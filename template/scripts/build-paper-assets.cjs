#!/usr/bin/env node
// Local adaptation of the user's installed Skillry paper prop library.
// Assets retain their source terms; they are not relicensed as project MIT code.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),os=require('node:os');
const skill=process.argv[2]||path.join(os.homedir(),'.agents/skills/bs-paper-cutout-story-video');
const root=path.resolve(__dirname,'..'),out=path.join(root,'public/paper-cutout');fs.mkdirSync(out,{recursive:true});
const context={window:{}};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(skill,'references/engine/props.js'),'utf8'),context);
const engine=fs.readFileSync(path.join(skill,'references/engine/papercut.js'),'utf8');
const filterCode=engine.slice(engine.indexOf('  function clayFilter('),engine.indexOf('  function clayWrap('));
vm.runInContext('let FID=0;const META={};const CLAY={wobble:3.4,relief:1,tex:.26};'+filterCode,context);
const picks={bulb:{},book:{},person:{color:'#F08A74',pose:'wave',scarf:'#EDB33F'},tree:{fruit:true},pine:{},flower:{color:'#F2A7B5'},sprout:{},grass:{},camera:{},note:{color:'#2E8C7C'},heart:{color:'#E25B4B'},envelope:{},butterfly:{color:'#EDB33F'},sunflower:{},bush:{},kite:{color:'#B9A6E0'}};
const manifest={source:'bs-paper-cutout-story-video',version:'1.0.0',props:{}};
for(const [name,opts]of Object.entries(picks)){
 const a=context.window.PAPER_PROP(name,opts);const f=vm.runInContext('clayFilter(1.4,{})',context),pad=35;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${a.w+pad*2}" height="${a.h+pad*2}" viewBox="${-pad} ${-pad} ${a.w+pad*2} ${a.h+pad*2}"><defs>${f.defs}<filter id="lift" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="2" stdDeviation="1.4" flood-color="#373521" flood-opacity=".18"/><feDropShadow dx="0" dy="7" stdDeviation="6" flood-color="#373521" flood-opacity=".12"/></filter></defs><g filter="url(#lift)"><g filter="url(#${f.id})">${a.svg}</g></g></svg>`;
 fs.writeFileSync(path.join(out,name+'.svg'),svg);manifest.props[name]={w:a.w,h:a.h,pad,src:'paper-cutout/'+name+'.svg'};
}
for(const file of ['Nunito-latin.woff2','Caveat-latin.woff2','OFL.txt'])fs.copyFileSync(path.join(skill,'references/engine/fonts',file),path.join(out,file));
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(out,'SOURCE.txt'),'Paper props and clay surface generated from the locally installed Skillry bs-paper-cutout-story-video v1.0.0. Original source terms apply. Fonts: Nunito and Caveat, SIL OFL; see OFL.txt. Private local adaptation, not a grant of MIT rights to Skillry assets.\n');
console.log('Prepared '+Object.keys(picks).length+' paper props in '+out);
