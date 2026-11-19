import React, {useEffect, useRef} from 'react';
import {
  AbsoluteFill,
  Audio,
  CalculateMetadataFunction,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {FontGate} from '../kit/frame';
import {PixelFonts} from '../kit/PixelFonts';
import {Mark} from './CleanUiDemo';
import {musicGainAt, TALK_FPS, TALK_OVERLAP, talkAsset} from '../kit/talk';
import {
  hasLineSwarm,
  isPaperShotDark,
  PAPER_LINE,
  PAPER_SCENES,
  PaperFormat,
  paperFormatDims,
  paperDarkAt,
  paperLineLayout,
  paperLineSchedule,
  paperMorphOf,
  PaperShot,
  PaperTalkEpisode,
  paperTextureAmount,
  resolvePaperTexture,
  smooth,
  validatePaperTalk,
} from '../kit/paperTalk';

export {PAPER_SCENES, validatePaperTalk};
export type {PaperFormat};
export type PaperTalkProps = {
  episode: string;
  ep?: PaperTalkEpisode;
  format?: PaperFormat;
  audio?: boolean;
};

type SceneCtx = {
  t: number;
  u: number;
  d: number;
  p: any;
  s: PaperShot;
  ep: PaperTalkEpisode;
  fmt: PaperFormat;
};

const PAPER = '#E8E8E6';
const INK = '#151515';
const BLUE = '#5C8DF0';
// 严格只使用项目内置打包的跨平台字体（MiSans VF / JetBrains Mono / Workbench Pixel CN）
const SANS = '"MiSans VF",sans-serif';
const MONO = '"JetBrains Mono","MiSans VF",monospace';
const PIXEL = '"Workbench Pixel CN","MiSans VF",monospace';

const lerp = (a: number, b: number, q: number) => a + (b - a) * q;
const isTallFmt = (fmt: PaperFormat) => fmt === 'portrait' || fmt === '3:4';
const hash = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** 单调无回弹缓出：落定后严格恒等于 1，消除过冲回拉与长尾微爬。 */
export function focusEase(t: number, start: number, end: number): number {
  if (t <= start) return 0;
  if (t >= end) return 1;
  return interpolate(t, [start, end], [0, 1], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

export function paperStageLayout(fmt: PaperFormat) {
  const {width, height} = paperFormatDims(fmt);
  if (fmt === '3:4') {
    return {
      width,
      height,
      subtitleTop: 1292,
      subtitleSide: 48,
      subtitleMaxWidth: 948,
      safeLeft: 48,
      safeRight: 1032,
      safeTop: 60,
      safeBottom: 1230,
    };
  }
  if (fmt === 'portrait') {
    return {
      width,
      height,
      subtitleTop: 1475,
      subtitleSide: 64,
      subtitleMaxWidth: 920,
      safeLeft: 48,
      safeRight: 1032,
      safeTop: 80,
      safeBottom: 1420,
    };
  }
  return {
    width,
    height,
    subtitleTop: 932,
    subtitleSide: 120,
    subtitleMaxWidth: 1620,
    safeLeft: 48,
    safeRight: 1872,
    safeTop: 48,
    safeBottom: 912,
  };
}

function useFontCanvas(
  fontSpec: string,
  text: string,
  draw: (g: CanvasRenderingContext2D) => void,
  deps: unknown[],
) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let done = false;
    const h = delayRender('paper-talk canvas');
    const finish = () => {
      if (done) return;
      done = true;
      const g = ref.current?.getContext('2d');
      if (g) draw(g);
      continueRender(h);
    };
    const fonts = (document as any).fonts;
    Promise.resolve(fonts?.ready)
      .then(() => fonts?.load?.(fontSpec, text || '0'))
      .then(finish)
      .catch(finish);
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return ref;
}

function Texture({
  t,
  amount,
  dark,
  chars,
  fmt,
}: {
  t: number;
  amount: number;
  dark: boolean;
  chars: string;
  fmt: PaperFormat;
}) {
  const {width: W, height: H} = paperFormatDims(fmt);
  const cw = 15;
  const ch = 19;
  const cols = Math.ceil(W / cw);
  const rows = Math.ceil(H / ch);
  const ramp = [' ', '·', ':', '-', '*', 'o', 'm', 'g'];
  const tx = Array.from(chars || '·');

  const ref = useFontCanvas(
    `500 14px ${MONO}`,
    chars + '·:-*omg',
    (g) => {
      g.clearRect(0, 0, W, H);
      if (amount <= 0) return;
      g.font = `500 14px ${MONO}`;
      g.textBaseline = 'top';
      g.fillStyle = dark ? '#FFFFFF' : INK;
      const thr = lerp(1, 0.18, amount);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * cw;
          const y = r * ch;
          const f =
            Math.sin(x * 0.0021 + y * 0.0034 + t * 0.22) *
            Math.cos(x * 0.0013 - y * 0.0029 - t * 0.17 + 1.1);
          const d = (f - thr) / (1 - thr);
          if (d <= 0) continue;
          const k = Math.min(ramp.length + 1, Math.floor(d * (ramp.length + 2)));
          const s = k < ramp.length ? ramp[k] : tx[(c + r) % tx.length];
          if (s === ' ') continue;
          g.globalAlpha = (dark ? 0.32 : 0.38) * Math.min(1, 0.35 + d);
          g.fillText(s, x, y);
        }
      }
    },
    [Math.round(t * 30), amount, dark, chars, W, H],
  );
  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}} />;
}

