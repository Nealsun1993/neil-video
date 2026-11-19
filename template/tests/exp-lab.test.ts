import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {existsSync, readFileSync, statSync} from 'node:fs';
import {resolve} from 'node:path';
import {
  SKIN_FONTS,
  SKIN_IDS,
  UI_SKINS,
  resolveSkin,
  skinSubtitleLayout,
} from '../src/kit/uiSkins';
import {
  EXP_FPS,
  EXP_SCENES,
  EXP_TEMPLATE_IDS,
  ExpEpisode,
  ExpFormat,
  balanceAngleAt,
  balanceTimings,
  buildPushHoldKeys,
  expCameraAt,
  expFormatDims,
  expPushCamera,
  expStageLayout,
  focusEase,
  metricTimings,
  metricValueAt,
  musicGainAt,
  talkAsset,
  validateExpLab,
} from '../src/kit/expLab';
import {expSceneBoxes} from '../src/templates/ExpLab';
import {checkStyledEpisode} from '../scripts/check-episodes';

const ROOT = resolve(__dirname, '..');

function loadExpMix(): ExpEpisode {
  return JSON.parse(
    readFileSync(resolve(ROOT, 'public/episodes/exp-adu-mix/episode.json'), 'utf8'),
  );
}

test('uiSkins：五套高保真 UI 皮肤完整可用、支持明暗变体且仅使用内置跨平台字体', () => {
  assert.deepEqual([...SKIN_IDS].sort(), ['blue', 'clean', 'minimal', 'paper', 'prism']);

  for (const fontCss of Object.values(SKIN_FONTS)) {
    assert.ok(
      !/PingFang|Hiragino|SF Pro|Heiti|Microsoft YaHei/i.test(fontCss),
      `字体栈禁止包含平台私有字体：${fontCss}`,
    );
  }

  for (const id of SKIN_IDS) {
    const light = resolveSkin(id, false);
    const dark = resolveSkin(id, true);
    assert.equal(light.id, id);
    assert.equal(dark.id, id);
    assert.equal(dark.dark, true);
    assert.ok(light.canvasBg && light.cardBg && light.accent && light.problem && light.success);
    assert.equal(light.tagPalette.length, 5);
    assert.ok(UI_SKINS[id]);
  }

  assert.equal(resolveSkin('paper', false).canvasBg, '#E8E8E6');
  assert.equal(resolveSkin('paper', true).canvasBg, '#151515');
  assert.equal(skinSubtitleLayout('3:4').top, 1292);
  assert.equal(skinSubtitleLayout('landscape').top, 928);
  assert.equal(skinSubtitleLayout('portrait').top, 1470);
});

