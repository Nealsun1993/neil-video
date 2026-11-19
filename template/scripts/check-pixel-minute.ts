import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderStill} from '@remotion/renderer';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {browserExecutable} from './browser-path.cjs';
async function main(){
 mkdirSync('out/pixel-minute-previews',{recursive:true});
 const serveUrl=await bundle({entryPoint:resolve('src/archived-styles.tsx'),outDir:resolve('out/pixel-minute-bundle')});
 const browser=await openBrowser('chrome',{browserExecutable:browserExecutable()}),results=[];
 try{for(const id of ['PixelMinute']){
  const inputProps={},composition=await selectComposition({serveUrl,id,inputProps,puppeteerInstance:browser});
  for(const sec of [2.5,6.8,10.5,14.5,21.8,27.8,32,36.7,41.6,47.5,52,57.5]){
   const output=resolve(`out/pixel-minute-previews/${id}-${sec}.png`);
   await renderStill({serveUrl,composition,inputProps,puppeteerInstance:browser,frame:Math.round(sec*30),output,imageFormat:'png',logLevel:'error'});
   results.push({id,sec,output});console.log('STILL',id,sec);
  }
 }writeFileSync('out/pixel-minute-check.json',JSON.stringify(results,null,2));}finally{const stop=setTimeout(()=>{void browser.runner.closeProcess()},5000);try{await browser.close({silent:true});}finally{clearTimeout(stop);browser.disconnect();}}
}
main().catch(e=>{console.error(e);process.exitCode=1});
