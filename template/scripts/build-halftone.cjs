const fs=require('node:fs'),path=require('node:path');
const out=path.resolve(__dirname,'../public/halftone');fs.mkdirSync(out,{recursive:true});
const circles=[];
for(let y=0;y<=2048;y+=22)for(let x=0;x<=6144;x+=22){
 const a=.5+.5*Math.sin(x*.010+y*.006+3*Math.sin(y*.0025)),b=.5+.5*Math.cos(x*.004-y*.013);
 const r=1.4+4.5*a*a;
 circles.push(`<circle cx="${x}" cy="${y}" r="${r.toFixed(2)}" fill="#4FC6A4" opacity="${(.18+.38*b).toFixed(2)}"/>`);
}
for(let y=17;y<=2048;y+=34)for(let x=17;x<=6144;x+=34){const a=.5+.5*Math.sin(x*.006-y*.009+2*Math.cos(x*.002));circles.push(`<circle cx="${x}" cy="${y}" r="${(1.1+2.9*a*a).toFixed(2)}" fill="#39AAC1" opacity="${(.12+.32*a).toFixed(2)}"/>`);}
fs.writeFileSync(path.join(out,'field.svg'),`<svg xmlns="http://www.w3.org/2000/svg" width="6144" height="2048" viewBox="0 0 6144 2048">${circles.join('')}</svg>`);
const {execFileSync}=require('node:child_process');
const project=path.resolve(__dirname,'../..');
const proof={portrait:'成片/一个想法长成片子-剪纸风-竖屏.mp4',landscape:'成片/一个想法长成片子-剪纸风-横屏.mp4'};
for(const [format,src] of Object.entries(proof)){
 const dest=path.join(out,`proof-${format}.jpg`);
 // Bundled proof frames are ready to use; opt in to extracting them again.
 if(!fs.existsSync(dest)||process.argv.includes('--refresh-proof')){
  execFileSync('ffmpeg',['-v','error','-y','-ss','21.5','-i',path.join(project,src),'-frames:v','1','-q:v','2',dest]);
 }
}
fs.writeFileSync(path.join(out,'sources.json'),JSON.stringify({field:'Original deterministic SVG, two pitches 22px / 34px',proof,proofTimeSeconds:21.5,control:'template/src/index.tsx: PaperStoryPortrait / PaperStoryLandscape'},null,2)+'\n');
console.log('Prepared continuous raster and real project proof frames.');
