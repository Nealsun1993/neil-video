const {existsSync}=require('node:fs');
function browserExecutable(){
 if(process.env.CHROME_EXE){if(!existsSync(process.env.CHROME_EXE))throw Error('CHROME_EXE 指向的浏览器不存在');return process.env.CHROME_EXE;}
 return ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/Applications/Chromium.app/Contents/MacOS/Chromium','/usr/bin/google-chrome','/usr/bin/chromium',`${process.env.PROGRAMFILES||'C:/Program Files'}/Google/Chrome/Application/chrome.exe`,`${process.env.LOCALAPPDATA||''}/Google/Chrome/Application/chrome.exe`].find(existsSync);
}
module.exports={browserExecutable};
