// 实验分镜契约（ExpLab）：保留现有五套 UI 皮肤与三脚架稳态动效，
// 提炼借鉴 adu-motion-video 的 7 套高信息密度视觉结构（statement / balance / compare / converge / metric / stepsMerge / editorial）。
import {
  musicGainAt,
  resolveTalkClip,
  speakingAt,
  TALK_FPS,
  TALK_OVERLAP,
  talkAsset,
  TalkCaption,
  TalkClip,
  TalkShot,
  TalkSource,
  validateTalkClip,
} from './talk';
import {isSkinId, resolveSkin, SKIN_IDS, SkinId, UI_SKINS} from './uiSkins';

export {
  isSkinId,
  musicGainAt,
  resolveSkin,
  resolveTalkClip,
  SKIN_IDS,
  speakingAt,
  TALK_FPS,
  TALK_OVERLAP,
  talkAsset,
  UI_SKINS,
  validateTalkClip,
};
export type {SkinId, TalkCaption, TalkClip, TalkSource};

export const EXP_FPS = 60;
export const EXP_OVERLAP = 0.28;

export type ExpFormat = '3:4' | 'landscape' | 'portrait';

export const EXP_TEMPLATE_IDS = [
  'exp.statement',
  'exp.balance',
  'exp.compare',
  'exp.converge',
  'exp.metric',
  'exp.stepsMerge',
  'exp.editorial',
] as const;
export type ExpTemplateId = (typeof EXP_TEMPLATE_IDS)[number];

/** 单向定点推镜配置：仅允许平滑推近并静止锁死至镜尾，严禁倒走拉远、震屏或弹簧过冲。 */
export type ExpZoomSpec =
  | false
  | {
      /** 推镜起始绝对秒数（落在当前镜头内） */
      at?: number;
      /** 目标放大倍率（3:4/9:16 建议 1.06..1.14，16:9 建议 1.08..1.22） */
      scale?: number;
      /** 焦点画布坐标 x（省略取画布中心） */
      x?: number;
      /** 焦点画布坐标 y（省略取舞台视觉中心） */
      y?: number;
      /** 推镜持续秒数（默认约 0.42s） */
      duration?: number;
    };

export type ExpStatementProps = {
  kicker?: string;
  badge?: string;
  hero: string;
  echoLayers?: number;
  wrong?: string;
  right?: string;
  strikeAt?: number;
  revealAt?: number;
  sub?: string;
  zoom?: ExpZoomSpec;
};

export type ExpBalanceSideObj = {
  label: string;
  sub?: string;
  tag?: string;
  metric?: string;
};
export type ExpBalanceSideInput = string | ExpBalanceSideObj;

export type ExpBalanceStepObj = {
  label: string;
  detail?: string;
  badge?: string;
  at?: number;
};
export type ExpBalanceStepInput = string | ExpBalanceStepObj;

export type ExpBalanceProps = {
  kicker?: string;
  title: string;
  left: ExpBalanceSideInput;
  right: ExpBalanceSideInput;
  initialTilt?: number;
  levelAt?: number;
  steps: ExpBalanceStepInput[];
  cue?: string;
  zoom?: ExpZoomSpec;
};

export type ExpCompareColumn = {
  badge?: string;
  title: string;
  lines: string[];
  foot?: string;
};

export type ExpCompareProps = {
  kicker?: string;
  title?: string;
  left: ExpCompareColumn;
  right: ExpCompareColumn;
  strikeAt?: number;
  stamp?: string;
  stampAt?: number;
  cue?: string;
  zoom?: ExpZoomSpec;
};

export type ExpConvergeNodeObj = {
  title: string;
  sub?: string;
  badge?: string;
  at?: number;
};
export type ExpConvergeNodeInput = string | ExpConvergeNodeObj;

export type ExpConvergeOutput = {
  title: string;
  badge?: string;
  sub?: string;
  lines?: string[];
  media?: string;
  at?: number;
};

export type ExpConvergeProps = {
  kicker?: string;
  title?: string;
  inputs: ExpConvergeNodeInput[];
  hub: ExpConvergeNodeInput;
  output: ExpConvergeOutput;
  railAt?: number;
  cue?: string;
  zoom?: ExpZoomSpec;
};

export type ExpMetricBar = {
  label: string;
  value: number;
  max?: number;
  display?: string;
  highlight?: boolean;
  at?: number;
};

export type ExpMetricConclusion =
  | string
  | {
      badge?: string;
      text: string;
      at?: number;
    };

export type ExpMetricProps = {
  kicker?: string;
  title?: string;
  value: number;
  fromValue?: number;
  decimals?: number;
  prefix?: string;
  unit?: string;
  label: string;
  countEndAt?: number;
  bars: ExpMetricBar[];
  conclusion?: ExpMetricConclusion;
  zoom?: ExpZoomSpec;
};

export type ExpMergeStepObj = {
  step?: string;
  title: string;
  sub?: string;
  badge?: string;
  at?: number;
};
export type ExpMergeStepInput = string | ExpMergeStepObj;

export type ExpMergedSummary = {
  badge?: string;
  title: string;
  sub?: string;
  lines?: string[];
  footer?: string;
  media?: string;
};

