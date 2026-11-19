// 纸感排印口播版：时间轴由配音驱动，支持横屏(1920×1080)、3:4 竖屏(1080×1440)与 9:16 竖屏兼容(1080×1920)，多段一行字与各模块可自由排序和重复。
import {TalkCaption, TalkShot, TALK_FPS, TALK_OVERLAP, talkAsset, speakingAt, musicGainAt} from './talk';

export {TALK_FPS, TALK_OVERLAP};
export type {TalkCaption, TalkShot};
export type PaperFormat = 'landscape' | 'portrait' | '3:4';

export const paperFormatDims = (fmt: PaperFormat = 'landscape') =>
  fmt === '3:4'
    ? {width: 1080, height: 1440}
    : fmt === 'portrait'
      ? {width: 1080, height: 1920}
      : {width: 1920, height: 1080};

export type LineStyle = 'voice' | 'heavy' | 'light' | 'breathe' | 'pixel' | 'lean';
export const LINE_STYLES: LineStyle[] = ['voice', 'heavy', 'light', 'breathe', 'pixel', 'lean'];

export type LineSeg = {
  text: string;
  style?: LineStyle;
  tag?: string;
  focus?: boolean;
};

export type PaperShot = TalkShot & {dark?: boolean};

export type PaperTalkEpisode = {
  id: string;
  title: string;
  style: 'paper';
  format?: PaperFormat;
  duration: number;
  brand: string;
  tagline?: string;
  texture?: string;
  roles?: string[];
  handle?: string;
  user?: {name: string; initial?: string} | string;
  audio: string;
  audioOffset?: number;
  music?: {src: string; volume?: number; voiceVolume?: number};
  sfx?: {src: string; volume?: number};
  sources?: Record<string, {src: string; length?: number}>;
  clips?: Record<string, any>;
  captions: TalkCaption[];
  shots: PaperShot[];
};

export const paperAsset = (ep: PaperTalkEpisode, p: string) => talkAsset(ep as any, p);
export const paperSpeakingAt = (ep: PaperTalkEpisode, t: number) => speakingAt(ep as any, t);
export const paperMusicGainAt = (ep: PaperTalkEpisode, t: number) => musicGainAt(ep as any, t);

export const PAPER_LINE = {
  fps: TALK_FPS,
  morph: 0.55,
  colors: ['#E5484D', '#30A46C', '#8E4EC6', '#F5A524', '#0091FF', '#E93D82', '#12A594', '#F76B15'],
  landscape: {width: 1920, height: 1080, size: 132, left: 220, caret: 1220, centerX: 960, centerY: 462},
  portrait: {width: 1080, height: 1920, size: 96, left: 96, caret: 760, centerX: 540, centerY: 810},
  '3:4': {width: 1080, height: 1440, size: 92, left: 92, caret: 760, centerX: 540, centerY: 620},
} as const;

export const smooth = (p: number) => {
  const q = Math.max(0, Math.min(1, p));
  return q * q * (3 - 2 * q);
};
const lerp = (a: number, b: number, q: number) => a + (b - a) * q;
const TABOO_RE = /github|gitee|抖音|小红书|douyin|bilibili|B站|https?:/i;
const len = (s: unknown) => (typeof s === 'string' ? Array.from(s).length : 0);

const text = (name: string, s: unknown, max: number, optional = false) => {
  if (optional && s == null) return;
  if (typeof s !== 'string') throw Error(`${name}必须是字符串`);
  const n = len(s);
  if (!n || n > max) throw Error(`${name}要1到${max}个字：${s}`);
};

const count = (name: string, a: unknown, min: number, max: number) => {
  if (!Array.isArray(a) || a.length < min || a.length > max) throw Error(`${name}要${min}到${max}项`);
};

export type PaperLineSched = {
  seg: LineSeg;
  index: number;
  start: number;
  typed: number;
  end: number;
  n: number;
  morphDur: number;
};

export function hasLineSwarm(shot: TalkShot, ep?: PaperTalkEpisode): boolean {
  const p = shot.props ?? {};
  if (typeof p.swarm === 'boolean') {
    if (!p.swarm) return false;
    const r = p.roles ?? ep?.roles ?? [];
    return Array.isArray(r) && r.length > 0;
  }
  return Array.isArray(p.roles) && p.roles.length > 0;
}

