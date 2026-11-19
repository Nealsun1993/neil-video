import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {
  LINE_STYLES,
  PAPER_LINE,
  PAPER_SCENES,
  PaperFormat,
  paperFormatDims,
  PaperTalkEpisode,
  paperAsset,
  paperDarkAt,
  paperDarkIntervals,
  paperLineLayout,
  paperLineSchedule,
  paperMusicGainAt,
  paperSpeakingAt,
  resolvePaperTexture,
  validatePaperTalk,
} from '../src/kit/paperTalk';
import {
  paperTalkMetadata,
  PaperTalk,
  blockBox,
  blockTagAnchors,
  focusEase,
  paperShotOut,
  paperStageLayout,
  posterLayout,
} from '../src/templates/PaperTalk';

const load = (id: string): PaperTalkEpisode =>
  JSON.parse(readFileSync(`public/episodes/${id}/episode.json`, 'utf8'));
const demo = load('paper-talk-demo');
const copy = (): PaperTalkEpisode => structuredClone(demo);

test('纸感口播版样片通过横屏 / 3:4 / 9:16 全部画幅校验，零 mp4 依赖，配音、配乐与音效文件齐全', () => {
  assert.equal(typeof PaperTalk, 'function');
  validatePaperTalk(demo);
  for (const fmt of ['landscape', '3:4', 'portrait'] as PaperFormat[]) {
    validatePaperTalk({...copy(), format: fmt});
  }
  for (const p of [demo.audio, demo.music!.src, demo.sfx!.src]) {
    assert(existsSync('public/' + paperAsset(demo, p)), `缺少文件: ${p}`);
  }
  assert(!JSON.stringify(demo).includes('.mp4'), '样片不应依赖外部 mp4 素材');
});

test('paperTalkMetadata 同时支持 1920x1080 横屏、1080x1440 (3:4) 竖屏与 1080x1920 兼容竖屏', async () => {
  const land = await paperTalkMetadata({
    props: {episode: 'paper-talk-demo', ep: copy(), format: 'landscape'},
    defaultProps: {episode: 'paper-talk-demo'},
    abortSignal: new AbortController().signal,
    compositionId: 'PaperTalk',
    isRendering: false,
  });
  assert.equal(land.width, 1920);
  assert.equal(land.height, 1080);
  assert.equal(land.fps, 60);
  assert.equal(land.durationInFrames, 1800);

  const p34 = await paperTalkMetadata({
    props: {episode: 'paper-talk-demo', ep: copy(), format: '3:4'},
    defaultProps: {episode: 'paper-talk-demo'},
    abortSignal: new AbortController().signal,
    compositionId: 'PaperTalk3x4',
    isRendering: false,
  });
  assert.equal(p34.width, 1080);
  assert.equal(p34.height, 1440);
  assert.equal(p34.props?.format, '3:4');

  const port = await paperTalkMetadata({
    props: {episode: 'paper-talk-demo', ep: copy(), format: 'portrait'},
    defaultProps: {episode: 'paper-talk-demo'},
    abortSignal: new AbortController().signal,
    compositionId: 'PaperTalkPortrait',
    isRendering: false,
  });
  assert.equal(port.width, 1080);
  assert.equal(port.height, 1920);
  assert.equal(port.props?.format, 'portrait');
});