export type ExpStepsMergeProps = {
  kicker?: string;
  title?: string;
  trackLabel?: string;
  steps: ExpMergeStepInput[];
  mergeAt?: number;
  summary: ExpMergedSummary;
  zoom?: ExpZoomSpec;
};

export type ExpEditorialNavObj = {
  code?: string;
  label: string;
  detail?: string;
  at?: number;
};
export type ExpEditorialNavInput = string | ExpEditorialNavObj;

export type ExpEditorialSpotlight = {
  badge?: string;
  text: string;
  at?: number;
};

export type ExpEditorialPanel = {
  windowTitle?: string;
  badge?: string;
  title: string;
  sub?: string;
  lines?: string[];
  media?: string;
  spotlight?: ExpEditorialSpotlight;
  footer?: string;
};

export type ExpEditorialProps = {
  kicker?: string;
  issue?: string;
  title: string;
  sub?: string;
  nav: ExpEditorialNavInput[];
  panel: ExpEditorialPanel;
  zoom?: ExpZoomSpec;
};

export type ExpShot = Omit<TalkShot, 'props'> & {
  template: ExpTemplateId | string;
  /** 单镜独立覆盖皮肤；未指定时回退到 episode.defaultSkin ?? 'clean' */
  skin?: SkinId;
  /** 是否启用暗场/反白变体（如 paper 黑底反白、prism 暗场渐晕） */
  dark?: boolean;
  /** 单向无回弹重点推镜（可选，也可写在 props.zoom） */
  zoom?: ExpZoomSpec;
  props: Record<string, any>;
};

export type ExpEpisode = {
  id: string;
  title: string;
  style: 'exp-lab';
  format?: ExpFormat;
  defaultSkin?: SkinId;
  duration: number;
  brand: string;
  audio: string;
  audioOffset?: number;
  music?: {src: string; volume?: number; voiceVolume?: number};
  sfx?: {src: string; volume?: number};
  sources?: Record<string, TalkSource>;
  clips?: Record<string, TalkClip>;
  captions: TalkCaption[];
  shots: ExpShot[];
};

export function expFormatDims(format: ExpFormat = '3:4') {
  if (format === 'landscape') return {w: 1920, h: 1080, width: 1920, height: 1080};
  if (format === 'portrait') return {w: 1080, h: 1920, width: 1080, height: 1920};
  return {w: 1080, h: 1440, width: 1080, height: 1440};
}

/**
 * 各画幅主体安全排版边界：
 * - 3:4 (1080x1440): 主体严格收在 [48..1032] x [68..1230]，底部留给 y=1292 字幕区
 * - 16:9 (1920x1080): 主体严格收在 [96..1824] x [64..880]，底部留给 y=928 字幕区
 * - 9:16 (1080x1920): 主体严格收在 [54..1026] x [140..1410]，底部留给 y=1470 字幕区
 */
export function expStageLayout(format: ExpFormat = '3:4') {
  if (format === 'landscape') {
    return {
      format,
      w: 1920,
      h: 1080,
      width: 1920,
      height: 1080,
      safeLeft: 96,
      safeRight: 1824,
      safeTop: 64,
      safeBottom: 880,
      safeW: 1728,
      safeH: 816,
      cx: 960,
      cy: 472,
      subtitleTop: 928,
    };
  }
  if (format === 'portrait') {
    return {
      format,
      w: 1080,
      h: 1920,
      width: 1080,
      height: 1920,
      safeLeft: 54,
      safeRight: 1026,
      safeTop: 140,
      safeBottom: 1410,
      safeW: 972,
      safeH: 1270,
      cx: 540,
      cy: 775,
      subtitleTop: 1470,
    };
  }
  return {
    format: '3:4' as const,
    w: 1080,
    h: 1440,
    width: 1080,
    height: 1440,
    safeLeft: 48,
    safeRight: 1032,
    safeTop: 68,
    safeBottom: 1230,
    safeW: 984,
    safeH: 1162,
    cx: 540,
    cy: 649,
    subtitleTop: 1292,
  };
}

export function resolveExpShotSkin(
  ep: Pick<ExpEpisode, 'defaultSkin'>,
  shot: Pick<ExpShot, 'skin'>,
): SkinId {
  return shot.skin ?? ep.defaultSkin ?? 'clean';
}

/**
 * 统一稳态动效曲线 `cubic-bezier(0.22, 1, 0.36, 1)`：
 * - 支持 `focusEase(t, start, end)` 与单参数 `focusEase(progress)`
 * - 严格单调递增，零过冲回弹（y1=y2=1 => y(u)=1-(1-u)^3）
 * - `t <= start` 恒等于 `0`，`t >= end` 严格恒等于整数 `1`（落定后零亚像素蠕变）
 */
export function focusEase(t: number, start = 0, end = 1): number {
  if (end <= start) return t >= end ? 1 : 0;
  if (t <= start) return 0;
  if (t >= end) return 1;
  const p = (t - start) / (end - start);
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 16; i++) {
    const m = (lo + hi) * 0.5;
    const u = 1 - m;
    const x = 3 * u * u * m * 0.22 + 3 * u * m * m * 0.36 + m * m * m;
    if (x < p) lo = m;
    else hi = m;
  }
  const s = (lo + hi) * 0.5;
  const inv = 1 - s;
  return 1 - inv * inv * inv;
}