/** 计算单个 paper.line 镜头内每段词的打字与变形时间表，自动缩放以贴合镜头起止时间。 */
export function paperLineSchedule(shot: TalkShot, ep?: PaperTalkEpisode): PaperLineSched[] {
  const p = shot.props ?? {};
  const segs: LineSeg[] = p.line ?? [];
  const d = Math.max(0.5, shot.end - shot.start);
  const swarm = hasLineSwarm(shot, ep);
  const lead = Math.min(0.18, d * 0.06);
  const tail = swarm ? Math.min(1.65, Math.max(0.75, d * 0.25)) : Math.min(0.7, Math.max(0.32, d * 0.15));
  const avail = Math.max(0.6, d - lead - tail);

  const baseChar = typeof p.char === 'number' && p.char > 0 ? p.char : 0.11;
  const baseStyled = typeof p.styledChar === 'number' && p.styledChar > 0 ? p.styledChar : 0.14;
  const baseHold = typeof p.hold === 'number' && p.hold >= 0 ? p.hold : 0.72;

  const rawTotal =
    segs.reduce((sum, seg) => {
      const n = Array.from(seg.text).length;
      return sum + n * (seg.style ? baseStyled : baseChar) + (seg.style ? baseHold : 0);
    }, 0) || 1;
  const scale = avail / rawTotal;

  let cur = shot.start + lead;
  return segs.map((seg, index) => {
    const n = Array.from(seg.text).length;
    const typeSpan = n * (seg.style ? baseStyled : baseChar) * scale;
    const holdSpan = (seg.style ? baseHold : 0) * scale;
    const typed = cur + typeSpan;
    const end = typed + holdSpan;
    const morphDur = Math.min(PAPER_LINE.morph, Math.max(0.2, holdSpan * 0.85 || 0.34));
    const item: PaperLineSched = {seg, index, start: cur, typed, end, n, morphDur};
    cur = end;
    return item;
  });
}

export function paperMorphOf(s: PaperLineSched, t: number): number {
  return s.seg.style ? smooth((t - s.typed - 0.03) / s.morphDur) : 0;
}

export function paperSegWidth(s: PaperLineSched, t: number, size: number): number {
  const m = paperMorphOf(s, t);
  const f = s.seg.style === 'heavy' ? 1 + 0.2 * m : s.seg.style === 'breathe' ? 1 + 0.42 * m : 1;
  return s.n * size * f;
}

export type PaperLineBox = PaperLineSched & {x: number; w: number; shown: number; p: number; m: number};

/** 计算 paper.line 在 t 时刻的排版坐标、光标位置、跟随滚动与收束焦点词（不强制要求 pixel 词）。 */
export function paperLineLayout(shot: TalkShot, t: number, format: PaperFormat = 'landscape', ep?: PaperTalkEpisode) {
  const cfg = PAPER_LINE[format];
  const sch = paperLineSchedule(shot, ep);
  let x = 0;
  let caret = 0;
  const segs: PaperLineBox[] = sch.map((s) => {
    const m = paperMorphOf(s, t);
    const w = paperSegWidth(s, t, cfg.size);
    const p = Math.max(0, Math.min(1, (t - s.start) / Math.max(1e-6, s.typed - s.start)));
    const shown = t < s.start ? 0 : Math.min(s.n, Math.floor(p * s.n + 1e-6));
    const box: PaperLineBox = {...s, x, w, shown, p: t < s.start ? 0 : p, m};
    if (t >= s.start) caret = x + w * (t >= s.typed ? 1 : p);
    x += w;
    return box;
  });

  const typingScroll = Math.max(0, caret - (cfg.caret - cfg.left));
  const lineEnd = sch.at(-1)?.end ?? shot.end;
  const focusSeg =
    segs.find((b) => b.seg.focus) ??
    segs.find((b) => b.seg.style === 'pixel') ??
    [...segs].reverse().find((b) => Boolean(b.seg.style)) ??
    segs.at(-1)!;

  const panDur = Math.min(0.65, Math.max(0.24, (shot.end - lineEnd) * 0.55));
  const sw = t <= lineEnd ? 0 : smooth((t - lineEnd) / panDur);
  const focusTargetScroll = focusSeg ? Math.round(focusSeg.x + focusSeg.w / 2 - (cfg.centerX - cfg.left)) : typingScroll;
  const scroll = sw >= 1 ? focusTargetScroll : sw > 0 ? lerp(typingScroll, focusTargetScroll, sw) : typingScroll;

  return {segs, caret, typingScroll, scroll, lineEnd, focusSeg, totalWidth: x, cfg};
}

