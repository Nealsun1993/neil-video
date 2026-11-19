import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderStill} from '@remotion/renderer';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {browserExecutable} from './browser-path.cjs';
async function main(){
 mkdirSync('out/og-mix-previews',{recursive:true});
 const serveUrl=await bundle({entryPoint:resolve('src/archived-styles.tsx'),outDir:resolve('out/og-mix-bundle')});
 const browser=await openBrowser('chrome',{browserExecutable:browserExecutable()}),results=[];
 try{for(const id of ['OgMixLaunch']){
  const inputProps={},composition=await selectComposition({serveUrl,id,inputProps,puppeteerInstance:browser});
  for(const sec of [1.3,3.5,4.2,6.5,8.5,10,12.2,14.5,16.4,18.5,20.5,22.5]){
   const output=resolve(`out/og-mix-previews/${id}-${sec}.png`);
   await renderStill({serveUrl,composition,inputProps,puppeteerInstance:browser,frame:Math.round(sec*30),output,imageFormat:'png',logLevel:'error'});
   results.push({id,sec,output});console.log('STILL',id,sec);
  }
 }writeFileSync('out/og-mix-check.json',JSON.stringify(results,null,2));}finally{const stop=setTimeout(()=>{void browser.runner.closeProcess()},5000);try{await browser.close({silent:true});}finally{clearTimeout(stop);browser.disconnect();}}
}
main().catch(e=>{console.error(e);process.exitCode=1});
