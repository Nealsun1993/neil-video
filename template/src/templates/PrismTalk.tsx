import React from 'react';
import {
  AbsoluteFill,
  Audio,
  CalculateMetadataFunction,
  Easing,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {FontGate} from '../kit/frame';
import {font, Mark, Traffic} from './CleanUiDemo';
import {musicGainAt, TALK_FPS, TALK_OVERLAP, talkAsset} from '../kit/talk';
import {
  isPrismShotDark,
  normalizeIconItem,
  normalizePunchItems,
  PRISM_SCENES,
  PrismCallout,
  PrismChatMessage,
  PrismFormat,
  prismFormatDims,
  PrismIconKind,
  PrismMediaInput,
  PrismResolvedMedia,
  PrismShot,
  PrismTalkEpisode,
  PrismZoomSpec,
  prismDarkAt,
  resolvePrismIdentity,
  resolvePrismMedia,
  validatePrismTalk,
} from '../kit/prismTalk';

export {PRISM_SCENES, validatePrismTalk};
export type {PrismFormat};
export type PrismTalkProps = {
  episode: string;
  ep?: PrismTalkEpisode;
  format?: PrismFormat;
  audio?: boolean;
};

type SceneCtx = {
  t: number;
  u: number;
  d: number;
  p: any;
  s: PrismShot;
  ep: PrismTalkEpisode;
  fmt: PrismFormat;
  lockFromPrevWindow?: boolean;
};

const INK = '#14161C';
const MUTED = '#7E8594';
const BLUE = '#1D6BF3';
const RAINBOW = 'linear-gradient(100deg,#FF8A3D,#FF3D77 45%,#8C5BFF 80%,#3E8BFF)';
const ACCENTS = {
  blue: {pill: '#1D6BF3', soft: '#EEF4FF', line: 'linear-gradient(90deg,#3E8BFF,#6E5BFF)'},
  purple: {pill: '#7C4DFF', soft: '#F3EEFF', line: 'linear-gradient(90deg,#8C5BFF,#FF3D77)'},
  coral: {pill: '#FF4D6D', soft: '#FFF0F3', line: 'linear-gradient(90deg,#FF8A3D,#FF3D77)'},
  emerald: {pill: '#12A594', soft: '#E9FBF8', line: 'linear-gradient(90deg,#12A594,#3E8BFF)'},
} as const;

const lerp = (a: number, b: number, q: number) => a + (b - a) * q;
const isTallFmt = (fmt: PrismFormat) => fmt === 'portrait' || fmt === '5:8' || fmt === '3:4';

/** 统一单调无回弹缓出：落定后严格恒等于 1，禁止过冲回晃与长尾亚像素蠕变。 */
export function focusEase(t: number, start: number, end: number): number {
  if (t <= start) return 0;
  if (t >= end) return 1;
  return interpolate(t, [start, end], [0, 1], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

export function stageCenterY(fmt: PrismFormat): number {
  return fmt === '3:4' ? 626 : fmt === '5:8' ? 736 : fmt === 'portrait' ? 800 : 458;
}

export function prismStageLayout(fmt: PrismFormat) {
  const {width, height} = prismFormatDims(fmt);
  const centerY = stageCenterY(fmt);
  const subtitleTop = fmt === '3:4' ? 1296 : fmt === '5:8' ? 1510 : fmt === 'portrait' ? 1470 : 928;
  const subtitleSide = fmt === '3:4' || fmt === '5:8' ? 48 : fmt === 'portrait' ? 64 : 120;
  const subtitleMaxWidth = fmt === '3:4' || fmt === '5:8' ? 948 : fmt === 'portrait' ? 920 : 1620;
  const windowRect =
    fmt === '3:4'
      ? {x: 58, y: 82, w: 964, h: 1096}
      : fmt === '5:8'
        ? {x: 64, y: 156, w: 952, h: 1172}
        : fmt === 'portrait'
          ? {x: 80, y: 350, w: 920, h: 940}
          : {x: 230, y: 86, w: 1460, h: 756};
  const chatWidth = fmt === '3:4' || fmt === '5:8' ? 968 : fmt === 'portrait' ? 920 : 1080;
  const chatBounds =
    fmt === '3:4'
      ? {minTop: 90, maxBottom: 1210}
      : fmt === '5:8'
        ? {minTop: 120, maxBottom: 1420}
        : fmt === 'portrait'
          ? {minTop: 180, maxBottom: 1390}
          : {minTop: 76, maxBottom: 868};
  return {width, height, centerY, subtitleTop, subtitleSide, subtitleMaxWidth, windowRect, chatWidth, chatBounds};
}

function Field({t, dark}: {t: number; dark: number}) {
  const dx = Math.sin(t * 0.8) * 14;
  const dy = Math.cos(t * 0.62) * 12;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at ${14 + dx}% ${86 + dy}%, #FFB03A 0%, transparent 42%),radial-gradient(ellipse at ${78 - dx}% ${68 + dy}%, #FF2D55 0%, transparent 55%),radial-gradient(ellipse at ${16 - dx}% ${14 + dy}%, #3A7BFF 0%, transparent 60%),radial-gradient(ellipse at ${84 + dx}% ${10 - dy}%, #FF6A2B 0%, transparent 46%),linear-gradient(140deg,#5B6CFF,#C13CCB 45%,#FF4B4B 80%)`,
      }}
    >
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse 82% 90% at 50% 50%, #000 44%, #000000d8 64%, transparent 100%)',
          opacity: dark,
        }}
      />
    </AbsoluteFill>
  );
}

function HollowMark({size, id}: {size: number; id: string}) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <defs>
        <mask id={id}>
          <rect x={3} y={3} width={34} height={34} rx={11} fill="#fff" />
          {[9, 20, 31]
            .flatMap((a) => [
              [a, 6],
              [a, 34],
              [6, a],
              [34, a],
            ])
            .map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={6} fill="#fff" />
            ))}
          <rect x={12} y={12} width={16} height={16} rx={3.4} fill="#000" />
        </mask>
      </defs>
      <rect width={40} height={40} fill="#fff" mask={`url(#${id})`} />
    </svg>
  );
}