function PixelWord({text, size, m}: {text: string; size: number; m: number}) {
  const n = Array.from(text).length;
  const w = Math.max(1, n * size);
  const h = Math.round(size * 1.3);
  const cell = Math.round(lerp(Math.round(size * 0.32), 8, m));
  const ref = useFontCanvas(
    `600 ${size}px ${SANS}`,
    text,
    (g) => {
      const mask = document.createElement('canvas');
      mask.width = w;
      mask.height = h;
      const q = mask.getContext('2d')!;
      q.font = `600 ${size}px ${SANS}`;
      q.textBaseline = 'middle';
      q.fillStyle = '#fff';
      q.fillText(text, 0, h * 0.52);
      const px = q.getImageData(0, 0, w, h).data;
      g.clearRect(0, 0, w, h);
      for (let y = cell / 2; y < h; y += cell) {
        for (let x = cell / 2; x < w; x += cell) {
          if (px[(Math.floor(y) * w + Math.floor(x)) * 4 + 3] < 110) continue;
          const k = x / w;
          g.fillStyle = `rgb(${Math.round(lerp(59, 155, k))},${Math.round(lerp(107, 93, k))},${Math.round(lerp(245, 229, k))})`;
          if (cell > 15) g.fillRect(x - cell / 2 + 1, y - cell / 2 + 1, cell - 2, cell - 2);
          else {
            g.beginPath();
            g.arc(x, y, cell * 0.44, 0, Math.PI * 2);
            g.fill();
          }
        }
      }
    },
    [text, size, cell],
  );
  return (
    <canvas
      ref={ref}
      width={w}
      height={h}
      style={{position: 'absolute', left: 0, top: (size * 1.2 - h) / 2, width: w, height: h}}
    />
  );
}

function Tag({
  x,
  y,
  name,
  color,
  o = 1,
  flip = false,
}: {
  x: number;
  y: number;
  name: string;
  color: string;
  o?: number;
  flip?: boolean;
}) {
  if (!name || o <= 0.005) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity: o, fontFamily: SANS, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: -7, top: -7, width: 14, height: 14, borderRadius: 7, background: color}} />
      <div
        style={{
          position: 'absolute',
          left: flip ? undefined : 8,
          right: flip ? 8 : undefined,
          top: 8,
          padding: '5px 12px 6px',
          borderRadius: 6,
          background: color,
          color: '#fff',
          fontSize: 23,
          lineHeight: 1.25,
          letterSpacing: 0,
          fontWeight: 600,
          fontVariationSettings: '"wght" 600',
          WebkitTextStroke: '0',
          whiteSpace: 'nowrap',
        }}
      >
        {name}
      </div>
    </div>
  );
}

function Square({
  x,
  y,
  size,
  color,
  o = 1,
  r = 0,
}: {
  x: number;
  y: number;
  size: number;
  color: string;
  o?: number;
  r?: number;
}) {
  if (o <= 0.005) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        opacity: o,
        transform: Math.abs(r) > 1e-4 ? `rotate(${r}deg)` : undefined,
        background: color,
        backgroundImage: 'repeating-conic-gradient(#0000 0 25%,#ffffff55 0 50%)',
        backgroundSize: '8px 8px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '38%',
          top: '38%',
          width: '62%',
          height: '62%',
          background: color,
          outline: `3px solid ${PAPER}`,
        }}
      />
    </div>
  );
}

const SQ = [
  [-130, -80, BLUE, -9],
  [35, -18, INK, 6],
  [-55, 72, '#C9A27A', 14],
  [125, 48, BLUE, -4],
  [-185, 34, INK, 10],
] as const;

function Wipe({pin, pout, fmt}: {pin: number; pout: number; fmt: PaperFormat}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const {width: W, height: H} = paperFormatDims(fmt);
  // 16:9 用 96x54 (20px 方格)，9:16 用 54x96 (20px 方格)，3:4 用 60x80 (18px 正方形像素格)
  const gw = fmt === '3:4' ? 60 : fmt === 'portrait' ? 54 : 96;
  const gh = fmt === '3:4' ? 80 : fmt === 'portrait' ? 96 : 54;
  const diag = Math.hypot(gw, gh);

  useEffect(() => {
    const g = ref.current?.getContext('2d');
    if (!g) return;
    g.clearRect(0, 0, gw, gh);
    g.fillStyle = '#0B0B0C';
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        const n = hash(x * 57 + y * 131) * 0.14;
        const a = Math.hypot(x - gw * 0.08, y - gh * 0.88) / diag + n;
        const b = Math.hypot(x - gw * 0.92, y - gh * 0.1) / diag + n;
        if (a < pin * 1.25 && !(b < pout * 1.25)) g.fillRect(x, y, 1, 1);
      }
    }
  }, [pin, pout, gw, gh, diag]);

  return (
    <canvas
      ref={ref}
      width={gw}
      height={gh}
      style={{position: 'absolute', inset: 0, width: W, height: H, imageRendering: 'pixelated', pointerEvents: 'none'}}
    />
  );
}

