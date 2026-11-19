// 五套 UI 皮肤抽象层：高保真提取现有五套口播风格的底场、卡片、框线、语义色与字幕规范，
// 供跨皮肤视觉结构实验（ExpLab）自由换装，不改动任何正式生产模板文件。
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';

const h = React.createElement;

export const SKIN_IDS = ['minimal', 'blue', 'prism', 'paper', 'clean'] as const;
export type SkinId = (typeof SKIN_IDS)[number];
export type SkinFormat = '3:4' | 'landscape' | 'portrait';

export function isSkinId(value: unknown): value is SkinId {
  return typeof value === 'string' && (SKIN_IDS as readonly string[]).includes(value);
}

/** 严格只使用工程内置打包的跨平台字体，杜绝平台专有字体回退豆腐块。 */
export const SKIN_FONTS = {
  sans: '"MiSans VF", sans-serif',
  mono: '"JetBrains Mono", "MiSans VF", monospace',
  pixel: '"Workbench Pixel CN", "MiSans VF", monospace',
} as const;

export type SkinChromeKind =
  | 'clean-traffic'
  | 'blue-glass'
  | 'prism-floating'
  | 'paper-rule'
  | 'minimal-workbench';

export type UiSkin = {
  id: SkinId;
  label: string;
  dark: boolean;
  /** 画布主底色 */
  canvasBg: string;
  /** 直接排在画布背景上的主标题文字色（如 prism 彩底与 blue 深海底为白色） */
  stageInk: string;
  /** 直接排在画布背景上的次级说明文字色 */
  stageMuted: string;
  /** 画布文字可选阴影（彩底/光底增强可读性） */
  stageTextShadow?: string;
  /** 主卡片/主窗口底色 */
  cardBg: string;
  /** 卡片内部次级底槽/未激活条底色 */
  cardSubtleBg: string;
  /** 卡片内部主文字色 */
  cardInk: string;
  /** 卡片内部次要文字色 */
  cardMuted: string;
  /** 卡片边框 CSS */
  cardBorder: string;
  /** 卡片阴影 CSS */
  cardShadow: string;
  /** 卡片外圆角 */
  cardRadius: number;
  /** 内部行/子块圆角 */
  innerRadius: number;
  /** 主强调色（焦点、激活态、主按钮） */
  accent: string;
  /** 高对比文字/图标强调色 */
  accentStrong: string;
  /** 强调色浅底填充 */
  accentSoft: string;
  /** 强调色边框 */
  accentBorder: string;
  /** 进度条/高亮导轨/胶囊渐变 */
  accentGradient: string;
  /** 痛点/错误/划除语义色 */
  problem: string;
  problemSoft: string;
  problemBorder: string;
  /** 正向/印章/达成语义色 */
  success: string;
  successSoft: string;
  successBorder: string;
  /** 警示/辅助对比色 */
  warning: string;
  /** 五色标签盘（尤其适配 paper 实色名牌与多维对比条） */
  tagPalette: readonly [string, string, string, string, string];
  /** 导轨/天平横梁默认线条色与点亮色 */
  railColor: string;
  railActiveColor: string;
  /** 窗口顶栏样式与配色 */
  chrome: SkinChromeKind;
  chromeBg: string;
  chromeBorder: string;
  chromeTitleColor: string;
  /** 字体族 */
  fontSans: string;
  fontMono: string;
  fontPixel: string;
  /** 字幕条配色 */
  subtitle: {
    bg: string;
    color: string;
    border: string;
    shadow: string;
  };
};

