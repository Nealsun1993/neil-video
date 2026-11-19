import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {CleanUiWorkflowPortrait} from './templates/CleanUiWorkflowPortrait';
import {CleanUiWorkflow, cleanUiSample} from './templates/CleanUiWorkflow';
import {CleanUiLive,cleanLiveMetadata} from './templates/CleanUiLive';
import {PaperLine,paperLineMetadata} from './templates/PaperLine';
import {CleanUiDemo} from './templates/CleanUiDemo';
import {BlueTalk,blueTalkMetadata} from './templates/BlueTalk';
import {PrismTalk,prismTalkMetadata} from './templates/PrismTalk';
import {PaperTalk,paperTalkMetadata} from './templates/PaperTalk';
import {CleanTalk,cleanTalkMetadata} from './templates/CleanTalk';
import {ExpLab,expLabMetadata} from './templates/ExpLab';
import {Episode, calculateMetadata, EpisodeProps} from './Episode';

// 渲染哪一期：--props='{"episode":"<目录名>"}'
const cleanWorkflowProps={...cleanUiSample,fileName:"voice.m4a",keyword:"口播工作台"};
const Root: React.FC = () => (
  <>
  <Composition id="BlueTalk" component={BlueTalk} width={1920} height={1080} fps={60} durationInFrames={1800} defaultProps={{episode:'blue-talk-demo'}} calculateMetadata={blueTalkMetadata}/>
  <Composition id="BlueTalk3x4" component={BlueTalk} width={1080} height={1440} fps={60} durationInFrames={1800} defaultProps={{episode:'blue-talk-demo',format:'3:4'}} calculateMetadata={blueTalkMetadata}/>
  <Composition id="BlueTalkPortrait" component={BlueTalk} width={1080} height={1920} fps={60} durationInFrames={1800} defaultProps={{episode:'blue-talk-demo',format:'portrait'}} calculateMetadata={blueTalkMetadata}/>
  <Composition id="PrismTalk" component={PrismTalk} width={1920} height={1080} fps={60} durationInFrames={1800} defaultProps={{episode:'prism-talk-demo',format:'landscape'}} calculateMetadata={prismTalkMetadata}/>
  <Composition id="PrismTalk3x4" component={PrismTalk} width={1080} height={1440} fps={60} durationInFrames={1800} defaultProps={{episode:'prism-talk-demo',format:'3:4'}} calculateMetadata={prismTalkMetadata}/>
  <Composition id="PrismTalkPortrait" component={PrismTalk} width={1080} height={1920} fps={60} durationInFrames={1800} defaultProps={{episode:'prism-talk-demo',format:'portrait'}} calculateMetadata={prismTalkMetadata}/>
  <Composition id="PrismTalk5x8" component={PrismTalk} width={1080} height={1728} fps={60} durationInFrames={1800} defaultProps={{episode:'prism-talk-demo',format:'5:8'}} calculateMetadata={prismTalkMetadata}/>
  <Composition id="PaperTalk" component={PaperTalk} width={1920} height={1080} fps={60} durationInFrames={1800} defaultProps={{episode:'paper-talk-demo',format:'landscape'}} calculateMetadata={paperTalkMetadata}/>
  <Composition id="PaperTalk3x4" component={PaperTalk} width={1080} height={1440} fps={60} durationInFrames={1800} defaultProps={{episode:'paper-talk-demo',format:'3:4'}} calculateMetadata={paperTalkMetadata}/>
  <Composition id="PaperTalkPortrait" component={PaperTalk} width={1080} height={1920} fps={60} durationInFrames={1800} defaultProps={{episode:'paper-talk-demo',format:'portrait'}} calculateMetadata={paperTalkMetadata}/>
  <Composition id="CleanTalk" component={CleanTalk} width={1920} height={1080} fps={60} durationInFrames={1800} defaultProps={{episode:'clean-talk-demo',format:'landscape'}} calculateMetadata={cleanTalkMetadata}/>
  <Composition id="CleanTalk3x4" component={CleanTalk} width={1080} height={1440} fps={60} durationInFrames={1800} defaultProps={{episode:'clean-talk-demo',format:'3:4'}} calculateMetadata={cleanTalkMetadata}/>
  <Composition id="CleanTalkPortrait" component={CleanTalk} width={1080} height={1920} fps={60} durationInFrames={1800} defaultProps={{episode:'clean-talk-demo',format:'portrait'}} calculateMetadata={cleanTalkMetadata}/>
  <Composition id="CleanTalk5x8" component={CleanTalk} width={1080} height={1728} fps={60} durationInFrames={1800} defaultProps={{episode:'clean-talk-demo',format:'5:8'}} calculateMetadata={cleanTalkMetadata}/>
  <Composition id="ExpLab" component={ExpLab} width={1920} height={1080} fps={60} durationInFrames={1800} defaultProps={{episode:'exp-adu-mix',format:'landscape'}} calculateMetadata={expLabMetadata}/>
  <Composition id="ExpLab3x4" component={ExpLab} width={1080} height={1440} fps={60} durationInFrames={1800} defaultProps={{episode:'exp-adu-mix',format:'3:4'}} calculateMetadata={expLabMetadata}/>
  <Composition id="CleanUiWorkflowPortrait" component={CleanUiWorkflowPortrait} width={1080} height={1920} fps={60} durationInFrames={3600} defaultProps={cleanWorkflowProps}/>
  <Composition id="PaperLine" component={PaperLine} width={1920} height={1080} fps={60} durationInFrames={1980} defaultProps={{}} calculateMetadata={paperLineMetadata}/>
  <Composition id="CleanUiLive" component={CleanUiLive} width={1920} height={1080} fps={60} durationInFrames={3600} defaultProps={{}} calculateMetadata={cleanLiveMetadata}/>
  <Composition id="CleanUiWorkflow" component={CleanUiWorkflow} width={1920} height={1080} fps={60} durationInFrames={3600} defaultProps={cleanWorkflowProps}/>
  <Composition id="CleanUiDemo" component={CleanUiDemo} width={1920} height={1080} fps={60} durationInFrames={780} defaultProps={cleanUiSample}/>
  <Composition<any, EpisodeProps>
    id="Episode"
    component={Episode}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={300}
    defaultProps={{episode: "demo", audio: true}}
    calculateMetadata={calculateMetadata}
  />
  <Composition<any, EpisodeProps>
    id="HybridLandscape" component={Episode} width={1920} height={1080} fps={30} durationInFrames={1035}
    defaultProps={{episode: 'hybrid-demo', format: 'landscape', audio: true}} calculateMetadata={calculateMetadata}
  />
  <Composition<any, EpisodeProps>
    id="Hybrid3x4" component={Episode} width={1080} height={1440} fps={30} durationInFrames={1035}
    defaultProps={{episode: 'hybrid-demo', format: '3:4', audio: true}} calculateMetadata={calculateMetadata}
  />
  <Composition<any, EpisodeProps>
    id="HybridPortrait" component={Episode} width={1080} height={1920} fps={30} durationInFrames={1035}
    defaultProps={{episode: 'hybrid-demo', format: 'portrait', audio: true}} calculateMetadata={calculateMetadata}
  />
  <Composition<any, EpisodeProps> id="StoryLandscape" component={Episode} width={1920} height={1080} fps={30} durationInFrames={405} defaultProps={{episode:'story-demo',format:'landscape',audio:true}} calculateMetadata={calculateMetadata}/>
  <Composition<any, EpisodeProps> id="Story3x4" component={Episode} width={1080} height={1440} fps={30} durationInFrames={405} defaultProps={{episode:'story-demo',format:'3:4',audio:true}} calculateMetadata={calculateMetadata}/>
  <Composition<any, EpisodeProps> id="StoryPortrait" component={Episode} width={1080} height={1920} fps={30} durationInFrames={405} defaultProps={{episode:'story-demo',format:'portrait',audio:true}} calculateMetadata={calculateMetadata}/>
  </>
);
registerRoot(Root);
