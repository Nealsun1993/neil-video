// 虹彩对话口播版：时间轴由配音驱动，支持 16:9 横屏与 9:16 / 5:8 / 3:4 竖向画幅，零视频素材可用内置卡片或静态图出片。
import {TalkCaption, TalkShot, TALK_FPS, TALK_OVERLAP, talkAsset, speakingAt, musicGainAt} from './talk';

export {TALK_FPS, TALK_OVERLAP};
export type {TalkCaption, TalkShot};
export type PrismFormat = 'landscape' | 'portrait' | '5:8' | '3:4';

export const prismFormatDims = (fmt: PrismFormat = 'landscape') =>
  fmt === 'portrait'
    ? {width: 1080, height: 1920}
    : fmt === '5:8'
      ? {width: 1080, height: 1728}
      : fmt === '3:4'
        ? {width: 1080, height: 1440}
        : {width: 1920, height: 1080};
export type PrismIconKind = 'mark' | 'play' | 'spark' | 'text' | 'wand' | 'check' | 'chat' | 'code' | 'layers' | 'mic';
export const PRISM_ICONS: PrismIconKind[] = ['mark', 'play', 'spark', 'text', 'wand', 'check', 'chat', 'code', 'layers', 'mic'];

export type PrismIconSpec = {icon: PrismIconKind; label?: string; sub?: string; at?: number};
export type PrismIconItem = PrismIconKind | PrismIconSpec;

export type PrismCardSpec = {
  kind?: 'card';
  title: string;
  badge?: string;
  lines: string[];
  footer?: string;
  accent?: 'blue' | 'purple' | 'coral' | 'emerald';
};
export type PrismImageSpec = {kind: 'image'; src: string; label?: string; fit?: 'cover' | 'contain'};
export type PrismVideoSpec = {kind: 'video'; src: string; at?: number; length?: number; label?: string};
export type PrismClipEntry = {src: string; at?: number; label?: string; kind?: 'video' | 'image'; fit?: 'cover' | 'contain'} | PrismCardSpec;
export type PrismMediaInput = string | PrismCardSpec | PrismImageSpec | PrismVideoSpec;

export type PrismResolvedMedia =
  | {kind: 'video'; src: string; at: number; label?: string}
  | {kind: 'image'; src: string; label?: string; fit: 'cover' | 'contain'}
  | {kind: 'card'; title: string; badge?: string; lines: string[]; footer?: string; accent: 'blue' | 'purple' | 'coral' | 'emerald'};

export type PrismUser = {name: string; initial?: string};
export type PrismZoomSpec = {
  at: number;
  scale?: number;
  origin?: string;
};
export type PrismChatMessage = {
  at?: number;
  from: 'user' | 'bench';
  name?: string;
  initial?: string;
  time?: string;
  text: string;
  typed?: boolean;
  media?: PrismMediaInput;
  mediaAt?: number;
  list?: string[];
  focusAt?: number;
  focusScale?: number;
};
export type PrismCallout = {text: string; at?: number};
export type PrismPunchItem = [string, string] | {pair: [string, string]; at?: number};
export type PrismShot = TalkShot & {dark?: boolean};

export type PrismTalkEpisode = {
  id: string;
  title: string;
  style: 'prism';
  format?: PrismFormat;
  duration: number;
  brand: string;
  handle?: string;
  user?: PrismUser | string;
  audio: string;
  audioOffset?: number;
  music?: {src: string; volume?: number; voiceVolume?: number};
  sfx?: {src: string; volume?: number};
  sources?: Record<string, {src: string; length?: number}>;
  clips?: Record<string, PrismClipEntry>;
  captions: TalkCaption[];
  shots: PrismShot[];
};

export const prismAsset = (ep: PrismTalkEpisode, p: string) => talkAsset(ep as any, p);
export const prismSpeakingAt = (ep: PrismTalkEpisode, t: number) => speakingAt(ep as any, t);
export const prismMusicGainAt = (ep: PrismTalkEpisode, t: number) => musicGainAt(ep as any, t);