export const UI_SKINS: Record<SkinId, UiSkin> = {
  clean: {
    id: 'clean',
    label: '纯白流线',
    dark: false,
    canvasBg: '#FFFFFF',
    stageInk: '#090B0B',
    stageMuted: '#697575',
    cardBg: '#FFFFFF',
    cardSubtleBg: '#F3F6F6',
    cardInk: '#090B0B',
    cardMuted: '#697575',
    cardBorder: '1px solid #E5ECEC',
    cardShadow: '0 16px 56px rgba(23, 40, 40, 0.08)',
    cardRadius: 26,
    innerRadius: 16,
    accent: '#0797F4',
    accentStrong: '#047AC8',
    accentSoft: '#EAF5FE',
    accentBorder: '1.5px solid rgba(7, 151, 244, 0.34)',
    accentGradient: 'linear-gradient(90deg, #0797F4 0%, #38B2FF 100%)',
    problem: '#E5484D',
    problemSoft: '#FFF1F2',
    problemBorder: '1.5px solid rgba(229, 72, 77, 0.28)',
    success: '#12A594',
    successSoft: '#ECFDF8',
    successBorder: '1.5px solid rgba(18, 165, 148, 0.30)',
    warning: '#F59E0B',
    tagPalette: ['#0797F4', '#12A594', '#6366F1', '#F59E0B', '#EC4899'],
    railColor: '#DCE6E7',
    railActiveColor: '#0797F4',
    chrome: 'clean-traffic',
    chromeBg: '#FFFFFF',
    chromeBorder: '1px solid #EEF2F2',
    chromeTitleColor: '#4E5959',
    fontSans: SKIN_FONTS.sans,
    fontMono: SKIN_FONTS.mono,
    fontPixel: SKIN_FONTS.pixel,
    subtitle: {
      bg: 'rgba(9, 11, 11, 0.88)',
      color: '#FFFFFF',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      shadow: '0 10px 30px rgba(9, 11, 11, 0.16)',
    },
  },

  blue: {
    id: 'blue',
    label: '深海蓝光',
    dark: true,
    canvasBg: '#06101D',
    stageInk: '#F7FBFF',
    stageMuted: '#9FC2E2',
    stageTextShadow: '0 4px 22px rgba(0, 14, 34, 0.65)',
    cardBg: 'linear-gradient(145deg, rgba(16, 38, 64, 0.90) 0%, rgba(9, 23, 40, 0.93) 60%, rgba(6, 16, 29, 0.96) 100%)',
    cardSubtleBg: 'rgba(255, 255, 255, 0.065)',
    cardInk: '#F4FAFF',
    cardMuted: '#9EC3E4',
    cardBorder: '1px solid rgba(148, 210, 255, 0.28)',
    cardShadow: '0 24px 70px rgba(0, 12, 32, 0.64)',
    cardRadius: 24,
    innerRadius: 14,
    accent: '#4FA3F5',
    accentStrong: '#9FD3FF',
    accentSoft: 'rgba(79, 163, 245, 0.18)',
    accentBorder: '1.5px solid rgba(159, 211, 255, 0.52)',
    accentGradient: 'linear-gradient(90deg, #247CE0 0%, #66C0FF 55%, #9FD3FF 100%)',
    problem: '#FF6B7A',
    problemSoft: 'rgba(255, 107, 122, 0.15)',
    problemBorder: '1.5px solid rgba(255, 107, 122, 0.42)',
    success: '#4ADEB5',
    successSoft: 'rgba(74, 222, 181, 0.15)',
    successBorder: '1.5px solid rgba(74, 222, 181, 0.44)',
    warning: '#FBBF24',
    tagPalette: ['#4FA3F5', '#9FD3FF', '#38BDF8', '#4ADEB5', '#818CF8'],
    railColor: 'rgba(159, 211, 255, 0.22)',
    railActiveColor: '#9FD3FF',
    chrome: 'blue-glass',
    chromeBg: 'rgba(13, 26, 42, 0.92)',
    chromeBorder: '1px solid rgba(255, 255, 255, 0.16)',
    chromeTitleColor: '#CAD8E6',
    fontSans: SKIN_FONTS.sans,
    fontMono: SKIN_FONTS.mono,
    fontPixel: SKIN_FONTS.pixel,
    subtitle: {
      bg: 'rgba(4, 16, 30, 0.78)',
      color: '#F7FBFF',
      border: '1px solid rgba(159, 211, 255, 0.22)',
      shadow: '0 10px 28px rgba(0, 14, 32, 0.55)',
    },
  },

  prism: {
    id: 'prism',
    label: '虹彩对话',
    dark: false,
    canvasBg: '#6B4EFF',
    stageInk: '#FFFFFF',
    stageMuted: 'rgba(255, 255, 255, 0.84)',
    stageTextShadow: '0 4px 24px rgba(20, 4, 44, 0.34)',
    cardBg: 'rgba(255, 255, 255, 0.97)',
    cardSubtleBg: '#F4F5FA',
    cardInk: '#14161C',
    cardMuted: '#727989',
    cardBorder: '1px solid rgba(255, 255, 255, 0.78)',
    cardShadow: '0 24px 68px rgba(20, 4, 48, 0.28)',
    cardRadius: 28,
    innerRadius: 18,
    accent: '#1D6BF3',
    accentStrong: '#7C4DFF',
    accentSoft: '#EEF3FF',
    accentBorder: '1.5px solid rgba(124, 77, 255, 0.34)',
    accentGradient: 'linear-gradient(100deg, #FF8A3D 0%, #FF3D77 45%, #8C5BFF 80%, #3E8BFF 100%)',
    problem: '#FF3D77',
    problemSoft: '#FFF0F5',
    problemBorder: '1.5px solid rgba(255, 61, 119, 0.32)',
    success: '#12A594',
    successSoft: '#E9FBF8',
    successBorder: '1.5px solid rgba(18, 165, 148, 0.34)',
    warning: '#FF8A3D',
    tagPalette: ['#1D6BF3', '#7C4DFF', '#FF4D6D', '#12A594', '#FF8A3D'],
    railColor: 'rgba(255, 255, 255, 0.42)',
    railActiveColor: '#FFFFFF',
    chrome: 'prism-floating',
    chromeBg: '#FAFBFD',
    chromeBorder: '1px solid #ECEEF5',
    chromeTitleColor: '#5B6272',
    fontSans: SKIN_FONTS.sans,
    fontMono: SKIN_FONTS.mono,
    fontPixel: SKIN_FONTS.pixel,
    subtitle: {
      bg: 'rgba(10, 12, 18, 0.84)',
      color: '#FFFFFF',
      border: '1px solid rgba(255, 255, 255, 0.24)',
      shadow: '0 10px 30px rgba(0, 0, 0, 0.42)',
    },
  },

  paper: {
    id: 'paper',
    label: '纸感排印',
    dark: false,
    canvasBg: '#E8E8E6',
    stageInk: '#151515',
    stageMuted: '#55585C',
    cardBg: '#F4F4F2',
    cardSubtleBg: '#E2E2DF',
    cardInk: '#151515',
    cardMuted: '#55585C',
    cardBorder: '2px solid #151515',
    cardShadow: '6px 6px 0px #151515',
    cardRadius: 12,
    innerRadius: 8,
    accent: '#5C8DF0',
    accentStrong: '#2D62D2',
    accentSoft: '#DCE7FC',
    accentBorder: '2px solid #151515',
    accentGradient: 'linear-gradient(90deg, #5C8DF0 0%, #8E4EC6 100%)',
    problem: '#E5484D',
    problemSoft: '#FCE8E9',
    problemBorder: '2px solid #E5484D',
    success: '#30A46C',
    successSoft: '#E2F5EC',
    successBorder: '2px solid #30A46C',
    warning: '#F5A524',
    tagPalette: ['#E5484D', '#30A46C', '#8E4EC6', '#F5A524', '#5C8DF0'],
    railColor: 'rgba(21, 21, 21, 0.28)',
    railActiveColor: '#5C8DF0',
    chrome: 'paper-rule',
    chromeBg: '#EAEAE7',
    chromeBorder: '2px solid #151515',
    chromeTitleColor: '#151515',
    fontSans: SKIN_FONTS.sans,
    fontMono: SKIN_FONTS.mono,
    fontPixel: SKIN_FONTS.pixel,
    subtitle: {
      bg: 'rgba(244, 244, 242, 0.94)',
      color: '#151515',
      border: '1.5px solid rgba(21, 21, 21, 0.20)',
      shadow: '0 8px 24px rgba(21, 21, 21, 0.08)',
    },
  },

  minimal: {
    id: 'minimal',
    label: '简约工作台',
    dark: false,
    canvasBg: '#F6F8FC',
    stageInk: '#10243A',
    stageMuted: '#56677C',
    cardBg: '#FFFFFF',
    cardSubtleBg: '#EFF3FA',
    cardInk: '#10243A',
    cardMuted: '#56677C',
    cardBorder: '1px solid rgba(16, 36, 58, 0.09)',
    cardShadow: '0 20px 60px rgba(16, 36, 58, 0.09)',
    cardRadius: 30,
    innerRadius: 18,
    accent: '#285BF0',
    accentStrong: '#1D49CC',
    accentSoft: '#EBF1FF',
    accentBorder: '1.5px solid rgba(40, 91, 240, 0.34)',
    accentGradient: 'linear-gradient(90deg, #285BF0 0%, #5882FA 100%)',
    problem: '#FF795C',
    problemSoft: '#FFF1ED',
    problemBorder: '1.5px solid rgba(255, 121, 92, 0.36)',
    success: '#16A37E',
    successSoft: '#EAFBF5',
    successBorder: '1.5px solid rgba(22, 163, 126, 0.32)',
    warning: '#F59E0B',
    tagPalette: ['#285BF0', '#FF795C', '#16A37E', '#6366F1', '#0EA5E9'],
    railColor: '#D6DFEC',
    railActiveColor: '#285BF0',
    chrome: 'minimal-workbench',
    chromeBg: '#FAFBFD',
    chromeBorder: '1px solid #E8EEF6',
    chromeTitleColor: '#56677C',
    fontSans: SKIN_FONTS.sans,
    fontMono: SKIN_FONTS.mono,
    fontPixel: SKIN_FONTS.pixel,
    subtitle: {
      bg: 'rgba(16, 36, 58, 0.88)',
      color: '#FFFFFF',
      border: '1px solid rgba(255, 255, 255, 0.14)',
      shadow: '0 10px 28px rgba(16, 36, 58, 0.16)',
    },
  },
};