export type ExpCameraKey = [u: number, scale: number, x: number, y: number];

export type ExpCameraState = {
  s: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  still: boolean;
  transform: string | undefined;
};

export function clampExpCameraTarget(
  scale: number,
  x: number,
  y: number,
  w = 1080,
  h = 1440,
  maxScale = 1.28,
) {
  const s = Math.max(1, Math.min(maxScale, scale));
  const minX = w / (2 * s);
  const maxX = w - minX;
  const minY = h / (2 * s);
  const maxY = h - minY;
  return {
    s,
    x: Math.max(minX, Math.min(maxX, x)),
    y: Math.max(minY, Math.min(maxY, y)),
  };
}

/**
 * 单向定点推镜关键帧：
 * `[0, 1] -> [t0, 1] -> [t1, sc] -> [d, sc]`
 * 只允许一次平滑放大并静止锁死至镜尾，绝不拉远倒走、绝无正弦晃动或震屏。
 */
export function buildPushHoldKeys(
  d: number,
  opts?: {
    atU?: number;
    scale?: number;
    x?: number;
    y?: number;
    duration?: number;
    format?: ExpFormat;
  },
): ExpCameraKey[] {
  const fmt = opts?.format ?? '3:4';
  const stage = expStageLayout(fmt);
  const cx = stage.w / 2;
  const cy = stage.h / 2;
  const dur = Math.max(0.5, d);
  const maxScale = fmt === 'landscape' ? 1.26 : 1.14;
  const rawScale = opts?.scale ?? 1;
  const atU = Math.max(0.14, opts?.atU ?? dur * 0.55);
  const avail = dur - atU;

  if (rawScale <= 1.001 || avail < 0.42) {
    return [
      [0, 1, cx, cy],
      [dur, 1, cx, cy],
    ];
  }

  const pushDur = Math.min(opts?.duration ?? 0.42, Math.max(0.24, avail * 0.5));
  const t1 = atU + pushDur;
  const target = clampExpCameraTarget(
    rawScale,
    opts?.x ?? cx,
    opts?.y ?? stage.cy,
    stage.w,
    stage.h,
    maxScale,
  );

  return [
    [0, 1, cx, cy],
    [atU, 1, cx, cy],
    [t1, target.s, target.x, target.y],
    [dur, target.s, target.x, target.y],
  ];
}

export function expCameraAt(
  u: number,
  keys: ExpCameraKey[],
  format: ExpFormat = '3:4',
): ExpCameraState {
  const {w, h} = expFormatDims(format);
  const cx = w / 2;
  const cy = h / 2;
  if (!keys.length) {
    return {s: 1, x: cx, y: cy, dx: 0, dy: 0, still: true, transform: undefined};
  }

  let s = keys[0][1];
  let x = keys[0][2];
  let y = keys[0][3];

  if (u > keys[0][0]) {
    const last = keys[keys.length - 1];
    if (u >= last[0]) {
      s = last[1];
      x = last[2];
      y = last[3];
    } else {
      for (let i = 1; i < keys.length; i++) {
        if (u < keys[i][0]) {
          const a = keys[i - 1];
          const b = keys[i];
          if (a[1] === b[1] && a[2] === b[2] && a[3] === b[3]) {
            s = a[1];
            x = a[2];
            y = a[3];
          } else {
            const q = focusEase(u, a[0], b[0]);
            s = a[1] + (b[1] - a[1]) * q;
            x = a[2] + (b[2] - a[2]) * q;
            y = a[3] + (b[3] - a[3]) * q;
          }
          break;
        }
      }
    }
  }

  const dx = cx - x * s;
  const dy = cy - y * s;
  const still = Math.abs(s - 1) < 1e-4 && Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05;
  return {
    s,
    x,
    y,
    dx,
    dy,
    still,
    transform: still
      ? undefined
      : `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) scale(${s.toFixed(4)})`,
  };
}

/** 一步读取单镜推镜相机状态（未配置 zoom 时全程 100% 三脚架静止锁死）。 */
export function expPushCamera(
  shot: Pick<ExpShot, 'start' | 'end' | 'zoom' | 'props'>,
  u: number,
  format: ExpFormat = '3:4',
): ExpCameraState {
  const d = Math.max(0.5, shot.end - shot.start);
  const spec: ExpZoomSpec | undefined = shot.zoom !== undefined ? shot.zoom : shot.props?.zoom;
  if (!spec) {
    return expCameraAt(u, buildPushHoldKeys(d, {scale: 1, format}), format);
  }
  const defaultScale = format === 'landscape' ? 1.14 : 1.09;
  const atU = spec.at != null ? spec.at - shot.start : d * 0.56;
  const keys = buildPushHoldKeys(d, {
    atU,
    scale: spec.scale ?? defaultScale,
    x: spec.x,
    y: spec.y,
    duration: spec.duration,
    format,
  });
  return expCameraAt(u, keys, format);
}