function PlayBadge({size, color = '#fff'}: {size: number; color?: string}) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <rect x={3} y={6} width={34} height={28} rx={8} fill={color} />
      <path d="M17 14.5v11l9-5.5z" fill="#000" />
    </svg>
  );
}

function PrismGlyph({kind, size, uid}: {kind: PrismIconKind; size: number; uid: string}) {
  if (kind === 'mark') return <HollowMark size={size} id={`mark-${uid}`} />;
  if (kind === 'play') return <PlayBadge size={size} />;
  const paths: Record<Exclude<PrismIconKind, 'mark' | 'play'>, string> = {
    spark: 'M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2L12 3zm7 12l1 2.5L22.5 18.5 20 19.5 19 22l-1-2.5-2.5-1 2.5-1 1-2.5z',
    text: 'M6 3h8l4 4v14H6V3zm8 0v5h4M9 12h6M9 16h6',
    wand: 'M4 20L15.5 8.5M14 5l1-2 1 2 2 1-2 1-1 2-1-2-2-1 2-1zm5 6l.8-1.6.8 1.6 1.6.8-1.6.8-.8 1.6-.8-1.6-1.6-.8 1.6-.8zM13 6l5 5',
    check: 'M20 6L9 17l-5-5',
    chat: 'M4 5h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4V7a2 2 0 0 1 2-2zm4 5h8m-8 4h5',
    code: 'M8 8l-4 4 4 4m8-8l4 4-4 4m-2-10l-4 12',
    layers: 'M12 3l9 5-9 5-9-5 9-5zm-9 9l9 5 9-5m-18 4l9 5 9-5',
    mic: 'M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zm-6 8a6 6 0 0 0 12 0m-6 6v4m-4 0h8',
  };
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: 'rgba(255,255,255,0.95)',
        boxShadow: '0 18px 44px rgba(20,0,48,0.28)',
        display: 'grid',
        placeItems: 'center',
        color: '#14161C',
      }}
    >
      <svg
        width={size * 0.56}
        height={size * 0.56}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.1}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={paths[kind]} />
      </svg>
    </div>
  );
}

function VideoClip({src, at, from}: {src: string; at: number; from: number}) {
  return (
    <Sequence from={Math.round(from * TALK_FPS)} layout="none">
      <OffthreadVideo
        src={staticFile(src)}
        trimBefore={Math.round(at * TALK_FPS)}
        muted
        style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}}
      />
    </Sequence>
  );
}

export function compactCardHeight(
  media: Extract<PrismResolvedMedia, {kind: 'card'}>,
  isPortrait: boolean,
  fmt?: PrismFormat,
): number {
  const rows = media.lines.length;
  const est = (rows >= 4 ? 108 + rows * 53 : 112 + rows * 64) + (media.footer ? 42 : 0);
  const floor = fmt === '3:4' ? 304 : isPortrait ? 320 : 300;
  return Math.max(floor, est);
}

export function punchLayout(a: string, b: string, fmt: PrismFormat): {stack: boolean; fontSize: number} {
  const isP = isTallFmt(fmt);
  const isWideTall = fmt === '5:8' || fmt === '3:4';
  const lenA = Array.from(a).length;
  const lenB = Array.from(b).length;
  const totalChars = lenA + lenB;
  const maxHalf = Math.max(lenA, lenB);
  const stack = isP && (totalChars > (isWideTall ? 8 : 7) || maxHalf > 4);
  const fontSize = isP
    ? stack
      ? Math.min(fmt === '3:4' ? 106 : isWideTall ? 110 : 104, Math.floor((isWideTall ? 860 : 850) / Math.max(1, maxHalf)))
      : Math.min(totalChars <= 6 ? (fmt === '3:4' ? 110 : 114) : 94, Math.floor(840 / Math.max(1, totalChars)))
    : Math.min(
        totalChars <= 8 ? 152 : totalChars <= 11 ? 120 : 100,
        Math.floor(1560 / Math.max(1, totalChars)),
      );
  return {stack, fontSize};
}

function PrismCardView({
  media,
  t,
  at,
  compact,
}: {
  media: Extract<PrismResolvedMedia, {kind: 'card'}>;
  t: number;
  at: number;
  compact?: boolean;
}) {
  const theme = ACCENTS[media.accent];
  const dense = Boolean(compact && media.lines.length >= 4);
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: dense ? '16px 22px' : compact ? '20px 26px' : '34px 42px',
        background: 'linear-gradient(160deg,#FAFBFD 0%,#F1F4FA 100%)',
        color: INK,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 6, background: theme.line}} />
      <div
        style={{
          position: 'absolute',
          right: -80,
          top: -80,
          width: 280,
          height: 280,
          borderRadius: '50%',
          background: theme.soft,
        }}
      />
      <div style={{position: 'relative', zIndex: 1}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap'}}>
          {media.badge ? (
            <span
              style={{
                padding: dense ? '3px 10px' : compact ? '4px 12px' : '6px 16px',
                borderRadius: 999,
                background: theme.pill,
                color: '#fff',
                fontSize: dense ? 18 : compact ? 20 : 23,
                fontWeight: 650,
                letterSpacing: 0.6,
              }}
            >
              {media.badge}
            </span>
          ) : null}
          <span style={{fontSize: dense ? 26 : compact ? 30 : 38, fontWeight: 700, letterSpacing: -0.5}}>
            {media.title}
          </span>
        </div>
        <div
          style={{
            marginTop: dense ? 10 : compact ? 14 : 24,
            display: 'flex',
            flexDirection: 'column',
            gap: dense ? 7 : compact ? 10 : 16,
          }}
        >
          {media.lines.map((line, idx) => {
            const q = focusEase(t, at + 0.08 + idx * 0.14, at + 0.38 + idx * 0.14);
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: dense ? '7px 12px' : compact ? '10px 14px' : '14px 20px',
                  borderRadius: dense ? 12 : 16,
                  background: '#FFFFFF',
                  border: '1px solid #E5E9F2',
                  boxShadow: '0 6px 18px rgba(20,22,28,0.05)',
                  opacity: q,
                  transform: q < 1 ? `translateX(${(1 - q) * 20}px)` : undefined,
                }}
              >
                <span
                  style={{
                    width: dense ? 24 : compact ? 28 : 34,
                    height: dense ? 24 : compact ? 28 : 34,
                    borderRadius: '50%',
                    background: theme.soft,
                    color: theme.pill,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: dense ? 16 : compact ? 18 : 20,
                    fontWeight: 700,
                    flex: 'none',
                  }}
                >
                  {idx + 1}
                </span>
                <span style={{fontSize: dense ? 22 : compact ? 25 : 31, fontWeight: 550, lineHeight: 1.32, color: '#222631'}}>
                  {line}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {media.footer ? (
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            paddingTop: dense ? 8 : 12,
            borderTop: '1px solid #E4E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: dense ? 19 : compact ? 21 : 25,
            color: MUTED,
            fontWeight: 500,
          }}
        >
          <span>{media.footer}</span>
          <span style={{color: theme.pill, fontWeight: 650}}>✓ READY</span>
        </div>
      ) : null}
    </div>
  );
}