/**
 * 解析皮肤对象；支持 `dark` 反白/暗场变体（如 `paper` 反白 `#151515`、`minimal` 深海蓝黑 `#0B192F`、`prism` 暗场渐晕）。
 */
export function resolveSkin(skin: SkinId = 'clean', dark?: boolean): UiSkin {
  const base = UI_SKINS[skin] ?? UI_SKINS.clean;
  if (!dark) return base;

  if (skin === 'paper') {
    return {
      ...base,
      dark: true,
      canvasBg: '#151515',
      stageInk: '#F4F4F2',
      stageMuted: '#A6A8AE',
      cardBg: '#202024',
      cardSubtleBg: '#2B2B30',
      cardInk: '#F4F4F2',
      cardMuted: '#A8ABB2',
      cardBorder: '2px solid #E8E8E6',
      cardShadow: '6px 6px 0px rgba(0, 0, 0, 0.65)',
      accentSoft: 'rgba(92, 141, 240, 0.22)',
      accentBorder: '2px solid #5C8DF0',
      problemSoft: 'rgba(229, 72, 77, 0.20)',
      successSoft: 'rgba(48, 164, 108, 0.20)',
      railColor: 'rgba(232, 232, 230, 0.28)',
      chromeBg: '#1B1B1F',
      chromeBorder: '2px solid #E8E8E6',
      chromeTitleColor: '#F4F4F2',
      subtitle: {
        bg: 'rgba(18, 18, 22, 0.90)',
        color: '#F4F4F2',
        border: '1.5px solid rgba(232, 232, 230, 0.28)',
        shadow: '0 10px 28px rgba(0, 0, 0, 0.48)',
      },
    };
  }

  if (skin === 'minimal') {
    return {
      ...base,
      dark: true,
      canvasBg: '#0B192F',
      stageInk: '#F6F8FC',
      stageMuted: '#9FB2C8',
      cardBg: '#132642',
      cardSubtleBg: '#1B3356',
      cardInk: '#F6F8FC',
      cardMuted: '#9FB2C8',
      cardBorder: '1px solid rgba(159, 178, 200, 0.22)',
      cardShadow: '0 22px 64px rgba(3, 10, 22, 0.55)',
      accent: '#5882FA',
      accentStrong: '#8CB0FF',
      accentSoft: 'rgba(88, 130, 250, 0.20)',
      problemSoft: 'rgba(255, 121, 92, 0.18)',
      successSoft: 'rgba(22, 163, 126, 0.18)',
      railColor: 'rgba(159, 178, 200, 0.24)',
      railActiveColor: '#5882FA',
      chromeBg: '#10213A',
      chromeBorder: '1px solid rgba(159, 178, 200, 0.18)',
      chromeTitleColor: '#C5D4E6',
      subtitle: {
        bg: 'rgba(7, 16, 31, 0.90)',
        color: '#FFFFFF',
        border: '1px solid rgba(159, 178, 200, 0.24)',
        shadow: '0 10px 28px rgba(0, 0, 0, 0.45)',
      },
    };
  }

  if (skin === 'clean') {
    return {
      ...base,
      dark: true,
      canvasBg: '#0D1317',
      stageInk: '#F5F8FA',
      stageMuted: '#95A5AE',
      cardBg: '#162026',
      cardSubtleBg: '#1E2B33',
      cardInk: '#F5F8FA',
      cardMuted: '#95A5AE',
      cardBorder: '1px solid rgba(255, 255, 255, 0.12)',
      cardShadow: '0 22px 60px rgba(0, 0, 0, 0.48)',
      accentSoft: 'rgba(7, 151, 244, 0.20)',
      problemSoft: 'rgba(229, 72, 77, 0.18)',
      successSoft: 'rgba(18, 165, 148, 0.18)',
      railColor: 'rgba(255, 255, 255, 0.18)',
      chromeBg: '#131C21',
      chromeBorder: '1px solid rgba(255, 255, 255, 0.10)',
      chromeTitleColor: '#B8C5CC',
    };
  }

  // prism 与 blue 在 dark=true 时打开暗场遮罩，保留各自高对比卡片规范
  return {...base, dark: true};
}

