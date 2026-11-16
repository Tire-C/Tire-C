import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createServer} from 'node:http';
import {chromium} from 'playwright';
import {execFileSync} from 'node:child_process';
const reference='https://raw.githubusercontent.com/Tire-C/Tire-C/cb4e9728be6a690199a924a7b20a6533bf3249ee/odyssey/review/odyssey.html';
const original='https://github.com/Tire-C/Tire-C/raw/cb4e9728be6a690199a924a7b20a6533bf3249ee/odyssey/review/odyssey.html';
await mkdir('preview/evidence',{recursive:true});
const report={sourceCommit:process.env.GITHUB_SHA,runId:process.env.GITHUB_RUN_ID,environment:'GitHub Actions ubuntu-24.04 public standard runner',rendering:'Remote CPU / Chromium ANGLE SwiftShader. No hardware GPU validation.',scope:'Anonymous public downloads and CodePen-style iframe wrapper. Not a saved or authenticated CodePen session.',downloads:[],checks:[],failures:[]};
function check(name,condition){report.checks.push({name,pass:!!condition});if(!condition)report.failures.push(name)}
for(const url of [original,reference]){
 try{
  const response=await fetch(url),html=await response.text();
  report.downloads.push({requested:url,final:response.url,status:response.status,contentType:response.headers.get('content-type'),cors:response.headers.get('access-control-allow-origin'),bytes:Buffer.byteLength(html),standalone:html.includes('<script>')&&!html.includes('src="./src/main.js"')});
 }catch(e){report.downloads.push({requested:url,error:e.message})}
}
check('Canonical public URL returns the complete standalone HTML',report.downloads[1].status===200&&report.downloads[1].standalone);
check('Original profile README blob preserved',execFileSync('git',['hash-object','../README.md']).toString().trim()==='1d0114fe01e78f186042fc760e37b66d6cf9c090');
const snippet=await readFile('preview/codepen.html','utf8');
const harness='<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#000}</style></head><body>'+snippet+'</body></html>';
const server=createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end(harness)}).listen(0,'127.0.0.1');
await new Promise(resolve=>server.once('listening',resolve));
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:'reduce'});
const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('raw.githubusercontent.com'))requests.push({url:r.url(),status:r.status()})});
try{
 await page.goto('http://127.0.0.1:'+server.address().port);
 await page.waitForFunction(()=>document.querySelector('#odyssey')?.contentWindow?.odyssey?.ready,{},{timeout:60000});
 const frame=page.frames().find(f=>f.parentFrame());
 assert(frame,'The preview frame must exist');
 const info=await frame.evaluate(()=>odyssey.info());report.info=info;
 check('Revision 5 loads through cross-origin fetch and iframe srcdoc',info.revision===5);
 check('The running preview has a 14-second timeline',await frame.evaluate(()=>odyssey.duration===14));
 check('Actual WebGL software renderer is identified',/SwiftShader/i.test(info.renderer));
 check('No runtime JavaScript errors',errors.length===0);
 check('Public raw download succeeds from the browser',requests.some(r=>r.status===200));
 await frame.addStyleTag({content:'#ui{visibility:hidden}'});
 await frame.evaluate(()=>odyssey.seek(odyssey.creatorTime));
 await page.screenshot({path:'preview/evidence/codepen-creator.png'});
 await frame.evaluate(()=>odyssey.seek(odyssey.worldTimes[6]));
 await page.screenshot({path:'preview/evidence/codepen-neural.png'});
 await frame.evaluate(()=>odyssey.seek(13));
 await page.screenshot({path:'preview/evidence/codepen-signature.png'});
 const pixel=await frame.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),p=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);odyssey.seek(13);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,p);let lit=0;for(let i=1;i<p.length;i+=4)if(p[i]>20)lit++;return lit});
 check('The iframe renders real nonempty pixels',pixel>1000);
}catch(e){report.failures.push(e.message)}
report.errors=errors;report.requests=requests;
const direct='https://htmlpreview.github.io/?https://github.com/Tire-C/Tire-C/blob/cb4e9728be6a690199a924a7b20a6533bf3249ee/odyssey/review/odyssey.html';
const directPage=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:'reduce'});
const directErrors=[];directPage.on('pageerror',e=>directErrors.push(e.message));
try{
 await directPage.goto(direct,{waitUntil:'domcontentloaded',timeout:45000});
 await directPage.waitForFunction(()=>window.odyssey?.ready,{},{timeout:60000});
 const directInfo=await directPage.evaluate(()=>odyssey.info());
 check('Direct public HTML preview runs revision 5',directInfo.revision===5);
 check('Direct preview has no JavaScript exceptions',directErrors.length===0);
 await directPage.evaluate(()=>odyssey.seek(odyssey.worldTimes[2]));
 await directPage.screenshot({path:'preview/evidence/direct-physics.png'});
 await directPage.evaluate(()=>odyssey.seek(13));
 await directPage.screenshot({path:'preview/evidence/direct-signature.png'});
 report.directPreview={url:direct,verified:true,info:directInfo,errors:directErrors};
}catch(e){report.directPreview={url:direct,verified:false,error:e.message,errors:directErrors};report.failures.push('Direct HTML preview: '+e.message)}
await directPage.close();
await browser.close();server.close();
await writeFile('preview/evidence/report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(report.failures.length)process.exitCode=1;
