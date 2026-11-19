import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {
  PRISM_SCENES,
  PrismFormat,
  PrismTalkEpisode,
  prismAsset,
  prismDarkAt,
  prismMusicGainAt,
  prismSpeakingAt,
  resolvePrismIdentity,
  resolvePrismMedia,
  validatePrismTalk,
} from '../src/kit/prismTalk';
import {
  prismTalkMetadata,
  PrismTalk,
  compactCardHeight,
  computeChatBubbleLayout,
  computeIconsLayout,
  computeWindowTransform,
  focusEase,
  prismStageLayout,
  punchLayout,
  stageCenterY,
} from '../src/templates/PrismTalk';

const load = (id: string): PrismTalkEpisode =>
  JSON.parse(readFileSync(`public/episodes/${id}/episode.json`, 'utf8'));
const demo = load('prism-talk-demo');
const copy = (): PrismTalkEpisode => structuredClone(demo);

test('虹彩口播版样片通过全部四画幅校验，零 mp4 依赖，配音、配乐、音效与图片均存在', () => {
  assert.equal(typeof PrismTalk, 'function');
  validatePrismTalk(demo);
  for (const fmt of ['landscape', 'portrait', '5:8', '3:4'] as const) {
    validatePrismTalk({...copy(), format: fmt});
  }
  for (const p of [demo.audio, demo.music!.src, demo.sfx!.src, 'dbs-hero.png']) {
    assert(existsSync('public/' + prismAsset(demo, p)), `缺少文件: ${p}`);
  }
  assert(!JSON.stringify(demo).includes('.mp4'), '样片不应依赖外部 mp4 素材');
});

test('prismTalkMetadata 同时支持 16:9 横屏与 9:16 / 5:8 / 3:4 三种竖向画幅', async () => {
  const land = await prismTalkMetadata({
    props: {episode: 'prism-talk-demo', ep: copy(), format: 'landscape'},
    defaultProps: {episode: 'prism-talk-demo'},
    abortSignal: new AbortController().signal,
    compositionId: 'PrismTalk',
    isRendering: false,
  });
  assert.equal(land.width, 1920);
  assert.equal(land.height, 1080);
  assert.equal(land.fps, 60);
  assert.equal(land.durationInFrames, 1800);

  const port = await prismTalkMetadata({
    props: {episode: 'prism-talk-demo', ep: copy(), format: 'portrait'},
    defaultProps: {episode: 'prism-talk-demo'},
    abortSignal: new AbortController().signal,
    compositionId: 'PrismTalkPortrait',
    isRendering: false,
  });
  assert.equal(port.width, 1080);
  assert.equal(port.height, 1920);
  assert.equal(port.props?.format, 'portrait');

  const p58 = await prismTalkMetadata({
    props: {episode: 'prism-talk-demo', ep: copy(), format: '5:8'},
    defaultProps: {episode: 'prism-talk-demo'},
    abortSignal: new AbortController().signal,
    compositionId: 'PrismTalk5x8',
    isRendering: false,
  });
  assert.equal(p58.width, 1080);
  assert.equal(p58.height, 1728);
  assert.equal(p58.props?.format, '5:8');

  const p34 = await prismTalkMetadata({
    props: {episode: 'prism-talk-demo', ep: copy(), format: '3:4'},
    defaultProps: {episode: 'prism-talk-demo'},
    abortSignal: new AbortController().signal,
    compositionId: 'PrismTalk3x4',
    isRendering: false,
  });
  assert.equal(p34.width, 1080);
  assert.equal(p34.height, 1440);
  assert.equal(p34.props?.format, '3:4');
});

test('6 个模块场景支持弹性时长（突破 4 秒限制）与自由排序、重复使用', () => {
  const keys = Object.keys(PRISM_SCENES);
  assert.deepEqual(keys, [
    'prism.logo',
    'prism.icons',
    'prism.headline',
    'prism.chat',
    'prism.window',
    'prism.punch',
  ]);
  for (const [k, s] of Object.entries(PRISM_SCENES)) {
    assert(s.min >= 1.5 && s.max >= 8 && s.max <= 12, `${k} 时长范围异常`);
  }
  const s03 = demo.shots.find((s) => s.id === 's03')!;
  assert(s03.end - s03.start > 7);
  assert.equal(demo.shots[4].template, 'prism.window');
  assert.equal(demo.shots[5].template, 'prism.window');
});