test('6 个模块场景可自由排序，paper.line 可跨多句重复且不强制要求 pixel 词', () => {
  assert.deepEqual(Object.keys(PAPER_SCENES), [
    'paper.intro',
    'paper.line',
    'paper.wall',
    'paper.poster',
    'paper.block',
    'paper.outro',
  ]);
  assert.deepEqual(LINE_STYLES, ['voice', 'heavy', 'light', 'breathe', 'pixel', 'lean']);

  const lineShots = demo.shots.filter((s) => s.template === 'paper.line');
  assert.equal(lineShots.length, 2, '样片包含两段独立的 paper.line');
  assert(!lineShots[0].props.line.some((seg: any) => seg.style === 'pixel'));
  const l0End = paperLineLayout(lineShots[0], lineShots[0].end - 0.05, 'landscape', demo);
  assert.equal(l0End.focusSeg.seg.text, '留人');
  const l1End = paperLineLayout(lineShots[1], lineShots[1].end - 0.05, 'landscape', demo);
  assert.equal(l1End.focusSeg.seg.text, '标题封面');

  const multi = copy();
  multi.shots = [
    {id: 'a', template: 'paper.line', start: 0, end: 10, props: {line: [{text: '第一句独立成行，'}, {text: '清晰明了', style: 'heavy'}]}},
    {id: 'b', template: 'paper.line', start: 10, end: 20, props: {line: [{text: '第二句接着展开，'}, {text: '自由复排', style: 'lean'}]}},
    {id: 'c', template: 'paper.line', start: 20, end: 30, props: {line: [{text: '第三句收束全文，'}, {text: '一气呵成', style: 'voice'}]}},
  ];
  multi.duration = 30;
  validatePaperTalk(multi);
});

test('横屏 / 3:4 / 9:16 镜头跟随光标：打字期光标不出画、滚动不回退，收束后整数像素静止锁死', () => {
  for (const fmt of ['landscape', '3:4', 'portrait'] as PaperFormat[]) {
    const cfg = PAPER_LINE[fmt];
    for (const shot of demo.shots.filter((s) => s.template === 'paper.line')) {
      const sch = paperLineSchedule(shot, demo);
      sch.forEach((x, i) => {
        assert(x.typed > x.start && x.end >= x.typed);
        if (i) assert(Math.abs(x.start - sch[i - 1].end) < 1e-9);
      });
      const lineEnd = sch.at(-1)!.end;
      assert(lineEnd < shot.end, '打字应在镜头结束前完成');

      let prevScroll = 0;
      let prevCaret = paperLineLayout(shot, sch[0].start, fmt, demo).caret;
      for (let f = Math.ceil(sch[0].start * 60); f < Math.floor(lineEnd * 60); f++) {
        const t = f / 60;
        const l = paperLineLayout(shot, t, fmt, demo);
        const screenX = cfg.left + l.caret - l.scroll;
        assert(
          screenX >= cfg.left - 1 && screenX <= cfg.caret + 1,
          `${fmt} ${shot.id} t=${t} 光标出画 x=${screenX}`,
        );
        assert(l.scroll >= prevScroll - 1e-6, `${fmt} ${shot.id} t=${t} 滚动回退`);
        assert(
          l.caret >= prevCaret - 1e-6 && l.caret - prevCaret < cfg.size * 1.05,
          `${fmt} ${shot.id} t=${t} 光标跳变`,
        );
        prevScroll = l.scroll;
        prevCaret = l.caret;
      }

      // 收束平移结束后，scroll 对齐整数像素并在剩余时间内纹丝不动
      const settled = paperLineLayout(shot, Math.min(shot.end - 0.02, lineEnd + 0.7), fmt, demo).scroll;
      assert.equal(settled, Math.round(settled), `${fmt} ${shot.id} 收束后应锁定整数像素`);
      const nearEnd = paperLineLayout(shot, shot.end - 0.02, fmt, demo).scroll;
      assert.equal(nearEnd, settled, `${fmt} ${shot.id} 收束后不应再微漂`);
    }
  }
});

test('配音字幕、BGM 闪避、像素暗场区间合并与纹理读取正常', () => {
  for (const c of demo.captions) {
    assert(demo.shots.some((s) => c.start >= s.start - 0.01 && c.start < s.end), c.text);
  }
  const mid = (demo.captions[5].start + demo.captions[5].end) / 2;
  assert.equal(paperSpeakingAt(demo, mid), 1);
  assert(Math.abs(paperMusicGainAt(demo, mid) - demo.music!.voiceVolume!) < 1e-9);

  const ivs = paperDarkIntervals(demo);
  assert.deepEqual(ivs, [{start: 20.2, end: 26.6}]);
  assert.equal(paperDarkAt(demo, 5).isDark, false);
  assert.equal(paperDarkAt(demo, 22).isDark, true);
  assert.equal(paperDarkAt(demo, 25).isDark, true);
  assert.equal(paperDarkAt(demo, 28).isDark, false);

  assert.equal(resolvePaperTexture(demo, 11), '真白话');
  assert.equal(resolvePaperTexture(demo, 4), '定题去味真话');
});

