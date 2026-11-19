import React from 'react';
import {
  AbsoluteFill,
  Audio,
  CalculateMetadataFunction,
  Img,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {FontGate} from '../kit/frame';
import {Mark} from './CleanUiDemo';
import {
  isSkinId,
  resolveSkin,
  SKIN_FONTS,
  SKIN_IDS,
  SkinBackdrop,
  SkinId,
  SkinSubtitle,
  SkinWindowBar,
  UI_SKINS,
  UiSkin,
  skinCardStyle,
} from '../kit/uiSkins';
import {
  balanceAngleAt,
  balanceTimings,
  compareTimings,
  convergeTimings,
  editorialTimings,
  EXP_FPS,
  EXP_OVERLAP,
  EXP_SCENES,
  EXP_TEMPLATE_IDS,
  expFormatDims,
  expPushCamera,
  expStageLayout,
  ExpBalanceProps,
  ExpCompareProps,
  ExpConvergeProps,
  ExpEditorialProps,
  ExpEpisode,
  ExpFormat,
  ExpMetricProps,
  ExpShot,
  ExpStatementProps,
  ExpStepsMergeProps,
  focusEase,
  metricTimings,
  metricValueAt,
  musicGainAt,
  normalizeBalanceSide,
  normalizeBalanceSteps,
  normalizeConvergeHub,
  normalizeConvergeNodes,
  normalizeEditorialNav,
  normalizeMergeSteps,
  normalizeMetricConclusion,
  resolveExpShotSkin,
  resolveTalkClip,
  statementTimings,
  stepsMergeTimings,
  talkAsset,
  validateExpLab,
} from '../kit/expLab';

export {
  EXP_FPS,
  EXP_OVERLAP,
  EXP_SCENES,
  EXP_TEMPLATE_IDS,
  SKIN_IDS,
  UI_SKINS,
  expFormatDims,
  expPushCamera,
  expStageLayout,
  focusEase,
  resolveExpShotSkin,
  resolveSkin,
  validateExpLab,
};
export type {ExpEpisode, ExpFormat, ExpShot, SkinId};

export type ExpLabProps = {
  episode: string;
  ep?: ExpEpisode;
  format?: ExpFormat;
  skin?: SkinId;
  audio?: boolean;
};

export type ExpBox = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

function fitTextSize(txt: string, base: number, maxPx: number, min = 16): number {
  const count = Math.max(1, Array.from(txt || '').length);
  return Math.max(min, Math.min(base, Math.floor(maxPx / count)));
}

/**
 * 确定性单向入场位移样式：
 * `q >= 1`（落定后）严格返回 `transform: undefined`，保证多帧像素 100% 锁死零亚像素漂移。
 */
function settleStyle(q: number, dy = 16, scaleFrom = 1): React.CSSProperties {
  if (q >= 1) {
    return {opacity: 1, transform: undefined};
  }
  const y = ((1 - q) * dy).toFixed(2);
  if (scaleFrom === 1) {
    return {
      opacity: q,
      transform: `translate3d(0, ${y}px, 0)`,
    };
  }
  const sc = (scaleFrom + (1 - scaleFrom) * q).toFixed(4);
  return {
    opacity: q,
    transform: `translate3d(0, ${y}px, 0) scale(${sc})`,
  };
}

/**
 * 计算任意镜头在指定画幅下的画布绝对布局包围盒（用于精确排版与安全边界自动化测试）。
 */
export function expSceneBoxes(shot: Pick<ExpShot, 'template' | 'props'>, fmt: ExpFormat = '3:4'): ExpBox[] {
  const st = expStageLayout(fmt);
  const isWide = fmt === 'landscape';
  const ox = st.safeLeft;
  const oy = st.safeTop;
  const W = st.safeW;
  const p = shot.props ?? {};

  const box = (id: string, x: number, y: number, w: number, h: number): ExpBox => ({
    id,
    x: ox + x,
    y: oy + y,
    w,
    h,
  });

  switch (shot.template) {
    case 'exp.statement': {
      const cardX = isWide ? 124 : 0;
      const cardW = isWide ? 1480 : W;
      return [
        box('header', 0, isWide ? 16 : 56, W, 52),
        box('hero', 0, isWide ? 86 : 136, W, isWide ? 280 : 340),
        box('card', cardX, isWide ? 392 : 508, cardW, isWide ? 308 : 432),
        box('sub', cardX, isWide ? 720 : 968, cardW, 54),
      ];
    }

    case 'exp.balance': {
      const n = Math.max(2, Math.min(3, Array.isArray(p.steps) ? p.steps.length : 3));
      const out: ExpBox[] = [
        box('header', 0, 0, W, isWide ? 94 : 112),
        box('scaleArena', 0, isWide ? 108 : 132, W, isWide ? 364 : 440),
      ];
      if (isWide) {
        const gap = 22;
        const sw = Math.floor((W - gap * (n - 1)) / n);
        for (let i = 0; i < n; i++) {
          out.push(box(`step-${i}`, i * (sw + gap), 494, sw, 212));
        }
        out.push(box('cue', 0, 726, W, 48));
      } else {
        const sh = n === 2 ? 168 : 132;
        const gap = 16;
        for (let i = 0; i < n; i++) {
          out.push(box(`step-${i}`, 0, 598 + i * (sh + gap), W, sh));
        }
        out.push(box('cue', 0, 1052, W, 48));
      }
      return out;
    }

    case 'exp.compare': {
      const gap = isWide ? 36 : 24;
      const colW = Math.floor((W - gap) / 2);
      const colY = isWide ? 116 : 144;
      const colH = isWide ? 596 : 820;
      return [
        box('header', 0, 0, W, isWide ? 96 : 116),
        box('leftCol', 0, colY, colW, colH),
        box('rightCol', colW + gap, colY, colW, colH),
        box('cue', 0, colY + colH + 22, W, 50),
      ];
    }

    case 'exp.converge': {
      const n = Math.max(2, Math.min(3, Array.isArray(p.inputs) ? p.inputs.length : 3));
      const out: ExpBox[] = [box('header', 0, 0, W, isWide ? 92 : 108)];
      if (isWide) {
        const inH = n === 3 ? 168 : 196;
        const gap = 24;
        const totalH = n * inH + (n - 1) * gap;
        const startY = 116 + Math.round((612 - totalH) / 2);
        for (let i = 0; i < n; i++) {
          out.push(box(`input-${i}`, 0, startY + i * (inH + gap), 420, inH));
        }
        out.push(box('hub', 616, 312, 356, 220));
        out.push(box('output', 1148, 162, 580, 520));
        out.push(box('cue', 0, 744, W, 48));
      } else {
        const gap = 18;
        const inW = Math.floor((W - gap * (n - 1)) / n);
        for (let i = 0; i < n; i++) {
          out.push(box(`input-${i}`, i * (inW + gap), 124, inW, 188));
        }
        out.push(box('hub', Math.round((W - 520) / 2), 396, 520, 148));
        out.push(box('output', 24, 624, W - 48, 432));
        out.push(box('cue', 24, 1072, W - 48, 48));
      }
      return out;
    }

    case 'exp.metric': {
      if (isWide) {
        return [
          box('header', 0, 0, W, 94),
          box('heroCard', 0, 116, 616, 536),
          box('barsCard', 652, 116, 1076, 536),
          box('conclusion', 0, 676, W, 108),
        ];
      }
      return [
        box('header', 0, 0, W, 112),
        box('heroCard', 0, 128, W, 288),
        box('barsCard', 0, 440, W, 492),
        box('conclusion', 0, 956, W, 144),
      ];
    }

    case 'exp.stepsMerge': {
      return [
        box('header', 0, 0, W, isWide ? 90 : 108),
        box('track', 0, isWide ? 104 : 124, W, 82),
        box('arena', 0, isWide ? 206 : 236, W, isWide ? 580 : 864),
      ];
    }

    case 'exp.editorial':
    default: {
      if (isWide) {
        return [
          box('leftRail', 0, 12, 548, 772),
          box('rightPanel', 584, 12, 1144, 772),
        ];
      }
      return [
        box('masthead', 0, 0, W, 176),
        box('leftRail', 0, 200, 332, 892),
        box('rightPanel', 356, 200, W - 356, 892),
      ];
    }
  }
}

type SceneCtx = {
  t: number;
  u: number;
  d: number;
  shot: ExpShot;
  ep: ExpEpisode;
  fmt: ExpFormat;
  skinId: SkinId;
  skin: UiSkin;
};

function StageHeader({
  skin,
  brand,
  kicker,
  title,
  badge,
  fmt,
  q,
}: {
  skin: UiSkin;
  brand: string;
  kicker?: string;
  title?: string;
  badge?: string;
  fmt: ExpFormat;
  q: number;
}) {
  const isWide = fmt === 'landscape';
  const isPaper = skin.id === 'paper';
  const titleMax = isWide ? 1240 : 880;
  const titleSize = title ? fitTextSize(title, isWide ? 46 : 42, titleMax, 28) : 38;
  return (
    <div style={{...settleStyle(q, 12), display: 'flex', flexDirection: 'column', gap: 10}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
          {skin.id === 'clean' ? (
            <span style={{color: skin.stageInk, display: 'inline-flex'}}>
              <Mark size={26} cutout={skin.canvasBg} />
            </span>
          ) : (
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: isPaper ? 2 : 99,
                background: skin.id === 'prism' ? '#FFFFFF' : skin.accent,
                display: 'inline-block',
              }}
            />
          )}
          <span
            style={{
              fontFamily: isPaper ? skin.fontMono : skin.fontSans,
              fontSize: 18,
              fontWeight: 650,
              letterSpacing: 0.4,
              color: skin.stageMuted,
              textShadow: skin.stageTextShadow,
            }}
          >
            {kicker ? `${brand} · ${kicker}` : brand}
          </span>
        </div>
        {badge ? (
          <span
            style={{
              fontFamily: isPaper ? skin.fontMono : skin.fontSans,
              fontSize: 16,
              fontWeight: 700,
              padding: '5px 14px',
              borderRadius: isPaper ? 6 : 99,
              background: skin.id === 'prism' ? 'rgba(255,255,255,0.20)' : skin.accentSoft,
              color:
                skin.id === 'prism'
                  ? '#FFFFFF'
                  : skin.dark
                    ? skin.accentStrong
                    : skin.accent,
              border:
                skin.id === 'prism'
                  ? '1px solid rgba(255,255,255,0.38)'
                  : isPaper
                    ? `2px solid ${skin.stageInk}`
                    : skin.accentBorder,
            }}
          >
            {badge}
          </span>
        ) : null}
      </div>
      {title ? (
        <div
          style={{
            fontSize: titleSize,
            fontWeight: 780,
            lineHeight: 1.16,
            letterSpacing: -0.8,
            color: skin.stageInk,
            textShadow: skin.stageTextShadow,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </div>
      ) : null}
    </div>
  );
}

function CueFooter({skin, text, q}: {skin: UiSkin; text?: string; q: number}) {
  if (!text) return null;
  const isPaper = skin.id === 'paper';
  return (
    <div
      style={{
        ...settleStyle(q, 10),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          padding: '9px 22px',
          borderRadius: isPaper ? 8 : 99,
          background: skin.id === 'prism' ? 'rgba(12, 14, 24, 0.34)' : skin.cardBg,
          border: skin.id === 'prism' ? '1px solid rgba(255,255,255,0.28)' : skin.cardBorder,
          color: skin.id === 'prism' ? '#FFFFFF' : skin.cardInk,
          fontSize: 20,
          fontWeight: 600,
          boxShadow: isPaper ? '3px 3px 0px rgba(21,21,21,0.35)' : undefined,
        }}
      >
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: 99,
            background: skin.id === 'prism' ? '#4ADEB5' : skin.success,
            flexShrink: 0,
          }}
        />
        <span>{text}</span>
      </div>
    </div>
  );
}