test('每条字幕落在对应镜头内，音乐在说话时自动压低且平滑无跳变', () => {
  for (const c of demo.captions) {
    assert(
      demo.shots.some((s) => c.start >= s.start - 0.01 && c.start < s.end),
      `字幕未落入镜头: ${c.text}`,
    );
  }
  const cMid = (demo.captions[3].start + demo.captions[3].end) / 2;
  assert.equal(prismSpeakingAt(demo, cMid), 1);
  assert(Math.abs(prismMusicGainAt(demo, cMid) - demo.music!.voiceVolume!) < 1e-9);
  assert.equal(prismMusicGainAt(demo, 0), 0);
  for (let f = 1; f < demo.duration * 60; f++) {
    assert(Math.abs(prismMusicGainAt(demo, f / 60) - prismMusicGainAt(demo, (f - 1) / 60)) < 0.02);
    const dk = prismDarkAt(demo, f / 60);
    assert(dk >= 0 && dk <= 1);
  }
});

test('媒体解析同时支持 (a) mp4 片段、(b) 静态图片、(c) 零素材内置卡片', () => {
  const shot = demo.shots[4];
  const withVid: PrismTalkEpisode = {
    ...copy(),
    sources: {demoVid: {src: '/blue-gallery/media/clean.mp4', length: 12}},
    clips: {...demo.clips, vClip: {src: 'demoVid', at: 2, label: '演示片段'}},
  };
  const rv = resolvePrismMedia(withVid, shot, 'vClip', 4);
  assert.equal(rv.kind, 'video');
  assert.equal(rv.src, 'blue-gallery/media/clean.mp4');
  assert.throws(() => resolvePrismMedia(withVid, shot, 'vClip', 11), /片源不够长/);

  const ri = resolvePrismMedia(demo, shot, 'dbsHero');
  assert.equal(ri.kind, 'image');
  assert.equal(ri.src, 'episodes/prism-talk-demo/dbs-hero.png');
  const riDirect = resolvePrismMedia(demo, shot, 'dbs-hero.png');
  assert.equal(riDirect.kind, 'image');

  const rc1 = resolvePrismMedia(demo, shot, {
    kind: 'card',
    title: '内置卡片',
    badge: 'NEW',
    lines: ['第一行说明', '第二行说明'],
  });
  assert.equal(rc1.kind, 'card');
  const rc2 = resolvePrismMedia(demo, shot, {
    title: '省略 kind 的卡片',
    badge: 'ZERO ASSET',
    lines: ['无需外部视频即可出片'],
  });
  assert.equal(rc2.kind, 'card');
});

test('去品牌硬编码检查：源码不含硬编码品牌或人名，身份信息完全读取配置', () => {
  for (const f of ['src/kit/prismTalk.ts', 'src/templates/PrismTalk.tsx']) {
    const src = readFileSync(f, 'utf8');
    assert(!src.includes('口播工作台'), `${f} 不应硬编码 口播工作台`);
    assert(!src.includes('尼尔'), `${f} 不应硬编码 尼尔`);
  }
  const id1 = resolvePrismIdentity(demo);
  assert.equal(id1.brand, '文案改造台');
  assert.equal(id1.handle, '@Agent');
  assert.equal(id1.user.name, '林夏');
  assert.equal(id1.user.initial, '林');

  const overrideShot = {...demo.shots[0], props: {brand: '新工坊', user: '小周'}};
  const id2 = resolvePrismIdentity(demo, overrideShot);
  assert.equal(id2.brand, '新工坊');
  assert.equal(id2.user.name, '小周');
  assert.equal(id2.user.initial, '小');
});

test('校验器提供清晰中文报错，并拦截平台名与外部链接', () => {
  let x = copy();
  x.shots[2].props.messages[0].text = '这是一句二十六个字的正常口语提问，在双行预算内完全放得下。';
  validatePrismTalk(x);

  x = copy();
  x.shots[2].props.messages[0].text = '这句消息故意写得特别特别长，已经远远超过了两行气泡所能容纳的四十字上限所以应该报错提示精简文字';
  assert.throws(() => validatePrismTalk(x), /\[s03\].*消息正文.*1到40个字/);

  x = copy();
  x.shots[1].props.items = [{icon: 'spark'}];
  assert.throws(() => validatePrismTalk(x), /\[s02\].*图标组 items要2到4项/);

  x = copy();
  x.shots[0].end = 1.0;
  x.shots[1].start = 1.0;
  assert.throws(() => validatePrismTalk(x), /\[s01\].*至少要 1\.5 秒/);

  x = copy();
  x.shots[2].props.messages[1].at = 20;
  assert.throws(() => validatePrismTalk(x), /\[s03\].*不在镜头/);

  x = copy();
  x.shots[4].props.media = 'missingClip';
  assert.throws(() => validatePrismTalk(x), /\[s05\].*没登记的素材/);

  x = copy();
  x.shots[4].props.zoom = {at: 30};
  assert.throws(() => validatePrismTalk(x), /\[s05\].*zoom\.at=30 不在镜头/);

  for (const taboo of ['发到小红书', '关注抖音', '去B站看', 'github仓库', 'https://example.com']) {
    x = copy();
    x.shots[6].props.messages[0].text = taboo;
    assert.throws(() => validatePrismTalk(x), /平台名或链接/, `未拦截禁忌词: ${taboo}`);
  }
});