const IMAGE_RE = /\.(png|jpe?g|webp|gif|svg)$/i;
const TABOO_RE = /github|gitee|抖音|小红书|douyin|bilibili|B站|https?:/i;
const clamp = (x: number) => Math.max(0, Math.min(1, x));
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

const cues = (s: TalkShot, items: {at?: number}[], gap: number, firstOptional = true) => {
  let last = s.start - gap;
  items.forEach((x, i) => {
    if (x.at == null) {
      if (i > 0 || !firstOptional) throw Error('缺少 at（这一项在第几秒出现，请写全片秒数）');
      last = s.start;
      return;
    }
    if (typeof x.at !== 'number' || Number.isNaN(x.at) || x.at < s.start - 1e-6 || x.at > s.end - 0.35) {
      throw Error(`at=${x.at} 不在镜头 [${s.start}, ${s.end}] 内（请写全片秒数，并留至少 0.35 秒展示时间）`);
    }
    if (i > 0 && x.at - last < gap - 1e-6) throw Error(`at=${x.at} 离上一项太近，至少隔 ${gap} 秒`);
    last = x.at;
  });
};

export function resolvePrismIdentity(ep: PrismTalkEpisode, s?: PrismShot) {
  const p = s?.props ?? {};
  const brand: string = p.brand ?? ep.brand;
  const handle: string = p.handle ?? ep.handle ?? `@${brand}`;
  const rawUser = p.user ?? ep.user;
  const userName = typeof rawUser === 'string' ? rawUser : rawUser?.name ?? '提问者';
  const userInitial =
    (typeof rawUser === 'object' && rawUser?.initial ? rawUser.initial : Array.from(userName)[0]) || '问';
  return {brand, handle, user: {name: userName, initial: userInitial}};
}

export function isPrismShotDark(s: PrismShot): boolean {
  const explicit = s.dark ?? s.props?.dark;
  if (typeof explicit === 'boolean') return explicit;
  return s.template === 'prism.logo' || s.template === 'prism.headline' || s.template === 'prism.punch';
}

/** 暗场强度：中间黑、四角留虹彩，进出各 0.35 秒平滑过渡。 */
export function prismDarkAt(ep: PrismTalkEpisode, t: number): number {
  let v = 0;
  for (const s of ep.shots) {
    if (!isPrismShotDark(s)) continue;
    const a = clamp((t - s.start + 0.18) / 0.35);
    const b = clamp((s.end + 0.18 - t) / 0.35);
    v = Math.max(v, Math.min(a, b));
  }
  return v;
}

function normalizeCard(raw: PrismCardSpec): PrismResolvedMedia {
  text('卡片标题', raw.title, 26);
  text('卡片角标', raw.badge, 16, true);
  text('卡片底栏', raw.footer, 30, true);
  count('卡片内容行', raw.lines, 1, 5);
  raw.lines.forEach((l) => text('卡片每行', l, 32));
  const accent = raw.accent ?? 'blue';
  if (!['blue', 'purple', 'coral', 'emerald'].includes(accent)) throw Error(`未知卡片配色：${accent}`);
  return {kind: 'card', title: raw.title, badge: raw.badge, lines: raw.lines, footer: raw.footer, accent};
}