function PrismMediaView({
  media,
  t,
  from,
  compact,
}: {
  media: PrismResolvedMedia;
  t: number;
  from: number;
  compact?: boolean;
}) {
  if (media.kind === 'video') {
    return <VideoClip src={media.src} at={media.at} from={from} />;
  }
  if (media.kind === 'image') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: media.fit === 'contain' ? '#F3F6FC' : '#0E1016',
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Img
          src={staticFile(media.src)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: media.fit,
            padding: media.fit === 'contain' ? (compact ? 14 : 28) : 0,
            boxSizing: 'border-box',
          }}
        />
        {media.label ? (
          <div
            style={{
              position: 'absolute',
              left: 18,
              bottom: 16,
              padding: '6px 14px',
              borderRadius: 999,
              background: 'rgba(14,16,22,0.75)',
              color: '#fff',
              fontSize: 21,
              fontWeight: 600,
            }}
          >
            {media.label}
          </div>
        ) : null}
      </div>
    );
  }
  return <PrismCardView media={media} t={t} at={from} compact={compact} />;
}

function LogoScene({u, p, s, ep, fmt}: SceneCtx) {
  const {brand} = resolvePrismIdentity(ep, s);
  const cy = stageCenterY(fmt);
  const inQ = focusEase(u, 0, 0.38);
  const isP = isTallFmt(fmt);
  const is58 = fmt === '5:8';
  const is34 = fmt === '3:4';
  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: cy - (is34 ? 126 : isP ? 140 : 105),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: is34 ? 20 : isP ? 24 : 20,
          opacity: inQ,
          filter: inQ < 1 ? `blur(${(1 - inQ) * 6}px)` : undefined,
          transform: inQ < 1 ? `translateY(${(1 - inQ) * 18}px) scale(${lerp(0.95, 1, inQ)})` : undefined,
        }}
      >
        {p.kicker ? (
          <div
            style={{
              padding: '7px 22px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.14)',
              border: '1px solid rgba(255,255,255,0.28)',
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: 1.5,
            }}
          >
            {p.kicker}
          </div>
        ) : null}
        <div
          style={{
            display: 'flex',
            flexDirection: isP && Array.from(brand).length > 6 ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 22,
            fontSize: is34 ? 72 : is58 ? 74 : isP ? 68 : 76,
            fontWeight: 700,
            letterSpacing: -1,
          }}
        >
          <Mark size={is34 ? 88 : is58 ? 92 : isP ? 84 : 80} cutout="#000" />
          <span>{brand}</span>
        </div>
        {p.tagline ? (
          <div style={{fontSize: is34 ? 32 : is58 ? 34 : isP ? 32 : 34, color: 'rgba(255,255,255,0.82)', opacity: focusEase(u, 0.2, 0.58)}}>
            {p.tagline}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
}

export function computeIconsLayout(s: PrismShot, fmt: PrismFormat, t: number) {
  const p = s.props ?? {};
  const items = (p.items as any[]).map(normalizeIconItem);
  const n = items.length;
  const isP = isTallFmt(fmt);
  const is58 = fmt === '5:8';
  const is34 = fmt === '3:4';
  const cy = stageCenterY(fmt);
  const hasLabels = items.some((x) => x.label || x.sub);
  const hasHeader = Boolean(p.kicker || p.title);
  const headerTop = is34 ? 126 : is58 ? 190 : isP ? 300 : 120;
  const glyphSize = hasLabels ? (is34 ? 106 : 116) : is34 ? 140 : 156;
  const estCardH = hasLabels ? (is34 ? 258 : 284) : glyphSize + 48;

  const itemAt = (idx: number) => items[idx].at ?? s.start + 0.1 + idx * 0.22;

  const cards = items.map((item, i) => {
    const at = itemAt(i);
    const q = focusEase(t, at, at + 0.4);
    const nextAt = i + 1 < n ? itemAt(i + 1) : null;
    const activeIn = focusEase(t, at, at + 0.32);
    const activeOut = nextAt != null ? focusEase(t, nextAt, nextAt + 0.32) : 0;
    const activeQ = activeIn * (1 - activeOut);

    let x = 0;
    let y = 0;
    let cardW = 340;
    if (isP) {
      if (n <= 2) {
        cardW = is34 || is58 ? 444 : 410;
        const gap = 36;
        const totalW = n * cardW + (n - 1) * gap;
        x = (1080 - totalW) / 2 + i * (cardW + gap);
        y = cy - (is34 ? 148 : 165);
      } else {
        cardW = is34 || is58 ? 444 : 420;
        const col = i % 2;
        const row = Math.floor(i / 2);
        x = (is34 || is58 ? 72 : 96) + col * (cardW + 48);
        y = is34
          ? row === 0
            ? 258
            : 654
          : is58
            ? (hasHeader ? 370 : 320) + row * 345
            : (hasHeader ? 470 : 420) + row * 350;
      }
    } else {
      cardW = n === 4 ? 350 : 390;
      const gap = n === 4 ? 36 : 48;
      const totalW = n * cardW + (n - 1) * gap;
      x = (1920 - totalW) / 2 + i * (cardW + gap);
      y = hasHeader ? 290 : cy - 170;
    }

    const translateY = (1 - q) * 28;
    const scale = lerp(0.92, 1, q) * (1 + 0.035 * activeQ);
    return {
      item,
      x,
      y,
      width: cardW,
      estHeight: estCardH,
      glyphSize,
      hasLabels,
      opacity: q,
      translateY,
      scale,
      activeQ,
    };
  });

  return {headerTop, hasHeader, hasLabels, cards};
}

function IconsScene({t, u, p, s, fmt}: SceneCtx) {
  const isP = isTallFmt(fmt);
  const is58 = fmt === '5:8';
  const is34 = fmt === '3:4';
  const layout = computeIconsLayout(s, fmt, t);
  const hq = focusEase(u, 0, 0.36);

  return (
    <AbsoluteFill>
      {layout.hasHeader ? (
        <div
          style={{
            position: 'absolute',
            left: is34 || is58 ? 64 : 80,
            right: is34 || is58 ? 64 : 80,
            top: layout.headerTop,
            textAlign: 'center',
            opacity: hq,
            transform: hq < 1 ? `translateY(${(1 - hq) * 18}px)` : undefined,
          }}
        >
          {p.kicker ? (
            <div style={{fontSize: is34 ? 28 : 30, fontWeight: 600, letterSpacing: 2, opacity: 0.88}}>{p.kicker}</div>
          ) : null}
          {p.title ? (
            <div style={{fontSize: is34 ? 48 : is58 ? 54 : isP ? 52 : 60, fontWeight: 700, marginTop: is34 ? 8 : 10}}>
              {p.title}
            </div>
          ) : null}
        </div>
      ) : null}
      {layout.cards.map((c, i) => {
        const moved = Math.abs(c.translateY) > 1e-4 || Math.abs(c.scale - 1) > 1e-4;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: c.x,
              top: c.y,
              width: c.width,
              padding: c.hasLabels ? (is34 ? '24px 22px' : '30px 24px') : is34 ? '20px' : '24px',
              boxSizing: 'border-box',
              borderRadius: 32,
              background: c.hasLabels ? `rgba(255,255,255,${(0.15 + 0.07 * c.activeQ).toFixed(3)})` : 'transparent',
              border: c.hasLabels ? `1px solid rgba(255,255,255,${(0.3 + 0.28 * c.activeQ).toFixed(3)})` : undefined,
              boxShadow: c.hasLabels ? '0 24px 60px rgba(32,0,64,0.22)' : undefined,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              opacity: c.opacity,
              transform: moved ? `translateY(${c.translateY}px) scale(${c.scale})` : undefined,
            }}
          >
            <PrismGlyph kind={c.item.icon} size={c.glyphSize} uid={`${s.id}-${i}`} />
            {c.item.label ? (
              <div
                style={{
                  fontSize: is34 ? 34 : 36,
                  fontWeight: 700,
                  marginTop: is34 ? 16 : 20,
                  textShadow: '0 2px 12px rgba(0,0,0,0.25)',
                }}
              >
                {c.item.label}
              </div>
            ) : null}
            {c.item.sub ? (
              <div style={{fontSize: is34 ? 24 : 25, opacity: 0.88, marginTop: is34 ? 6 : 8, fontWeight: 500}}>
                {c.item.sub}
              </div>
            ) : null}
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

function HeadlineScene({t, u, p, s, fmt}: SceneCtx) {
  const lines = p.lines as string[];
  const isP = isTallFmt(fmt);
  const is58 = fmt === '5:8';
  const is34 = fmt === '3:4';
  const maxChars = Math.max(...lines.map((l) => Array.from(l).length));
  const size = isP
    ? maxChars <= 6
      ? is34
        ? 108
        : is58
          ? 112
          : 104
      : maxChars <= 10
        ? is34
          ? 82
          : is58
            ? 84
            : 78
        : is34
          ? 62
          : is58
            ? 64
            : 60
    : maxChars <= 6
      ? 156
      : maxChars <= 10
        ? 114
        : 86;
  const showIcons = p.showIcons ?? maxChars <= 9;
  const iconSize = Math.round(size * 0.82);
  const cy = stageCenterY(fmt);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: is34 || is58 ? 52 : isP ? 64 : 120,
          right: is34 || is58 ? 52 : isP ? 64 : 120,
          top: cy,
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {p.kicker ? (
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: 2,
              color: 'rgba(255,255,255,0.78)',
              marginBottom: is34 ? 20 : 24,
              opacity: focusEase(u, 0, 0.34),
            }}
          >
            {p.kicker}
          </div>
        ) : null}
        {lines.map((l, i) => {
          const q = focusEase(t, s.start + 0.04 + i * 0.18, s.start + 0.42 + i * 0.18);
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: Math.round(size * 0.18),
                fontSize: size,
                fontWeight: 700,
                letterSpacing: -2,
                lineHeight: 1.16,
                opacity: q,
                filter: q < 1 ? `blur(${(1 - q) * 6}px)` : undefined,
                transform: q < 1 ? `translateY(${(1 - q) * 28}px)` : undefined,
              }}
            >
              {showIcons && i === 0 ? <Mark size={iconSize} cutout="#000" /> : null}
              <span>{l}</span>
              {showIcons && i === lines.length - 1 ? <PlayBadge size={iconSize} /> : null}
            </div>
          );
        })}
        {p.sub ? (
          <div
            style={{
              fontSize: isP ? 32 : 36,
              color: 'rgba(255,255,255,0.82)',
              marginTop: is34 ? 22 : 28,
              opacity: focusEase(u, 0.28, 0.68),
            }}
          >
            {p.sub}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
}

function Avatar({from, initial, small}: {from: 'user' | 'bench'; initial: string; small?: boolean}) {
  const sz = small ? 72 : 80;
  return from === 'user' ? (
    <div
      style={{
        width: sz,
        height: sz,
        borderRadius: '50%',
        flex: 'none',
        display: 'grid',
        placeItems: 'center',
        fontSize: small ? 34 : 38,
        fontWeight: 650,
        color: '#fff',
        background: 'linear-gradient(140deg,#5B8CFF,#8C5BFF)',
      }}
    >
      {initial}
    </div>
  ) : (
    <div
      style={{
        width: sz,
        height: sz,
        borderRadius: 20,
        flex: 'none',
        display: 'grid',
        placeItems: 'center',
        background: '#0E1016',
        color: '#fff',
      }}
    >
      <Mark size={small ? 44 : 50} cutout="#0E1016" />
    </div>
  );
}

function RichText({text, handle, count}: {text: string; handle: string; count: number}) {
  const shown = Array.from(text).slice(0, count).join('');
  if (!handle) return <>{shown}</>;
  const parts = shown.split(handle);
  return (
    <>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {i ? <span style={{color: BLUE, fontWeight: 650}}>{handle}</span> : null}
          {part}
        </React.Fragment>
      ))}
    </>
  );
}