function ExpMediaSlot({
  ep,
  skin,
  media,
  from,
  fallbackTitle,
}: {
  ep: ExpEpisode;
  skin: UiSkin;
  media?: string;
  from: number;
  fallbackTitle: string;
}) {
  if (!media) return null;
  const resolved = resolveTalkClip(ep as any, media);
  if (!resolved) return null;
  if (resolved.kind === 'image') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: skin.innerRadius,
          overflow: 'hidden',
          border: skin.cardBorder,
        }}
      >
        <Img
          src={staticFile(resolved.asset)}
          style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}}
        />
      </div>
    );
  }
  if (resolved.kind === 'video') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: skin.innerRadius,
          overflow: 'hidden',
          border: skin.cardBorder,
        }}
      >
        <Sequence from={Math.round(from * EXP_FPS)} layout="none">
          <OffthreadVideo
            src={staticFile(resolved.asset)}
            trimBefore={Math.round((resolved.clip.at ?? 0) * EXP_FPS)}
            muted
            style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}}
          />
        </Sequence>
      </div>
    );
  }
  const c = resolved.clip;
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: '16px 20px',
        borderRadius: skin.innerRadius,
        background: skin.cardSubtleBg,
        border: skin.accentBorder,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10}}>
        <span style={{fontSize: 19, fontWeight: 720, color: skin.cardInk}}>
          {c.title ?? c.label ?? fallbackTitle}
        </span>
        {c.badge ? (
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 99,
              background: skin.accentSoft,
              color: skin.dark ? skin.accentStrong : skin.accent,
            }}
          >
            {c.badge}
          </span>
        ) : null}
      </div>
      {c.lines?.slice(0, 2).map((ln, idx) => (
        <div key={idx} style={{fontSize: 17, color: skin.cardMuted, fontWeight: 550}}>
          · {ln}
        </div>
      ))}
    </div>
  );
}

// ───────────────────────── 1. exp.statement：回声渐变叠字 + 划错改对金句 ─────────────────────────

