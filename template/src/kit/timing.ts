import {validatePixelProps} from './pixelDesign';
import {validateStoryFlowProps} from './storyFlow';
import type {Episode, Shot} from './types';
import {showcaseItemRect, stageSourceRect, type Format} from './layout';
export type Rhythm = {mode: 'voice' | 'beat'; bpm?: number; offset?: number};
export type TimeAnchor = number | {beat: number} | {word: number; offset?: number};
const TIMES = new Set(['revealAt', 'ctaAt', 'at', 'out', 'flipAt', 'emphAt', 'typeAt', 'sendAt', 'badAt', 'goodAt', 'shakeAt', 'saveAt', 'splitAt', 'subAt', 'pushAt', 'focusAt', 'coverAt', 'readAt', 'readEnd', 'popAt', 'liftAt', 'pickAt', 'allAt', 'boxAt', 'envAt', 'flyAt', 'openAt', 'hlAt', 'titleAt', 'iconAt', 'clickAt']);
const TIME_ARRAYS = new Set(['pages', 'slots', 'fills']);
export const rhythmOf = (ep: Episode, shot: Shot): Rhythm => ({mode: 'voice', ...ep.rhythm, ...shot.rhythm});
export function resolveTime(anchor: TimeAnchor, ep: Episode, shot: Shot): number {
  if (typeof anchor === 'number' && Number.isFinite(anchor)) return anchor;
  const r = rhythmOf(ep, shot);
  if (anchor && typeof anchor === 'object' && 'beat' in anchor) {
    const bpm = r.bpm ?? 120;
    if (!Number.isFinite(r.offset ?? 0) || r.mode !== 'beat' || !Number.isFinite(bpm) || bpm <= 0 || !Number.isFinite(anchor.beat)) throw Error(`[${shot.id}] beat 时间需要 beat 模式与正数 BPM`);
    return shot.start + (r.offset ?? 0) + anchor.beat * 60 / bpm;
  }
  if (anchor && typeof anchor === 'object' && 'word' in anchor) {
    const word = ep._words?.[anchor.word];
    if (r.mode !== 'voice' || !Number.isInteger(anchor.word) || !word || !Number.isFinite(word[1]) || !Number.isFinite(anchor.offset ?? 0)) throw Error(`[${shot.id}] word 时间需要 voice 模式和有效 _words 索引`);
    return (ep.audioOffset ?? 0) + word[1] + (anchor.offset ?? 0);
  }
  throw Error(`[${shot.id}] 无效时间锚点 ${JSON.stringify(anchor)}`);
}
function resolveProps(value: any, ep: Episode, shot: Shot, key = ''): any {
  if (TIMES.has(key)) return resolveTime(value, ep, shot);
  if (Array.isArray(value)) return value.map(v => TIME_ARRAYS.has(key) ? resolveTime(v, ep, shot) : resolveProps(v, ep, shot));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolveProps(v, ep, shot, k)]));
  return value;
}
const WIDE = new Set(['scene', 'showcase', 'app.modules', 'app.browser', 'story.flow', 'pixel.story']);
/** 仅在入口解析一次；Page、acts、focus、anchors 共用同一份绝对时间与几何。 */
export function prepareEpisode(input: Episode, override?: Format): Episode {
  const format = override ?? input.format ?? 'portrait';
  if (format !== 'portrait' && format !== 'landscape' && format !== '3:4') throw Error(`未知画幅: ${format}`);
  if (!Array.isArray(input.shots) || !input.shots.length || !Number.isFinite(input.duration) || input.duration <= 0) throw Error('一期视频需要正数 duration 和至少一个镜头');
  if (!Number.isFinite(input.audioOffset ?? 0) || (input.audioOffset ?? 0) < 0) throw Error('audioOffset 需要非负秒数');
  const ep = {...input, format};
  const shots = input.shots.map((s, index) => {
    if (!Number.isFinite(s.start) || !Number.isFinite(s.end) || s.start < 0 || s.end <= s.start || s.end > input.duration + 0.01) throw Error(`[${s.id}] 镜头起止时间出界`);
    const rhythm = rhythmOf(ep, s);
    if (!['voice', 'beat'].includes(rhythm.mode) || (rhythm.mode === 'beat' && (!Number.isFinite(rhythm.bpm ?? 120) || (rhythm.bpm ?? 120) <= 0))) throw Error(`[${s.id}] 无效节奏模式或 BPM`);
    if (!Number.isFinite(rhythm.offset ?? 0)) throw Error(`[${s.id}] 节拍偏移必须为有限秒数`);
    if (s.template === 'showcase' && (typeof s.props.title !== 'string' || !s.props.title.trim() || (s.props.items?.length ?? 0) > 3)) throw Error(`[${s.id}] showcase 需要标题，最多三个展示项`);
    if (s.template === 'showcase' && ((!['hero', 'chapter', 'result'].includes(s.props.variant ?? 'hero')) || (s.props.variant === 'chapter' && s.props.items?.length))) throw Error(`[${s.id}] showcase variant 无效，chapter 请只放居中标题`);
    if (format === 'landscape' && s.template === 'app.modules' && (s.props.items?.length ?? 0) > 6) throw Error(`[${s.id}] 横屏模块清单最多六项`);
    if (format === 'landscape' && !WIDE.has(s.template)) throw Error(`[${s.id}] ${s.template} 暂未提供原生横屏布局，请用 scene / showcase / app.modules / app.browser`);
    if (format === 'landscape' && s.template === 'scene' && (s.props.pieces ?? []).some((d: any) => !['text', 'toggles'].includes(d.kind))) throw Error(`[${s.id}] 横屏 scene 当前支持 text / toggles；其他碎片继续使用竖屏`);
    if(ep.presentation==='pixel' && s.template!=='pixel.story')throw Error('pixel 版式当前仅支持 pixel.story');
    const props = resolveProps(s.props, ep, s);
    if(['story.flow','pixel.story'].includes(s.template)) validateStoryFlowProps(props,s.start,s.end);
    if(s.template==='pixel.story'){if(ep.presentation!=='pixel')throw Error('pixel.story 需要 presentation=pixel');validatePixelProps(props);}
    if (props.launch?.from && typeof props.launch.from === 'object' && 'showcaseItem' in props.launch.from) {
      const item = props.launch.from.showcaseItem, prev = input.shots[index-1];
      if (!Number.isInteger(item) || item < 0 || prev?.template !== 'showcase' || item >= (prev.props.items?.length ?? 0)) throw Error(`[${s.id}] launch.showcaseItem 必须引用上一镜实际存在的展示卡片`);
      let r = showcaseItemRect(format, item, ep.presentation === 'showcase');
      if(format !== 'landscape' && ep.presentation === 'showcase') r = stageSourceRect(r, format);
      props.launch.from = [r.x, r.y, r.w, r.h];
    }
    return {...s, props: {...props, __format: format}};
  });
  return {...ep, shots};
}
