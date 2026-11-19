import React,{useEffect,useState}from'react';
import {continueRender,delayRender,staticFile,cancelRender}from'remotion';
export const PixelFonts:React.FC<{text:string}>=({text})=>{
 const [handle]=useState(()=>delayRender('pixel fonts'));
 useEffect(()=>{
  if(!document.getElementById('workbench-pixel-fonts')){
   const style=document.createElement('style');style.id='workbench-pixel-fonts';
   style.textContent=`@font-face{font-family:"Workbench Pixel CN";font-weight:400;src:url("${staticFile('pixel-fonts/FusionPixel-12-zh_hans.woff2')}")}@font-face{font-family:"Workbench Pixel Mono";font-weight:400;src:url("${staticFile('pixel-fonts/DepartureMono-Regular.woff2')}")}`;
   document.head.appendChild(style);
  }
  Promise.all([document.fonts.load('48px "Workbench Pixel CN"',text),document.fonts.load('24px "Workbench Pixel Mono"','WORKBENCH 0123456789')]).then(()=>document.fonts.ready).then(()=>continueRender(handle)).catch(cancelRender);
 },[handle,text]);
 return null;
};