/** 解析窗口或聊天气泡内的媒体：支持 (a) mp4 视频片段、(b) 静态图片、(c) 零素材内置卡片。 */
export function resolvePrismMedia(
  ep: PrismTalkEpisode,
  s: TalkShot,
  input: PrismMediaInput | undefined,
  needDuration?: number,
): PrismResolvedMedia {
  const need = needDuration ?? s.end - s.start + TALK_OVERLAP;
  if (input == null) throw Error('缺少展示内容（请提供 media 片段、图片路径，或 {title, lines, badge} 内置卡片）');

  if (typeof input === 'object') {
    if ((input as PrismImageSpec).kind === 'image') {
      const img = input as PrismImageSpec;
      text('图片路径', img.src, 120);
      text('图片标签', img.label, 24, true);
      return {kind: 'image', src: prismAsset(ep, img.src), label: img.label, fit: img.fit ?? 'cover'};
    }
    if ((input as PrismVideoSpec).kind === 'video') {
      const vid = input as PrismVideoSpec;
      text('视频路径或片源名', vid.src, 120);
      const at = vid.at ?? 0;
      if (at < 0) throw Error(`视频起点不能为负数：${at}`);
      const reg = ep.sources?.[vid.src];
      const totalLen = reg?.length ?? vid.length;
      if (totalLen != null && at + need > totalLen - 0.05) throw Error(`视频素材 ${vid.src} 时长不够`);
      return {kind: 'video', src: prismAsset(ep, reg ? reg.src : vid.src), at, label: vid.label};
    }
    if ((input as PrismCardSpec).kind === 'card' || ('title' in input && Array.isArray((input as PrismCardSpec).lines))) {
      return normalizeCard(input as PrismCardSpec);
    }
    throw Error('无法识别的 media 对象（支持 kind:"card" / "image" / "video" 或 {title, lines, badge}）');
  }

  if (typeof input === 'string') {
    const clip = ep.clips?.[input];
    if (clip) {
      if ((clip as PrismCardSpec).kind === 'card' || ('lines' in clip && Array.isArray((clip as PrismCardSpec).lines))) {
        return normalizeCard(clip as PrismCardSpec);
      }
      const c = clip as {src: string; at?: number; label?: string; kind?: 'video' | 'image'; fit?: 'cover' | 'contain'};
      if (c.kind === 'image' || (!ep.sources?.[c.src] && IMAGE_RE.test(c.src))) {
        return {kind: 'image', src: prismAsset(ep, c.src), label: c.label, fit: c.fit ?? 'cover'};
      }
      const source = ep.sources?.[c.src];
      if (!source) throw Error(`片段 ${input} 的片源没登记：${c.src}`);
      if (IMAGE_RE.test(source.src)) {
        return {kind: 'image', src: prismAsset(ep, source.src), label: c.label, fit: c.fit ?? 'cover'};
      }
      const at = c.at ?? 0;
      if (at < 0 || (source.length != null && at + need > source.length - 0.05)) {
        throw Error(`片段 ${input} 的片源不够长`);
      }
      return {kind: 'video', src: prismAsset(ep, source.src), at, label: c.label};
    }
    if (IMAGE_RE.test(input)) {
      return {kind: 'image', src: prismAsset(ep, input), fit: 'cover'};
    }
    throw Error(`用了没登记的素材：${input}（请在 clips 登记，或直接传图片路径 / {title, lines} 零素材卡片）`);
  }

  throw Error('media 格式无效');
}

export function normalizeIconItem(item: PrismIconItem): PrismIconSpec {
  return typeof item === 'string' ? {icon: item} : item;
}

export function normalizePunchItems(lines: PrismPunchItem[], s: TalkShot): {pair: [string, string]; start: number; end: number}[] {
  const step = (s.end - s.start) / lines.length;
  return lines.map((item, i) => {
    const pair = Array.isArray(item) ? item : item.pair;
    const start = !Array.isArray(item) && item.at != null ? item.at : s.start + i * step;
    const next =
      i + 1 < lines.length
        ? !Array.isArray(lines[i + 1]) && (lines[i + 1] as {at?: number}).at != null
          ? (lines[i + 1] as {at: number}).at
          : s.start + (i + 1) * step
        : s.end;
    return {pair, start, end: next};
  });
}

type Spec = {min: number; max: number; check: (p: any, s: PrismShot, ep: PrismTalkEpisode) => void};