export function skinFormatDims(fmt: SkinFormat = '3:4') {
  if (fmt === 'landscape') return {w: 1920, h: 1080, width: 1920, height: 1080};
  if (fmt === 'portrait') return {w: 1080, h: 1920, width: 1080, height: 1920};
  return {w: 1080, h: 1440, width: 1080, height: 1440};
}

export function skinSubtitleLayout(fmt: SkinFormat = '3:4') {
  if (fmt === 'landscape') {
    return {top: 928, side: 120, maxWidth: 1620};
  }
  if (fmt === 'portrait') {
    return {top: 1470, side: 60, maxWidth: 920};
  }
  return {top: 1292, side: 48, maxWidth: 948};
}

export function skinCardStyle(
  skinOrObj: SkinId | UiSkin,
  opts?: {dark?: boolean; elevated?: boolean; padding?: number | string},
): React.CSSProperties {
  const s = typeof skinOrObj === 'string' ? resolveSkin(skinOrObj, opts?.dark) : skinOrObj;
  return {
    background: opts?.elevated === false ? s.cardSubtleBg : s.cardBg,
    color: s.cardInk,
    border: s.cardBorder,
    borderRadius: opts?.elevated === false ? s.innerRadius : s.cardRadius,
    boxShadow: opts?.elevated === false ? undefined : s.cardShadow,
    padding: opts?.padding,
    boxSizing: 'border-box',
    fontFamily: s.fontSans,
  };
}