test('exp-adu-mix 实验样片：覆盖全部 5 套皮肤 × 7 套 adu 结构，真实配音/配乐/音效齐全且换任意单一皮肤均通过', () => {
  const ep = loadExpMix();
  assert.equal(ep.style, 'exp-lab');
  assert.equal(ep.duration, 30);
  assert.equal(ep.shots.length, 7);

  // 全部真实音频素材均在磁盘存在且非空
  const audioFile = resolve(ROOT, 'public', talkAsset(ep as any, ep.audio));
  const musicFile = resolve(ROOT, 'public', talkAsset(ep as any, ep.music!.src));
  const sfxFile = resolve(ROOT, 'public', talkAsset(ep as any, ep.sfx!.src));
  for (const p of [audioFile, musicFile, sfxFile]) {
    assert.ok(existsSync(p) && statSync(p).size > 1000, `缺少真实音频素材：${p}`);
  }

  // 同一部 30s 实验片同时覆盖全部 7 种结构与全部 5 套皮肤
  const usedTemplates = new Set(ep.shots.map((s) => s.template));
  assert.deepEqual([...usedTemplates].sort(), [...EXP_TEMPLATE_IDS].sort());

  const usedSkins = new Set(ep.shots.map((s) => s.skin ?? ep.defaultSkin));
  assert.deepEqual([...usedSkins].sort(), [...SKIN_IDS].sort());

  // 每条字幕均落在对应镜头区间附近，BGM 在说话时平滑压低
  for (const c of ep.captions) {
    const matched = ep.shots.some((s) => c.start >= s.start - 0.08 && c.end <= s.end + 0.08);
    assert.ok(matched, `字幕跨越镜头边界过多：${c.text} [${c.start}, ${c.end}]`);
  }
  const speakingGain = musicGainAt(ep as any, 1.2);
  const pauseGain = musicGainAt({...ep, captions: ep.captions.slice(0, 1)} as any, 4.5);
  assert.ok(speakingGain < pauseGain, '人声说话期间配乐应自动压低，留白区间平滑抬升');

  // 通过 checkStyledEpisode 全画幅校验（landscape / 3:4 / portrait）
  assert.doesNotThrow(() => checkStyledEpisode(ep));

  // 全部 7 种结构切换任意单一统一皮肤（5 种 × 3 画幅）均合法通过
  for (const skin of SKIN_IDS) {
    for (const format of ['3:4', 'landscape', 'portrait'] as ExpFormat[]) {
      const unified = structuredClone(ep);
      unified.format = format;
      unified.defaultSkin = skin;
      unified.shots.forEach((s) => {
        delete s.skin;
      });
      assert.doesNotThrow(() => validateExpLab(unified), `统一皮肤 ${skin} (${format}) 应通过校验`);
    }
  }
});

test('全部 7 结构在 3:4 (1080x1440) / 16:9 (1920x1080) / 9:16 下严守安全区且绝不压字幕', () => {
  assert.deepEqual(expFormatDims('3:4'), {w: 1080, h: 1440, width: 1080, height: 1440});
  assert.deepEqual(expFormatDims('landscape'), {w: 1920, h: 1080, width: 1920, height: 1080});
  assert.deepEqual(expFormatDims('portrait'), {w: 1080, h: 1920, width: 1080, height: 1920});

  const ep = loadExpMix();
  const formats: ExpFormat[] = ['3:4', 'landscape', 'portrait'];

  for (const fmt of formats) {
    const st = expStageLayout(fmt);
    if (fmt === '3:4') {
      assert.equal(st.safeLeft, 48);
      assert.equal(st.safeRight, 1032);
      assert.equal(st.safeTop, 68);
      assert.equal(st.safeBottom, 1230);
      assert.equal(st.subtitleTop, 1292);
    }

    for (const shot of ep.shots) {
      const boxes = expSceneBoxes(shot, fmt);
      assert.ok(boxes.length >= 2, `${shot.template} 应返回有效布局包围盒`);

      for (const b of boxes) {
        assert.ok(
          b.x >= st.safeLeft - 0.5 && b.x + b.w <= st.safeRight + 0.5,
          `[${fmt}] ${shot.template}.${b.id} 横向越界：[${b.x}, ${b.x + b.w}] 超出 [${st.safeLeft}, ${st.safeRight}]`,
        );
        assert.ok(
          b.y >= st.safeTop - 0.5 && b.y + b.h <= st.safeBottom + 0.5,
          `[${fmt}] ${shot.template}.${b.id} 纵向越界：[${b.y}, ${b.y + b.h}] 超出 [${st.safeTop}, ${st.safeBottom}]`,
        );
        assert.ok(
          b.y + b.h <= st.subtitleTop - 40,
          `[${fmt}] ${shot.template}.${b.id} 过近或侵入字幕区 y=${st.subtitleTop}`,
        );
      }

      // 即使开启单向重点放大（zoom），推镜终点后的主体底边仍不得触碰字幕条
      const d = shot.end - shot.start;
      const endCam = expPushCamera(shot, d, fmt);
      for (const b of boxes) {
        const zoomedBottom = (b.y + b.h) * endCam.s + endCam.dy;
        assert.ok(
          zoomedBottom <= st.subtitleTop - 10,
          `[${fmt}] ${shot.template}.${b.id} 推镜放大后底边 ${zoomedBottom.toFixed(1)} 侵入字幕区 ${st.subtitleTop}`,
        );
      }
    }
  }
});