export const PRISM_SCENES: Record<string, Spec> = {
  'prism.logo': {
    min: 1.5,
    max: 8,
    check: (p, _s, ep) => {
      text('品牌名', p.brand ?? ep.brand, 12);
      text('顶部小标', p.kicker, 20, true);
      text('副标题', p.tagline, 28, true);
    },
  },
  'prism.icons': {
    min: 1.5,
    max: 10,
    check: (p, s) => {
      text('顶部小标', p.kicker, 20, true);
      text('标题', p.title, 18, true);
      count('图标组 items', p.items, 2, 4);
      const specs = (p.items as PrismIconItem[]).map(normalizeIconItem);
      if (specs.some((x) => x.at != null)) cues(s, specs, 0.35, true);
      for (const x of specs) {
        if (!PRISM_ICONS.includes(x.icon)) {
          throw Error(`未知图标 ${x.icon}，可选 ${PRISM_ICONS.join(' / ')}`);
        }
        text('图标名称', x.label, 12, true);
        text('图标说明', x.sub, 18, true);
      }
    },
  },
  'prism.headline': {
    min: 1.5,
    max: 10,
    check: (p) => {
      text('顶部小标', p.kicker, 20, true);
      count('大标题行数', p.lines, 1, 3);
      p.lines.forEach((l: unknown) => text('大标题每行', l, 14));
      text('副标题', p.sub, 28, true);
    },
  },
  'prism.chat': {
    min: 2,
    max: 12,
    check: (p, s, ep) => {
      count('对话消息 messages', p.messages, 1, 4);
      const ms = p.messages as PrismChatMessage[];
      cues(s, ms, 0.35, true);
      ms.forEach((m, i) => {
        if (m.from !== 'user' && m.from !== 'bench') throw Error('消息发送方 from 只能是 user 或 bench');
        text('消息正文（1到2行预算）', m.text, 40);
        text('消息发送者名', m.name, 12, true);
        text('消息头像字', m.initial, 2, true);
        text('消息时间', m.time, 12, true);
        if (m.list != null) {
          count('消息列表项', m.list, 1, 4);
          m.list.forEach((item) => text('列表每项', item, 24));
        }
        if (m.media != null) {
          const msgAt = m.at ?? s.start + (i === 0 ? 0.15 : i * 0.6);
          const mAt = m.mediaAt ?? Math.min(s.end - 0.4, msgAt + 0.45);
          if (m.mediaAt != null && (m.mediaAt < msgAt - 1e-6 || m.mediaAt > s.end - 0.35)) {
            throw Error(`mediaAt=${m.mediaAt} 必须在消息出现时间 ${msgAt} 与镜头结束前 0.35 秒之间`);
          }
          resolvePrismMedia(ep, s, m.media, Math.max(0.5, s.end - mAt + TALK_OVERLAP));
        }
        if (m.focusAt != null) {
          const msgAt = m.at ?? s.start + (i === 0 ? 0.15 : i * 0.6);
          if (typeof m.focusAt !== 'number' || Number.isNaN(m.focusAt) || m.focusAt < msgAt - 1e-6 || m.focusAt > s.end - 0.35) {
            throw Error(`focusAt=${m.focusAt} 必须在消息出现时间 ${msgAt} 与镜头结束前 0.35 秒之间`);
          }
        }
        if (m.focusScale != null && (typeof m.focusScale !== 'number' || m.focusScale < 1 || m.focusScale > 1.08)) {
          throw Error(`focusScale=${m.focusScale} 需在 1.0 到 1.08 之间`);
        }
      });
    },
  },
  'prism.window': {
    min: 2,
    max: 12,
    check: (p, s, ep) => {
      text('窗口标题', p.title ?? p.window, 28);
      text('窗口角标', p.badge, 16, true);
      const mediaInput: PrismMediaInput | undefined =
        p.media ?? p.card ?? (Array.isArray(p.lines) ? {kind: 'card', title: p.cardTitle ?? p.title ?? p.window, badge: p.badge, lines: p.lines, footer: p.footer} : undefined);
      resolvePrismMedia(ep, s, mediaInput, s.end - s.start + TALK_OVERLAP);
      if (p.callouts != null) {
        count('窗口要点提示 callouts', p.callouts, 1, 3);
        cues(s, p.callouts, 0.45, true);
        p.callouts.forEach((c: PrismCallout) => text('窗口要点文字', c.text, 22));
      }
      if (p.zoom != null && p.zoom !== false) {
        const z = p.zoom as PrismZoomSpec;
        if (typeof z !== 'object' || typeof z.at !== 'number' || Number.isNaN(z.at) || z.at < s.start - 1e-6 || z.at > s.end - 0.35) {
          throw Error(`zoom.at=${(z as any)?.at} 不在镜头 [${s.start}, ${s.end}] 内（需留至少 0.35 秒展示时间）`);
        }
        if (z.scale != null && (typeof z.scale !== 'number' || z.scale < 1 || z.scale > 1.08)) {
          throw Error(`zoom.scale=${z.scale} 需在 1.0 到 1.08 之间`);
        }
      }
      if (p.focusAt != null) {
        if (typeof p.focusAt !== 'number' || Number.isNaN(p.focusAt) || p.focusAt < s.start - 1e-6 || p.focusAt > s.end - 0.35) {
          throw Error(`focusAt=${p.focusAt} 不在镜头 [${s.start}, ${s.end}] 内（需留至少 0.35 秒展示时间）`);
        }
      }
    },
  },
  'prism.punch': {
    min: 1.8,
    max: 12,
    check: (p, s) => {
      text('顶部小标', p.kicker, 20, true);
      count('收尾短句 lines', p.lines, 1, 4);
      const items = p.lines as PrismPunchItem[];
      const withAt = items.filter((x): x is {pair: [string, string]; at?: number} => !Array.isArray(x));
      if (withAt.some((x) => x.at != null)) {
        cues(
          s,
          items.map((x) => (Array.isArray(x) ? {} : {at: x.at})),
          0.4,
          true,
        );
      }
      for (const raw of items) {
        const pair = Array.isArray(raw) ? raw : raw?.pair;
        if (!Array.isArray(pair) || pair.length !== 2) throw Error('punch 每项需要 [前半句, 虹彩后半句] 两段文字');
        text('短句前半段', pair[0], 10);
        text('短句后半段', pair[1], 10);
        if (len(pair[0]) + len(pair[1]) > 14) throw Error(`收尾短句合起来最多14个字：${pair.join('')}`);
      }
    },
  },
};