export function estimateChatBubbleHeight(
  m: PrismChatMessage,
  ep: PrismTalkEpisode,
  s: PrismShot,
  fmt: PrismFormat,
): number {
  const isP = isTallFmt(fmt);
  const is34 = fmt === '3:4';
  const {chatWidth} = prismStageLayout(fmt);
  const padY = is34 ? 24 : fmt === '5:8' ? 28 : isP ? 26 : 28;
  const padX = is34 ? 32 : fmt === '5:8' ? 34 : isP ? 30 : 36;
  const avatarSz = isP ? 72 : 80;
  const gapX = isP ? 20 : 24;
  const textColW = chatWidth - padX * 2 - avatarSz - gapX;
  const bodyFs = is34 ? 34 : isP ? 36 : 39;
  const charsPerLine = Math.max(12, Math.floor(textColW / bodyFs));
  const textLines = Math.max(1, Math.ceil(Array.from(m.text).length / charsPerLine));
  const headerH = Math.round((isP ? 28 : 30) * 1.32);
  const bodyH = Math.round(textLines * bodyFs * 1.42) + 6;
  const listFs = is34 ? 29 : isP ? 31 : 34;
  const listH = m.list?.length ? 8 + m.list.length * Math.round(listFs * 1.52) : 0;
  const mainH = Math.max(avatarSz, headerH + bodyH + listH);

  let mediaBlockH = 0;
  if (m.media != null) {
    const media = resolvePrismMedia(ep, s, m.media);
    const mediaH = media.kind === 'card' ? compactCardHeight(media, isP, fmt) : is34 ? 330 : isP ? 360 : 320;
    mediaBlockH = 18 + mediaH + 2;
  }
  return padY * 2 + mainH + mediaBlockH;
}

