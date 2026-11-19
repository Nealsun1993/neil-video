import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderStill} from '@remotion/renderer';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {browserExecutable} from './browser-path.cjs';
async function main(){
 mkdirSync('out/paper-previews',{recursive:true});
 const serveUrl=await bundle({entryPoint:resolve('src/archived-styles.tsx'),outDir:resolve('out/paper-bundle')});
 const browser=await openBrowser('chrome',{browserExecutable:browserExecutable()}),results=[];
 try{for(const id of ['PaperStoryPortrait']){
  const inputProps={},composition=await selectComposition({serveUrl,id,inputProps,puppeteerInstance:browser});
  for(const sec of [2.5,7,11.5,16.5,21.5,26.5,31.5,36.5,42]){
   const output=resolve(`out/paper-previews/${id}-${sec}.png`);
   await renderStill({serveUrl,composition,inputProps,puppeteerInstance:browser,frame:Math.round(sec*30),output,imageFormat:'png',logLevel:'error'});
   results.push({id,sec,output});console.log('STILL',id,sec);
  }
 }writeFileSync('out/paper-check.json',JSON.stringify(results,null,2));}finally{const stop=setTimeout(()=>{void browser.runner.closeProcess()},5000);try{await browser.close({silent:true});}finally{clearTimeout(stop);browser.disconnect();}}
}
main().catch(e=>{console.error(e);process.exitCode=1});