// ───────────────────────── 数据归一化与镜内时间排布辅助函数 ─────────────────────────

export function normalizeBalanceSide(side: ExpBalanceSideInput): ExpBalanceSideObj {
  return typeof side === 'string' ? {label: side} : side;
}

export function normalizeBalanceSteps(steps: ExpBalanceStepInput[]): ExpBalanceStepObj[] {
  return (steps ?? []).map((st) => (typeof st === 'string' ? {label: st} : st));
}

export function normalizeConvergeNodes(nodes: ExpConvergeNodeInput[]): ExpConvergeNodeObj[] {
  return (nodes ?? []).map((n) => (typeof n === 'string' ? {title: n} : n));
}

export function normalizeConvergeHub(hub: ExpConvergeNodeInput): ExpConvergeNodeObj {
  return typeof hub === 'string' ? {title: hub} : hub;
}

export function normalizeMergeSteps(steps: ExpMergeStepInput[]): ExpMergeStepObj[] {
  return (steps ?? []).map((st, idx) =>
    typeof st === 'string'
      ? {step: `0${idx + 1}`, title: st}
      : {step: st.step ?? `0${idx + 1}`, ...st},
  );
}

export function normalizeEditorialNav(nav: ExpEditorialNavInput[]): ExpEditorialNavObj[] {
  return (nav ?? []).map((item, idx) =>
    typeof item === 'string'
      ? {code: `0${idx + 1}`, label: item}
      : {code: item.code ?? `0${idx + 1}`, ...item},
  );
}

export function normalizeMetricConclusion(
  conclusion?: ExpMetricConclusion,
): {badge?: string; text: string; at?: number} | null {
  if (!conclusion) return null;
  return typeof conclusion === 'string' ? {text: conclusion} : conclusion;
}

export function statementTimings(shot: Pick<ExpShot, 'start' | 'end' | 'props'>) {
  const d = Math.max(1.5, shot.end - shot.start);
  const p = shot.props ?? {};
  const strikeU =
    p.strikeAt != null ? p.strikeAt - shot.start : Math.min(d - 0.85, Math.max(0.55, d * 0.34));
  const revealU =
    p.revealAt != null
      ? p.revealAt - shot.start
      : Math.min(d - 0.5, Math.max(strikeU + 0.28, d * 0.54));
  const subU = Math.min(d - 0.32, revealU + 0.32);
  return {d, heroInEndU: 0.42, strikeU, revealU, subU};
}

export function balanceTimings(shot: Pick<ExpShot, 'start' | 'end' | 'props'>) {
  const d = Math.max(1.5, shot.end - shot.start);
  const p = shot.props ?? {};
  const rawTilt = typeof p.initialTilt === 'number' && p.initialTilt !== 0 ? p.initialTilt : -8.5;
  const tiltDeg = Math.max(-14, Math.min(14, rawTilt));
  const levelStartU =
    p.levelAt != null ? p.levelAt - shot.start : Math.min(d - 1.1, Math.max(0.55, d * 0.32));
  const levelEndU = Math.min(d - 0.45, levelStartU + 0.52);
  const steps = normalizeBalanceSteps(p.steps ?? []);
  const span = Math.max(0.45, d - levelEndU - 0.45);
  const stepUs = steps.map((st, idx) =>
    st.at != null
      ? st.at - shot.start
      : levelEndU + 0.08 + (idx * span) / Math.max(1, steps.length),
  );
  return {d, tiltDeg, levelStartU, levelEndU, stepUs};
}

/** 天平倾角计算：到 `levelEndU` 后严格恒等于 `0` 度，零余震、零弹簧回晃。 */
export function balanceAngleAt(shot: Pick<ExpShot, 'start' | 'end' | 'props'>, t: number): number {
  const u = t - shot.start;
  const {tiltDeg, levelStartU, levelEndU} = balanceTimings(shot);
  const q = focusEase(u, levelStartU, levelEndU);
  return q >= 1 ? 0 : tiltDeg * (1 - q);
}

export function compareTimings(shot: Pick<ExpShot, 'start' | 'end' | 'props'>) {
  const d = Math.max(1.5, shot.end - shot.start);
  const p = shot.props ?? {};
  const strikeU =
    p.strikeAt != null ? p.strikeAt - shot.start : Math.min(d - 0.9, Math.max(0.65, d * 0.38));
  const stampU =
    p.stampAt != null
      ? p.stampAt - shot.start
      : Math.min(d - 0.45, Math.max(strikeU + 0.3, d * 0.62));
  return {d, leftInU: 0.08, rightInU: 0.24, strikeU, stampU};
}

export function convergeTimings(shot: Pick<ExpShot, 'start' | 'end' | 'props'>) {
  const d = Math.max(1.5, shot.end - shot.start);
  const p = shot.props ?? {};
  const inputs = normalizeConvergeNodes(p.inputs ?? []);
  const hub = normalizeConvergeHub(p.hub ?? '');
  const inputUs = inputs.map((item, idx) =>
    item.at != null ? item.at - shot.start : 0.1 + idx * 0.18,
  );
  const lastInU = Math.max(0.28, ...inputUs);
  const railStartU = p.railAt != null ? p.railAt - shot.start : Math.min(d - 1.15, lastInU + 0.22);
  const hubU = hub.at != null ? hub.at - shot.start : Math.min(d - 0.85, railStartU + 0.28);
  const outRailU = Math.min(d - 0.62, hubU + 0.24);
  const outputU =
    p.output?.at != null ? p.output.at - shot.start : Math.min(d - 0.42, outRailU + 0.22);
  return {d, inputUs, railStartU, hubU, outRailU, outputU};
}

