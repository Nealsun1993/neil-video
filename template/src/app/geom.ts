import {layoutFor, type Format} from '../kit/layout';
import type {Episode, Shot} from '../kit/types';
// 方案 C · 产品演示：示意 App 窗口的几何。页面模板一律使用「窗口内坐标」。
export const WIN = {x: 72, y: 170, w: 936, h: 1210} as const;
export const BAR_H = 84;        // 标题栏
export const TABS_H = 96;       // 章节标签栏
export const TOP = BAR_H + TABS_H; // 内容区起点（180）
export const PAD = 44;          // 内容左右内边距 → 内容 x 44–892
export const CW = WIN.w - PAD * 2; // 848
export const VIEW = {cx: 540, cy: WIN.y + WIN.h / 2, bottom: 1410}; // 相机中心与可视区下缘（字幕在 1455）

/** 相机状态 */
export type Cam = {s: number; tx: number; ty: number};
export const IDENTITY: Cam = {s: 1, tx: 0, ty: 0};

/** 把窗口内的一块区域放到画面中心：rect = [x, y, w, h]（窗口内坐标） */
export const camFor = (rect: [number, number, number, number] | null, scale?: number, format: Format = 'portrait'): Cam => {
  const {WIN, VIEW} = geometryFor(format);
  if (!rect) return IDENTITY;
  const [x, y, w, h] = rect;
  const s = scale ?? Math.max(1, Math.min(1.6, (WIN.w + 24) / w, (WIN.h - 30) / h));
  const cx = WIN.x + x + w / 2, cy = WIN.y + y + h / 2;
  return {s, tx: VIEW.cx - s * cx, ty: VIEW.cy - s * cy};
};

/** 原生横屏窗口更宽、更矮；页面及交互锚点使用相同几何。 */
export const geometryFor = (format: Format = 'portrait') => {
  const l = layoutFor(format), win = l.app;
  return {WIN: win, CW: win.w - PAD * 2, wide: format === 'landscape',
    VIEW: {cx: win.x + win.w / 2, cy: win.y + win.h / 2, bottom: format === 'landscape' ? 950 : format === '3:4' ? 1280 : 1410},
    width: l.width, height: l.height};
};
export const geometryOf = (shot: Shot) => geometryFor(shot.props?.__format);
export const geometryOfEpisode = (ep: Episode) => geometryFor(ep.format);

/** 标题固定在演示区外时，三脚架锁死窗口（消除 3% 微颤缩放），保证窗口顶栏与表格线条零抖动。 */
export const portraitPresentationCamera = (_cam: Cam): Cam => IDENTITY;