export function computeChatBubbleLayout(
  ep: PrismTalkEpisode,
  s: PrismShot,
  fmt: PrismFormat,
  t: number,
) {
  const p = s.props ?? {};
  const ms = (p.messages ?? []) as PrismChatMessage[];
  const isP = isTallFmt(fmt);
  const {width, centerY, chatWidth, chatBounds} = prismStageLayout(fmt);
  const cx = width / 2;
  const msgAt = (idx: number) => ms[idx].at ?? s.start + (idx === 0 ? 0.15 : idx * 0.6);
  const estHeights = ms.map((m) => estimateChatBubbleHeight(m, ep, s, fmt));
  const peekStep = fmt === '3:4' ? 112 : isP ? 124 : 114;

  // 当第 k 条消息位于最前景时，第 j (j <= k) 条消息的顶边固定坐标
  const targetTopAtStage = (j: number, k: number): number => {
    const stackRoom = Math.min(k * 28, 56);
    const rawFrontTop = Math.round(centerY - estHeights[k] / 2 + stackRoom);
    const maxAllowedTop = Math.max(chatBounds.minTop, chatBounds.maxBottom - estHeights[k]);
    const minFrontTop = Math.min(chatBounds.minTop + Math.min(k * 42, 84), maxAllowedTop);
    const frontTop = Math.max(minFrontTop, Math.min(maxAllowedTop, rawFrontTop));
    if (j === k) return frontTop;
    return Math.max(chatBounds.minTop, frontTop - (k - j) * peekStep);
  };

  const bubbles = ms
    .map((m, j) => {
      const at = msgAt(j);
      if (t < at) return null;
      const q = focusEase(t, at, at + 0.36);
      const baseTop = targetTopAtStage(j, j);
      let curTop = baseTop;
      let depth = 0;
      for (let k = j + 1; k < ms.length; k++) {
        const pk = focusEase(t, msgAt(k), msgAt(k) + 0.38);
        curTop += pk * (targetTopAtStage(j, k) - targetTopAtStage(j, k - 1));
        depth += pk;
      }

      const enterOffsetY = (1 - q) * 28;
      const screenTop = curTop + enterOffsetY;
      const translateY = screenTop - baseTop;
      const focusBoost =
        m.focusAt != null && depth === 0
          ? focusEase(t, m.focusAt, m.focusAt + 0.38) * ((m.focusScale ?? 1.045) - 1)
          : 0;
      const scale = lerp(0.96, 1, q) * (1 - Math.min(0.14, depth * 0.05)) * (1 + focusBoost);
      const opacity = q * (1 - Math.min(0.72, depth * 0.34));
      const blurPx = depth > 0.001 ? depth * 3.2 : 0;

      const mAt = m.mediaAt ?? Math.min(s.end - 0.4, at + 0.45);
      const mediaProgress = m.media != null ? focusEase(t, mAt, mAt + 0.38) : 0;

      return {
        index: j,
        message: m,
        at,
        mediaAt: mAt,
        mediaProgress,
        left: cx,
        width: chatWidth,
        baseTop,
        screenTop,
        translateY,
        scale,
        opacity,
        blurPx,
        depth,
        estimatedHeight: estHeights[j],
      };
    })
    .filter((x): x is NonNullable<typeof x> => x != null);

  return {sceneScale: 1, cx, chatWidth, chatBounds, bubbles};
}