export function isPaperShotDark(s: PaperShot): boolean {
  const explicit = s.dark ?? s.props?.dark;
  if (typeof explicit === 'boolean') return explicit;
  return s.template === 'paper.poster' || s.template === 'paper.block';
}

export function paperDarkIntervals(ep: PaperTalkEpisode): {start: number; end: number}[] {
  const out: {start: number; end: number}[] = [];
  for (const s of ep.shots) {
    if (!isPaperShotDark(s)) continue;
    const prev = out.at(-1);
    if (prev && Math.abs(prev.end - s.start) < 0.02) prev.end = s.end;
    else out.push({start: s.start, end: s.end});
  }
  return out;
}

/** 像素擦除暗场状态：支持任意位置、任意次数的海报/色块暗场进出。 */
export function paperDarkAt(ep: PaperTalkEpisode, t: number) {
  const intervals = paperDarkIntervals(ep);
  for (const iv of intervals) {
    const pre = iv.start <= 0.01 ? 0 : 0.36;
    const post = iv.end >= ep.duration - 0.01 ? 0 : 0.42;
    if (t >= iv.start - pre && t <= iv.end + post) {
      const pin = iv.start <= 0.01 ? 1 : smooth((t - iv.start + 0.34) / 0.55);
      const pout = iv.end >= ep.duration - 0.01 ? 0 : smooth((t - iv.end + 0.16) / 0.55);
      const isDark = pin > 0.5 && pout < 0.5;
      return {on: true, pin, pout, isDark};
    }
  }
  return {on: false, pin: 0, pout: 0, isDark: false};
}

export function resolvePaperTexture(ep: PaperTalkEpisode, t: number): string {
  const cur = ep.shots.find((s) => t >= s.start && t < s.end) ?? ep.shots.at(-1);
  const tx = cur?.props?.texture ?? ep.texture ?? ep.brand;
  return typeof tx === 'string' && tx.length > 0 ? tx : ep.brand;
}

export function paperTextureAmount(ep: PaperTalkEpisode, t: number): number {
  const cur = ep.shots.find((s) => t >= s.start && t < s.end) ?? ep.shots.at(-1);
  if (!cur) return 0.5;
  if (typeof cur.props?.textureAmount === 'number') return Math.max(0, Math.min(1, cur.props.textureAmount));
  if (cur.template === 'paper.wall') return 0.16;
  if (isPaperShotDark(cur)) return 0.82;
  if (cur.template === 'paper.outro') return 0.7;
  return 0.5;
}

type Spec = {min: number; max: number; check: (p: any, s: PaperShot, ep: PaperTalkEpisode) => void};

const checkRoles = (roles: unknown, min = 1, max = 10, optional = true) => {
  if (optional && roles == null) return;
  count('分工名牌 roles', roles, min, max);
  (roles as unknown[]).forEach((r) => text('分工名牌', r, 10));
};

export const PAPER_SCENES: Record<string, Spec> = {
  'paper.intro': {
    min: 1.5,
    max: 7,
    check: (p, _s, ep) => {
      text('开场标题', p.title, 16, true);
      text('开场副标', p.sub, 28, true);
      text('点阵字纹理', p.texture, 16, true);
      const roles = p.roles ?? ep.roles;
      if (roles != null) checkRoles(roles, 1, 8, false);
      if (!p.title && (!Array.isArray(roles) || roles.length === 0)) {
        throw Error('paper.intro 需要至少提供 title 或 roles');
      }
    },
  },
  'paper.line': {
    min: 2,
    max: 14,
    check: (p) => {
      text('顶部小标', p.kicker, 20, true);
      text('点阵字纹理', p.texture, 16, true);
      count('一行字分段 line', p.line, 1, 24);
      let totalChars = 0;
      for (const seg of p.line as LineSeg[]) {
        text('分段文字', seg.text, 24);
        totalChars += len(seg.text);
        if (seg.style != null) {
          if (!LINE_STYLES.includes(seg.style)) {
            throw Error(`未知词形样式 ${seg.style}，可选 ${LINE_STYLES.join(' / ')}`);
          }
          text('带样式的词', seg.text, 8);
          text('词旁名牌 tag', seg.tag, 10, true);
        }
      }
      if (totalChars < 2 || totalChars > 64) {
        throw Error(`paper.line 单镜总字数要2到64个字（当前 ${totalChars} 字；更长的段落请拆成多个 paper.line 镜头）`);
      }
      checkRoles(p.roles, 1, 10, true);
    },
  },
  'paper.wall': {
    min: 2,
    max: 10,
    check: (p) => {
      const word = p.word ?? p.wallWord;
      text('字墙关键词 word', word, 6);
      text('点阵字纹理', p.texture, 16, true);
      checkRoles(p.roles, 1, 10, true);
    },
  },
  'paper.poster': {
    min: 2,
    max: 10,
    check: (p) => {
      text('海报小标', p.kicker, 24, true);
      text('点阵字纹理', p.texture, 16, true);
      const lines = p.lines ?? p.poster;
      count('黑底海报行数 lines', lines, 1, 4);
      (lines as unknown[]).forEach((l) => text('海报每行', l, 9));
      checkRoles(p.roles, 1, 10, true);
    },
  },
  'paper.block': {
    min: 2,
    max: 10,
    check: (p) => {
      text('色块顶标 label', p.label, 24, true);
      text('点阵字纹理', p.texture, 16, true);
      count('蓝色海报块行数 rows', p.rows, 2, 3);
      (p.rows as unknown[]).forEach((r) => text('色块每行', r, 6));
      checkRoles(p.roles, 1, 10, true);
    },
  },
  'paper.outro': {
    min: 2,
    max: 10,
    check: (p, _s, ep) => {
      text('品牌名', p.brand ?? ep.brand, 12);
      text('收尾引导句', p.line, 20, true);
      text('收尾副标 tagline', p.tagline ?? ep.tagline, 28, true);
      text('点阵字纹理', p.texture, 16, true);
    },
  },
};

