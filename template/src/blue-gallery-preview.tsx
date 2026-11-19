import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {BlueGalleryPromo} from './templates/BlueGalleryPromo';
import {BlueGalleryLive,blueLiveMetadata} from './templates/BlueGalleryLive';

function Root(){
 return <><Composition id="BlueGalleryLive" component={BlueGalleryLive} width={1920} height={1080} fps={60} durationInFrames={1860}
  defaultProps={{}} calculateMetadata={blueLiveMetadata}/>
 <Composition id="BlueGalleryPromo" component={BlueGalleryPromo} width={1920} height={1080} fps={60} durationInFrames={1860}
  defaultProps={{brand:'口播工作台',prompt:'把口播封面换成浅蓝色，再加一个简洁的章节标题。'}}/></>;
}
registerRoot(Root);
