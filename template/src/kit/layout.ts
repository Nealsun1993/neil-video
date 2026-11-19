/** 内容布局与输出画幅分开；支持 16:9 横屏、3:4 主推竖屏与 9:16 竖屏兼容（未指定时默认 portrait 以兼容旧配置）。 */
export type Format = 'portrait' | 'landscape' | '3:4';
export type Rect = {x: number; y: number; w: number; h: number};
export const layoutFor = (format: Format = 'portrait') => format === 'landscape' ? {
  format, width: 1920, height: 1080,
  app: {x: 660, y: 80, w: 1188, h: 850},
  rail: {x: 72, y: 180, w: 516, h: 650},
  subtitle: {x: 140, y: 950, w: 1640},
  primary: {x: 680, y: 180, w: 1168, h: 700},
} : format === '3:4' ? {
  format, width: 1080, height: 1440,
  app: {x: 72, y: 84, w: 936, h: 1196},
  rail: {x: 80, y: 128, w: 920, h: 220},
  subtitle: {x: 80, y: 1292, w: 920},
  primary: {x: 80, y: 390, w: 920, h: 760},
} : {
  format, width: 1080, height: 1920,
  app: {x: 72, y: 170, w: 936, h: 1210},
  rail: {x: 80, y: 196, w: 880, h: 250},
  subtitle: {x: 80, y: 1455, w: 880},
  primary: {x: 80, y: 460, w: 880, h: 860},
};
export type EpisodeLayout = ReturnType<typeof layoutFor>;
/** 包装卡片与后续工作台共用锚点，换画幅时无需重填 launch 坐标。 */
export const showcaseItemRect = (format: Format, index: number, showcaseDesign = false): Rect => format === 'landscape'
  ? {x: 850, y: 170 + index * 230, w: 990, h: 180}
  : format === '3:4'
  ? (showcaseDesign ? {x: 80, y: 500 + index * 232, w: 920, h: 196} : {x: 80, y: 520 + index * 204, w: 920, h: 172})
  : showcaseDesign ? {x:80,y:740+index*260,w:920,h:220} : {x: 80, y: 760 + index * 220, w: 920, h: 180};

/** 竖屏展示：标题在上，原生工作台在独立的中下部视口内运行。 */
export const PORTRAIT_STAGE = {scale:.9, x:54, y:410, top:550, bottom:1690} as const;
export const STAGE_3X4 = {scale:.72, x:151, y:344, top:400, bottom:1276} as const;
export const stageFor = (format: Format = 'portrait') => format === '3:4' ? STAGE_3X4 : PORTRAIT_STAGE;
export const stageSourceRect = (r: Rect, format: Format = 'portrait'): Rect => {
  const st = stageFor(format);
  return {x:(r.x-st.x)/st.scale,y:(r.y-st.y)/st.scale,w:r.w/st.scale,h:r.h/st.scale};
};