export function validatePaperTalk(ep: PaperTalkEpisode) {
  if (!ep || ep.style !== 'paper') throw Error(`未知风格：${(ep as any)?.style}，PaperTalk 需要 style 为 "paper"`);
  if (ep.format != null && ep.format !== 'landscape' && ep.format !== 'portrait' && ep.format !== '3:4') {
    throw Error(`画幅 format 只能是 landscape、portrait 或 3:4：${ep.format}`);
  }
  if (!(ep.duration > 0) || !Array.isArray(ep.shots) || !ep.shots.length) {
    throw Error('需要正数 duration 和至少一个镜头');
  }
  text('品牌名 brand', ep.brand, 12);
  text('副标题 tagline', ep.tagline, 28, true);
  text('默认纹理字 texture', ep.texture, 16, true);
  checkRoles(ep.roles, 1, 12, true);
  if (!ep.audio || typeof ep.audio !== 'string') throw Error('缺少配音文件字段 audio');

  let end = 0;
  for (const s of ep.shots) {
    const where = `[${s.id}] `;
    try {
      if (Math.abs(s.start - end) > 0.01) {
        throw Error(`镜头不连续：上一镜结束在 ${end}，这一镜从 ${s.start} 开始`);
      }
      const spec = PAPER_SCENES[s.template];
      if (!spec) {
        throw Error(`没有这个场景：${s.template}，可选 ${Object.keys(PAPER_SCENES).join(' / ')}`);
      }
      const d = +(s.end - s.start).toFixed(3);
      if (d < spec.min) {
        throw Error(`这一镜只有 ${d} 秒，${s.template} 至少要 ${spec.min} 秒；和相邻的句子合并，或换一个场景`);
      }
      if (d > spec.max) {
        throw Error(`这一镜有 ${d} 秒，${s.template} 最多撑 ${spec.max} 秒；把这句话拆成两个镜头`);
      }
      spec.check(s.props ?? {}, s, ep);
    } catch (e) {
      throw Error(where + (e as Error).message);
    }
    end = s.end;
  }
  if (Math.abs(end - ep.duration) > 0.01) {
    throw Error(`最后一个镜头结束在 ${end}，和 duration ${ep.duration} 对不上`);
  }
  if (!Array.isArray(ep.captions) || !ep.captions.length) throw Error('需要至少一条字幕 captions');
  let cap = 0;
  for (const c of ep.captions) {
    if (c.start < cap - 0.01 || c.end <= c.start || c.end > ep.duration + 0.01) {
      throw Error(`字幕时间有误：${c.text}`);
    }
    text('字幕', c.text, 34);
    cap = c.end;
  }
  if (
    TABOO_RE.test(
      JSON.stringify([ep.title, ep.brand, ep.tagline, ep.texture, ep.roles, ep.clips, ep.captions, ep.shots]),
    )
  ) {
    throw Error('文案里不能出现平台名或链接');
  }
}