test('跨平台字体安全与去品牌硬编码：禁用 Songti/Kaiti，不含硬编码品牌名', () => {
  for (const f of ['src/kit/paperTalk.ts', 'src/templates/PaperTalk.tsx']) {
    const src = readFileSync(f, 'utf8');
    for (const banned of ['Songti', 'STSong', 'Kaiti', 'STKaiti', '口播工作台', '尼尔']) {
      assert(!src.includes(banned), `${f} 不应包含 ${banned}`);
    }
  }
});

test('校验器提供清晰中文报错，并拦截平台名与外部链接', () => {
  let x = copy();
  x.shots[1].props.line = [{text: '好'}];
  assert.throws(() => validatePaperTalk(x), /\[s02\].*单镜总字数要2到64个字/);

  x = copy();
  x.shots[1].props.line[1].style = 'unknownStyle' as any;
  assert.throws(() => validatePaperTalk(x), /\[s02\].*未知词形样式/);

  x = copy();
  x.shots[2].props.word = '这个字墙词太长了';
  assert.throws(() => validatePaperTalk(x), /\[s03\].*字墙关键词/);

  x = copy();
  x.shots[0].end = 1.0;
  x.shots[1].start = 1.0;
  assert.throws(() => validatePaperTalk(x), /\[s01\].*至少要 1\.5 秒/);

  x = {...copy(), format: '5:8' as any};
  assert.throws(() => validatePaperTalk(x), /landscape、portrait 或 3:4/);

  for (const taboo of ['发到小红书', '抖音爆款', 'bilibili主页', 'github链接', 'http://test.cn']) {
    x = copy();
    x.shots[6].props.tagline = taboo;
    assert.throws(() => validatePaperTalk(x), /平台名或链接/, `未拦截禁忌词: ${taboo}`);
  }
});