test('三脚架稳态去晃动契约：focusEase 无过冲、天平落平归零锁死、大数字到点锁死、镜头单向推近无倒走且源码零摇摆', () => {
  // 1. focusEase 严格单调递增、无弹簧过冲、终点恒等于整数 1
  let prev = 0;
  for (let i = 0; i <= 120; i++) {
    const t = i / 100;
    const v = focusEase(t, 0.1, 0.9);
    assert.ok(v >= prev - 1e-9, `focusEase 在 t=${t} 发生回退：${v} < ${prev}`);
    assert.ok(v >= 0 && v <= 1, `focusEase 超出 [0,1]（弹簧过冲）：${v}`);
    prev = v;
  }
  assert.equal(focusEase(0.1, 0.1, 0.9), 0);
  assert.equal(focusEase(0.9, 0.1, 0.9), 1);
  assert.equal(focusEase(2.5, 0.1, 0.9), 1);

  const ep = loadExpMix();

  // 2. 天平（exp.balance）倾角单向平滑归零，u >= levelEndU 后严格 === 0（零余震）
  const balShot = ep.shots.find((s) => s.template === 'exp.balance')!;
  const {levelEndU} = balanceTimings(balShot);
  let prevAbsAngle = Math.abs(balanceAngleAt(balShot, balShot.start));
  assert.ok(prevAbsAngle > 0);
  for (let f = 1; f <= Math.round((balShot.end - balShot.start) * EXP_FPS); f++) {
    const t = balShot.start + f / EXP_FPS;
    const u = f / EXP_FPS;
    const ang = balanceAngleAt(balShot, t);
    assert.ok(Math.abs(ang) <= prevAbsAngle + 1e-6, '天平回平期间不应反向摆动或余震');
    prevAbsAngle = Math.abs(ang);
    if (u >= levelEndU + 1e-6) {
      assert.equal(ang, 0, `天平落定后必须严格锁死 0 度（u=${u.toFixed(3)}）`);
    }
  }

  // 3. 大数字（exp.metric）计数单向递增，u >= countEndU 后严格锁死目标值
  const metShot = ep.shots.find((s) => s.template === 'exp.metric')!;
  const {countEndU} = metricTimings(metShot);
  let prevMetric = metricValueAt(metShot, metShot.start);
  for (let f = 1; f <= Math.round((metShot.end - metShot.start) * EXP_FPS); f++) {
    const t = metShot.start + f / EXP_FPS;
    const u = f / EXP_FPS;
    const val = metricValueAt(metShot, t);
    assert.ok(val >= prevMetric - 1e-6, '大数字计数不应回退抖动');
    prevMetric = val;
    if (u >= countEndU + 1e-6) {
      assert.equal(val, metShot.props.value, '计数到达后必须精确锁死目标值');
    }
  }

  // 4. 重点推镜（buildPushHoldKeys / expCameraAt）全画幅严格单向推近并静止保持，零倒走镜头
  for (const fmt of ['3:4', 'landscape', 'portrait'] as ExpFormat[]) {
    const d = 4.2;
    const keys = buildPushHoldKeys(d, {atU: 1.4, scale: 1.1, format: fmt});
    let lastS = 1;
    let holdFrames = 0;
    const dims = expFormatDims(fmt);
    for (let f = 0; f <= Math.round(d * EXP_FPS); f++) {
      const u = f / EXP_FPS;
      const cam = expCameraAt(u, keys, fmt);
      assert.ok(cam.s >= lastS - 1e-6, `[${fmt}] 严禁倒走拉远镜头：u=${u}, ${cam.s} < ${lastS}`);
      // 任意帧不露出画布外空白
      assert.ok(cam.dx <= 0.05 && cam.dx >= dims.w * (1 - cam.s) - 0.05);
      assert.ok(cam.dy <= 0.05 && cam.dy >= dims.h * (1 - cam.s) - 0.05);
      if (Math.abs(cam.s - keys[keys.length - 1][1]) < 1e-4) holdFrames++;
      lastS = cam.s;
    }
    assert.ok(holdFrames >= 60, `[${fmt}] 推镜到位后应有充足静止驻留帧`);
  }

  // 5. 源码级防回归审计：ExpLab.tsx 与 expLab.ts 严禁出现正弦晃动、震屏、弹簧或线性微爬
  for (const rel of ['src/templates/ExpLab.tsx', 'src/kit/expLab.ts']) {
    const code = readFileSync(resolve(ROOT, rel), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
    assert.ok(!/Math\.sin|Math\.cos/.test(code), `${rel} 严禁包含 Math.sin / Math.cos 周期摇摆`);
    assert.ok(!/\bspring\s*\(|\bshake\s*\(/.test(code), `${rel} 严禁包含 spring 过冲或 shake 震屏`);
    assert.ok(!/1\s*\+\s*u\s*\*/.test(code), `${rel} 严禁包含 1 + u * k 线性缩放蠕变`);
  }
});

test('validateExpLab：拦截违禁平台词、外链、未知皮肤/结构、断裂时间轴与超长文案', () => {
  assert.equal(Object.keys(EXP_SCENES).length, 7);
  const base = loadExpMix();

  for (const badBrand of ['关注抖音号', '小红书同名', '去B站看', 'github仓库', 'https://example.com']) {
    const bad = structuredClone(base);
    bad.brand = badBrand.slice(0, 12);
    if (badBrand.startsWith('http')) {
      bad.shots[0].props.sub = badBrand;
      bad.brand = '文案工坊';
    }
    assert.throws(() => validateExpLab(bad), /平台名或链接/, `应拦截禁忌内容：${badBrand}`);
  }

  const badSkin = structuredClone(base);
  (badSkin.shots[0] as any).skin = 'neon';
  assert.throws(() => validateExpLab(badSkin), /未知单镜皮肤/);

  const badTpl = structuredClone(base);
  badTpl.shots[1].template = 'exp.unknown';
  assert.throws(() => validateExpLab(badTpl), /没有这个实验结构/);

  const gapShot = structuredClone(base);
  gapShot.shots[2].start = 10.5;
  assert.throws(() => validateExpLab(gapShot), /镜头不连续/);

  const sameStmt = structuredClone(base);
  sameStmt.shots[0].props.right = sameStmt.shots[0].props.wrong;
  assert.throws(() => validateExpLab(sameStmt), /不能相同/);
});

test('Hub 轻量接线：src/index.tsx 与 local-workbench.cjs 支持 ExpLab (1920x1080) 与 ExpLab3x4 (1080x1440)', () => {
  const indexSrc = readFileSync(resolve(ROOT, 'src/index.tsx'), 'utf8');
  assert.match(indexSrc, /id="ExpLab"[\s\S]{0,160}?width=\{1920\}[\s\S]{0,80}?height=\{1080\}/);
  assert.match(indexSrc, /id="ExpLab3x4"[\s\S]{0,160}?width=\{1080\}[\s\S]{0,80}?height=\{1440\}/);

  for (const id of ['ExpLab', 'ExpLab3x4']) {
    const out = JSON.parse(
      execFileSync(process.execPath, ['scripts/local-workbench.cjs', '--dry-run', 'render', id], {
        cwd: ROOT,
        encoding: 'utf8',
      }),
    );
    assert.equal(out.action, 'render');
    assert.equal(out.composition, id);
  }
});