function IntroScene({u, p, ep, fmt}: SceneCtx) {
  const isTall = isTallFmt(fmt);
  const is34 = fmt === '3:4';
  const cfg = PAPER_LINE[fmt];
  const roles: string[] = p.roles ?? ep.roles ?? [];
  const cx = cfg.centerX;
  const cy = cfg.centerY;
  const sqCount = Math.min(Math.max(roles.length, 3), 5);
  const titleQ = focusEase(u, 0.16, 0.54);

  return (
    <AbsoluteFill style={{fontFamily: SANS, color: INK}}>
      {SQ.slice(0, sqCount).map(([dx, dy, col, r], i) => {
        const q = focusEase(u, 0.06 + i * 0.14, 0.42 + i * 0.14);
        const sx = Math.round(cx + dx * (is34 ? 1.12 : isTall ? 1.15 : 1.55) - (is34 ? 40 : 44));
        const sy = Math.round(
          cy + (p.title ? (is34 ? -105 : -110) : 0) + dy * (is34 ? 1.08 : isTall ? 1.15 : 1.35) - (is34 ? 40 : 44),
        );
        return (
          <React.Fragment key={i}>
            <Square
              x={sx}
              y={sy}
              size={is34 ? 80 : isTall ? 82 : 94}
              color={col}
              o={q}
              r={r * (1 - q) + r * 0.3}
            />
            {roles[i] ? (
              <Tag
                x={sx + (is34 ? 84 : isTall ? 88 : 100)}
                y={sy + (is34 ? 80 : isTall ? 84 : 96)}
                name={roles[i]}
                color={PAPER_LINE.colors[i % PAPER_LINE.colors.length]}
                o={focusEase(u, 0.26 + i * 0.14, 0.54 + i * 0.14)}
              />
            ) : null}
          </React.Fragment>
        );
      })}
      {p.title ? (
        <div
          style={{
            position: 'absolute',
            left: is34 ? 64 : isTall ? 72 : 160,
            right: is34 ? 64 : isTall ? 72 : 160,
            top: cy + (roles.length ? (is34 ? 88 : 95) : -45),
            textAlign: 'center',
            opacity: titleQ,
            transform: titleQ < 1 ? `translateY(${((1 - titleQ) * 24).toFixed(3)}px)` : undefined,
          }}
        >
          <div style={{fontSize: is34 ? 72 : isTall ? 74 : 96, fontWeight: 700, letterSpacing: -2, lineHeight: 1.15}}>
            {p.title}
          </div>
          {p.sub ? (
            <div style={{fontFamily: MONO, fontSize: is34 ? 29 : isTall ? 30 : 34, color: '#55585C', marginTop: 18}}>
              {p.sub}
            </div>
          ) : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
}

function LineScene({t, u, p, s, ep, fmt}: SceneCtx) {
  const isTall = isTallFmt(fmt);
  const is34 = fmt === '3:4';
  const L = paperLineLayout(s, t, fmt, ep);
  const sch = paperLineSchedule(s, ep);
  const S = L.cfg.size;
  const cy = L.cfg.centerY;
  const roles: string[] = p.roles ?? ep.roles ?? [];
  const showSwarm = hasLineSwarm(s, ep);
  const focusX = L.focusSeg.x + L.focusSeg.w / 2;

  return (
    <AbsoluteFill>
      {p.kicker ? (
        <div
          style={{
            position: 'absolute',
            left: L.cfg.left,
            top: cy - S * 1.38,
            fontFamily: MONO,
            fontSize: isTall ? 25 : 28,
            fontWeight: 600,
            letterSpacing: 1.5,
            color: '#5A5E66',
            opacity: focusEase(u, 0, 0.3),
          }}
        >
          {p.kicker}
        </div>
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: L.cfg.left,
          top: cy - S * 0.6,
          height: S * 1.2,
          fontFamily: SANS,
          fontSize: S,
          lineHeight: `${S * 1.2}px`,
          fontWeight: 500,
          color: INK,
          whiteSpace: 'nowrap',
          transform: Math.abs(L.scroll) > 1e-4 ? `translate3d(${-L.scroll.toFixed(3)}px, 0, 0)` : undefined,
        }}
      >
        {L.segs.map((segBox, i) => {
          if (t < segBox.start) return null;
          const st = segBox.seg.style;
          const m = paperMorphOf(sch[i], t);
          const shownText = Array.from(segBox.seg.text).slice(0, segBox.shown).join('');
          const active = st && t >= segBox.typed - 0.08 && t < segBox.end + 0.45;
          // 6 种词形变形全部基于内置跨平台可变字体 MiSans VF / Workbench Pixel CN
          const spanStyle: React.CSSProperties =
            st === 'heavy'
              ? {
                  fontVariationSettings: `"wght" ${lerp(500, 750, m)}`,
                  WebkitTextStroke: `${m * 3}px ${INK}`,
                  transform: `scaleX(${1 + 0.2 * m})`,
                  transformOrigin: '0 50%',
                  display: 'inline-block',
                }
              : st === 'light'
                ? {fontVariationSettings: `"wght" ${lerp(500, 160, m)}`}
                : st === 'breathe'
                  ? {letterSpacing: `${m * 0.42}em`}
                  : st === 'lean'
                    ? {
                        display: 'inline-block',
                        fontVariationSettings: `"wght" ${lerp(500, 630, m)}`,
                        transform: `skewX(${-16 * m}deg) translateX(${Math.sin(m * Math.PI) * 22}px)`,
                        filter: m < 1 ? `blur(${Math.sin(m * Math.PI) * 4.2}px)` : undefined,
                      }
                    : {};
          const waveT = Math.min(t, segBox.end);

          return (
            <div key={i} style={{position: 'absolute', left: segBox.x, top: 0, width: segBox.w, height: S * 1.2}}>
              {st === 'voice' ? (
                <div
                  style={{
                    position: 'absolute',
                    left: -6,
                    top: 12,
                    width: (segBox.w + 12) * m,
                    height: S * 1.2 - 24,
                    background: '#8FB4FF',
                    opacity: 0.55,
                  }}
                />
              ) : null}
              {st === 'pixel' && m > 0 ? (
                <div style={{opacity: m > 0.02 ? 1 : 0}}>
                  <PixelWord text={segBox.seg.text} size={S} m={m} />
                </div>
              ) : (
                <span style={spanStyle}>{shownText}</span>
              )}
              {st === 'voice' ? (
                <svg
                  width={Math.max(9, segBox.w)}
                  height={28}
                  style={{position: 'absolute', left: 0, top: S * 1.2 - 4, opacity: m}}
                >
                  {Array.from({length: Math.max(1, Math.floor(segBox.w / 9))}, (_, k) => {
                    const bh = 4 + Math.abs(Math.sin(k * 0.7 + waveT * 7)) * 22;
                    return <rect key={k} x={k * 9} y={(28 - bh) / 2} width={4} height={bh} rx={2} fill={BLUE} />;
                  })}
                </svg>
              ) : null}
              {active ? (
                <div
                  style={{
                    position: 'absolute',
                    left: -12,
                    top: 2,
                    width: segBox.w + 24,
                    height: S * 1.2 - 4,
                    border: `2px solid ${BLUE}`,
                    opacity: smooth((t - segBox.typed + 0.08) / 0.18) * (1 - smooth((t - segBox.end - 0.15) / 0.28)),
                  }}
                />
              ) : null}
              {st && segBox.seg.tag && t >= segBox.typed - 0.12 ? (
                <Tag
                  x={i % 2 ? segBox.w + 16 : -16}
                  y={i % 2 ? S * 1.2 + 8 : -34}
                  flip={!(i % 2)}
                  name={segBox.seg.tag}
                  color={PAPER_LINE.colors[i % PAPER_LINE.colors.length]}
                  o={
                    focusEase(t, segBox.typed - 0.12, segBox.typed + 0.12) *
                    (1 - focusEase(t, segBox.end + 1.3, segBox.end + 1.7) * (segBox === L.focusSeg ? 0 : 1))
                  }
                />
              ) : null}
            </div>
          );
        })}
        {t < L.lineEnd + 0.28 ? (
          <div
            style={{
              position: 'absolute',
              left: L.caret + 8,
              top: S * 0.1,
              width: 6,
              height: S,
              background: INK,
              opacity: t < L.lineEnd && Math.floor(t * 2.4) % 2 === 0 ? 1 : t < L.lineEnd ? 0.85 : 0,
            }}
          />
        ) : null}
        {showSwarm && t >= L.lineEnd
          ? roles.concat(roles).map((name, k) => {
              const at = L.lineEnd + 0.08 + k * 0.065;
              const q = focusEase(t, at, at + 0.36);
              const a = hash(k) * Math.PI * 2;
              const radEnd = isTall
                ? (is34 ? 105 : 115) + hash(k + 40) * (is34 ? 115 : 130)
                : 150 + hash(k + 40) * 165;
              const rad = lerp(isTall ? 640 : 880, radEnd, q);
              return (
                <Tag
                  key={k}
                  x={focusX + Math.cos(a) * rad * (isTall ? 0.86 : 1.22)}
                  y={S * 0.6 + Math.sin(a) * rad * (is34 ? 0.72 : isTall ? 0.75 : 0.62)}
                  name={name}
                  color={PAPER_LINE.colors[k % PAPER_LINE.colors.length]}
                  o={q}
                  flip={Math.cos(a) < 0}
                />
              );
            })
          : null}
      </div>
    </AbsoluteFill>
  );
}

// 12 种跨平台字形变体：全部采用内置 MiSans VF / JetBrains Mono / Workbench Pixel CN
const WALL_VARIANTS: React.CSSProperties[] = [
  {fontFamily: SANS, fontVariationSettings: '"wght" 750', WebkitTextStroke: `5px ${INK}`},
  {fontFamily: SANS, fontVariationSettings: '"wght" 160'},
  {fontFamily: SANS, fontVariationSettings: '"wght" 700', letterSpacing: '-0.04em'},
  {fontFamily: SANS, fontVariationSettings: '"wght" 550', transform: 'skewX(-12deg)'},
  {fontFamily: PIXEL},
  {fontFamily: SANS, fontVariationSettings: '"wght" 700', color: 'transparent', WebkitTextStroke: `3px ${INK}`},
  {fontFamily: SANS, fontVariationSettings: '"wght" 700', background: INK, color: PAPER, padding: '0 16px'},
  {fontFamily: SANS, fontVariationSettings: '"wght" 700', transform: 'scaleX(1.36)'},
  {fontFamily: SANS, fontVariationSettings: '"wght" 650', transform: 'scale(0.68,1.26)'},
  {fontFamily: MONO, letterSpacing: '0.16em', fontWeight: 600},
  {fontFamily: SANS, fontVariationSettings: '"wght" 650', color: BLUE},
  {fontFamily: SANS, fontVariationSettings: '"wght" 700', WebkitTextStroke: `3.5px ${INK}`, transform: 'skewX(11deg)'},
];

function WallScene({u, p, ep, fmt}: SceneCtx) {
  const isTall = isTallFmt(fmt);
  const is34 = fmt === '3:4';
  const cfg = PAPER_LINE[fmt];
  const stg = paperStageLayout(fmt);
  const word: string = p.word ?? p.wallWord;
  const roles: string[] = p.roles ?? ep.roles ?? [];
  const wordLen = Array.from(word).length;
  const fontSize = is34
    ? wordLen >= 5
      ? 74
      : wordLen >= 4
        ? 86
        : 100
    : isTall
      ? wordLen >= 5
        ? 76
        : wordLen >= 4
          ? 88
          : 104
      : wordLen >= 5
        ? 92
        : wordLen >= 4
          ? 106
          : 122;
  const cw = Math.max(is34 ? 276 : isTall ? 290 : 350, Math.round(wordLen * fontSize * 1.18 + 68));
  const chh = is34 ? 168 : isTall ? 185 : 200;
  const cols = isTall ? 7 : 9;
  const rows = isTall ? 9 : 7;
  const centerCol = Math.floor(cols / 2);
  const centerRow = Math.floor(rows / 2);
  const openQ = focusEase(u, 0, 0.85);
  const zoom = lerp(1.78, 1, openQ);

  return (
    <AbsoluteFill style={{opacity: focusEase(u, 0, 0.24)}}>
      <div
        style={{
          position: 'absolute',
          left: cfg.centerX,
          top: cfg.centerY,
          width: 0,
          height: 0,
          transform: openQ < 1 ? `scale(${zoom.toFixed(5)})` : undefined,
        }}
      >
        {Array.from({length: cols * rows}, (_, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const x = (col - (cols - 1) / 2) * cw + (row % 2 ? cw / 2 : 0);
          const y = (row - (rows - 1) / 2) * chh;
          const dist = Math.hypot(x, y);
          const q = focusEase(u, dist * 0.00065, dist * 0.00065 + 0.34);
          const isCenter = col === centerCol && row === centerRow;
          const v = isCenter ? 10 : (i * 5 + row * 3 + col * 2) % WALL_VARIANTS.length;
          const tagScreenX = cfg.centerX + x + cw / 2 - 28;
          const tagScreenY = cfg.centerY + y + chh / 2 - 32;
          const tagInSafeZone =
            tagScreenX - 7 >= stg.safeLeft &&
            tagScreenX + 270 <= stg.safeRight &&
            tagScreenY - 7 >= stg.safeTop &&
            tagScreenY + 46 <= stg.safeBottom;
          const boxed = roles.length > 0 && hash(i + 3) > 0.8 && tagInSafeZone;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x - cw / 2,
                top: y - chh / 2,
                width: cw,
                height: chh,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isCenter ? 1 : q,
                fontSize,
                lineHeight: 1,
                color: INK,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{display: 'inline-block', ...WALL_VARIANTS[v]}}>{word}</span>
              {boxed && q > 0 ? (
                <>
                  <div style={{position: 'absolute', inset: '14px 18px', border: `2px solid ${BLUE}`, opacity: q}} />
                  <Tag
                    x={cw - 28}
                    y={chh - 32}
                    name={roles[i % roles.length]}
                    color={PAPER_LINE.colors[i % PAPER_LINE.colors.length]}
                    o={q}
                  />
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

export function posterLayout(
  lines: string[],
  roles: string[],
  hasKicker: boolean,
  fmt: PaperFormat,
) {
  const isTall = isTallFmt(fmt);
  const is34 = fmt === '3:4';
  const maxChars = Math.max(...lines.map((l) => Array.from(l).length));
  const maxWidth = is34 ? 880 : isTall ? 900 : 1460;
  const rawSize = is34
    ? lines.length >= 4
      ? 116
      : lines.length === 3
        ? 138
        : 156
    : isTall
      ? lines.length >= 4
        ? 128
        : lines.length === 3
          ? 152
          : 168
      : lines.length >= 4
        ? 148
        : lines.length === 3
          ? 188
          : 212;
  const fontSize = Math.min(rawSize, Math.floor(maxWidth / Math.max(1, maxChars * 1.06)));
  const rowGap = Math.round(fontSize * 1.22);
  const blockH = lines.length * rowGap;
  const baseCenterY = is34 ? 580 : isTall ? 810 : 446;
  const startY = Math.max(hasKicker ? 132 : 84, Math.round(baseCenterY - blockH / 2 + (hasKicker ? 22 : 0)));
  const leftX = is34 ? 80 : isTall ? 88 : 210;

  const inlineTags = lines.map((line, i) => {
    const n = Array.from(line).length;
    const rawTagX = Math.round(n * fontSize * (is34 ? 1.0 : 1.04) + 22);
    const flipInline = isTall && leftX + rawTagX > 760;
    const inlineX = isTall ? (flipInline ? 1016 - leftX : rawTagX) : Math.min(1320, rawTagX);
    return {
      x: inlineX,
      y: 24 + i * 16,
      screenX: leftX + inlineX,
      screenY: startY + i * rowGap + 24 + i * 16,
      flip: flipInline,
    };
  });

  const minScatterY = Math.min(920, startY + blockH + 28);
  const scatterTags = roles.slice(0, 4).map((name, k) => {
    const isFlip = k % 2 === 0;
    const rx = is34
      ? isFlip
        ? Math.round(460 + hash(k + 7) * 520)
        : Math.round(120 + hash(k + 7) * 580)
      : isTall
        ? isFlip
          ? Math.round(420 + hash(k + 7) * 460)
          : Math.round(280 + hash(k + 7) * 440)
        : isFlip
          ? Math.round(1260 + hash(k + 7) * 460)
          : Math.round(1180 + hash(k + 7) * 320);
    const ry = is34
      ? Math.round(minScatterY + k * 54 + hash(k + 17) * 28)
      : isTall
        ? Math.round(380 + hash(k + 17) * 820)
        : Math.round(180 + hash(k + 17) * 560);
    return {name, x: rx, y: ry, flip: isFlip};
  });

  return {leftX, startY, fontSize, rowGap, blockH, inlineTags, scatterTags};
}

function PosterScene({u, d, p, ep, fmt}: SceneCtx) {
  const is34 = fmt === '3:4';
  const lines: string[] = p.lines ?? p.poster;
  const roles: string[] = p.roles ?? ep.roles ?? [];
  const L = posterLayout(lines, roles, Boolean(p.kicker), fmt);

  return (
    <AbsoluteFill
      style={{
        opacity: focusEase(u, 0.06, 0.34),
        color: PAPER,
        fontFamily: SANS,
      }}
    >
      {p.kicker ? (
        <div
          style={{
            position: 'absolute',
            left: L.leftX,
            top: L.startY - 56,
            fontFamily: MONO,
            fontSize: 26,
            letterSpacing: 2,
            color: BLUE,
            fontWeight: 600,
          }}
        >
          {p.kicker}
        </div>
      ) : null}
      {lines.map((line, i) => {
        const q = focusEase(u, 0.14 + i * 0.16, 0.48 + i * 0.16);
        const slamWindow = Math.max(0.6, d * 0.52);
        const boldAt = Math.min(d - 0.4, d * 0.26 + (i * slamWindow) / Math.max(1, lines.length));
        const b = focusEase(u, boldAt, boldAt + 0.16);
        const flash = u >= boldAt && u < boldAt + 0.2;
        const tagCfg = L.inlineTags[i];
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: L.leftX,
              top: L.startY + i * L.rowGap,
              height: L.rowGap,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                fontSize: L.fontSize,
                lineHeight: 1.05,
                letterSpacing: `${lerp(0.05, -0.02, b)}em`,
                fontVariationSettings: `"wght" ${lerp(160, 750, b)}`,
                WebkitTextStroke: `${b * 4}px ${flash ? INK : PAPER}`,
                background: flash ? PAPER : 'transparent',
                color: flash ? INK : PAPER,
                clipPath: q < 1 ? `inset(0 ${(1 - q) * 100}% 0 0)` : undefined,
                transform: `scaleX(${lerp(is34 ? 0.94 : 0.92, is34 ? 1.0 : 1.04, b)})`,
                transformOrigin: '0 50%',
                whiteSpace: 'nowrap',
              }}
            >
              {line}
            </span>
            {roles.length > 0 && u > boldAt - 0.22 ? (
              <Tag
                x={tagCfg.x}
                y={tagCfg.y}
                name={roles[(i * 2 + 1) % roles.length]}
                color={PAPER_LINE.colors[(i * 2 + 1) % 8]}
                o={focusEase(u, boldAt - 0.22, boldAt)}
                flip={tagCfg.flip}
              />
            ) : null}
          </div>
        );
      })}
      {L.scatterTags.map((tag, k) => {
        const at = d * 0.62 + k * 0.14;
        const q = focusEase(u, at, at + 0.28);
        return <Tag key={k} x={tag.x} y={tag.y} name={tag.name} color={PAPER_LINE.colors[(k + 3) % 8]} o={q} flip={tag.flip} />;
      })}
    </AbsoluteFill>
  );
}

export function blockBox(fmt: PaperFormat): {S: number; x: number; y: number} {
  if (fmt === '3:4') return {S: 740, x: (1080 - 740) / 2, y: 248};
  if (fmt === 'portrait') return {S: 820, x: (1080 - 820) / 2, y: 430};
  return {S: 720, x: (1920 - 720) / 2, y: 126};
}

export function blockTagAnchors(fmt: PaperFormat): readonly [number, number, boolean][] {
  const {S, x, y} = blockBox(fmt);
  // 竖屏窄画幅将名牌锚在色块上下缘与内侧，确保任意 1–10 字名牌均完整落在安全区内且互不重叠
  if (fmt === '3:4') {
    return [
      [x + S - 24, y - 46, true],
      [x + 24, y + Math.round(S * 0.25), false],
      [x + S - 24, y + Math.round(S * 0.21), true],
      [x + 24, y + Math.round(S * 0.58), false],
      [x + 28, y + S + 20, false],
      [x + S - 28, y + S + 20, true],
    ];
  }
  if (fmt === 'portrait') {
    return [
      [x + S - 28, y - 48, true],
      [x + 24, y + Math.round(S * 0.26), false],
      [x + S - 24, y + Math.round(S * 0.22), true],
      [x + 24, y + Math.round(S * 0.6), false],
      [x + 36, y + S + 18, false],
      [x + S - 36, y + S + 22, true],
    ];
  }
  return [
    [x - 24, y + Math.round(S * 0.18), true],
    [x + S + 16, y + Math.round(S * 0.12), false],
    [x - 36, y + Math.round(S * 0.52), true],
    [x + S + 20, y + Math.round(S * 0.48), false],
    [x + Math.round(S * 0.16), y + S + 14, true],
    [x + Math.round(S * 0.82), y + S + 18, false],
  ];
}

export function paperShotOut(t: number, s: PaperShot, isLast: boolean, nextDark: boolean): number {
  if (isLast) return 0;
  const thisDark = isPaperShotDark(s);
  if (thisDark && !nextDark) return smooth((t - s.end + 0.14) / (TALK_OVERLAP + 0.14));
  if (!thisDark && nextDark) return smooth((t - s.end - 0.04) / (TALK_OVERLAP - 0.04));
  return smooth((t - s.end + 0.06) / (TALK_OVERLAP + 0.06));
}

function BlockScene({u, d, p, ep, fmt}: SceneCtx) {
  const isTall = isTallFmt(fmt);
  const is34 = fmt === '3:4';
  const {S, x, y} = blockBox(fmt);
  const q = focusEase(u, 0, 0.32);
  const rows: string[] = p.rows;
  const roles: string[] = p.roles ?? ep.roles ?? [];
  const tagAnchors = blockTagAnchors(fmt);

  const fitSize = (str: string, cap: number) =>
    Math.min(cap, Math.floor((S - 64) / Math.max(1, Array.from(str).length * 1.06)));

  const r0 = focusEase(u, d * 0.08, d * 0.08 + 0.28);
  const r0b = focusEase(u, d * 0.24, d * 0.24 + 0.18);
  const r1 = focusEase(u, d * 0.36, d * 0.36 + 0.3);
  const r2 = focusEase(u, d * 0.54, d * 0.54 + 0.28);
  const r2Text = focusEase(u, d * 0.6, d * 0.6 + 0.24);

  const rowBox = (idx: number, top: number, h: number, node: React.ReactNode) => (
    <div
      key={idx}
      style={{
        position: 'absolute',
        left: 0,
        top,
        width: S,
        height: h,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {node}
    </div>
  );

  const h0 = Math.round(S * 0.36);
  const h1 = Math.round(S * 0.27);
  const h2 = S - h0 - h1;

  return (
    <AbsoluteFill style={{fontFamily: SANS}}>
      {p.label ? (
        <div style={{position: 'absolute', left: x, top: y - 44, color: PAPER, fontSize: 25, fontFamily: MONO, opacity: q}}>
          {p.label}
        </div>
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: S,
          height: S,
          background: BLUE,
          opacity: q,
          transform: q < 1 ? `scale(${lerp(0.95, 1, q).toFixed(5)})` : undefined,
          backgroundImage:
            'linear-gradient(#3F6FD066 2px,transparent 2px),linear-gradient(90deg,#3F6FD066 2px,transparent 2px)',
          backgroundSize: `${Math.round(S / 5)}px ${Math.round(S / 5)}px`,
          overflow: 'hidden',
        }}
      >
        {rowBox(
          0,
          0,
          h0,
          <span
            style={{
              fontSize: fitSize(rows[0], is34 ? 218 : isTall ? 236 : 216),
              lineHeight: 1,
              color: INK,
              fontVariationSettings: `"wght" ${lerp(160, 750, r0b)}`,
              WebkitTextStroke: `${r0b * 9}px ${INK}`,
              clipPath: r0 < 1 ? `inset(0 ${(1 - r0) * 100}% 0 0)` : undefined,
              whiteSpace: 'nowrap',
            }}
          >
            {rows[0]}
          </span>,
        )}
        {rowBox(
          1,
          h0,
          h1,
          <span
            style={{
              fontSize: fitSize(rows[1], is34 ? 172 : isTall ? 186 : 168),
              lineHeight: 1,
              color: 'transparent',
              WebkitTextStroke: `3px ${INK}`,
              letterSpacing: '0.1em',
              clipPath: r1 < 1 ? `inset(0 ${(1 - r1) * 100}% 0 0)` : undefined,
              whiteSpace: 'nowrap',
            }}
          >
            {rows[1]}
          </span>,
        )}
        {rows[2] ? (
          <>
            <div style={{position: 'absolute', left: 0, top: h0 + h1, width: S * r2, height: h2, background: INK}} />
            {rowBox(
              2,
              h0 + h1,
              h2,
              <span
                style={{
                  fontSize: fitSize(rows[2], is34 ? 224 : isTall ? 244 : 224),
                  lineHeight: 1,
                  color: PAPER,
                  fontVariationSettings: '"wght" 750',
                  WebkitTextStroke: `7px ${PAPER}`,
                  letterSpacing: '0.06em',
                  opacity: r2Text,
                  transform: r2Text < 1 ? `scaleX(${lerp(0.86, 1, r2Text).toFixed(5)})` : undefined,
                  whiteSpace: 'nowrap',
                }}
              >
                {rows[2]}
              </span>,
            )}
          </>
        ) : null}
      </div>
      {roles.slice(0, 6).map((name, k) => {
        const at = d * 0.22 + k * 0.1;
        const [ax, ay, flip] = tagAnchors[k];
        return (
          <Tag
            key={k}
            x={ax}
            y={ay}
            name={name}
            color={PAPER_LINE.colors[k % PAPER_LINE.colors.length]}
            o={focusEase(u, at, at + 0.24)}
            flip={flip}
          />
        );
      })}
    </AbsoluteFill>
  );
}

function OutroScene({t, u, d, p, ep, fmt}: SceneCtx) {
  const isTall = isTallFmt(fmt);
  const is34 = fmt === '3:4';
  const cfg = PAPER_LINE[fmt];
  const brand: string = p.brand ?? ep.brand;
  const tagline: string | undefined = p.tagline ?? ep.tagline;
  const brandChars = Array.from(brand);
  const convergeEnd = Math.min(0.85, d * 0.3);
  const g = focusEase(u, 0.12, 0.12 + convergeEnd);
  const markAt = Math.min(0.95, d * 0.32);
  const mark = focusEase(u, markAt, markAt + 0.28);
  const typeSpan = Math.min(0.9, Math.max(0.4, d * 0.28));
  const typedCount = Math.min(
    brandChars.length,
    Math.floor(brandChars.length * focusEase(u, markAt + 0.18, markAt + 0.18 + typeSpan) * 1.0001),
  );
  const fontSize = isTall
    ? Math.min(is34 ? 88 : 92, Math.floor(700 / Math.max(1, brandChars.length)))
    : Math.min(124, Math.floor(1100 / Math.max(1, brandChars.length)));
  const markSize = Math.round(fontSize * 1.12);

  return (
    <AbsoluteFill style={{opacity: focusEase(u, 0, 0.25), color: INK, fontFamily: SANS}}>
      {SQ.map(([dx, dy, col, r], i) => {
        const a = hash(i + 60) * Math.PI * 2;
        const targetX = cfg.centerX - (brandChars.length * fontSize) / 2 - markSize / 2;
        const x = lerp(cfg.centerX + Math.cos(a) * (is34 ? 340 : isTall ? 380 : 580), targetX + dx * 0.15, g);
        const y = lerp(cfg.centerY + Math.sin(a) * (is34 ? 340 : isTall ? 420 : 340), cfg.centerY + dy * 0.15, g);
        return (
          <Square
            key={i}
            x={x - 36}
            y={y - 36}
            size={lerp(88, 64, g)}
            color={col}
            o={focusEase(u, 0.06 + i * 0.06, 0.3 + i * 0.06) * (1 - mark)}
            r={r * (1 - g)}
          />
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: 60,
          right: 60,
          top: cfg.centerY - markSize * 0.55,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isTall ? 22 : 30,
        }}
      >
        <div
          style={{
            opacity: mark,
            transform: mark < 1 ? `scale(${lerp(0.65, 1, mark).toFixed(5)})` : undefined,
          }}
        >
          <Mark size={markSize} cutout={PAPER} />
        </div>
        <div
          style={{
            fontSize,
            fontWeight: 650,
            letterSpacing: -2,
            minWidth: brandChars.length * fontSize,
            whiteSpace: 'nowrap',
          }}
        >
          {brandChars.slice(0, typedCount).join('')}
          <span
            style={{
              display: 'inline-block',
              width: 6,
              height: Math.round(fontSize * 0.9),
              marginLeft: 8,
              verticalAlign: '-10px',
              background: INK,
              opacity: u > markAt + 0.12 && Math.floor(t * 2.4) % 2 === 0 ? 1 : 0,
            }}
          />
        </div>
      </div>
      {p.line ? (
        <div
          style={{
            position: 'absolute',
            left: 60,
            right: 60,
            top: cfg.centerY + markSize * 0.68,
            textAlign: 'center',
            fontSize: is34 ? 36 : isTall ? 38 : 42,
            fontWeight: 650,
            color: BLUE,
            opacity: focusEase(u, markAt + typeSpan * 0.7, markAt + typeSpan * 0.7 + 0.35),
          }}
        >
          {p.line}
        </div>
      ) : null}
      {tagline ? (
        <div
          style={{
            position: 'absolute',
            left: 60,
            right: 60,
            top: cfg.centerY + markSize * (p.line ? 1.18 : 0.72),
            textAlign: 'center',
            fontFamily: MONO,
            fontSize: is34 ? 28 : isTall ? 30 : 34,
            color: '#55585C',
            opacity: focusEase(u, markAt + typeSpan * 0.9, markAt + typeSpan * 0.9 + 0.35),
          }}
        >
          {tagline}
        </div>
      ) : null}
    </AbsoluteFill>
  );
}

const SCENES: Record<string, React.FC<SceneCtx>> = {
  'paper.intro': IntroScene,
  'paper.line': LineScene,
  'paper.wall': WallScene,
  'paper.poster': PosterScene,
  'paper.block': BlockScene,
  'paper.outro': OutroScene,
};

function Subtitle({
  t,
  ep,
  fmt,
  dark,
}: {
  t: number;
  ep: PaperTalkEpisode;
  fmt: PaperFormat;
  dark: boolean;
}) {
  const c = ep.captions.find((x) => t >= x.start && t < x.end);
  if (!c) return null;
  const isTall = isTallFmt(fmt);
  const is34 = fmt === '3:4';
  const {subtitleTop, subtitleSide, subtitleMaxWidth} = paperStageLayout(fmt);
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
          fontFamily: SANS,
          fontSize: is34 ? (n > 18 ? 36 : 41) : isTall ? (n > 18 ? 38 : 43) : n > 24 ? 40 : 45,
          fontWeight: 600,
          lineHeight: is34 ? 1.35 : 1.38,
          textAlign: 'center',
          padding: is34 ? '9px 24px' : isTall ? '10px 26px' : '8px 30px',
          borderRadius: 16,
          color: dark ? '#F4F4F2' : INK,
          background: dark ? 'rgba(18, 18, 22, 0.88)' : 'rgba(244, 244, 242, 0.93)',
          border: dark ? '1.5px solid rgba(232, 232, 230, 0.28)' : '1.5px solid rgba(21, 21, 21, 0.16)',
          boxShadow: dark ? '0 10px 28px rgba(0,0,0,0.45)' : '0 8px 24px rgba(21,21,21,0.08)',
        }}
      >
        {c.text}
      </div>
    </div>
  );
}

export const paperTalkMetadata: CalculateMetadataFunction<PaperTalkProps> = async ({props}) => {
  const raw: PaperTalkEpisode =
    props.ep ?? (await fetch(staticFile(`episodes/${props.episode}/episode.json`)).then((r) => r.json()));
  const fmt: PaperFormat = props.format ?? raw.format ?? 'landscape';
  const ep: PaperTalkEpisode = {...raw, format: fmt};
  validatePaperTalk(ep);
  const {width, height} = paperFormatDims(fmt);
  return {
    durationInFrames: Math.round(ep.duration * TALK_FPS),
    fps: TALK_FPS,
    width,
    height,
    props: {...props, format: fmt, ep},
  };
};

export const PaperTalk: React.FC<PaperTalkProps> = ({ep, format, audio = true}) => {
  const {fps, width, height} = useVideoConfig();
  const t = useCurrentFrame() / fps;
  if (!ep) return null;
  const fmt: PaperFormat =
    format ??
    ep.format ??
    (height > width ? (Math.abs(width / height - 3 / 4) < 0.03 ? '3:4' : 'portrait') : 'landscape');
  const {width: W, height: H} = paperFormatDims(fmt);

  const dk = paperDarkAt(ep, t);
  const txChars = resolvePaperTexture(ep, t);
  const txAmount = paperTextureAmount(ep, t);
  const allText = JSON.stringify([ep.brand, ep.tagline, ep.texture, ep.roles, ep.captions, ep.shots]) + '·:-*omg0123456789';

  const renderShot = (s: PaperShot, i: number) => {
    if (t < s.start || t >= s.end + TALK_OVERLAP) return null;
    const Scene = SCENES[s.template];
    const isLast = i === ep.shots.length - 1;
    const nextDark = !isLast && isPaperShotDark(ep.shots[i + 1]);
    const thisDark = isPaperShotDark(s);
    const out = paperShotOut(t, s, isLast, nextDark);
    if (out >= 1) return null;
    const blurPx = !isLast && thisDark === nextDark && out > 0 ? out * 10 : 0;
    return (
      <AbsoluteFill
        key={s.id}
        style={{
          opacity: 1 - out,
          filter: blurPx > 0 ? `blur(${blurPx}px)` : undefined,
        }}
      >
        <Scene t={t} u={t - s.start} d={s.end - s.start} p={s.props ?? {}} s={s} ep={ep} fmt={fmt} />
      </AbsoluteFill>
    );
  };

  return (
    <AbsoluteFill style={{background: PAPER, overflow: 'hidden'}}>
      <FontGate text={allText} />
      <PixelFonts text={allText} />
      {audio ? (
        <Sequence from={Math.round((ep.audioOffset ?? 0) * fps)} layout="none">
          <Audio src={staticFile(talkAsset(ep as any, ep.audio))} />
        </Sequence>
      ) : null}
      {audio && ep.music ? (
        <Audio loop src={staticFile(talkAsset(ep as any, ep.music.src))} volume={(f) => musicGainAt(ep as any, f / fps)} />
      ) : null}
      {audio && ep.sfx ? <Audio src={staticFile(talkAsset(ep as any, ep.sfx.src))} volume={ep.sfx.volume ?? 0.5} /> : null}

      {/* 纸面亮色镜头层 */}
      {ep.shots.map((s, i) => (!isPaperShotDark(s) ? renderShot(s, i) : null))}

      {/* 像素暗场擦除层 */}
      {dk.on ? <Wipe pin={dk.pin} pout={dk.pout} fmt={fmt} /> : null}

      {/* ASCII 点阵灰调纹理层 */}
      <Texture t={t} amount={txAmount} dark={dk.isDark} chars={txChars} fmt={fmt} />

      {/* 黑底海报与蓝色色块暗场镜头层 */}
      {ep.shots.map((s, i) => (isPaperShotDark(s) ? renderShot(s, i) : null))}

      {/* 纸张颗粒滤镜 */}
      <svg
        width={W}
        height={H}
        style={{position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'multiply', opacity: dk.isDark ? 0 : 1}}
      >
        <filter id={`paper-talk-grain-${fmt}`}>
          <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves={2} seed={4} />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .1 0" />
        </filter>
        <rect width={W} height={H} filter={`url(#paper-talk-grain-${fmt})`} />
      </svg>

      {/* 自适应高对比度口播字幕 */}
      <Subtitle t={t} ep={ep} fmt={fmt} dark={dk.isDark} />
    </AbsoluteFill>
  );
};