test('3:4 (1080x1440) 原生安全区 [48..1032]x[60..1230] 与全画幅名牌零越界、亮暗切换无跳变', () => {
  const stg34 = paperStageLayout('3:4');
  assert.deepEqual(paperFormatDims('3:4'), {width: 1080, height: 1440});
  assert.equal(stg34.subtitleTop, 1292);
  assert.equal(PAPER_LINE['3:4'].centerX, 540);
  assert.equal(PAPER_LINE['3:4'].centerY, 620);

  const b34 = blockBox('3:4');
  assert(b34.x >= 48 && b34.x + b34.S <= 1032, '3:4 色块横向越界');
  assert(b34.y - 44 >= 60 && b34.y + b34.S <= 1230, '3:4 色块或顶标纵向越界');

  // 最大 10 字名牌胶囊宽度约 262px
  const maxPillW = 10 * 23 + 32;
  for (const fmt of ['landscape', '3:4', 'portrait'] as PaperFormat[]) {
    const stg = paperStageLayout(fmt);
    const anchors = blockTagAnchors(fmt);
    for (const [ax, ay, flip] of anchors) {
      const left = flip ? ax - 8 - maxPillW : ax - 7;
      const right = flip ? ax + 7 : ax + 8 + maxPillW;
      assert(left >= stg.safeLeft && right <= stg.safeRight, `${fmt} 色块名牌横向越界: [${left}, ${right}]`);
      assert(ay - 7 >= stg.safeTop && ay + 46 <= stg.safeBottom, `${fmt} 色块名牌纵向越界: y=${ay}`);
    }
    if (fmt === '3:4') {
      // 3:4 底部两枚 10 字名牌互不重叠
      const leftBottomRightEdge = anchors[4][0] + 8 + maxPillW;
      const rightBottomLeftEdge = anchors[5][0] - 8 - maxPillW;
      assert(leftBottomRightEdge + 24 <= rightBottomLeftEdge, '3:4 色块底部两枚名牌间距不足');
    }
  }

  // 3:4 黑底海报满 4 行 9 字 + 顶标 + 10 字名牌均落在 [48..1032]x[60..1230] 内
  const p34 = posterLayout(
    ['一二三四五六七八九', '一二三四五六七八九', '一二三四五六七八九', '一二三四五六七八九'],
    ['十字分工名牌一二三四', '十字分工名牌五六七八', '十字分工名牌九十甲乙', '十字分工名牌丙丁戊己'],
    true,
    '3:4',
  );
  assert(p34.startY - 56 >= 60, `3:4 海报顶标越界: ${p34.startY - 56}`);
  assert(p34.startY + p34.blockH <= 1230, `3:4 海报正文底部越界: ${p34.startY + p34.blockH}`);
  for (const tag of p34.inlineTags) {
    const left = tag.flip ? tag.screenX - 8 - maxPillW : tag.screenX - 7;
    const right = tag.flip ? tag.screenX + 7 : tag.screenX + 8 + maxPillW;
    assert(left >= 48 && right <= 1032, `3:4 海报行内名牌横向越界: [${left}, ${right}]`);
    assert(tag.screenY - 7 >= 60 && tag.screenY + 46 <= 1230, `3:4 海报行内名牌纵向越界: ${tag.screenY}`);
  }
  for (const tag of p34.scatterTags) {
    const left = tag.flip ? tag.x - 8 - maxPillW : tag.x - 7;
    const right = tag.flip ? tag.x + 7 : tag.x + 8 + maxPillW;
    assert(left >= 48 && right <= 1032, `3:4 海报散落名牌横向越界: [${left}, ${right}]`);
    assert(tag.y - 7 >= 60 && tag.y + 46 <= 1230, `3:4 海报散落名牌纵向越界: ${tag.y}`);
  }

  // 检查全部镜头切换单帧不透明度变化均平滑连续
  for (let i = 0; i < demo.shots.length - 1; i++) {
    const s = demo.shots[i];
    const nextDark = demo.shots[i + 1].template === 'paper.poster' || demo.shots[i + 1].template === 'paper.block';
    let prev = paperShotOut(s.end - 0.3, s, false, nextDark);
    assert.equal(prev, 0);
    for (let f = Math.round((s.end - 0.3) * 60) + 1; f <= Math.round((s.end + 0.3) * 60); f++) {
      const cur = paperShotOut(f / 60, s, false, nextDark);
      assert(cur >= prev - 1e-9 && cur - prev < 0.12, `${s.id} 出场单帧跳变: ${prev} -> ${cur}`);
      prev = cur;
    }
    assert(Math.abs(prev - 1) < 1e-6);
  }
});

test('去晃动铁律验证：focusEase 单调无回弹，GPU translate3d 横移，UI 零 sin/cos 摇摆与零线性微爬', () => {
  let prev = 0;
  for (let i = 0; i <= 100; i++) {
    const v = focusEase(i / 100, 0.15, 0.55);
    assert(v >= prev - 1e-12 && v >= 0 && v <= 1, `focusEase 非单调或过冲: ${prev} -> ${v}`);
    prev = v;
  }
  assert.equal(focusEase(0.15, 0.15, 0.55), 0);
  assert.equal(focusEase(0.55, 0.15, 0.55), 1);

  const src = readFileSync('src/templates/PaperTalk.tsx', 'utf8');
  assert(src.includes('translate3d('), 'LineScene 横向滚动应采用 GPU translate3d');
  assert(!/Math\.(?:sin|cos)\(t\s*\*/.test(src), 'PaperTalk UI 元素不应再有 Math.sin(t*...) / Math.cos(t*...) 持续晃动');
  assert(!/u\s*\*\s*0\.01[45]/.test(src), 'PaperTalk 不应再有 1 + u*0.014/0.015 持续线性微爬缩放');
  assert(!/translate\(\$\{-u\s*\*/.test(src), 'WallScene 不应再有持续对角线漂移');
});
