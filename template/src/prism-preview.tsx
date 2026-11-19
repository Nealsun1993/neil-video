import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {PrismPromo} from './templates/PrismPromo';
import {PrismChat,prismChatMetadata} from './templates/PrismChat';

const defaultProps={brand:'口播工作台',prompt:'把这段口播整理成视频，校对字幕，配上画面。',project:'口播样稿',action:'开始整理',closing:'从一段口播开始'};

function Root(){
 return <>
  <Composition id="PrismChat" component={PrismChat} width={1920} height={1080} fps={60} durationInFrames={1800} defaultProps={{}} calculateMetadata={prismChatMetadata}/>
  <Composition id="PrismPromo" component={PrismPromo} width={1920} height={1080} fps={30} durationInFrames={990} defaultProps={defaultProps}/>
  <Composition id="PrismPromoPortrait" component={PrismPromo} width={1080} height={1920} fps={30} durationInFrames={990} defaultProps={defaultProps}/>
 </>;
}
registerRoot(Root);