const PAPER_CORNERS: Array<{
  key: string;
  pos: React.CSSProperties;
  lines: [string, string, string];
  align: 'left' | 'right';
}> = [
  {key: 'tl', pos: {left: 24, top: 22}, lines: ['+ · · : - -', '· : *', ':'], align: 'left'},
  {key: 'tr', pos: {right: 24, top: 22}, lines: ['- - : · · +', '* : ·', ':'], align: 'right'},
  {key: 'bl', pos: {left: 24, bottom: 22}, lines: [':', '· : *', '+ · · : - -'], align: 'left'},
  {key: 'br', pos: {right: 24, bottom: 22}, lines: [':', '* : ·', '- - : · · +'], align: 'right'},
];

export type SkinBackdropProps = {
  skin: SkinId;
  dark?: boolean | number;
  t?: number;
  fmt?: SkinFormat;
};

/**
 * 公共五皮肤背景壳：
 * - clean: 纯白 #FFFFFF 画布 + 极淡雾灰顶光
 * - blue: 深海蓝光缓慢游走底场 (#06101D -> #0E233B + #4FA3F5 柔光)
 * - prism: 虹彩流体渐层底场 + 可选暗场径向渐晕
 * - paper: #E8E8E6 暖灰纸底（dark 反白 #151515）+ 四角静态 ASCII 点阵角标
 * - minimal: #F6F8FC 纸白 + 40px 点阵网格底 + 慢周期柔和蓝光
 */