function ChatBubbleCard({
  m,
  t,
  at,
  mediaAt,
  mediaProgress,
  s,
  ep,
  fmt,
}: {
  m: PrismChatMessage;
  t: number;
  at: number;
  mediaAt: number;
  mediaProgress: number;
  s: PrismShot;
  ep: PrismTalkEpisode;
  fmt: PrismFormat;
}) {
  const isP = isTallFmt(fmt);
  const is58 = fmt === '5:8';
  const is34 = fmt === '3:4';
  const {chatWidth} = prismStageLayout(fmt);
  const id = resolvePrismIdentity(ep, s);
  const senderName = m.name ?? (m.from === 'user' ? id.user.name : id.brand);
  const senderInitial = m.initial ?? id.user.initial;
  const chars = Array.from(m.text);
  const count = m.typed ? Math.floor(chars.length * focusEase(t, at + 0.16, at + 0.9)) : chars.length;
  const media = m.media != null ? resolvePrismMedia(ep, s, m.media) : null;
  const mediaH = media ? (media.kind === 'card' ? compactCardHeight(media, isP, fmt) : is34 ? 330 : isP ? 360 : 320) : 0;
  const bodyFs = is34 ? 34 : isP ? 36 : 39;
  const listFs = is34 ? 29 : isP ? 31 : 34;

  return (
    <div
      style={{
        width: chatWidth,
        boxSizing: 'border-box',
        padding: is34 ? '24px 32px' : is58 ? '28px 34px' : isP ? '26px 30px' : '28px 36px',
        borderRadius: 32,
        background: '#FFFFFF',
        color: INK,
        boxShadow: '0 30px 80px rgba(42,0,77,0.34), 0 2px 0 #fff inset',
      }}
    >
      <div style={{display: 'flex', gap: isP ? 20 : 24, alignItems: 'flex-start'}}>
        <Avatar from={m.from} initial={senderInitial} small={isP} />
        <div style={{flex: 1, minWidth: 0}}>
          <div style={{fontSize: isP ? 28 : 30, fontWeight: 650}}>
            {senderName}
            {m.time ? (
              <span style={{marginLeft: 14, fontWeight: 400, color: MUTED, fontSize: isP ? 24 : 25}}>{m.time}</span>
            ) : null}
          </div>
          {/* 同格隐藏完整文本预占位，彻底消除打字机跨行时的高度突变 */}
          <div
            style={{
              display: 'grid',
              fontSize: bodyFs,
              lineHeight: 1.42,
              marginTop: 6,
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
            }}
          >
            <span style={{gridArea: '1 / 1', visibility: 'hidden', pointerEvents: 'none'}} aria-hidden>
              {m.text}
            </span>
            <span style={{gridArea: '1 / 1'}}>
              <RichText text={m.text} handle={id.handle} count={count} />
            </span>
          </div>
          {/* 列表项按终态高度预占位，槽位内平稳渐显，卡片顶边与底边均零抽动 */}
          {m.list ? (
            <div style={{marginTop: 8, display: 'flex', flexDirection: 'column', gap: 2}}>
              {m.list.map((item, i) => {
                const q = focusEase(t, at + 0.42 + i * 0.3, at + 0.74 + i * 0.3);
                return (
                  <div
                    key={i}
                    style={{
                      opacity: q,
                      transform: q < 1 ? `translateY(${(1 - q) * 10}px)` : undefined,
                      fontSize: listFs,
                      lineHeight: 1.5,
                      color: '#30343F',
                    }}
                  >
                    {i + 1}. {item}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
      {media && mediaProgress > 0 ? (
        <div
          style={{
            height: Math.round(mediaProgress * mediaH),
            marginTop: Math.round(mediaProgress * 18),
            opacity: mediaProgress,
            borderRadius: 20,
            overflow: 'hidden',
            border: '1px solid #E6EAF2',
            background: '#0E1016',
          }}
        >
          <div style={{height: mediaH}}>
            <PrismMediaView media={media} t={t} from={mediaAt} compact />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ChatScene({t, s, ep, fmt}: SceneCtx) {
  const layout = computeChatBubbleLayout(ep, s, fmt, t);

  return (
    <AbsoluteFill>
      {layout.bubbles.map((b) => {
        const hasMotion = Math.abs(b.translateY) > 1e-4 || Math.abs(b.scale - 1) > 1e-4;
        return (
          <div
            key={b.index}
            style={{
              position: 'absolute',
              left: b.left,
              top: b.baseTop,
              zIndex: b.index,
              opacity: b.opacity,
              filter: b.blurPx > 0 ? `blur(${b.blurPx.toFixed(2)}px)` : undefined,
              transformOrigin: '50% 0%',
              transform: hasMotion
                ? `translate(-50%, ${b.translateY.toFixed(3)}px) scale(${b.scale.toFixed(5)})`
                : 'translateX(-50%)',
            }}
          >
            <ChatBubbleCard
              m={b.message}
              t={t}
              at={b.at}
              mediaAt={b.mediaAt}
              mediaProgress={b.mediaProgress}
              s={s}
              ep={ep}
              fmt={fmt}
            />
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

export function computeWindowTransform(
  s: PrismShot,
  fmt: PrismFormat,
  t: number,
  lockFromPrevWindow = false,
) {
  const p = s.props ?? {};
  const u = t - s.start;
  const {windowRect} = prismStageLayout(fmt);
  const fromPrevWindow = lockFromPrevWindow;
  const inQ = fromPrevWindow ? focusEase(u, 0, 0.24) : focusEase(u, 0, 0.36);
  const opacity = inQ;
  const translateY = fromPrevWindow ? 0 : (1 - inQ) * 20;
  const enterScale = fromPrevWindow ? 1 : lerp(0.97, 1, inQ);

  let zoomAt: number | null = null;
  let targetScale = 1;
  let origin = `${windowRect.x + windowRect.w / 2}px ${windowRect.y + windowRect.h / 2}px`;

  if (p.zoom !== false) {
    if (p.zoom && typeof p.zoom === 'object') {
      const z = p.zoom as PrismZoomSpec;
      zoomAt = z.at;
      targetScale = z.scale ?? 1.045;
      if (z.origin) origin = z.origin;
    } else if (typeof p.focusAt === 'number') {
      zoomAt = p.focusAt;
      targetScale = 1.045;
    } else if (Array.isArray(p.callouts) && p.callouts.length > 0) {
      const idx = p.callouts.length - 1;
      const rawAt = (p.callouts[idx] as PrismCallout).at ?? s.start + 0.5 + idx * 0.7;
      if (rawAt >= s.start + 0.4 && rawAt <= s.end - 0.45) {
        zoomAt = rawAt;
        targetScale = 1.045;
      }
    }
  }

  const zoomProgress = zoomAt != null ? focusEase(t, zoomAt, zoomAt + 0.38) : 0;
  const scale = enterScale * (1 + (targetScale - 1) * zoomProgress);

  return {
    windowRect,
    fromPrevWindow,
    opacity,
    translateY,
    scale,
    zoomProgress,
    origin,
  };
}

function WindowScene({t, p, s, ep, fmt, lockFromPrevWindow}: SceneCtx) {
  const title: string = p.title ?? p.window;
  const mediaInput: PrismMediaInput =
    p.media ??
    p.card ?? {
      kind: 'card',
      title: p.cardTitle ?? title,
      badge: p.badge,
      lines: p.lines ?? [],
      footer: p.footer,
    };
  const media = resolvePrismMedia(ep, s, mediaInput);
  const callouts: PrismCallout[] = p.callouts ?? [];
  const pose = computeWindowTransform(s, fmt, t, lockFromPrevWindow);
  const {x: winX, y: winY, w: winW, h: winH} = pose.windowRect;
  const hasTransform = Math.abs(pose.translateY) > 1e-4 || Math.abs(pose.scale - 1) > 1e-4;

  return (
    <AbsoluteFill
      style={{
        opacity: pose.opacity,
        transformOrigin: pose.origin,
        transform: hasTransform ? `translateY(${pose.translateY.toFixed(3)}px) scale(${pose.scale.toFixed(5)})` : undefined,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: winX,
          top: winY,
          width: winW,
          height: winH,
          borderRadius: 28,
          overflow: 'hidden',
          background: '#FFFFFF',
          boxShadow: pose.fromPrevWindow && pose.opacity < 1 ? 'none' : '0 40px 110px rgba(42,0,77,0.46)',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            padding: '0 26px',
            background: '#F6F7FA',
            borderBottom: '1px solid #E6E8EF',
            color: '#4F5665',
            fontSize: 24,
            fontWeight: 600,
          }}
        >
          <Traffic color />
          <span style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{title}</span>
          {p.badge ? (
            <span
              style={{
                padding: '4px 14px',
                borderRadius: 999,
                background: '#EEF3FF',
                color: BLUE,
                fontSize: 19,
                fontWeight: 700,
              }}
            >
              {p.badge}
            </span>
          ) : null}
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 65, bottom: 0}}>
          <PrismMediaView media={media} t={t} from={s.start} />
          {callouts.length ? (
            <div
              style={{
                position: 'absolute',
                right: 28,
                bottom: 24,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 12,
                zIndex: 3,
              }}
            >
              {callouts.map((c, idx) => {
                const cAt = c.at ?? s.start + 0.5 + idx * 0.7;
                const q = focusEase(t, cAt, cAt + 0.36);
                if (q <= 0) return null;
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 22px',
                      borderRadius: 999,
                      background: 'rgba(14,16,24,0.88)',
                      color: '#fff',
                      fontSize: 25,
                      fontWeight: 650,
                      border: '1px solid rgba(255,255,255,0.24)',
                      boxShadow: '0 12px 30px rgba(0,0,0,0.28)',
                      opacity: q,
                      transform: q < 1 ? `translateY(${(1 - q) * 14}px) scale(${lerp(0.95, 1, q)})` : undefined,
                    }}
                  >
                    ✦ {c.text}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
}

function PunchScene({t, p, s, fmt}: SceneCtx) {
  const items = normalizePunchItems(p.lines, s);
  const isP = isTallFmt(fmt);
  const is34 = fmt === '3:4';
  const cy = stageCenterY(fmt);

  return (
    <AbsoluteFill>
      {p.kicker ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: cy - (is34 ? 196 : isP ? 220 : 170),
            textAlign: 'center',
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: 2.5,
            color: 'rgba(255,255,255,0.72)',
          }}
        >
          {p.kicker}
        </div>
      ) : null}
      {items.map(({pair: [a, b], start, end}, i) => {
        if (t < start || t >= end) return null;
        const span = end - start;
        const q = focusEase(t, start, start + Math.min(0.26, span * 0.28));
        const out = i === items.length - 1 ? 0 : focusEase(t, end - Math.min(0.2, span * 0.22), end);
        const white = focusEase(t, start + span * 0.42, start + span * 0.78);
        const {stack, fontSize} = punchLayout(a, b, fmt);

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 60,
              right: 60,
              top: cy,
              display: 'flex',
              flexDirection: stack ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize,
              fontWeight: 700,
              letterSpacing: -3,
              lineHeight: 1.15,
              opacity: q * (1 - out),
              filter: q < 1 || out > 0 ? `blur(${(1 - q) * 8 + out * 8}px)` : undefined,
              transform: q < 1 ? `translateY(-50%) scale(${lerp(0.95, 1, q)})` : 'translateY(-50%)',
            }}
          >
            <span>{a}</span>
            <span style={{position: 'relative', marginLeft: stack ? 0 : 10}}>
              <span style={{background: RAINBOW, WebkitBackgroundClip: 'text', color: 'transparent', opacity: 1 - white}}>
                {b}
              </span>
              <span style={{position: 'absolute', left: 0, top: 0, opacity: white}}>{b}</span>
            </span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

const SCENES: Record<string, React.FC<SceneCtx>> = {
  'prism.logo': LogoScene,
  'prism.icons': IconsScene,
  'prism.headline': HeadlineScene,
  'prism.chat': ChatScene,
  'prism.window': WindowScene,
  'prism.punch': PunchScene,
};

function Subtitle({t, ep, fmt}: {t: number; ep: PrismTalkEpisode; fmt: PrismFormat}) {
  const c = ep.captions.find((x) => t >= x.start && t < x.end);
  if (!c) return null;
  const isP = isTallFmt(fmt);
  const is34 = fmt === '3:4';
  const {subtitleTop, subtitleSide, subtitleMaxWidth} = prismStageLayout(fmt);
  const n = Array.from(c.text).length;
  return (
    <div
      style={{
        position: 'absolute',
        left: subtitleSide,
        right: subtitleSide,
        top: subtitleTop,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          maxWidth: subtitleMaxWidth,
          fontSize: is34 ? (n > 18 ? 36 : 41) : isP ? (n > 18 ? 38 : 43) : n > 24 ? 40 : 45,
          fontWeight: 600,
          lineHeight: is34 ? 1.35 : 1.38,
          textAlign: 'center',
          padding: is34 ? '9px 24px' : isP ? '10px 26px' : '8px 30px',
          borderRadius: 18,
          color: '#FFFFFF',
          background: 'rgba(10, 12, 18, 0.82)',
          border: '1px solid rgba(255, 255, 255, 0.24)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.42)',
        }}
      >
        {c.text}
      </div>
    </div>
  );
}

export const prismTalkMetadata: CalculateMetadataFunction<PrismTalkProps> = async ({props}) => {
  const raw: PrismTalkEpisode =
    props.ep ?? (await fetch(staticFile(`episodes/${props.episode}/episode.json`)).then((r) => r.json()));
  const fmt: PrismFormat = props.format ?? raw.format ?? 'landscape';
  const ep: PrismTalkEpisode = {...raw, format: fmt};
  validatePrismTalk(ep);
  const {width, height} = prismFormatDims(fmt);
  return {
    durationInFrames: Math.round(ep.duration * TALK_FPS),
    fps: TALK_FPS,
    width,
    height,
    props: {...props, format: fmt, ep},
  };
};

export const PrismTalk: React.FC<PrismTalkProps> = ({ep, format, audio = true}) => {
  const {fps, width, height} = useVideoConfig();
  const t = useCurrentFrame() / fps;
  if (!ep) return null;
  const fmt: PrismFormat =
    format ??
    ep.format ??
    (height > width
      ? Math.abs(width / height - 3 / 4) < 0.03
        ? '3:4'
        : Math.abs(width / height - 5 / 8) < 0.03
          ? '5:8'
          : 'portrait'
      : 'landscape');

  return (
    <AbsoluteFill style={{background: '#000', fontFamily: font, color: '#fff', overflow: 'hidden'}}>
      <FontGate text={JSON.stringify([ep.brand, ep.handle, ep.user, ep.clips, ep.captions, ep.shots]) + '0123456789.:✓✦提问者'} />
      {audio ? (
        <Sequence from={Math.round((ep.audioOffset ?? 0) * fps)} layout="none">
          <Audio src={staticFile(talkAsset(ep as any, ep.audio))} />
        </Sequence>
      ) : null}
      {audio && ep.music ? (
        <Audio loop src={staticFile(talkAsset(ep as any, ep.music.src))} volume={(f) => musicGainAt(ep as any, f / fps)} />
      ) : null}
      {audio && ep.sfx ? <Audio src={staticFile(talkAsset(ep as any, ep.sfx.src))} volume={ep.sfx.volume ?? 0.5} /> : null}
      <Field t={t} dark={prismDarkAt(ep, t)} />
      {ep.shots.map((s, i) => {
        const isLast = i === ep.shots.length - 1;
        const nextShot = !isLast ? ep.shots[i + 1] : undefined;
        const prevShot = i > 0 ? ep.shots[i - 1] : undefined;
        const holdWindowShell =
          s.template === 'prism.window' &&
          nextShot?.template === 'prism.window' &&
          computeWindowTransform(s, fmt, s.end).scale <= 1.0005;
        const lockFromPrevWindow =
          s.template === 'prism.window' &&
          prevShot?.template === 'prism.window' &&
          computeWindowTransform(prevShot, fmt, prevShot.end).scale <= 1.0005;
        const tail = holdWindowShell ? 0.24 : 0.2;
        if (t < s.start || t >= s.end + (isLast ? TALK_OVERLAP : tail)) return null;
        const Scene = SCENES[s.template];
        const out = isLast || holdWindowShell ? 0 : focusEase(t, s.end - 0.04, s.end + tail);
        if (out >= 1) return null;
        const exitBlur = out > 0 && isPrismShotDark(s) ? out * 5 : 0;
        return (
          <AbsoluteFill
            key={s.id}
            style={{
              opacity: 1 - out,
              filter: exitBlur > 0 ? `blur(${exitBlur.toFixed(2)}px)` : undefined,
            }}
          >
            <Scene
              t={t}
              u={t - s.start}
              d={s.end - s.start}
              p={s.props ?? {}}
              s={s}
              ep={ep}
              fmt={fmt}
              lockFromPrevWindow={lockFromPrevWindow}
            />
          </AbsoluteFill>
        );
      })}
      <Subtitle t={t} ep={ep} fmt={fmt} />
    </AbsoluteFill>
  );
};
