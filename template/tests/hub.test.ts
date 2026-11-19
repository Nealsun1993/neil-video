import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {existsSync, readFileSync, rmSync, statSync} from 'node:fs';
import {resolve} from 'node:path';
import {STYLE_VALIDATORS, checkStyledEpisode} from '../scripts/check-episodes';
import {prepareEpisode} from '../src/kit/timing';

const ROOT = resolve(__dirname, '..');

test('src/index.tsx 注册全部 5 套配音驱动双画幅（16:9 + 3:4 主标准 + 9:16 兼容）并保留历史入口', () => {
  const src = readFileSync(resolve(ROOT, 'src/index.tsx'), 'utf8');
  const expected: [string, number, number][] = [
    ['BlueTalk', 1920, 1080],
    ['BlueTalk3x4', 1080, 1440],
    ['BlueTalkPortrait', 1080, 1920],
    ['PrismTalk', 1920, 1080],
    ['PrismTalk3x4', 1080, 1440],
    ['PrismTalkPortrait', 1080, 1920],
    ['PrismTalk5x8', 1080, 1728],
    ['PaperTalk', 1920, 1080],
    ['PaperTalk3x4', 1080, 1440],
    ['PaperTalkPortrait', 1080, 1920],
    ['CleanTalk', 1920, 1080],
    ['CleanTalk3x4', 1080, 1440],
    ['CleanTalkPortrait', 1080, 1920],
    ['CleanTalk5x8', 1080, 1728],
    ['HybridLandscape', 1920, 1080],
    ['Hybrid3x4', 1080, 1440],
    ['HybridPortrait', 1080, 1920],
    ['StoryLandscape', 1920, 1080],
    ['Story3x4', 1080, 1440],
    ['StoryPortrait', 1080, 1920],
    ['Episode', 1080, 1920],
    ['CleanUiWorkflow', 1920, 1080],
    ['CleanUiWorkflowPortrait', 1080, 1920],
    ['CleanUiLive', 1920, 1080],
    ['PaperLine', 1920, 1080],
    ['CleanUiDemo', 1920, 1080],
  ];
  for (const [id, w, h] of expected) {
    const re = new RegExp(`id="${id}"[\\s\\S]{0,160}?width=\\{${w}\\}[\\s\\S]{0,80}?height=\\{${h}\\}`);
    assert.match(src, re, `缺少或画幅不匹配：${id} (${w}x${h})`);
  }

  // 验证 local-workbench.cjs dry-run 支持全部 16:9 + 3:4 主标准 + 9:16 兼容入口
  for (const id of [
    'BlueTalk',
    'BlueTalk3x4',
    'BlueTalkPortrait',
    'PrismTalk',
    'PrismTalk3x4',
    'PrismTalkPortrait',
    'PrismTalk5x8',
    'PaperTalk',
    'PaperTalk3x4',
    'PaperTalkPortrait',
    'CleanTalk',
    'CleanTalk3x4',
    'CleanTalkPortrait',
    'CleanTalk5x8',
    'HybridLandscape',
    'Hybrid3x4',
    'HybridPortrait',
    'StoryLandscape',
    'Story3x4',
    'StoryPortrait',
  ]) {
    const out = JSON.parse(
      execFileSync(process.execPath, ['scripts/local-workbench.cjs', '--dry-run', 'render', id], {
        cwd: ROOT,
        encoding: 'utf8',
      }),
    );
    assert.equal(out.action, 'render');
    assert.equal(out.composition, id);
  }

  const exportCmd = readFileSync(resolve(ROOT, '../导出视频.command'), 'utf8');
  for (const id of [
    'BlueTalk3x4',
    'PrismTalk3x4',
    'PaperTalk3x4',
    'CleanTalk3x4',
    'Hybrid3x4',
    'Story3x4',
    'BlueTalkPortrait',
    'PrismTalkPortrait',
    'PaperTalkPortrait',
    'CleanTalkPortrait',
  ]) {
    assert.ok(exportCmd.includes(id), `导出视频.command 缺少 ${id}`);
  }
});

