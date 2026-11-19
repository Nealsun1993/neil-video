import {browserExecutable} from './browser-path.cjs';
import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderStill} from '@remotion/renderer';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
async function main(){
 mkdirSync('out/story-previews',{recursive:true});
 const serveUrl=await bundle({entryPoint:resolve('src/index.tsx'),outDir:resolve('out/story-bundle')});
 const browser=await openBrowser('chrome',{browserExecutable:browserExecutable()}),results=[];
 try{for(const id of ['StoryLandscape','StoryPortrait']){
  const inputProps={episode:'story-demo',audio:false},composition=await selectComposition({serveUrl,id,inputProps,puppeteerInstance:browser});
  for(const sec of process.argv.includes('--smoke')?[3.4,9.533333333333333]:[1.2,2.9,3.6,6.8,9.4,9.8,10.3,11.5,12.8]){
   const output=resolve(`out/story-previews/${id}-${sec}.png`);
   await renderStill({serveUrl,composition,inputProps,puppeteerInstance:browser,frame:Math.round(sec*30),output,imageFormat:'png',logLevel:'error'});
   results.push({id,sec,output});console.log('STILL',id,sec);
  }
 }writeFileSync('out/story-check.json',JSON.stringify(results,null,2));}finally{const stop=setTimeout(()=>{void browser.runner.closeProcess()},5000);try{await browser.close({silent:true});}finally{clearTimeout(stop);browser.disconnect();}}
}
main().catch(e=>{console.error(e);process.exitCode=1});
