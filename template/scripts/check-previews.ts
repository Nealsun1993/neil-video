import {browserExecutable} from './browser-path.cjs';
/** 同一配置的双画幅抽帧 + 原有示例回归。只输出静帧，不自动导出影片。 */
import {bundle} from '@remotion/bundler';
import {openBrowser, selectComposition, renderStill} from '@remotion/renderer';
import {mkdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
async function main() {
  mkdirSync('out/previews', {recursive:true});
  const serveUrl=await bundle({entryPoint:resolve('src/index.tsx'),outDir:resolve('out/preview-bundle')});
  const browser=await openBrowser('chrome', {browserExecutable:browserExecutable()});
  const results: any[]=[];
  try {
    for(const [id,episode,times] of [
      ['Episode','demo',[1.2,8.5,14.8,20.6]],
      ['HybridLandscape','hybrid-demo',[1.8,5.6,6.6,12.8,13.8,18.8,24.6,33]],
      ['HybridPortrait','hybrid-demo',[1.8,5.6,6.6,12.8,13.8,18.8,24.6,33]],
    ] as const) {
      const inputProps={episode,audio:false};
      const composition=await selectComposition({serveUrl,id,inputProps,puppeteerInstance:browser});
      if (id==='HybridLandscape' && (composition.width!==1920||composition.height!==1080)) throw Error('错误横屏尺寸');
      if (id!=='HybridLandscape' && (composition.width!==1080||composition.height!==1920)) throw Error('错误竖屏尺寸');
      for(const sec of times) {
        const output=resolve(`out/previews/${id}-${sec.toFixed(1)}.png`);
        await renderStill({serveUrl,composition,inputProps,puppeteerInstance:browser,frame:Math.round(sec*composition.fps),output,imageFormat:'png',logLevel:'error'});
        results.push({id,sec,width:composition.width,height:composition.height,output});
        console.log('STILL',id,sec);
      }
    }
    writeFileSync('out/preview-check.json',JSON.stringify(results,null,2));
  } finally {const stop=setTimeout(()=>{void browser.runner.closeProcess()},5000);try{await browser.close({silent:true});}finally{clearTimeout(stop);browser.disconnect();}}
}
main().catch(e=>{console.error(e);process.exitCode=1});