export function metricTimings(shot: Pick<ExpShot, 'start' | 'end' | 'props'>) {
  const d = Math.max(1.5, shot.end - shot.start);
  const p = shot.props ?? {};
  const countStartU = 0.14;
  const countEndU =
    p.countEndAt != null
      ? p.countEndAt - shot.start
      : Math.min(d - 0.95, Math.max(0.75, d * 0.42));
  const bars: ExpMetricBar[] = p.bars ?? [];
  const barUs = bars.map((b, idx) =>
    b.at != null ? b.at - shot.start : Math.min(d - 0.55, 0.32 + idx * 0.2),
  );
  const conc = normalizeMetricConclusion(p.conclusion);
  const conclusionU =
    conc?.at != null ? conc.at - shot.start : Math.min(d - 0.42, Math.max(countEndU + 0.12, d * 0.64));
  return {d, countStartU, countEndU, barUs, conclusionU};
}

/** 大数字平滑计数：`t >= shot.start + countEndU` 后严格锁死为目标值 `value`，零尾数跳动。 */
export function metricValueAt(shot: Pick<ExpShot, 'start' | 'end' | 'props'>, t: number): number {
  const p = shot.props ?? {};
  const from = typeof p.fromValue === 'number' ? p.fromValue : 0;
  const to = typeof p.value === 'number' ? p.value : 0;
  const decimals = typeof p.decimals === 'number' ? Math.max(0, Math.min(2, p.decimals)) : 0;
  const u = t - shot.start;
  const {countStartU, countEndU} = metricTimings(shot);
  const q = focusEase(u, countStartU, countEndU);
  if (q >= 1) return to;
  const raw = from + (to - from) * q;
  const factor = Math.pow(10, decimals);
  return Math.round(raw * factor) / factor;
}

export function stepsMergeTimings(shot: Pick<ExpShot, 'start' | 'end' | 'props'>) {
  const d = Math.max(1.5, shot.end - shot.start);
  const p = shot.props ?? {};
  const steps = normalizeMergeSteps(p.steps ?? []);
  const mergeStartU =
    p.mergeAt != null ? p.mergeAt - shot.start : Math.min(d - 0.72, Math.max(0.95, d * 0.58));
  const mergeEndU = Math.min(d - 0.24, mergeStartU + 0.46);
  const stepWindow = Math.max(0.45, mergeStartU - 0.28);
  const stepUs = steps.map((st, idx) =>
    st.at != null
      ? st.at - shot.start
      : 0.12 + (idx * stepWindow) / Math.max(1, steps.length),
  );
  return {d, stepUs, mergeStartU, mergeEndU};
}

export function editorialTimings(shot: Pick<ExpShot, 'start' | 'end' | 'props'>) {
  const d = Math.max(1.5, shot.end - shot.start);
  const p = shot.props ?? {};
  const nav = normalizeEditorialNav(p.nav ?? []);
  const span = Math.max(0.6, d - 0.85);
  const navUs = nav.map((item, idx) =>
    item.at != null
      ? item.at - shot.start
      : 0.16 + (idx * span) / Math.max(1, nav.length),
  );
  const panelInU = 0.18;
  const spotlightU =
    p.panel?.spotlight?.at != null
      ? p.panel.spotlight.at - shot.start
      : Math.min(d - 0.45, Math.max(0.65, d * 0.52));
  return {d, navUs, panelInU, spotlightU};
}

// ───────────────────────── 分镜与文案安全校验器 ─────────────────────────

export type ExpSceneSpec = {
  min: number;
  max: number;
  archetype: string;
  aduRef: string;
  check: (p: any, s: ExpShot, ep: ExpEpisode) => void;
};

const TABOO_RE = /github|gitee|抖音|小红书|douyin|bilibili|B站|https?:/i;
const len = (s: unknown) => (typeof s === 'string' ? Array.from(s).length : 0);

function text(name: string, s: unknown, max: number, optional = false) {
  if (optional && s == null) return;
  const n = len(s);
  if (!n || n > max) {
    throw Error(`${name}要1到${max}个字：${s}`);
  }
}

function count(name: string, a: unknown, min: number, max: number) {
  if (!Array.isArray(a) || a.length < min || a.length > max) {
    throw Error(`${name}要${min}到${max}项`);
  }
}

function finiteNum(name: string, v: unknown, optional = false) {
  if (optional && v == null) return;
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw Error(`${name}必须是有效数字`);
  }
}

function cueAt(s: ExpShot, at: unknown, tail = 0.22) {
  if (typeof at !== 'number' || !Number.isFinite(at) || at < s.start || at > s.end - tail) {
    throw Error(`at=${at} 不在这个镜头 [${s.start}, ${s.end}] 安全范围内`);
  }
}