export const SkinBackdrop: React.FC<SkinBackdropProps> = ({skin, dark = false, t, fmt}) => {
  const frame = useCurrentFrame();
  const cfg = useVideoConfig();
  const sec = t ?? frame / (cfg.fps || 60);
  const resolvedFmt: SkinFormat =
    fmt ??
    (cfg.height > cfg.width
      ? Math.abs(cfg.width / cfg.height - 3 / 4) < 0.03
        ? '3:4'
        : 'portrait'
      : 'landscape');
  const darkAmt = typeof dark === 'number' ? Math.max(0, Math.min(1, dark)) : dark ? 1 : 0;
  const isDark = darkAmt >= 0.5;
  const s = resolveSkin(skin, isDark);
  const {w, h: height} = skinFormatDims(resolvedFmt);

  if (skin === 'clean') {
    return h(
      AbsoluteFill,
      {style: {background: s.canvasBg, overflow: 'hidden', pointerEvents: 'none'}},
      h(AbsoluteFill, {
        style: {
          background: isDark
            ? 'radial-gradient(ellipse 75% 55% at 50% 0%, rgba(7, 151, 244, 0.12) 0%, transparent 70%)'
            : 'radial-gradient(ellipse 80% 52% at 50% 0%, #F3F7FA 0%, rgba(243, 246, 246, 0) 72%)',
        },
      }),
    );
  }

  if (skin === 'blue') {
    const x1 = 30 + Math.sin(sec * 0.42) * 12;
    const y1 = 60 + Math.sin(sec * 0.36) * 9;
    const x2 = 72 + Math.cos(sec * 0.38) * 11;
    const y2 = 20 + Math.sin(sec * 0.45) * 7;
    return h(
      AbsoluteFill,
      {
        style: {
          background: `radial-gradient(ellipse at ${x1}% ${y1}%, rgba(26, 108, 196, 0.78) 0%, transparent 62%), radial-gradient(ellipse at ${x2}% ${y2}%, rgba(79, 163, 245, 0.52) 0%, transparent 36%), linear-gradient(135deg, #06101D 0%, #0E233B 58%, #071729 100%)`,
          overflow: 'hidden',
          pointerEvents: 'none',
        },
      },
      darkAmt > 0
        ? h(AbsoluteFill, {
            style: {background: '#020812', opacity: 0.42 * darkAmt},
          })
        : null,
    );
  }

  if (skin === 'prism') {
    const dx = Math.sin(sec * 0.55) * 11;
    const dy = Math.cos(sec * 0.44) * 9;
    return h(
      AbsoluteFill,
      {
        style: {
          background: `radial-gradient(ellipse at ${14 + dx}% ${86 + dy}%, #FFB03A 0%, transparent 44%), radial-gradient(ellipse at ${78 - dx}% ${68 + dy}%, #FF2D55 0%, transparent 55%), radial-gradient(ellipse at ${16 - dx}% ${14 + dy}%, #3A7BFF 0%, transparent 60%), radial-gradient(ellipse at ${84 + dx}% ${10 - dy}%, #FF6A2B 0%, transparent 46%), linear-gradient(140deg, #5B6CFF 0%, #C13CCB 45%, #FF4B4B 82%)`,
          overflow: 'hidden',
          pointerEvents: 'none',
        },
      },
      darkAmt > 0
        ? h(AbsoluteFill, {
            style: {
              background:
                'radial-gradient(ellipse 84% 90% at 50% 50%, #06070B 44%, rgba(6, 7, 11, 0.86) 66%, transparent 100%)',
              opacity: darkAmt,
            },
          })
        : null,
    );
  }

  if (skin === 'paper') {
    const dotColor = isDark ? 'rgba(244, 244, 242, 0.08)' : 'rgba(21, 21, 21, 0.075)';
    const markColor = isDark ? 'rgba(244, 244, 242, 0.42)' : 'rgba(21, 21, 21, 0.36)';
    return h(
      AbsoluteFill,
      {style: {background: s.canvasBg, overflow: 'hidden', pointerEvents: 'none'}},
      h(AbsoluteFill, {
        style: {
          backgroundImage: `radial-gradient(circle at center, ${dotColor} 1.3px, transparent 1.9px)`,
          backgroundSize: '24px 24px',
          backgroundPosition: '12px 12px',
        },
      }),
      ...PAPER_CORNERS.map((c) =>
        h(
          'div',
          {
            key: c.key,
            style: {
              position: 'absolute',
              ...c.pos,
              fontFamily: SKIN_FONTS.mono,
              fontSize: 14,
              fontWeight: 600,
              lineHeight: 1.35,
              letterSpacing: 1.5,
              color: markColor,
              textAlign: c.align,
              userSelect: 'none',
            },
          },
          c.lines.map((line, idx) => h('div', {key: idx}, line)),
        ),
      ),
    );
  }

  // minimal: #F6F8FC 纸白 + 40px 点阵网格 + 慢速柔和蓝光
  const tau = Math.PI * 2;
  const lx = w * 0.5 + 240 * Math.sin((tau * sec) / 26);
  const ly = height * 0.78 + 110 * Math.sin((tau * sec) / 19 + 1);
  const dotBase = isDark ? 'rgba(197, 212, 230, 0.14)' : 'rgba(16, 36, 58, 0.14)';
  return h(
    AbsoluteFill,
    {style: {background: s.canvasBg, overflow: 'hidden', pointerEvents: 'none'}},
    h(AbsoluteFill, {
      style: {
        background: `radial-gradient(ellipse 680px 520px at ${lx.toFixed(1)}px ${ly.toFixed(1)}px, rgba(40, 91, 240, ${isDark ? 0.22 : 0.12}), rgba(40, 91, 240, 0) 70%)`,
      },
    }),
    h(AbsoluteFill, {
      style: {
        backgroundImage: `radial-gradient(circle at center, ${dotBase} 2px, transparent 2.9px)`,
        backgroundSize: '40px 40px',
        backgroundPosition: '20px 20px',
        WebkitMaskImage:
          'linear-gradient(to bottom, rgba(0,0,0,0.32) 12%, rgba(0,0,0,0.78) 65%, rgba(0,0,0,0.95) 100%)',
      },
    }),
  );
};