test('check-episodes.ts 准确分发 blue / prism / paper / clean 四套横屏 + 3:4 + 9:16 校验器', () => {
  assert.deepEqual(Object.keys(STYLE_VALIDATORS).sort(), ['blue', 'clean', 'paper', 'prism']);

  const demos: [string, string][] = [
    ['blue-talk-demo', 'blue'],
    ['prism-talk-demo', 'prism'],
    ['paper-talk-demo', 'paper'],
    ['clean-talk-demo', 'clean'],
  ];
  for (const [name, style] of demos) {
    const ep = JSON.parse(readFileSync(resolve(ROOT, 'public/episodes', name, 'episode.json'), 'utf8'));
    const snapshot = structuredClone(ep);
    assert.equal(ep.style, style);
    assert.doesNotThrow(() => checkStyledEpisode(ep), `${name} 应同时通过横屏、3:4 与 9:16 竖屏校验`);
    assert.deepEqual(ep, snapshot, 'checkStyledEpisode 不应原地修改输入对象');

    const taboo = structuredClone(ep);
    taboo.brand = '抖音号';
    assert.throws(() => checkStyledEpisode(taboo), /平台名或链接/, `${style} 应拦截禁忌词`);
  }

  assert.throws(() => checkStyledEpisode({style: 'unknown'}), /未知口播风格/);
});

test('from_audio.py 与 talk-sfx.py 支持五套口播风格 3:4 竖屏主标准与 16:9 横屏起片、去品牌化与音效生成', () => {
  const sampleAudio = resolve(ROOT, 'public/episodes/clean-talk-demo/narration.m4a');
  const sampleCaps = resolve(ROOT, 'public/episodes/clean-talk-demo/episode.json');
  const cases: {style: 'blue' | 'prism' | 'paper' | 'clean' | 'default'; format: 'landscape' | '3:4' | 'portrait'; brand?: string}[] = [
    {style: 'blue', format: '3:4', brand: '极客笔记'},
    {style: 'prism', format: '3:4', brand: '效率实验室'},
    {style: 'paper', format: '3:4', brand: '文字工坊'},
    {style: 'clean', format: '3:4'},
    {style: 'default', format: '3:4'},
    {style: 'blue', format: 'landscape', brand: '极客笔记'},
    {style: 'paper', format: 'portrait', brand: '文字工坊'},
  ];

  const createdDirs: string[] = [];
  try {
    for (let idx = 0; idx < cases.length; idx++) {
      const c = cases[idx];
      const epId = `_tmp_hub_${c.style}_${idx}`;
      const epDir = resolve(ROOT, 'public/episodes', epId);
      createdDirs.push(epDir);
      rmSync(epDir, {recursive: true, force: true});

      const args = [
        'scripts/from_audio.py',
        sampleAudio,
        epId,
        '--style',
        c.style,
        '--format',
        c.format,
        '--captions-json',
        sampleCaps,
      ];
      if (c.brand) args.push('--brand', c.brand);
      execFileSync('python3', args, {cwd: ROOT, stdio: 'pipe'});

      assert.ok(existsSync(resolve(epDir, 'narration.m4a')), `${epId} 缺少 narration.m4a`);
      assert.ok(existsSync(resolve(epDir, 'envelope.json')), `${epId} 缺少 envelope.json`);
      const epText = readFileSync(resolve(epDir, 'episode.json'), 'utf8');
      assert.ok(!/口播工作台|尼尔|莱恩/.test(epText), `${epId} 不应泄漏作者默认品牌或角色名`);

      const ep = JSON.parse(epText);
      assert.equal(ep.format, c.format);

      if (c.style === 'default') {
        assert.equal(ep.app?.title, '我的频道');
        assert.ok(Array.isArray(ep.shots) && ep.shots.length > 0);
        assert.doesNotThrow(() => prepareEpisode(structuredClone(ep), '3:4'), 'default 3:4 起始骨架应通过 prepareEpisode');
        continue;
      }

      assert.equal(ep.style, c.style);
      assert.equal(ep.brand, c.brand ?? '我的频道');
      assert.doesNotThrow(() => checkStyledEpisode(ep), `from_audio.py 生成的 ${c.style} 起始配置应直接通过双画幅校验`);

      execFileSync('python3', ['scripts/talk-sfx.py', epId], {cwd: ROOT, stdio: 'pipe'});
      const sfxPath = resolve(epDir, 'sfx.m4a');
      assert.ok(existsSync(sfxPath) && statSync(sfxPath).size > 1000, `${epId} 的 sfx.m4a 应成功生成`);

      const epAfterSfx = JSON.parse(readFileSync(resolve(epDir, 'episode.json'), 'utf8'));
      assert.equal(epAfterSfx.sfx?.src, 'sfx.m4a');
      assert.doesNotThrow(() => checkStyledEpisode(epAfterSfx), `写入 sfx 后 ${c.style} 配置仍应通过校验`);
    }
  } finally {
    for (const dir of createdDirs) {
      rmSync(dir, {recursive: true, force: true});
    }
  }
});