test('最大合法长度边界保护：全画幅（含 3:4）10字半句 punch 不越界，5行+footer 卡片不裁切', () => {
  for (const fmt of ['portrait', '5:8', '3:4'] as const) {
    const pTall = punchLayout('一二三四五六七八九十', '收尾词', fmt);
    assert.equal(pTall.stack, true);
    assert(10 * pTall.fontSize * 1.1 <= 960, `${fmt} punch 字号过大: ${pTall.fontSize}`);
  }

  const pLand = punchLayout('一二三四五六七八九十', '一二三四', 'landscape');
  assert(14 * pLand.fontSize * 1.1 <= 1800, `横屏 punch 字号过大: ${pLand.fontSize}`);

  const maxCard = resolvePrismMedia(demo, demo.shots[2], {
    kind: 'card',
    title: '五行带底栏完整卡片',
    badge: 'MAX 5',
    lines: ['第一行要点', '第二行要点', '第三行要点', '第四行要点', '第五行要点'],
    footer: '底部状态栏文字说明',
  });
  assert.equal(maxCard.kind, 'card');
  for (const fmt of ['landscape', 'portrait', '5:8', '3:4'] as const) {
    const h = compactCardHeight(maxCard, fmt !== 'landscape', fmt);
    assert(h >= 400, `${fmt} 5行卡片高度不足: ${h}`);
  }
});

test('3:4 (1080x1440) 原生视觉排版安全区校验：字幕、2x2 图标、对话卡与预览窗零碰撞零切边', () => {
  assert.equal(stageCenterY('3:4'), 626);
  const stg = prismStageLayout('3:4');
  assert.equal(stg.width, 1080);
  assert.equal(stg.height, 1440);
  assert.equal(stg.subtitleTop, 1296);
  assert.deepEqual(stg.windowRect, {x: 58, y: 82, w: 964, h: 1096});
  assert(stg.windowRect.y + stg.windowRect.h < stg.subtitleTop - 100);

  // 2x2 满 4 张图标卡在 3:4 下底部严格 <= 1040，横向严守 [72, 1008]
  const fourIconsShot = {
    ...demo.shots[1],
    props: {
      kicker: '装进你的 Agent',
      title: '四大核心环节',
      items: [
        {icon: 'spark', label: '定选题标题', sub: 'dbs Skill', at: 2.15},
        {icon: 'wand', label: '洗净机器味', sub: 'Humanizer', at: 2.8},
        {icon: 'layers', label: '双工具串联', sub: '成套出稿', at: 3.45},
        {icon: 'check', label: '响度标准化', sub: '-14.5 LUFS', at: 4.1},
      ],
    },
  };
  const icons34 = computeIconsLayout(fourIconsShot, '3:4', 5.2);
  assert.equal(icons34.headerTop, 126);
  assert.equal(icons34.cards[0].y, 258);
  assert.equal(icons34.cards[2].y, 654);
  for (const c of icons34.cards) {
    assert(c.x >= 72 && c.x + c.width <= 1008, `3:4 图标横向越界: ${c.x}..${c.x + c.width}`);
    assert(c.y + c.estHeight <= 1040, `3:4 图标底部超过 1040: ${c.y + c.estHeight}`);
  }

  // 3:4 对话卡即使挂满 5 行带底栏卡片也严格落在 [90, 1210] 内，不撞 y=1296 字幕
  const heavyChatShot = structuredClone(demo.shots[2]);
  heavyChatShot.props.messages[1].media = {
    kind: 'card',
    title: '五行最大卡片验证',
    badge: 'MAX',
    lines: ['要点一', '要点二', '要点三', '要点四', '要点五'],
    footer: '完整交付说明',
  };
  const chat34 = computeChatBubbleLayout(demo, heavyChatShot, '3:4', 11.5);
  assert.equal(chat34.chatWidth, 968);
  for (const b of chat34.bubbles) {
    assert(b.screenTop >= 90, `3:4 气泡顶部越过 90: ${b.screenTop}`);
    assert(
      b.screenTop + b.estimatedHeight <= 1210,
      `3:4 气泡底部越过 1210: ${b.screenTop + b.estimatedHeight}`,
    );
  }

  // 横屏 (1920x1080) 即使叠到第 3 条消息且挂满 5 行带底栏卡片 + 列表，底部也严格 <= 868（不撞 y=928 字幕）
  const heavyLandShot = structuredClone(heavyChatShot);
  heavyLandShot.props.messages.push({
    from: 'bench',
    at: 9.6,
    text: '这是一条两行长度的横屏极限测试消息，用来核验多卡片叠放时的底部安全区保护。',
    list: ['核验第一条补充说明', '核验第二条补充说明'],
    media: heavyChatShot.props.messages[1].media,
    mediaAt: 10.1,
  });
  const chatLand = computeChatBubbleLayout(demo, heavyLandShot, 'landscape', 11.8);
  for (const b of chatLand.bubbles) {
    assert(b.screenTop >= 76, `横屏气泡顶部越过 76: ${b.screenTop}`);
    assert(
      b.screenTop + b.estimatedHeight <= 868,
      `横屏气泡底部越过 868: ${b.screenTop + b.estimatedHeight}`,
    );
  }
});