export type SkinSubtitleProps = {
  skin: SkinId;
  text?: string | null;
  fmt?: SkinFormat;
  dark?: boolean;
};

/**
 * 公共五皮肤字幕层：
 * - 3:4 定位在 y = 1292 安全区
 * - 16:9 定位在 y = 928 安全区
 * - 9:16 定位在 y = 1470 安全区
 */
export const SkinSubtitle: React.FC<SkinSubtitleProps> = ({skin, text, fmt = '3:4', dark}) => {
  if (!text) return null;
  const s = resolveSkin(skin, dark);
  const {top, side, maxWidth} = skinSubtitleLayout(fmt);
  const n = Array.from(text).length;
  const isTall = fmt !== 'landscape';
  const fontSize =
    fmt === '3:4'
      ? n > 18
        ? 37
        : 41
      : fmt === 'portrait'
        ? n > 18
          ? 38
          : 43
        : n > 24
          ? 40
          : 44;

  return h(
    'div',
    {
      style: {
        position: 'absolute',
        left: side,
        right: side,
        top,
        zIndex: 40,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      },
    },
    h(
      'div',
      {
        style: {
          maxWidth,
          fontFamily: SKIN_FONTS.sans,
          fontSize,
          fontWeight: 600,
          lineHeight: fmt === '3:4' ? 1.35 : 1.38,
          textAlign: 'center',
          padding: fmt === '3:4' ? '9px 26px' : isTall ? '10px 28px' : '8px 30px',
          borderRadius: skin === 'paper' ? 12 : 16,
          color: s.subtitle.color,
          background: s.subtitle.bg,
          border: s.subtitle.border,
          boxShadow: s.subtitle.shadow,
        },
      },
      text,
    ),
  );
};