function cues(s: ExpShot, items: Array<{at?: number}>, gap = 0.18, firstOptional = true) {
  let last = s.start - gap;
  items.forEach((item, idx) => {
    if (item.at == null) {
      if (!firstOptional && idx > 0) throw Error('缺少 at（这一项在第几秒出现）');
      return;
    }
    cueAt(s, item.at, 0.2);
    if (item.at - last < gap) {
      throw Error(`at=${item.at} 离上一项太近，至少隔 ${gap} 秒`);
    }
    last = item.at;
  });
}

function checkZoomSpec(zoom: unknown, s: ExpShot) {
  if (zoom == null || zoom === false) return;
  if (typeof zoom !== 'object') throw Error('zoom 配置格式有误');
  const z = zoom as Record<string, unknown>;
  if (z.at != null) cueAt(s, z.at, 0.25);
  if (z.scale != null) {
    finiteNum('zoom.scale', z.scale);
    if ((z.scale as number) < 1 || (z.scale as number) > 1.4) {
      throw Error(`zoom.scale 建议在 1.0 到 1.4 之间：${z.scale}`);
    }
  }
}

export const EXP_SCENES: Record<ExpTemplateId, ExpSceneSpec> = {
  'exp.statement': {
    min: 1.8,
    max: 14,
    archetype: '回声渐变叠字 + 划错改对金句',
    aduRef: '06-A echo-focus / answer-to-question',
    check: (p, s) => {
      text('顶部小标', p.kicker, 18, true);
      text('胶囊角标', p.badge, 14, true);
      text('回声主标题', p.hero, 18);
      if (p.echoLayers != null) {
        finiteNum('回声层数', p.echoLayers);
        if (p.echoLayers < 1 || p.echoLayers > 4) throw Error('回声层数要 1 到 4 层');
      }
      text('旧认知短句', p.wrong, 26, true);
      text('新主张金句', p.right, 26, p.wrong == null);
      if (p.wrong != null && p.wrong === p.right) {
        throw Error('划除句与改写金句不能相同');
      }
      text('底部补充', p.sub, 34, true);
      if (p.strikeAt != null) cueAt(s, p.strikeAt, 0.22);
      if (p.revealAt != null) {
        cueAt(s, p.revealAt, 0.22);
        if (p.strikeAt != null && p.revealAt < p.strikeAt) {
          throw Error('revealAt 不能早于 strikeAt');
        }
      }
      checkZoomSpec(p.zoom, s);
    },
  },

  'exp.balance': {
    min: 1.8,
    max: 14,
    archetype: '矛盾天平回稳 + 三步方案',
    aduRef: '02-A paper-balance',
    check: (p, s) => {
      text('顶部小标', p.kicker, 18, true);
      text('天平标题', p.title, 20);
      if (p.left == null || p.right == null) throw Error('天平左右两端 left / right 必填');
      const left = normalizeBalanceSide(p.left);
      const right = normalizeBalanceSide(p.right);
      text('左盘主词', left.label, 14);
      text('左盘副注', left.sub, 20, true);
      text('左盘角标', left.tag, 10, true);
      text('左盘指标', left.metric, 10, true);
      text('右盘主词', right.label, 14);
      text('右盘副注', right.sub, 20, true);
      text('右盘角标', right.tag, 10, true);
      text('右盘指标', right.metric, 10, true);
      if (p.initialTilt != null) {
        finiteNum('初始倾角', p.initialTilt);
        if (Math.abs(p.initialTilt) > 16) throw Error('天平初始倾角绝对值不能超过 16 度');
      }
      if (p.levelAt != null) cueAt(s, p.levelAt, 0.25);
      count('三步方案', p.steps, 2, 3);
      const steps = normalizeBalanceSteps(p.steps);
      cues(s, steps, 0.18, true);
      for (const st of steps) {
        text('方案步骤名', st.label, 14);
        text('方案步骤说明', st.detail, 22, true);
        text('方案角标', st.badge, 10, true);
      }
      text('底部提示', p.cue, 28, true);
      checkZoomSpec(p.zoom, s);
    },
  },

  'exp.compare': {
    min: 1.8,
    max: 14,
    archetype: '双栏对比 + 斜线划除 + 无震屏稳压印章',
    aduRef: '01-D / TPL.compare',
    check: (p, s) => {
      text('顶部小标', p.kicker, 18, true);
      text('对比主标题', p.title, 22, true);
      if (!p.left || !p.right) throw Error('双栏对比需要 left 与 right 两栏');
      for (const [sideName, col] of [
        ['左栏', p.left],
        ['右栏', p.right],
      ] as const) {
        text(`${sideName}角标`, col.badge, 12, true);
        text(`${sideName}标题`, col.title, 16);
        count(`${sideName}要点`, col.lines, 1, 4);
        col.lines.forEach((line: unknown) => text(`${sideName}每行`, line, 22));
        text(`${sideName}底注`, col.foot, 20, true);
      }
      text('稳压印章', p.stamp, 12, true);
      text('底部提示', p.cue, 28, true);
      if (p.strikeAt != null) cueAt(s, p.strikeAt, 0.22);
      if (p.stampAt != null) {
        cueAt(s, p.stampAt, 0.22);
        if (p.strikeAt != null && p.stampAt < p.strikeAt) {
          throw Error('stampAt 不能早于 strikeAt');
        }
      }
      checkZoomSpec(p.zoom, s);
    },
  },

  'exp.converge': {
    min: 1.8,
    max: 14,
    archetype: '多源输入经 SVG 导轨汇聚至枢纽 + 结果卡',
    aduRef: '02-B / 04-A rail-convergence',
    check: (p, s, ep) => {
      text('顶部小标', p.kicker, 18, true);
      text('汇聚标题', p.title, 22, true);
      count('输入卡片', p.inputs, 2, 3);
      const inputs = normalizeConvergeNodes(p.inputs);
      cues(s, inputs, 0.15, true);
      for (const item of inputs) {
        text('输入卡标题', item.title, 14);
        text('输入卡说明', item.sub, 20, true);
        text('输入卡角标', item.badge, 10, true);
      }
      if (!p.hub) throw Error('汇聚镜头需要中心枢纽 hub');
      const hub = normalizeConvergeHub(p.hub);
      text('中心枢纽名', hub.title, 14);
      text('中心枢纽副注', hub.sub, 18, true);
      text('中心枢纽角标', hub.badge, 10, true);
      if (hub.at != null) cueAt(s, hub.at, 0.22);
      if (!p.output) throw Error('汇聚镜头需要结果卡 output');
      text('结果卡标题', p.output.title, 18);
      text('结果卡角标', p.output.badge, 12, true);
      text('结果卡副注', p.output.sub, 24, true);
      if (p.output.lines != null) {
        count('结果卡要点', p.output.lines, 1, 3);
        p.output.lines.forEach((line: unknown) => text('结果卡每行', line, 22));
      }
      if (p.output.media != null) validateTalkClip(ep as any, s as any, p.output.media);
      if (p.output.at != null) cueAt(s, p.output.at, 0.22);
      if (p.railAt != null) cueAt(s, p.railAt, 0.25);
      text('底部提示', p.cue, 28, true);
      checkZoomSpec(p.zoom, s);
    },
  },

  'exp.metric': {
    min: 1.8,
    max: 14,
    archetype: '大字平滑计数 + 多对比条 + 结论聚焦',
    aduRef: 'TPL.number / 06-A metric-bars',
    check: (p, s) => {
      text('顶部小标', p.kicker, 18, true);
      text('数据主标题', p.title, 22, true);
      finiteNum('核心数值 value', p.value);
      finiteNum('起始数值 fromValue', p.fromValue, true);
      if (p.decimals != null) {
        finiteNum('小数位 decimals', p.decimals);
        if (p.decimals < 0 || p.decimals > 2) throw Error('decimals 只支持 0 到 2 位');
      }
      text('数值前缀', p.prefix, 6, true);
      text('数值单位', p.unit, 10, true);
      text('数值说明', p.label, 20);
      if (p.countEndAt != null) cueAt(s, p.countEndAt, 0.22);
      count('对比条 bars', p.bars, 2, 4);
      cues(s, p.bars, 0.15, true);
      for (const bar of p.bars as ExpMetricBar[]) {
        text('对比条名称', bar.label, 16);
        finiteNum('对比条数值', bar.value);
        finiteNum('对比条满分值', bar.max, true);
        if (bar.max != null && bar.max <= 0) throw Error('对比条 max 必须大于 0');
        text('对比条显示文案', bar.display, 12, true);
      }
      const conc = normalizeMetricConclusion(p.conclusion);
      if (conc) {
        text('结论角标', conc.badge, 12, true);
        text('结论聚焦文案', conc.text, 30);
        if (conc.at != null) cueAt(s, conc.at, 0.22);
      }
      checkZoomSpec(p.zoom, s);
    },
  },

  'exp.stepsMerge': {
    min: 1.8,
    max: 14,
    archetype: '步骤轨道逐段点亮 + 三卡平滑归拢合为总结卡',
    aduRef: '05 / 01-B / 01-E steps-merge',
    check: (p, s, ep) => {
      text('顶部小标', p.kicker, 18, true);
      text('流程标题', p.title, 22, true);
      text('轨道标签', p.trackLabel, 16, true);
      count('流程步骤卡', p.steps, 2, 4);
      const steps = normalizeMergeSteps(p.steps);
      cues(s, steps, 0.15, true);
      for (const st of steps) {
        text('步骤编号', st.step, 8, true);
        text('步骤标题', st.title, 14);
        text('步骤说明', st.sub, 22, true);
        text('步骤角标', st.badge, 10, true);
      }
      if (p.mergeAt != null) cueAt(s, p.mergeAt, 0.28);
      if (!p.summary) throw Error('stepsMerge 需要归拢后的总结卡 summary');
      text('总结卡角标', p.summary.badge, 14, true);
      text('总结卡标题', p.summary.title, 20);
      text('总结卡副标', p.summary.sub, 28, true);
      if (p.summary.lines != null) {
        count('总结卡要点', p.summary.lines, 1, 3);
        p.summary.lines.forEach((line: unknown) => text('总结卡每行', line, 22));
      }
      text('总结卡底栏', p.summary.footer, 24, true);
      if (p.summary.media != null) validateTalkClip(ep as any, s as any, p.summary.media);
      checkZoomSpec(p.zoom, s);
    },
  },

  'exp.editorial': {
    min: 1.8,
    max: 14,
    archetype: '杂志不对称分栏：窄栏目录主张高亮 + 宽栏卡片聚光',
    aduRef: '01-D / 03-A asymmetric-editorial',
    check: (p, s, ep) => {
      text('杂志小标', p.kicker, 18, true);
      text('刊号角标', p.issue, 14, true);
      text('窄栏主标题', p.title, 20);
      text('窄栏导语', p.sub, 34, true);
      count('窄栏目录项', p.nav, 2, 4);
      const nav = normalizeEditorialNav(p.nav);
      cues(s, nav, 0.15, true);
      for (const item of nav) {
        text('目录编号', item.code, 8, true);
        text('目录标题', item.label, 14);
        text('目录细注', item.detail, 22, true);
      }
      if (!p.panel) throw Error('杂志分栏需要宽栏面板 panel');
      text('宽栏窗口名', p.panel.windowTitle, 20, true);
      text('宽栏角标', p.panel.badge, 14, true);
      text('宽栏标题', p.panel.title, 20);
      text('宽栏副注', p.panel.sub, 28, true);
      if (p.panel.lines != null) {
        count('宽栏要点', p.panel.lines, 1, 4);
        p.panel.lines.forEach((line: unknown) => text('宽栏每行', line, 24));
      }
      if (p.panel.media != null) validateTalkClip(ep as any, s as any, p.panel.media);
      if (p.panel.spotlight != null) {
        text('聚光角标', p.panel.spotlight.badge, 12, true);
        text('聚光重点句', p.panel.spotlight.text, 28);
        if (p.panel.spotlight.at != null) cueAt(s, p.panel.spotlight.at, 0.22);
      }
      text('宽栏底注', p.panel.footer, 24, true);
      checkZoomSpec(p.zoom, s);
    },
  },
};