test('去晃动铁律验证：focusEase 无回弹，对话卡在打字/list/media 展开期顶边纹丝不动，窗口静止锁死', () => {
  // 1. focusEase 严格单调 [0, 1]，无任何 >1 过冲回弹
  let prev = 0;
  for (let i = 0; i <= 100; i++) {
    const v = focusEase(i / 100, 0.2, 0.6);
    assert(v >= prev - 1e-12 && v <= 1 && v >= 0, `focusEase 非单调或过冲: ${prev} -> ${v}`);
    prev = v;
  }
  assert.equal(focusEase(0.2, 0.2, 0.6), 0);
  assert.equal(focusEase(0.6, 0.2, 0.6), 1);

  // 2. 源码中除背景柔光 Field 外，UI 组件严禁出现 Math.sin 周期摇摆
  const tsxSrc = readFileSync('src/templates/PrismTalk.tsx', 'utf8');
  const sinMatches = tsxSrc.match(/Math\.sin\(/g) ?? [];
  assert.equal(sinMatches.length, 1, 'PrismTalk.tsx 除背景 Field 外不应再有任何 Math.sin 周期晃动');

  const s02 = demo.shots[1]; // prism.icons [2.1, 5.8]
  const s03 = demo.shots[2]; // prism.chat  [5.8, 13.3] (含 typed 与 mediaAt=9.95)
  const s05 = demo.shots[4]; // prism.window [17.9, 20.2]
  const s06 = demo.shots[5]; // prism.window [20.2, 23.5] (连续窗口 + callouts 重点放大)
  const s07 = demo.shots[6]; // prism.chat  [23.5, 26.5] (含两条 list 展开)

  for (const fmt of ['3:4', '5:8', 'portrait', 'landscape'] as PrismFormat[]) {
    // A. s03 第一条打字消息落定后 (6.30s..8.20s)，顶边与缩放零漂移
    const chatBase0 = computeChatBubbleLayout(demo, s03, fmt, 6.3);
    assert.equal(chatBase0.sceneScale, 1);
    const refTop0 = chatBase0.bubbles[0].screenTop;
    for (let f = Math.ceil(6.3 * 60); f <= Math.floor(8.2 * 60); f++) {
      const cur = computeChatBubbleLayout(demo, s03, fmt, f / 60);
      assert.equal(cur.sceneScale, 1);
      assert(Math.abs(cur.bubbles[0].screenTop - refTop0) < 1e-9, `${fmt} s03 打字期顶边发生晃动`);
      assert(Math.abs(cur.bubbles[0].scale - 1) < 1e-9, `${fmt} s03 打字期发生缩放蠕变`);
    }

    // B. s03 第二条消息落定后直至镜头结束 (8.66s..13.25s，完整跨越 mediaAt=9.95s 卡片展开！)，两张气泡顶边均纹丝不动
    const chatBase1 = computeChatBubbleLayout(demo, s03, fmt, 8.66);
    const refStackTop = chatBase1.bubbles[0].screenTop;
    const refFrontTop = chatBase1.bubbles[1].screenTop;
    assert(refStackTop < refFrontTop - 70, `${fmt} 后景提问卡应清晰露头不被吞没`);
    for (let f = Math.ceil(8.66 * 60); f <= Math.floor(13.25 * 60); f++) {
      const cur = computeChatBubbleLayout(demo, s03, fmt, f / 60);
      assert(Math.abs(cur.bubbles[0].screenTop - refStackTop) < 1e-9, `${fmt} s03 后景卡在 media 展开时晃动`);
      assert(Math.abs(cur.bubbles[1].screenTop - refFrontTop) < 1e-9, `${fmt} s03 前景卡在 media 展开时上跳晃动`);
      assert(Math.abs(cur.bubbles[1].scale - 1) < 1e-9, `${fmt} s03 前景卡发生缩放漂移`);
    }

    // C. s07 列表消息在两条 list 逐项显现期间 (24.08s..26.45s)，顶边与缩放纹丝不动
    const chatBase7 = computeChatBubbleLayout(demo, s07, fmt, 24.08);
    const refListTop = chatBase7.bubbles[0].screenTop;
    for (let f = Math.ceil(24.08 * 60); f <= Math.floor(26.45 * 60); f++) {
      const cur = computeChatBubbleLayout(demo, s07, fmt, f / 60);
      assert(Math.abs(cur.bubbles[0].screenTop - refListTop) < 1e-9, `${fmt} s07 list 展开期顶边抽动`);
      assert(Math.abs(cur.bubbles[0].scale - 1) < 1e-9);
    }

    // D. s02 图标全部落定后 (4.50s..5.75s) 零上下浮动、零缩放蠕变
    const iconBase = computeIconsLayout(s02, fmt, 4.5);
    for (let f = Math.ceil(4.5 * 60); f <= Math.floor(5.75 * 60); f++) {
      const cur = computeIconsLayout(s02, fmt, f / 60);
      cur.cards.forEach((c, idx) => {
        assert.equal(c.y, iconBase.cards[idx].y);
        assert(Math.abs(c.translateY) < 1e-9, `${fmt} 图标落定后仍有位移`);
        assert(Math.abs(c.scale - iconBase.cards[idx].scale) < 1e-9, `${fmt} 图标落定后仍有缩放蠕变`);
      });
    }

    // E. s05 -> s06 预览窗：s05 入场后完全静止；切入 s06 时外框无缝锁死；22.1s 重点时刻单向无回弹推近至 1.045x 后静止驻留
    for (let f = Math.ceil(18.3 * 60); f <= Math.floor(20.2 * 60); f++) {
      const w5 = computeWindowTransform(s05, fmt, f / 60, false);
      assert.equal(w5.translateY, 0);
      assert.equal(w5.scale, 1);
    }
    for (let f = Math.ceil(20.2 * 60); f <= Math.floor(22.09 * 60); f++) {
      const w6Pre = computeWindowTransform(s06, fmt, f / 60, true);
      assert.equal(w6Pre.translateY, 0);
      assert.equal(w6Pre.scale, 1, `${fmt} 连续窗口切换后在重点前不应漂移`);
    }
    let lastScale = 1;
    for (let f = Math.ceil(22.1 * 60); f <= Math.floor(23.5 * 60); f++) {
      const w6Zoom = computeWindowTransform(s06, fmt, f / 60, true);
      assert.equal(w6Zoom.translateY, 0);
      assert(w6Zoom.scale >= lastScale - 1e-9 && w6Zoom.scale <= 1.045 + 1e-9, `${fmt} 窗口重点放大回弹或越界`);
      lastScale = w6Zoom.scale;
    }
    const w6Hold = computeWindowTransform(s06, fmt, 22.6, true);
    assert(Math.abs(w6Hold.scale - 1.045) < 1e-9);
    assert.equal(computeWindowTransform(s06, fmt, 23.4, true).scale, w6Hold.scale);

    // 验证 3:4 / 5:8 / portrait 在 1.045x 重点放大后窗口四边均不切边、不撞字幕
    const stg = prismStageLayout(fmt);
    const halfW = (stg.windowRect.w * 1.045) / 2;
    const halfH = (stg.windowRect.h * 1.045) / 2;
    const cx = stg.windowRect.x + stg.windowRect.w / 2;
    const cy = stg.windowRect.y + stg.windowRect.h / 2;
    assert(cx - halfW >= 24 && cx + halfW <= stg.width - 24, `${fmt} 窗口放大后横向越界`);
    assert(cy - halfH >= 24 && cy + halfH <= stg.subtitleTop - 40, `${fmt} 窗口放大后纵向撞字幕`);
  }
});