export function validatePrismTalk(ep: PrismTalkEpisode) {
  if (!ep || ep.style !== 'prism') throw Error(`未知风格：${(ep as any)?.style}，PrismTalk 需要 style 为 "prism"`);
  if (
    ep.format != null &&
    ep.format !== 'landscape' &&
    ep.format !== 'portrait' &&
    ep.format !== '5:8' &&
    ep.format !== '3:4'
  ) {
    throw Error(`画幅 format 只能是 landscape、portrait、5:8 或 3:4：${ep.format}`);
  }
  if (!(ep.duration > 0) || !Array.isArray(ep.shots) || !ep.shots.length) {
    throw Error('需要正数 duration 和至少一个镜头');
  }
  text('品牌名 brand', ep.brand, 12);
  text('账号名 handle', ep.handle, 16, true);
  if (typeof ep.user === 'string') text('用户名 user', ep.user, 12);
  else if (ep.user != null) {
    text('用户名 user.name', ep.user.name, 12);
    text('用户首字 user.initial', ep.user.initial, 2, true);
  }
  if (!ep.audio || typeof ep.audio !== 'string') throw Error('缺少配音文件字段 audio');

  let end = 0;
  for (const s of ep.shots) {
    const where = `[${s.id}] `;
    try {
      if (Math.abs(s.start - end) > 0.01) {
        throw Error(`镜头不连续：上一镜结束在 ${end}，这一镜从 ${s.start} 开始`);
      }
      const spec = PRISM_SCENES[s.template];
      if (!spec) {
        throw Error(`没有这个场景：${s.template}，可选 ${Object.keys(PRISM_SCENES).join(' / ')}`);
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
  if (TABOO_RE.test(JSON.stringify([ep.title, ep.brand, ep.handle, ep.user, ep.clips, ep.captions, ep.shots]))) {
    throw Error('文案里不能出现平台名或链接');
  }
}