export function validateExpLab(ep: ExpEpisode) {
  if (ep.style !== 'exp-lab') {
    throw Error(`未知风格：${ep.style}（应为 exp-lab）`);
  }
  if (
    ep.format != null &&
    ep.format !== '3:4' &&
    ep.format !== 'landscape' &&
    ep.format !== 'portrait'
  ) {
    throw Error(`未知画幅：${ep.format}，可选 3:4 / landscape / portrait`);
  }
  if (ep.defaultSkin != null && !isSkinId(ep.defaultSkin)) {
    throw Error(`未知默认皮肤：${ep.defaultSkin}，可选 ${SKIN_IDS.join(' / ')}`);
  }
  if (!(ep.duration > 0) || !ep.shots?.length) {
    throw Error('需要正数 duration 和至少一个镜头');
  }
  text('品牌名', ep.brand, 14);

  let end = 0;
  for (const s of ep.shots) {
    const where = `[${s.id}] `;
    try {
      if (Math.abs(s.start - end) > 0.015) {
        throw Error(`镜头不连续：上一镜结束在 ${end}，这一镜从 ${s.start} 开始`);
      }
      if (s.skin != null && !isSkinId(s.skin)) {
        throw Error(`未知单镜皮肤：${s.skin}，可选 ${SKIN_IDS.join(' / ')}`);
      }
      const spec = (EXP_SCENES as Record<string, ExpSceneSpec | undefined>)[s.template];
      if (!spec) {
        throw Error(
          `没有这个实验结构：${s.template}，可选 ${Object.keys(EXP_SCENES).join(' / ')}`,
        );
      }
      const d = +(s.end - s.start).toFixed(3);
      if (d < spec.min) {
        throw Error(
          `这一镜只有 ${d} 秒，${s.template} 至少要 ${spec.min} 秒；和相邻的句子合并，或换一个结构`,
        );
      }
      if (d > spec.max) {
        throw Error(
          `这一镜有 ${d} 秒，${s.template} 最多撑 ${spec.max} 秒；把这句话拆成两个镜头`,
        );
      }
      checkZoomSpec(s.zoom, s);
      spec.check(s.props ?? {}, s, ep);
    } catch (e) {
      throw Error(where + (e as Error).message);
    }
    end = s.end;
  }

  if (Math.abs(end - ep.duration) > 0.015) {
    throw Error(`最后一个镜头结束在 ${end}，和 duration ${ep.duration} 对不上`);
  }

  let cap = 0;
  for (const c of ep.captions ?? []) {
    if (c.start < cap - 0.01 || c.end <= c.start || c.end > ep.duration + 0.01) {
      throw Error(`字幕时间有误：${c.text}`);
    }
    text('字幕', c.text, 30);
    cap = c.end;
  }

  if (TABOO_RE.test(JSON.stringify([ep.brand, ep.title, ep.clips, ep.captions, ep.shots]))) {
    throw Error('文案里不能出现平台名或链接');
  }
}