const StatementScene: React.FC<SceneCtx> = ({u, shot, ep, fmt, skinId, skin}) => {
  const p = shot.props as ExpStatementProps;
  const boxes = expSceneBoxes(shot, fmt);
  const isWide = fmt === 'landscape';
  const {heroInEndU, strikeU, revealU, subU} = statementTimings(shot);

  const headQ = focusEase(u, 0, 0.32);
  const heroQ = focusEase(u, 0.04, heroInEndU);
  const cardQ = focusEase(u, 0.14, 0.48);
  const strikeQ = p.wrong ? focusEase(u, strikeU, strikeU + 0.32) : 0;
  const revealQ = p.right ? focusEase(u, p.wrong ? revealU : 0.24, (p.wrong ? revealU : 0.24) + 0.36) : 0;
  const subQ = focusEase(u, subU, subU + 0.32);

  const layers = Math.max(1, Math.min(4, Math.round(p.echoLayers ?? 3)));
  const heroSize = fitTextSize(p.hero, isWide ? 82 : 68, isWide ? 1520 : 920, 38);
  const stepY = isWide ? 36 : 42;
  const isPaper = skinId === 'paper';

  const bHead = boxes[0];
  const bHero = boxes[1];
  const bCard = boxes[2];
  const bSub = boxes[3];

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: bHead.x, top: bHead.y, width: bHead.w, height: bHead.h}}>
        <StageHeader
          skin={skin}
          brand={ep.brand}
          kicker={p.kicker}
          badge={p.badge ?? 'STATEMENT'}
          fmt={fmt}
          q={headQ}
        />
      </div>

      {/* 回声渐变叠字主标题区 */}
      <div
        style={{
          position: 'absolute',
          left: bHero.x,
          top: bHero.y,
          width: bHero.w,
          height: bHero.h,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingBottom: isWide ? 18 : 24,
          boxSizing: 'border-box',
        }}
      >
        <div style={{position: 'relative', width: '100%', textAlign: 'center'}}>
          {Array.from({length: layers}, (_, i) => {
            const depth = layers - i; // 远 -> 近
            const eq = focusEase(u, 0.06 + i * 0.05, 0.44 + i * 0.05);
            const targetY = -depth * stepY;
            const curY = eq >= 1 ? targetY : +(targetY * eq).toFixed(2);
            const alpha = (0.14 + ((layers - depth + 1) / (layers + 1)) * 0.24) * eq;
            return (
              <div
                key={depth}
                aria-hidden
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  transform: `translate3d(0, ${curY}px, 0) scale(${(1 - depth * 0.025).toFixed(3)})`,
                  fontSize: heroSize,
                  fontWeight: 820,
                  lineHeight: 1.08,
                  letterSpacing: -1.5,
                  color: 'transparent',
                  WebkitTextStroke: `2px ${skinId === 'prism' || skin.dark ? 'rgba(255,255,255,0.68)' : skin.accent}`,
                  opacity: alpha,
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                {p.hero}
              </div>
            );
          })}
          <div
            style={{
              ...settleStyle(heroQ, 18),
              position: 'relative',
              fontSize: heroSize,
              fontWeight: 850,
              lineHeight: 1.08,
              letterSpacing: -1.5,
              color: skin.stageInk,
              textShadow: skin.stageTextShadow,
              whiteSpace: 'nowrap',
            }}
          >
            {p.hero}
          </div>
        </div>
      </div>

      {/* 划错改对核心主张卡 */}
      <div
        style={{
          position: 'absolute',
          left: bCard.x,
          top: bCard.y,
          width: bCard.w,
          height: bCard.h,
          ...skinCardStyle(skin),
          ...settleStyle(cardQ, 18),
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <SkinWindowBar
          skin={skinId}
          dark={skin.dark}
          compact
          title={`${ep.brand} · 核心主张校准`}
          badge={p.badge}
        />
        <div
          style={{
            flex: 1,
            padding: isWide ? '22px 38px' : '28px 32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: isWide ? 18 : 24,
          }}
        >
          {p.wrong ? (
            <div
              style={{
                padding: isWide ? '18px 24px' : '22px 24px',
                borderRadius: skin.innerRadius,
                background: skin.problemSoft,
                border: skin.problemBorder,
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                opacity: 1 - 0.36 * strikeQ,
              }}
            >
              <span
                style={{
                  fontFamily: isPaper ? skin.fontMono : skin.fontSans,
                  fontSize: 16,
                  fontWeight: 750,
                  padding: '5px 12px',
                  borderRadius: isPaper ? 6 : 99,
                  background: skin.problem,
                  color: '#FFFFFF',
                  flexShrink: 0,
                }}
              >
                旧误区
              </span>
              <div style={{position: 'relative', display: 'inline-block', maxWidth: '84%'}}>
                <span
                  style={{
                    fontSize: fitTextSize(p.wrong, isWide ? 31 : 30, bCard.w - 220, 20),
                    fontWeight: 650,
                    color: skin.cardInk,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.wrong}
                </span>
                <div
                  style={{
                    position: 'absolute',
                    left: -4,
                    right: -4,
                    top: '52%',
                    height: 4,
                    borderRadius: 4,
                    background: skin.problem,
                    transformOrigin: '0 50%',
                    transform: strikeQ >= 1 ? undefined : `scaleX(${strikeQ.toFixed(4)})`,
                    opacity: strikeQ > 0 ? 1 : 0,
                  }}
                />
              </div>
            </div>
          ) : null}

          {p.right ? (
            <div
              style={{
                ...settleStyle(revealQ, 14),
                padding: isWide ? '20px 24px' : '26px 24px',
                borderRadius: skin.innerRadius,
                background: skin.accentSoft,
                border: skin.accentBorder,
                display: 'flex',
                alignItems: 'center',
                gap: 18,
              }}
            >
              <span
                style={{
                  fontFamily: isPaper ? skin.fontMono : skin.fontSans,
                  fontSize: 16,
                  fontWeight: 750,
                  padding: '5px 12px',
                  borderRadius: isPaper ? 6 : 99,
                  background: skin.accent,
                  color: '#FFFFFF',
                  flexShrink: 0,
                }}
              >
                新主张
              </span>
              <span
                style={{
                  fontSize: fitTextSize(p.right, isWide ? 35 : 33, bCard.w - 220, 22),
                  fontWeight: 780,
                  color: skin.cardInk,
                  whiteSpace: 'nowrap',
                }}
              >
                {p.right}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {p.sub ? (
        <div style={{position: 'absolute', left: bSub.x, top: bSub.y, width: bSub.w, height: bSub.h}}>
          <CueFooter skin={skin} text={p.sub} q={subQ} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 2. exp.balance：矛盾天平回稳 + 三步方案 ─────────────────────────

const BalanceScene: React.FC<SceneCtx> = ({t, u, shot, ep, fmt, skin}) => {
  const p = shot.props as ExpBalanceProps;
  const boxes = expSceneBoxes(shot, fmt);
  const isWide = fmt === 'landscape';
  const isPaper = skin.id === 'paper';

  const left = normalizeBalanceSide(p.left);
  const right = normalizeBalanceSide(p.right);
  const steps = normalizeBalanceSteps(p.steps);
  const {levelEndU, stepUs} = balanceTimings(shot);
  const angle = balanceAngleAt(shot, t);
  const angleLocked = Math.abs(angle) < 1e-4;

  const headQ = focusEase(u, 0, 0.32);
  const scaleInQ = focusEase(u, 0.08, 0.42);
  const cueQ = focusEase(u, Math.max(levelEndU + 0.24, (stepUs[stepUs.length - 1] ?? 0.8) + 0.16), Math.max(levelEndU + 0.56, (stepUs[stepUs.length - 1] ?? 0.8) + 0.46));

  const bHead = boxes[0];
  const bArena = boxes[1];
  const bCue = boxes[boxes.length - 1];

  const cx = Math.round(bArena.w / 2);
  const pivotY = isWide ? 74 : 90;
  const beamR = isWide ? 420 : 258;
  const panW = isWide ? 468 : 404;
  const panH = isWide ? 162 : 182;
  const hangerH = 38;

  const renderPan = (side: ReturnType<typeof normalizeBalanceSide>, idx: 0 | 1) => {
    const color = idx === 0 ? skin.accent : skin.success;
    const softBg = idx === 0 ? skin.accentSoft : skin.successSoft;
    const borderCss = idx === 0 ? skin.accentBorder : skin.successBorder;
    return (
      <div
        style={{
          width: panW,
          height: panH,
          ...skinCardStyle(skin, {padding: isWide ? '18px 22px' : '20px 22px'}),
          border: borderCss,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8}}>
          <span
            style={{
              fontFamily: isPaper ? skin.fontMono : skin.fontSans,
              fontSize: 15,
              fontWeight: 700,
              padding: '3px 11px',
              borderRadius: isPaper ? 5 : 99,
              background: softBg,
              color: skin.dark ? '#FFFFFF' : color,
            }}
          >
            {side.tag ?? (idx === 0 ? 'LEFT' : 'RIGHT')}
          </span>
          {side.metric ? (
            <span
              style={{
                fontFamily: skin.fontMono,
                fontSize: 16,
                fontWeight: 700,
                color: skin.cardMuted,
              }}
            >
              {side.metric}
            </span>
          ) : null}
        </div>
        <div
          style={{
            fontSize: fitTextSize(side.label, isWide ? 32 : 30, panW - 48, 22),
            fontWeight: 780,
            color: skin.cardInk,
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
          }}
        >
          {side.label}
        </div>
        {side.sub ? (
          <div
            style={{
              fontSize: 18,
              fontWeight: 550,
              color: skin.cardMuted,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {side.sub}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: bHead.x, top: bHead.y, width: bHead.w, height: bHead.h}}>
        <StageHeader
          skin={skin}
          brand={ep.brand}
          kicker={p.kicker}
          title={p.title}
          badge={angleLocked ? 'BALANCED · 0.0°' : 'BALANCING'}
          fmt={fmt}
          q={headQ}
        />
      </div>

      {/* 天平平衡主舞台：落平后 angle===0，transform 完全移除，绝对零余震 */}
      <div
        style={{
          position: 'absolute',
          left: bArena.x,
          top: bArena.y,
          width: bArena.w,
          height: bArena.h,
          ...settleStyle(scaleInQ, 14),
        }}
      >
        {/* 中央支点立柱与底座 */}
        <svg
          width={bArena.w}
          height={bArena.h}
          viewBox={`0 0 ${bArena.w} ${bArena.h}`}
          style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}}
          aria-hidden
        >
          <line
            x1={cx}
            y1={pivotY}
            x2={cx}
            y2={bArena.h - 28}
            stroke={skin.railColor}
            strokeWidth={6}
            strokeLinecap="round"
          />
          <rect
            x={cx - 76}
            y={bArena.h - 32}
            width={152}
            height={14}
            rx={7}
            fill={angleLocked ? skin.railActiveColor : skin.railColor}
          />
          <polygon
            points={`${cx},${pivotY - 14} ${cx - 16},${pivotY + 14} ${cx + 16},${pivotY + 14}`}
            fill={skin.accent}
          />
        </svg>

        {/* 横梁与双托盘 */}
        <div
          style={{
            position: 'absolute',
            left: cx,
            top: pivotY,
            width: 0,
            height: 0,
            transform: angleLocked ? undefined : `rotate(${angle.toFixed(3)}deg)`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: -beamR,
              top: -4,
              width: beamR * 2,
              height: 8,
              borderRadius: 8,
              background: angleLocked ? skin.railActiveColor : skin.railColor,
            }}
          />
          {/* 左托盘悬挂 */}
          <div
            style={{
              position: 'absolute',
              left: -beamR,
              top: 0,
              transform: angleLocked ? undefined : `rotate(${(-angle).toFixed(3)}deg)`,
            }}
          >
            <div
              style={{
                width: 3,
                height: hangerH,
                background: skin.railColor,
                marginLeft: -1.5,
              }}
            />
            <div style={{position: 'absolute', left: -Math.round(panW / 2), top: hangerH}}>
              {renderPan(left, 0)}
            </div>
          </div>

          {/* 右托盘悬挂 */}
          <div
            style={{
              position: 'absolute',
              left: beamR,
              top: 0,
              transform: angleLocked ? undefined : `rotate(${(-angle).toFixed(3)}deg)`,
            }}
          >
            <div
              style={{
                width: 3,
                height: hangerH,
                background: skin.railColor,
                marginLeft: -1.5,
              }}
            />
            <div style={{position: 'absolute', left: -Math.round(panW / 2), top: hangerH}}>
              {renderPan(right, 1)}
            </div>
          </div>
        </div>
      </div>

      {/* 三步解法卡片 */}
      {steps.map((stItem, idx) => {
        const bStep = boxes[2 + idx];
        const sq = focusEase(u, stepUs[idx], stepUs[idx] + 0.34);
        const tagColor = skin.tagPalette[idx % skin.tagPalette.length];
        return (
          <div
            key={idx}
            style={{
              position: 'absolute',
              left: bStep.x,
              top: bStep.y,
              width: bStep.w,
              height: bStep.h,
              ...skinCardStyle(skin, {padding: isWide ? '20px 24px' : '18px 26px'}),
              ...settleStyle(sq, 14),
              display: 'flex',
              flexDirection: isWide ? 'column' : 'row',
              alignItems: isWide ? 'flex-start' : 'center',
              justifyContent: isWide ? 'space-between' : 'flex-start',
              gap: isWide ? 10 : 20,
            }}
          >
            <span
              style={{
                fontFamily: skin.fontMono,
                fontSize: 17,
                fontWeight: 800,
                padding: '6px 14px',
                borderRadius: isPaper ? 6 : 12,
                background: tagColor,
                color: '#FFFFFF',
                flexShrink: 0,
              }}
            >
              {stItem.badge ?? `0${idx + 1}`}
            </span>
            <div style={{display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0}}>
              <div
                style={{
                  fontSize: isWide ? 26 : 27,
                  fontWeight: 760,
                  color: skin.cardInk,
                  whiteSpace: 'nowrap',
                }}
              >
                {stItem.label}
              </div>
              {stItem.detail ? (
                <div
                  style={{
                    fontSize: isWide ? 18 : 20,
                    fontWeight: 540,
                    color: skin.cardMuted,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {stItem.detail}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}

      {p.cue ? (
        <div style={{position: 'absolute', left: bCue.x, top: bCue.y, width: bCue.w, height: bCue.h}}>
          <CueFooter skin={skin} text={p.cue} q={cueQ} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 3. exp.compare：双栏对比 + 斜线划除 + 稳压印章 ─────────────────────────

const CompareScene: React.FC<SceneCtx> = ({u, shot, ep, fmt, skinId, skin}) => {
  const p = shot.props as ExpCompareProps;
  const boxes = expSceneBoxes(shot, fmt);
  const isWide = fmt === 'landscape';
  const isPaper = skinId === 'paper';
  const {leftInU, rightInU, strikeU, stampU} = compareTimings(shot);

  const headQ = focusEase(u, 0, 0.32);
  const leftQ = focusEase(u, leftInU, leftInU + 0.34);
  const rightQ = focusEase(u, rightInU, rightInU + 0.36);
  const strikeQ = focusEase(u, strikeU, strikeU + 0.34);
  const stampQ = focusEase(u, stampU, stampU + 0.28);
  const cueQ = focusEase(u, stampU + 0.2, stampU + 0.52);

  const bHead = boxes[0];
  const bLeft = boxes[1];
  const bRight = boxes[2];
  const bCue = boxes[3];

  const stampText = p.stamp ?? '已淘汰';
  const stampScale = stampQ >= 1 ? 1 : 1.14 - 0.14 * stampQ;

  const renderCol = (col: ExpCompareProps['left'], side: 'left' | 'right', inQ: number, box: ExpBox) => {
    const isLeft = side === 'left';
    const accentColor = isLeft ? skin.problem : skin.success;
    const softColor = isLeft ? skin.problemSoft : skin.successSoft;
    const borderCss = isLeft ? skin.problemBorder : skin.accentBorder;
    const innerW = box.w - (isWide ? 68 : 48);
    const lineSize = isWide ? 24 : 22;

    return (
      <div
        style={{
          position: 'absolute',
          left: box.x,
          top: box.y,
          width: box.w,
          height: box.h,
          ...skinCardStyle(skin),
          border: isLeft && strikeQ > 0 ? borderCss : !isLeft && strikeQ > 0.4 ? borderCss : skin.cardBorder,
          ...settleStyle(inQ, 16),
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <SkinWindowBar
          skin={skinId}
          dark={skin.dark}
          compact
          title={col.badge ?? (isLeft ? 'BEFORE' : 'AFTER')}
          badge={isLeft ? 'CONTRAST' : 'RECOMMENDED'}
        />
        <div
          style={{
            flex: 1,
            padding: isWide ? '26px 34px' : '28px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: isWide ? 20 : 22,
            opacity: isLeft ? 1 - 0.26 * strikeQ : 1,
          }}
        >
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <span
              style={{
                fontFamily: isPaper ? skin.fontMono : skin.fontSans,
                fontSize: 15,
                fontWeight: 750,
                padding: '4px 12px',
                borderRadius: isPaper ? 5 : 99,
                background: softColor,
                color: skin.dark ? '#FFFFFF' : accentColor,
              }}
            >
              {col.badge ?? (isLeft ? '旧方案' : '新方案')}
            </span>
          </div>
          <div
            style={{
              fontSize: fitTextSize(col.title, isWide ? 36 : 31, innerW, 22),
              fontWeight: 800,
              color: skin.cardInk,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
            }}
          >
            {col.title}
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: isWide ? 14 : 16, marginTop: 4}}>
            {col.lines.map((ln, idx) => (
              <div
                key={idx}
                style={{
                  padding: isWide ? '14px 18px' : '16px 16px',
                  borderRadius: skin.innerRadius,
                  background: isLeft ? skin.cardSubtleBg : softColor,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 99,
                    background: accentColor,
                    color: '#FFFFFF',
                    fontSize: 14,
                    fontWeight: 800,
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  {isLeft ? '×' : '✓'}
                </span>
                <span
                  style={{
                    fontSize: fitTextSize(ln, lineSize, innerW - 56, 17),
                    fontWeight: 600,
                    color: skin.cardInk,
                    lineHeight: 1.32,
                  }}
                >
                  {ln}
                </span>
              </div>
            ))}
          </div>

          {col.foot ? (
            <div
              style={{
                marginTop: 'auto',
                paddingTop: 12,
                borderTop: skin.chromeBorder,
                fontSize: isWide ? 19 : 18,
                fontWeight: 600,
                color: isLeft ? skin.cardMuted : skin.dark ? skin.accentStrong : skin.accent,
              }}
            >
              {col.foot}
            </div>
          ) : null}
        </div>

        {/* 左栏单向利落斜线划除 + 零震屏稳压印章 */}
        {isLeft && strikeQ > 0 ? (
          <svg
            width={box.w}
            height={box.h}
            viewBox={`0 0 ${box.w} ${box.h}`}
            style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}}
            aria-hidden
          >
            <line
              x1={32}
              y1={84}
              x2={box.w - 32}
              y2={box.h - 36}
              stroke={skin.problem}
              strokeWidth={5}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={strikeQ >= 1 ? 0 : +(1 - strikeQ).toFixed(4)}
              opacity={0.82}
            />
          </svg>
        ) : null}

        {isLeft && stampQ > 0 ? (
          <div
            style={{
              position: 'absolute',
              right: isWide ? 28 : 20,
              bottom: isWide ? 28 : 26,
              padding: '10px 22px',
              borderRadius: isPaper ? 6 : 12,
              border: `3.5px solid ${skin.problem}`,
              background: skin.dark ? 'rgba(20, 12, 16, 0.90)' : 'rgba(255, 245, 246, 0.94)',
              color: skin.problem,
              fontFamily: skin.fontMono,
              fontSize: isWide ? 26 : 24,
              fontWeight: 850,
              letterSpacing: 2,
              opacity: stampQ,
              transform:
                stampQ >= 1
                  ? 'rotate(-8deg)'
                  : `rotate(-8deg) scale(${stampScale.toFixed(4)})`,
              pointerEvents: 'none',
            }}
          >
            {stampText}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: bHead.x, top: bHead.y, width: bHead.w, height: bHead.h}}>
        <StageHeader
          skin={skin}
          brand={ep.brand}
          kicker={p.kicker}
          title={p.title ?? `${p.left.title} vs ${p.right.title}`}
          badge="COMPARE"
          fmt={fmt}
          q={headQ}
        />
      </div>
      {renderCol(p.left, 'left', leftQ, bLeft)}
      {renderCol(p.right, 'right', rightQ, bRight)}
      {p.cue ? (
        <div style={{position: 'absolute', left: bCue.x, top: bCue.y, width: bCue.w, height: bCue.h}}>
          <CueFooter skin={skin} text={p.cue} q={cueQ} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 4. exp.converge：SVG 导轨汇聚至枢纽 + 结果卡 ─────────────────────────

const ConvergeScene: React.FC<SceneCtx> = ({u, shot, ep, fmt, skinId, skin}) => {
  const p = shot.props as ExpConvergeProps;
  const boxes = expSceneBoxes(shot, fmt);
  const st = expStageLayout(fmt);
  const isWide = fmt === 'landscape';
  const isPaper = skinId === 'paper';

  const inputs = normalizeConvergeNodes(p.inputs);
  const hub = normalizeConvergeHub(p.hub);
  const {inputUs, railStartU, hubU, outRailU, outputU} = convergeTimings(shot);

  const headQ = focusEase(u, 0, 0.32);
  const inRailQ = focusEase(u, railStartU, railStartU + 0.38);
  const hubQ = focusEase(u, hubU - 0.12, hubU + 0.24);
  const outLineQ = focusEase(u, outRailU, outRailU + 0.28);
  const outputQ = focusEase(u, outputU, outputU + 0.36);
  const cueQ = focusEase(u, outputU + 0.24, outputU + 0.54);

  const bHead = boxes[0];
  const inBoxes = inputs.map((_, i) => boxes[1 + i]);
  const bHub = boxes[1 + inputs.length];
  const bOut = boxes[2 + inputs.length];
  const bCue = boxes[3 + inputs.length];

  const hubCx = bHub.x + bHub.w / 2;
  const hubCy = bHub.y + bHub.h / 2;

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: bHead.x, top: bHead.y, width: bHead.w, height: bHead.h}}>
        <StageHeader
          skin={skin}
          brand={ep.brand}
          kicker={p.kicker}
          title={p.title ?? `${hub.title} · 汇聚交付`}
          badge="CONVERGE"
          fmt={fmt}
          q={headQ}
        />
      </div>

      {/* SVG 汇聚导轨层：连线完成后 strokeDashoffset===0 实线常亮，绝无跑马灯频闪 */}
      <svg
        width={st.w}
        height={st.h}
        viewBox={`0 0 ${st.w} ${st.h}`}
        style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}}
        aria-hidden
      >
        {inBoxes.map((ib, idx) => {
          const dPath = isWide
            ? `M ${ib.x + ib.w} ${ib.y + ib.h / 2} C ${(ib.x + ib.w + bHub.x) / 2} ${ib.y + ib.h / 2}, ${(ib.x + ib.w + bHub.x) / 2} ${hubCy}, ${bHub.x} ${hubCy}`
            : `M ${ib.x + ib.w / 2} ${ib.y + ib.h} C ${ib.x + ib.w / 2} ${(ib.y + ib.h + bHub.y) / 2}, ${hubCx} ${(ib.y + ib.h + bHub.y) / 2}, ${hubCx} ${bHub.y}`;
          return (
            <g key={idx}>
              <path d={dPath} fill="none" stroke={skin.railColor} strokeWidth={3} />
              {inRailQ > 0 ? (
                <path
                  d={dPath}
                  fill="none"
                  stroke={skin.railActiveColor}
                  strokeWidth={4}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={inRailQ >= 1 ? 0 : +(1 - inRailQ).toFixed(4)}
                />
              ) : null}
            </g>
          );
        })}

        {(() => {
          const outPath = isWide
            ? `M ${bHub.x + bHub.w} ${hubCy} L ${bOut.x} ${bOut.y + bOut.h / 2}`
            : `M ${hubCx} ${bHub.y + bHub.h} L ${bOut.x + bOut.w / 2} ${bOut.y}`;
          return (
            <g>
              <path d={outPath} fill="none" stroke={skin.railColor} strokeWidth={3} />
              {outLineQ > 0 ? (
                <path
                  d={outPath}
                  fill="none"
                  stroke={skin.railActiveColor}
                  strokeWidth={5}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={outLineQ >= 1 ? 0 : +(1 - outLineQ).toFixed(4)}
                />
              ) : null}
            </g>
          );
        })()}
      </svg>

      {/* 多源输入卡片 */}
      {inputs.map((node, idx) => {
        const ib = inBoxes[idx];
        const nq = focusEase(u, inputUs[idx], inputUs[idx] + 0.32);
        const tagColor = skin.tagPalette[idx % skin.tagPalette.length];
        return (
          <div
            key={idx}
            style={{
              position: 'absolute',
              left: ib.x,
              top: ib.y,
              width: ib.w,
              height: ib.h,
              ...skinCardStyle(skin, {padding: '20px 22px'}),
              ...settleStyle(nq, 14),
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                alignSelf: 'flex-start',
                fontFamily: skin.fontMono,
                fontSize: 14,
                fontWeight: 750,
                padding: '4px 10px',
                borderRadius: isPaper ? 5 : 99,
                background: tagColor,
                color: '#FFFFFF',
              }}
            >
              {node.badge ?? `IN 0${idx + 1}`}
            </span>
            <div
              style={{
                fontSize: fitTextSize(node.title, isWide ? 28 : 26, ib.w - 44, 19),
                fontWeight: 780,
                color: skin.cardInk,
                whiteSpace: 'nowrap',
              }}
            >
              {node.title}
            </div>
            {node.sub ? (
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 540,
                  color: skin.cardMuted,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {node.sub}
              </div>
            ) : null}
          </div>
        );
      })}

      {/* 中心汇聚枢纽 */}
      <div
        style={{
          position: 'absolute',
          left: bHub.x,
          top: bHub.y,
          width: bHub.w,
          height: bHub.h,
          ...skinCardStyle(skin, {padding: '20px 26px'}),
          border: skin.accentBorder,
          background: skin.accentSoft,
          ...settleStyle(hubQ, 12, 0.96),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: skin.fontMono,
            fontSize: 14,
            fontWeight: 800,
            padding: '4px 12px',
            borderRadius: isPaper ? 5 : 99,
            background: skin.accent,
            color: '#FFFFFF',
          }}
        >
          {hub.badge ?? 'CORE HUB'}
        </span>
        <div
          style={{
            fontSize: fitTextSize(hub.title, 32, bHub.w - 48, 22),
            fontWeight: 820,
            color: skin.cardInk,
            whiteSpace: 'nowrap',
          }}
        >
          {hub.title}
        </div>
        {hub.sub ? (
          <div style={{fontSize: 18, fontWeight: 560, color: skin.cardMuted}}>{hub.sub}</div>
        ) : null}
      </div>

      {/* 汇聚产出结果卡 */}
      <div
        style={{
          position: 'absolute',
          left: bOut.x,
          top: bOut.y,
          width: bOut.w,
          height: bOut.h,
          ...skinCardStyle(skin),
          ...settleStyle(outputQ, 16, 0.97),
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <SkinWindowBar
          skin={skinId}
          dark={skin.dark}
          compact
          title={p.output.title}
          badge={p.output.badge ?? 'OUTPUT'}
        />
        <div
          style={{
            flex: 1,
            padding: '18px 26px',
            display: 'flex',
            flexDirection: 'column',
            gap: 11,
          }}
        >
          <div
            style={{
              fontSize: fitTextSize(p.output.title, 30, bOut.w - 60, 22),
              fontWeight: 800,
              color: skin.cardInk,
              whiteSpace: 'nowrap',
            }}
          >
            {p.output.title}
          </div>
          {p.output.sub ? (
            <div style={{fontSize: 18, fontWeight: 560, color: skin.cardMuted}}>{p.output.sub}</div>
          ) : null}
          {p.output.media ? (
            <div style={{minHeight: 108}}>
              <ExpMediaSlot
                ep={ep}
                skin={skin}
                media={p.output.media}
                from={shot.start}
                fallbackTitle={p.output.title}
              />
            </div>
          ) : null}
          {p.output.lines?.length ? (
            <div style={{display: 'flex', flexDirection: 'column', gap: 9, marginTop: 'auto'}}>
              {p.output.lines.map((ln, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 16px',
                    borderRadius: skin.innerRadius,
                    background: skin.cardSubtleBg,
                    fontSize: 19,
                    fontWeight: 600,
                    color: skin.cardInk,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 99,
                      background: skin.accent,
                      flexShrink: 0,
                    }}
                  />
                  <span>{ln}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {p.cue ? (
        <div style={{position: 'absolute', left: bCue.x, top: bCue.y, width: bCue.w, height: bCue.h}}>
          <CueFooter skin={skin} text={p.cue} q={cueQ} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 5. exp.metric：大字平滑计数 + 多对比条 + 结论聚焦 ─────────────────────────

const MetricScene: React.FC<SceneCtx> = ({t, u, shot, ep, fmt, skinId, skin}) => {
  const p = shot.props as ExpMetricProps;
  const boxes = expSceneBoxes(shot, fmt);
  const isWide = fmt === 'landscape';
  const isPaper = skinId === 'paper';

  const {barUs, conclusionU} = metricTimings(shot);
  const numVal = metricValueAt(shot, t);
  const decimals = typeof p.decimals === 'number' ? Math.max(0, Math.min(2, p.decimals)) : 0;
  const formattedVal = decimals > 0 ? numVal.toFixed(decimals) : String(Math.round(numVal));
  const conc = normalizeMetricConclusion(p.conclusion);

  const headQ = focusEase(u, 0, 0.32);
  const heroQ = focusEase(u, 0.08, 0.4);
  const barsCardQ = focusEase(u, 0.16, 0.48);
  const concQ = focusEase(u, conclusionU, conclusionU + 0.34);

  const bHead = boxes[0];
  const bHero = boxes[1];
  const bBars = boxes[2];
  const bConc = boxes[3];

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: bHead.x, top: bHead.y, width: bHead.w, height: bHead.h}}>
        <StageHeader
          skin={skin}
          brand={ep.brand}
          kicker={p.kicker}
          title={p.title ?? p.label}
          badge="METRIC"
          fmt={fmt}
          q={headQ}
        />
      </div>

      {/* 大字平滑计数卡：tabular-nums 等宽字宽，到 countEndAt 后精确锁死零抖动 */}
      <div
        style={{
          position: 'absolute',
          left: bHero.x,
          top: bHero.y,
          width: bHero.w,
          height: bHero.h,
          ...skinCardStyle(skin, {padding: isWide ? '34px 38px' : '26px 36px'}),
          ...settleStyle(heroQ, 16),
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: isWide ? 'flex-start' : 'center',
          gap: 12,
        }}
      >
        <span
          style={{
            fontFamily: isPaper ? skin.fontMono : skin.fontSans,
            fontSize: 16,
            fontWeight: 750,
            padding: '5px 14px',
            borderRadius: isPaper ? 6 : 99,
            background: skin.accentSoft,
            color: skin.dark ? skin.accentStrong : skin.accent,
          }}
        >
          KEY INDICATOR
        </span>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            fontFamily: skin.fontMono,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          {p.prefix ? (
            <span style={{fontSize: isWide ? 54 : 48, fontWeight: 780, color: skin.accent}}>
              {p.prefix}
            </span>
          ) : null}
          <span
            style={{
              fontSize: isWide ? 136 : 118,
              fontWeight: 850,
              letterSpacing: -3,
              color: skin.cardInk,
            }}
          >
            {formattedVal}
          </span>
          {p.unit ? (
            <span style={{fontSize: isWide ? 52 : 46, fontWeight: 780, color: skin.accent}}>
              {p.unit}
            </span>
          ) : null}
        </div>
        <div
          style={{
            fontSize: isWide ? 28 : 26,
            fontWeight: 680,
            color: skin.cardMuted,
          }}
        >
          {p.label}
        </div>
      </div>

      {/* 多维对比条面板 */}
      <div
        style={{
          position: 'absolute',
          left: bBars.x,
          top: bBars.y,
          width: bBars.w,
          height: bBars.h,
          ...skinCardStyle(skin),
          ...settleStyle(barsCardQ, 16),
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <SkinWindowBar
          skin={skinId}
          dark={skin.dark}
          compact
          title={`${ep.brand} · 量化对比`}
          badge={`${p.bars.length} ITEMS`}
        />
        <div
          style={{
            flex: 1,
            padding: isWide ? '26px 36px' : '24px 32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-around',
            gap: 14,
          }}
        >
          {p.bars.map((bar, idx) => {
            const bq = focusEase(u, barUs[idx], barUs[idx] + 0.44);
            const max = bar.max ?? 100;
            const targetPct = Math.max(2, Math.min(100, (bar.value / max) * 100));
            const curPct = bq >= 1 ? targetPct : +(targetPct * bq).toFixed(2);
            const fillBg = bar.highlight
              ? skin.accentGradient
              : skin.tagPalette[idx % skin.tagPalette.length];

            return (
              <div key={idx} style={{display: 'flex', flexDirection: 'column', gap: 9}}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                  <span style={{fontSize: 22, fontWeight: 680, color: skin.cardInk}}>{bar.label}</span>
                  <span
                    style={{
                      fontFamily: skin.fontMono,
                      fontVariantNumeric: 'tabular-nums',
                      fontSize: 22,
                      fontWeight: 780,
                      color: bar.highlight ? (skin.dark ? skin.accentStrong : skin.accent) : skin.cardMuted,
                    }}
                  >
                    {bar.display ?? String(bar.value)}
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: 22,
                    borderRadius: isPaper ? 6 : 99,
                    background: skin.cardSubtleBg,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${curPct}%`,
                      height: '100%',
                      borderRadius: isPaper ? 6 : 99,
                      background: fillBg,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 底部结论聚焦卡 */}
      {conc ? (
        <div
          style={{
            position: 'absolute',
            left: bConc.x,
            top: bConc.y,
            width: bConc.w,
            height: bConc.h,
            ...skinCardStyle(skin, {padding: '18px 28px'}),
            border: skin.accentBorder,
            background: skin.accentSoft,
            ...settleStyle(concQ, 14),
            display: 'flex',
            alignItems: 'center',
            gap: 18,
          }}
        >
          <span
            style={{
              fontFamily: isPaper ? skin.fontMono : skin.fontSans,
              fontSize: 16,
              fontWeight: 800,
              padding: '6px 14px',
              borderRadius: isPaper ? 6 : 99,
              background: skin.accent,
              color: '#FFFFFF',
              flexShrink: 0,
            }}
          >
            {conc.badge ?? '结论聚焦'}
          </span>
          <span
            style={{
              fontSize: fitTextSize(conc.text, isWide ? 28 : 26, bConc.w - 190, 19),
              fontWeight: 740,
              color: skin.cardInk,
              lineHeight: 1.3,
            }}
          >
            {conc.text}
          </span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 6. exp.stepsMerge：步骤轨道点亮 + 三卡归拢合为总结卡 ─────────────────────────

const StepsMergeScene: React.FC<SceneCtx> = ({u, shot, ep, fmt, skinId, skin}) => {
  const p = shot.props as ExpStepsMergeProps;
  const boxes = expSceneBoxes(shot, fmt);
  const isWide = fmt === 'landscape';
  const isPaper = skinId === 'paper';

  const steps = normalizeMergeSteps(p.steps);
  const {stepUs, mergeStartU, mergeEndU} = stepsMergeTimings(shot);

  const headQ = focusEase(u, 0, 0.32);
  const trackQ = focusEase(u, 0.06, 0.36);
  const mergeQ = focusEase(u, mergeStartU, mergeEndU);
  const stepFadeOut = focusEase(u, mergeStartU + 0.1, mergeEndU);
  const sumQ = focusEase(u, mergeStartU + 0.12, mergeEndU);

  const bHead = boxes[0];
  const bTrack = boxes[1];
  const bArena = boxes[2];

  const n = steps.length;
  const activeCount = steps.reduce((acc, _, i) => acc + (u >= stepUs[i] ? 1 : 0), 0);
  const progressPct = mergeQ > 0 ? 100 : Math.min(100, (activeCount / Math.max(1, n)) * 100);

  const arenaCx = bArena.x + bArena.w / 2;
  const arenaCy = bArena.y + bArena.h / 2;

  const stepRects = steps.map((_, idx) => {
    if (isWide) {
      const gap = 24;
      const cw = Math.floor((bArena.w - gap * (n - 1)) / n);
      const ch = 372;
      return {
        x: bArena.x + idx * (cw + gap),
        y: bArena.y + Math.round((bArena.h - ch) / 2),
        w: cw,
        h: ch,
      };
    }
    const ch = n >= 4 ? 174 : 210;
    const gap = 18;
    const totalH = n * ch + (n - 1) * gap;
    const startY = bArena.y + Math.round((bArena.h - totalH) / 2);
    return {
      x: bArena.x + 16,
      y: startY + idx * (ch + gap),
      w: bArena.w - 32,
      h: ch,
    };
  });

  const sumW = isWide ? 1160 : bArena.w - 24;
  const sumH = isWide ? 520 : 548;
  const sumX = Math.round(arenaCx - sumW / 2);
  const sumY = Math.round(arenaCy - sumH / 2);

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: bHead.x, top: bHead.y, width: bHead.w, height: bHead.h}}>
        <StageHeader
          skin={skin}
          brand={ep.brand}
          kicker={p.kicker}
          title={p.title ?? p.summary.title}
          badge={mergeQ >= 1 ? 'MERGED' : `STEP ${Math.max(1, activeCount)}/${n}`}
          fmt={fmt}
          q={headQ}
        />
      </div>

      {/* 顶部步骤进度轨道 */}
      <div
        style={{
          position: 'absolute',
          left: bTrack.x,
          top: bTrack.y,
          width: bTrack.w,
          height: bTrack.h,
          ...skinCardStyle(skin, {padding: '0 28px'}),
          ...settleStyle(trackQ, 10),
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <span
          style={{
            fontFamily: skin.fontMono,
            fontSize: 16,
            fontWeight: 780,
            color: skin.cardMuted,
            flexShrink: 0,
          }}
        >
          {p.trackLabel ?? 'PIPELINE'}
        </span>
        <div
          style={{
            flex: 1,
            height: 12,
            borderRadius: 99,
            background: skin.cardSubtleBg,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progressPct}%`,
              height: '100%',
              borderRadius: 99,
              background: skin.accentGradient,
            }}
          />
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0}}>
          {steps.map((stItem, idx) => {
            const on = u >= stepUs[idx];
            return (
              <span
                key={idx}
                style={{
                  fontFamily: skin.fontMono,
                  fontSize: 15,
                  fontWeight: 800,
                  padding: '5px 12px',
                  borderRadius: isPaper ? 5 : 99,
                  background: on ? skin.accent : skin.cardSubtleBg,
                  color: on ? '#FFFFFF' : skin.cardMuted,
                }}
              >
                {stItem.step}
              </span>
            );
          })}
        </div>
      </div>

      {/* 归拢前的分步卡片（归拢完成后彻底隐藏，零残影） */}
      {mergeQ < 1
        ? steps.map((stItem, idx) => {
            const r = stepRects[idx];
            const inQ = focusEase(u, stepUs[idx], stepUs[idx] + 0.3);
            const rCx = r.x + r.w / 2;
            const rCy = r.y + r.h / 2;
            const dx = (arenaCx - rCx) * mergeQ;
            const dy = (arenaCy - rCy) * mergeQ + (1 - inQ) * 14;
            const sc = 1 - 0.08 * mergeQ;
            const stillCard = inQ >= 1 && mergeQ === 0;
            const tagColor = skin.tagPalette[idx % skin.tagPalette.length];

            return (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  left: r.x,
                  top: r.y,
                  width: r.w,
                  height: r.h,
                  ...skinCardStyle(skin, {padding: isWide ? '26px 26px' : '22px 28px'}),
                  opacity: inQ * (1 - stepFadeOut),
                  transform: stillCard
                    ? undefined
                    : `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) scale(${sc.toFixed(4)})`,
                  display: 'flex',
                  flexDirection: isWide ? 'column' : 'row',
                  alignItems: isWide ? 'flex-start' : 'center',
                  justifyContent: isWide ? 'space-between' : 'flex-start',
                  gap: 20,
                }}
              >
                <div style={{display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0}}>
                  <span
                    style={{
                      fontFamily: skin.fontMono,
                      fontSize: 18,
                      fontWeight: 850,
                      padding: '6px 14px',
                      borderRadius: isPaper ? 6 : 12,
                      background: tagColor,
                      color: '#FFFFFF',
                    }}
                  >
                    {stItem.step}
                  </span>
                  {stItem.badge ? (
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        padding: '4px 11px',
                        borderRadius: 99,
                        background: skin.cardSubtleBg,
                        color: skin.cardMuted,
                      }}
                    >
                      {stItem.badge}
                    </span>
                  ) : null}
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0}}>
                  <div
                    style={{
                      fontSize: fitTextSize(stItem.title, isWide ? 31 : 29, r.w - 60, 20),
                      fontWeight: 800,
                      color: skin.cardInk,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {stItem.title}
                  </div>
                  {stItem.sub ? (
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 550,
                        color: skin.cardMuted,
                      }}
                    >
                      {stItem.sub}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        : null}

      {/* 归拢后的统一总结交付卡（sumQ>=1 后 transform===undefined 静止锁死） */}
      {sumQ > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: sumX,
            top: sumY,
            width: sumW,
            height: sumH,
            ...skinCardStyle(skin),
            border: skin.accentBorder,
            ...settleStyle(sumQ, 12, 0.96),
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <SkinWindowBar
            skin={skinId}
            dark={skin.dark}
            title={`${ep.brand} · 总结交付卡`}
            badge={p.summary.badge ?? 'SUMMARY'}
          />
          <div
            style={{
              flex: 1,
              padding: isWide ? '22px 36px' : '28px 32px',
              display: 'flex',
              flexDirection: 'column',
              gap: isWide ? 14 : 16,
            }}
          >
            <div
              style={{
                fontSize: fitTextSize(p.summary.title, isWide ? 38 : 35, sumW - 76, 24),
                fontWeight: 840,
                color: skin.cardInk,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
              }}
            >
              {p.summary.title}
            </div>
            {p.summary.sub ? (
              <div style={{fontSize: isWide ? 20 : 21, fontWeight: 560, color: skin.cardMuted}}>
                {p.summary.sub}
              </div>
            ) : null}
            {isWide && p.summary.media && p.summary.lines?.length ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.15fr',
                  gap: 18,
                  alignItems: 'stretch',
                }}
              >
                <ExpMediaSlot
                  ep={ep}
                  skin={skin}
                  media={p.summary.media}
                  from={shot.start}
                  fallbackTitle={p.summary.title}
                />
                <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12}}>
                  {p.summary.lines.map((ln, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '14px 18px',
                        borderRadius: skin.innerRadius,
                        background: skin.cardSubtleBg,
                        fontSize: 20,
                        fontWeight: 650,
                        color: skin.cardInk,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 99,
                          background: skin.accent,
                          flexShrink: 0,
                        }}
                      />
                      <span>{ln}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {p.summary.media ? (
                  <div style={{minHeight: 112}}>
                    <ExpMediaSlot
                      ep={ep}
                      skin={skin}
                      media={p.summary.media}
                      from={shot.start}
                      fallbackTitle={p.summary.title}
                    />
                  </div>
                ) : null}
                {p.summary.lines?.length ? (
                  <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                    {p.summary.lines.map((ln, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '14px 20px',
                          borderRadius: skin.innerRadius,
                          background: skin.cardSubtleBg,
                          fontSize: 22,
                          fontWeight: 650,
                          color: skin.cardInk,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                        }}
                      >
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 99,
                            background: skin.accent,
                            flexShrink: 0,
                          }}
                        />
                        <span>{ln}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </>
            )}
            {p.summary.footer ? (
              <div
                style={{
                  marginTop: 'auto',
                  padding: '12px 22px',
                  borderRadius: isPaper ? 8 : 14,
                  background: skin.accent,
                  color: '#FFFFFF',
                  fontSize: 21,
                  fontWeight: 740,
                  textAlign: 'center',
                }}
              >
                {p.summary.footer}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 7. exp.editorial：杂志不对称分栏（窄栏目录高亮 + 宽栏聚光） ─────────────────────────

const EditorialScene: React.FC<SceneCtx> = ({u, shot, ep, fmt, skinId, skin}) => {
  const p = shot.props as ExpEditorialProps;
  const boxes = expSceneBoxes(shot, fmt);
  const isWide = fmt === 'landscape';
  const isPaper = skinId === 'paper';

  const nav = normalizeEditorialNav(p.nav);
  const {navUs, panelInU, spotlightU} = editorialTimings(shot);

  const headQ = focusEase(u, 0, 0.32);
  const panelQ = focusEase(u, panelInU, panelInU + 0.36);
  const spotQ = p.panel.spotlight ? focusEase(u, spotlightU, spotlightU + 0.34) : 0;

  let activeIdx = 0;
  for (let i = 0; i < navUs.length; i++) {
    if (u >= navUs[i]) activeIdx = i;
  }

  const bMast = isWide ? null : boxes[0];
  const bLeft = isWide ? boxes[0] : boxes[1];
  const bRight = isWide ? boxes[1] : boxes[2];

  return (
    <AbsoluteFill>
      {/* 竖屏顶部杂志刊头（Masthead） */}
      {bMast ? (
        <div
          style={{
            position: 'absolute',
            left: bMast.x,
            top: bMast.y,
            width: bMast.w,
            height: bMast.h,
            ...skinCardStyle(skin, {padding: '22px 28px'}),
            ...settleStyle(headQ, 12),
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <span
              style={{
                fontFamily: skin.fontMono,
                fontSize: 16,
                fontWeight: 750,
                color: skin.dark ? skin.accentStrong : skin.accent,
              }}
            >
              {p.kicker ?? `${ep.brand} · EDITORIAL`}
            </span>
            <span
              style={{
                fontFamily: skin.fontMono,
                fontSize: 15,
                fontWeight: 750,
                padding: '4px 12px',
                borderRadius: isPaper ? 5 : 99,
                background: skin.cardSubtleBg,
                color: skin.cardInk,
              }}
            >
              {p.issue ?? 'ISSUE 01'}
            </span>
          </div>
          <div
            style={{
              fontSize: fitTextSize(p.title, 40, bMast.w - 60, 26),
              fontWeight: 840,
              color: skin.cardInk,
              lineHeight: 1.15,
              whiteSpace: 'nowrap',
            }}
          >
            {p.title}
          </div>
          {p.sub ? (
            <div
              style={{
                fontSize: 19,
                fontWeight: 550,
                color: skin.cardMuted,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {p.sub}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* 左侧窄栏：目录索引高亮（固定盒模型与描边宽度，切换时零跳动零重排） */}
      <div
        style={{
          position: 'absolute',
          left: bLeft.x,
          top: bLeft.y,
          width: bLeft.w,
          height: bLeft.h,
          ...skinCardStyle(skin, {padding: isWide ? '28px 28px' : '22px 18px'}),
          ...settleStyle(headQ, 14),
          display: 'flex',
          flexDirection: 'column',
          gap: isWide ? 18 : 16,
        }}
      >
        {isWide ? (
          <div
            style={{
              paddingBottom: 16,
              borderBottom: skin.chromeBorder,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <span
                style={{
                  fontFamily: skin.fontMono,
                  fontSize: 15,
                  fontWeight: 750,
                  color: skin.dark ? skin.accentStrong : skin.accent,
                }}
              >
                {p.kicker ?? ep.brand}
              </span>
              <span
                style={{
                  fontFamily: skin.fontMono,
                  fontSize: 14,
                  fontWeight: 750,
                  padding: '3px 10px',
                  borderRadius: isPaper ? 5 : 99,
                  background: skin.cardSubtleBg,
                  color: skin.cardMuted,
                }}
              >
                {p.issue ?? 'EDITORIAL'}
              </span>
            </div>
            <div
              style={{
                fontSize: fitTextSize(p.title, 38, bLeft.w - 56, 24),
                fontWeight: 840,
                color: skin.cardInk,
                lineHeight: 1.18,
              }}
            >
              {p.title}
            </div>
            {p.sub ? (
              <div style={{fontSize: 18, fontWeight: 540, color: skin.cardMuted, lineHeight: 1.38}}>
                {p.sub}
              </div>
            ) : null}
          </div>
        ) : (
          <div
            style={{
              fontFamily: skin.fontMono,
              fontSize: 15,
              fontWeight: 780,
              color: skin.cardMuted,
              letterSpacing: 1,
            }}
          >
            INDEX · 目录
          </div>
        )}

        <div style={{display: 'flex', flexDirection: 'column', gap: 12, flex: 1, justifyContent: 'center'}}>
          {nav.map((item, idx) => {
            const reached = u >= navUs[idx];
            const isCurrent = idx === activeIdx;
            return (
              <div
                key={idx}
                style={{
                  padding: isWide ? '16px 18px' : '18px 14px',
                  borderRadius: skin.innerRadius,
                  background: isCurrent ? skin.accentSoft : skin.cardSubtleBg,
                  borderLeft: `5px solid ${isCurrent ? skin.accent : reached ? skin.railActiveColor : 'transparent'}`,
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                  <span
                    style={{
                      fontFamily: skin.fontMono,
                      fontSize: 15,
                      fontWeight: 800,
                      color: isCurrent ? (skin.dark ? skin.accentStrong : skin.accent) : skin.cardMuted,
                    }}
                  >
                    {item.code}
                  </span>
                  <span
                    style={{
                      fontSize: fitTextSize(item.label, isWide ? 24 : 21, bLeft.w - 84, 17),
                      fontWeight: 760,
                      color: skin.cardInk,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.label}
                  </span>
                </div>
                {item.detail ? (
                  <div
                    style={{
                      fontSize: isWide ? 17 : 16,
                      fontWeight: 540,
                      color: skin.cardMuted,
                      lineHeight: 1.34,
                    }}
                  >
                    {item.detail}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* 右侧宽栏：详情卡片 + 重点聚光 */}
      <div
        style={{
          position: 'absolute',
          left: bRight.x,
          top: bRight.y,
          width: bRight.w,
          height: bRight.h,
          ...skinCardStyle(skin),
          ...settleStyle(panelQ, 16),
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <SkinWindowBar
          skin={skinId}
          dark={skin.dark}
          title={p.panel.windowTitle ?? `${ep.brand} · 拆解面板`}
          badge={p.panel.badge ?? 'FEATURE'}
        />
        <div
          style={{
            flex: 1,
            padding: isWide ? '28px 36px' : '26px 26px',
            display: 'flex',
            flexDirection: 'column',
            gap: isWide ? 18 : 18,
          }}
        >
          <div
            style={{
              fontSize: fitTextSize(p.panel.title, isWide ? 36 : 29, bRight.w - 60, 21),
              fontWeight: 820,
              color: skin.cardInk,
              lineHeight: 1.2,
            }}
          >
            {p.panel.title}
          </div>
          {p.panel.sub ? (
            <div style={{fontSize: isWide ? 20 : 18, fontWeight: 550, color: skin.cardMuted}}>
              {p.panel.sub}
            </div>
          ) : null}

          {p.panel.media ? (
            <div style={{height: isWide ? 210 : 200}}>
              <ExpMediaSlot
                ep={ep}
                skin={skin}
                media={p.panel.media}
                from={shot.start}
                fallbackTitle={p.panel.title}
              />
            </div>
          ) : null}

          {p.panel.lines?.length ? (
            <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
              {p.panel.lines.map((ln, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: isWide ? '14px 18px' : '14px 16px',
                    borderRadius: skin.innerRadius,
                    background: skin.cardSubtleBg,
                    fontSize: isWide ? 21 : 19,
                    fontWeight: 620,
                    color: skin.cardInk,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      fontFamily: skin.fontMono,
                      fontSize: 14,
                      fontWeight: 800,
                      width: 26,
                      height: 26,
                      borderRadius: isPaper ? 5 : 8,
                      background: skin.tagPalette[idx % skin.tagPalette.length],
                      color: '#FFFFFF',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span>{ln}</span>
                </div>
              ))}
            </div>
          ) : null}

          {p.panel.spotlight ? (
            <div
              style={{
                ...settleStyle(spotQ, 12),
                marginTop: 'auto',
                padding: isWide ? '18px 22px' : '16px 18px',
                borderRadius: skin.innerRadius,
                background: skin.accentSoft,
                border: skin.accentBorder,
                display: 'flex',
                flexDirection: isWide ? 'row' : 'column',
                alignItems: isWide ? 'center' : 'flex-start',
                gap: 12,
              }}
            >
              <span
                style={{
                  fontFamily: isPaper ? skin.fontMono : skin.fontSans,
                  fontSize: 15,
                  fontWeight: 800,
                  padding: '4px 12px',
                  borderRadius: isPaper ? 5 : 99,
                  background: skin.accent,
                  color: '#FFFFFF',
                  flexShrink: 0,
                }}
              >
                {p.panel.spotlight.badge ?? 'SPOTLIGHT'}
              </span>
              <span
                style={{
                  fontSize: isWide ? 21 : 19,
                  fontWeight: 700,
                  color: skin.cardInk,
                  lineHeight: 1.35,
                }}
              >
                {p.panel.spotlight.text}
              </span>
            </div>
          ) : null}

          {p.panel.footer ? (
            <div
              style={{
                marginTop: p.panel.spotlight ? 4 : 'auto',
                paddingTop: 10,
                borderTop: skin.chromeBorder,
                fontFamily: isPaper ? skin.fontMono : skin.fontSans,
                fontSize: 17,
                fontWeight: 600,
                color: skin.cardMuted,
              }}
            >
              {p.panel.footer}
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const SCENE_MAP: Record<string, React.FC<SceneCtx>> = {
  'exp.statement': StatementScene,
  'exp.balance': BalanceScene,
  'exp.compare': CompareScene,
  'exp.converge': ConvergeScene,
  'exp.metric': MetricScene,
  'exp.stepsMerge': StepsMergeScene,
  'exp.editorial': EditorialScene,
};

function ExpCameraStage({
  shot,
  u,
  fmt,
  children,
}: {
  shot: ExpShot;
  u: number;
  fmt: ExpFormat;
  children: React.ReactNode;
}) {
  const cam = expPushCamera(shot, u, fmt);
  const st = expStageLayout(fmt);
  const clipBottom = st.h - (st.subtitleTop - 10);
  return (
    <AbsoluteFill style={{clipPath: `inset(0px 0px ${clipBottom}px 0px)`}}>
      <AbsoluteFill
        style={
          cam.still
            ? undefined
            : {
                transformOrigin: '0 0',
                transform: cam.transform,
              }
        }
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export const expLabMetadata: CalculateMetadataFunction<ExpLabProps> = async ({props}) => {
  const ep: ExpEpisode =
    props.ep ??
    (await fetch(staticFile(`episodes/${props.episode}/episode.json`)).then((r) => r.json()));
  validateExpLab(ep);
  const format: ExpFormat = props.format ?? ep.format ?? '3:4';
  const {w, h} = expFormatDims(format);
  return {
    durationInFrames: Math.round(ep.duration * EXP_FPS),
    fps: EXP_FPS,
    width: w,
    height: h,
    props: {...props, ep, format},
  };
};

export const ExpLab: React.FC<ExpLabProps> = ({ep, format, skin: overrideSkin, audio = true}) => {
  const {fps, width, height} = useVideoConfig();
  const t = useCurrentFrame() / fps;
  if (!ep) return null;

  const fmt: ExpFormat =
    format ??
    ep.format ??
    (height > width
      ? Math.abs(width / height - 3 / 4) < 0.03
        ? '3:4'
        : 'portrait'
      : 'landscape');

  const activeShot =
    ep.shots.find((s) => t >= s.start && t < s.end) ?? ep.shots[ep.shots.length - 1];
  const activeSkinId: SkinId =
    overrideSkin && isSkinId(overrideSkin) ? overrideSkin : resolveExpShotSkin(ep, activeShot);
  const activeCap = ep.captions.find((c) => t >= c.start && t < c.end);

  return (
    <AbsoluteFill
      style={{
        fontFamily: SKIN_FONTS.sans,
        overflow: 'hidden',
      }}
    >
      <FontGate
        text={
          JSON.stringify([ep.brand, ep.title, ep.clips, ep.captions, ep.shots]) +
          '旧误区新主张淘汰硬编结论聚焦总结交付卡目录索引量化对比0123456789.%×✓·|'
        }
      />
      {audio ? (
        <Sequence from={Math.round((ep.audioOffset ?? 0) * fps)} layout="none">
          <Audio src={staticFile(talkAsset(ep as any, ep.audio))} />
        </Sequence>
      ) : null}
      {audio && ep.music ? (
        <Audio
          loop
          src={staticFile(talkAsset(ep as any, ep.music.src))}
          volume={(f) => musicGainAt(ep as any, f / fps)}
        />
      ) : null}
      {audio && ep.sfx ? (
        <Audio
          src={staticFile(talkAsset(ep as any, ep.sfx.src))}
          volume={ep.sfx.volume ?? 0.48}
        />
      ) : null}

      {ep.shots.map((s, idx) => {
        if (t < s.start || t >= s.end + EXP_OVERLAP) return null;
        const Scene = SCENE_MAP[s.template];
        if (!Scene) return null;
        const u = t - s.start;
        const d = s.end - s.start;
        const isLast = idx === ep.shots.length - 1;
        const out = isLast ? 0 : focusEase(t, s.end - 0.05, s.end + EXP_OVERLAP);
        const shotSkinId: SkinId =
          overrideSkin && isSkinId(overrideSkin) ? overrideSkin : resolveExpShotSkin(ep, s);
        const resolved = resolveSkin(shotSkinId, s.dark);

        return (
          <AbsoluteFill
            key={s.id}
            style={{
              opacity: 1 - out,
              filter: out > 0 ? `blur(${(out * 6).toFixed(2)}px)` : undefined,
            }}
          >
            <SkinBackdrop skin={shotSkinId} dark={s.dark} t={t} fmt={fmt} />
            <ExpCameraStage shot={s} u={u} fmt={fmt}>
              <Scene
                t={t}
                u={u}
                d={d}
                shot={s}
                ep={ep}
                fmt={fmt}
                skinId={shotSkinId}
                skin={resolved}
              />
            </ExpCameraStage>
          </AbsoluteFill>
        );
      })}

      <SkinSubtitle
        skin={activeSkinId}
        text={activeCap?.text ?? null}
        fmt={fmt}
        dark={activeShot?.dark}
      />
    </AbsoluteFill>
  );
};
