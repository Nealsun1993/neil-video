import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {OgTemplatePortrait} from './templates/OgTemplatePortrait';
import {OgMix} from './templates/OgMix';
import {OgCollage,ogMetadata} from './templates/OgCollage';
import {HalftoneAsciiPortrait} from './templates/HalftoneAsciiPortrait';
import {HalftoneLaunch,halftoneMetadata} from './templates/HalftoneLaunch';
import {PaperStoryWide,paperWideMetadata} from './templates/PaperStoryWide';
import {PaperStory,paperMetadata} from './templates/PaperStory';
import {PixelWorldPortrait,pixelWorldPortraitMetadata} from './templates/PixelWorldPortrait';
import {PixelWorld,pixelWorldMetadata} from './templates/PixelWorld';
import {PixelPromo,pixelPromoMetadata} from './templates/PixelPromo';
import {Episode, calculateMetadata, EpisodeProps} from './Episode';

const ArchivedStyles: React.FC = () => (
  <>
  <Composition id="OgTemplatePortrait" component={OgTemplatePortrait} width={1080} height={1920} fps={30} durationInFrames={720} defaultProps={{episode:'og-template'}} calculateMetadata={async(args)=>({...await ogMetadata(args),width:1080,height:1920})}/>
  <Composition id="OgTemplateLaunch" component={OgMix} width={1920} height={1080} fps={30} durationInFrames={720} defaultProps={{episode:'og-template'}} calculateMetadata={ogMetadata}/>
  <Composition id="OgMixLaunch" component={OgMix} width={1920} height={1080} fps={30} durationInFrames={720} defaultProps={{}} calculateMetadata={ogMetadata}/>
  <Composition id="OgCollageLaunch" component={OgCollage} width={1920} height={1080} fps={30} durationInFrames={720} defaultProps={{}} calculateMetadata={ogMetadata}/>
  <Composition id="HalftoneAsciiPortrait" component={HalftoneAsciiPortrait} width={1080} height={1920} fps={30} durationInFrames={720} defaultProps={{}} calculateMetadata={async(args)=>({...await halftoneMetadata(args),width:1080,height:1920})}/>
  <Composition id="HalftoneAsciiFusion" component={HalftoneLaunch} width={1920} height={1080} fps={30} durationInFrames={720} defaultProps={{dynamicField:true,asciiFusion:true}} calculateMetadata={halftoneMetadata}/>
  <Composition id="HalftoneLaunchDynamic" component={HalftoneLaunch} width={1920} height={1080} fps={30} durationInFrames={720} defaultProps={{dynamicField:true}} calculateMetadata={halftoneMetadata}/>
  <Composition id="HalftoneCanvasDynamic" component={HalftoneLaunch} width={1920} height={1080} fps={30} durationInFrames={900} defaultProps={{dynamicField:true,canvasOnly:true,audio:false}} calculateMetadata={async(args)=>({...await halftoneMetadata(args),durationInFrames:900})}/>
  <Composition id="HalftoneLaunch" component={HalftoneLaunch} width={1920} height={1080} fps={30} durationInFrames={720} defaultProps={{}} calculateMetadata={halftoneMetadata}/>
  <Composition id="HalftoneCanvasStudy" component={HalftoneLaunch} width={1920} height={1080} fps={30} durationInFrames={900} defaultProps={{canvasOnly:true,audio:false}} calculateMetadata={async(args)=>({...await halftoneMetadata(args),durationInFrames:900})}/>
  <Composition id="PaperStoryLandscape" component={PaperStoryWide} width={1920} height={1080} fps={30} durationInFrames={1350} defaultProps={{}} calculateMetadata={paperWideMetadata}/>
  <Composition id="PaperStoryPortrait" component={PaperStory} width={1080} height={1920} fps={30} durationInFrames={1350} defaultProps={{}} calculateMetadata={paperMetadata}/>
  <Composition id="PixelWorldPortrait" component={PixelWorldPortrait} width={1080} height={1920} fps={30} durationInFrames={1800} defaultProps={{}} calculateMetadata={pixelWorldPortraitMetadata}/>
  <Composition id="PixelWorldMinute" component={PixelWorld} width={1920} height={1080} fps={30} durationInFrames={1800} defaultProps={{}} calculateMetadata={pixelWorldMetadata}/>
  <Composition id="PixelMinute" component={PixelPromo} width={1920} height={1080} fps={30} durationInFrames={1800} defaultProps={{}} calculateMetadata={pixelPromoMetadata}/>
  <Composition<any, EpisodeProps> id="PixelLandscape" component={Episode} width={1920} height={1080} fps={30} durationInFrames={405} defaultProps={{episode:'pixel-demo',format:'landscape',audio:true}} calculateMetadata={calculateMetadata}/>
  <Composition<any, EpisodeProps> id="PixelPortrait" component={Episode} width={1080} height={1920} fps={30} durationInFrames={405} defaultProps={{episode:'pixel-demo',format:'portrait',audio:true}} calculateMetadata={calculateMetadata}/>
  </>
);
registerRoot(ArchivedStyles);