export type SkinWindowBarProps = {
  skin: SkinId;
  title: string;
  badge?: string;
  dark?: boolean;
  compact?: boolean;
};

/**
 * 五套皮肤通用的窗口顶栏（可选辅助壳）：
 * clean 灰点胶囊栏 / blue 深色红黄绿栏 / prism 彩色红黄绿悬浮栏 / paper 硬边等宽栏 / minimal 三灰点工作台栏
 */
export const SkinWindowBar: React.FC<SkinWindowBarProps> = ({
  skin,
  title,
  badge,
  dark,
  compact = false,
}) => {
  const s = resolveSkin(skin, dark);
  const dotColors =
    skin === 'prism' || skin === 'blue'
      ? ['#FF5F57', '#FEBC2E', '#28C840']
      : skin === 'paper'
        ? [s.cardInk, s.accent, s.problem]
        : ['#DCE3EC', '#DCE3EC', '#DCE3EC'];
  const height = compact ? 48 : 56;

  return h(
    'div',
    {
      style: {
        height,
        padding: compact ? '0 18px' : '0 24px',
        background: s.chromeBg,
        borderBottom: s.chromeBorder,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        boxSizing: 'border-box',
        flexShrink: 0,
      },
    },
    h(
      'div',
      {style: {display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0}},
      dotColors.map((c, i) =>
        h('span', {
          key: i,
          style: {
            width: skin === 'paper' ? 10 : 12,
            height: skin === 'paper' ? 10 : 12,
            borderRadius: skin === 'paper' ? 2 : 99,
            background: c,
            display: 'block',
          },
        }),
      ),
    ),
    h(
      'div',
      {
        style: {
          fontFamily: skin === 'paper' ? s.fontMono : s.fontSans,
          fontSize: compact ? 17 : 19,
          fontWeight: 600,
          color: s.chromeTitleColor,
          padding: skin === 'clean' ? '5px 16px' : undefined,
          borderRadius: skin === 'clean' ? 99 : undefined,
          background: skin === 'clean' ? s.cardSubtleBg : undefined,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
      },
      title,
    ),
    badge
      ? h(
          'span',
          {
            style: {
              fontFamily: skin === 'paper' ? s.fontMono : s.fontSans,
              fontSize: compact ? 14 : 15,
              fontWeight: 600,
              padding: '4px 12px',
              borderRadius: skin === 'paper' ? 6 : 99,
              background: s.accentSoft,
              color: skin === 'blue' || s.dark ? s.accentStrong : s.accent,
              border: skin === 'paper' ? `1.5px solid ${s.cardInk}` : undefined,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            },
          },
          badge,
        )
      : h('span', {style: {width: 36, flexShrink: 0}}),
  );
};
