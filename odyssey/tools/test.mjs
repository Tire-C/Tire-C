import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium,firefox,webkit} from 'playwright';
import {PNG} from 'pngjs';
import {cameraAt,stateAt,DURATION,UNIVERSE_SCALE,playbackTime,CREATOR_TIME} from '../src/timeline.js';
const BASE='0f00154f3651c7bed8cf8660780bb3c1750ed9bc',BLOB='1d0114fe01e78f186042fc760e37b66d6cf9c090';
await mkdir('diagnostics',{recursive:true});
const checks=[],failures=[],shots=[];
function check(name,fn){try{fn();checks.push({name,pass:true})}catch(e){failures.push(name+': '+e.message);checks.push({name,pass:false,error:e.message})}}
const previousGeometry=execFileSync('git',['show','1252ca823180a84221bac03bcdc55cd334d5b283:odyssey/src/geometry.js']).toString();
const currentGeometry=await readFile('src/geometry.js','utf8');
const worldsSource=s=>s.split('export function worlds')[1].split('export function creator')[0];
check('Approved scientific worlds preserved exactly',()=>assert.equal(worldsSource(currentGeometry),worldsSource(previousGeometry)));
check('Revised duration with preserved final hold',()=>{assert.equal(DURATION,28);assert.equal(playbackTime(28),24);assert.equal(playbackTime(31.5)-playbackTime(28),3.5)});
const original=execFileSync('git',['show',BASE+':README.md']);
check('README is byte-for-byte identical to baseline',()=>assert.deepEqual(execFileSync('git',['show','HEAD:README.md']),original));
check('README original blob',()=>assert.equal(execFileSync('git',['hash-object','../README.md']).toString().trim(),BLOB));
const backup=await readFile('audit/README.original.md');
check('Verified backup',()=>assert.deepEqual(backup,original));
function hash(b){return createHash('sha256').update(b).digest('hex')}
for(let t=0;t<DURATION;t+=.01){const a=cameraAt(t),b=cameraAt(t+.001);assert(a.position.every(Number.isFinite));assert(Math.hypot(...a.position.map((v,i)=>v-b.position[i]))<.02)}
checks.push({name:'Camera continuity and finite coordinates over the complete revised timeline',pass:true});
check('Final phrase exact and held for 3.5 seconds',()=>{assert.equal(stateAt(24).name,'Hi, I am Tire');assert.equal(stateAt(27.4).signature,1)});
const html=await readFile('.build/odyssey.html');
const server=createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end(html)}).listen(0,'127.0.0.1');
await new Promise(r=>server.once('listening',r));
const url='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.goto(url+'/?test=1');await page.waitForFunction(()=>window.odyssey?.ready);
await page.addStyleTag({content:'#ui{visibility:hidden}'});
const info=await page.evaluate(()=>odyssey.info()),geometry=await page.evaluate(()=>odyssey.geometry());
check('Eight genuine 3D environments inside the head',()=>{assert.equal(geometry.length,8);for(const g of geometry){for(let a=0;a<3;a++)assert(g.max[a]-g.min[a]>5,g.name+' is flat');assert(g.radius*UNIVERSE_SCALE<.130)}}); 
check('Software rendering explicitly identified',()=>assert.match(info.renderer,/SwiftShader/i));
for(const story of [0,.6,1,1.6,2.6,4.6,6.6,8.6,10.6,12.6,14.6,16,17,17.5,18,18.5,19,19.5,20,20.5,21,21.5,22,24,25.8,27,28.5,30.5]){
 const t=playbackTime(story),state=await page.evaluate(t=>odyssey.seek(t),t);
 const filename='r2-frame-'+t.toFixed(2).replace('.','_')+'.png',buffer=await page.locator('canvas').screenshot({path:'diagnostics/'+filename});
 const png=PNG.sync.read(buffer);let lit=0,green=0,white=0;
 for(let i=0;i<png.data.length;i+=4){if(png.data[i+1]>18){lit++;if(png.data[i+1]>png.data[i]&&png.data[i+1]>png.data[i+2])green++;else white++}}
 const coverage=lit/(png.width*png.height);
 check('Frame '+t+' contains monochrome rendered geometry',()=>{assert(coverage>.002,'nearly empty frame: '+coverage);assert(green/Math.max(1,lit)>.995,'non-green geometry')});
 shots.push({t,file:filename,coverage,hash:hash(buffer),state});
}
const boundary=playbackTime(25);
await page.evaluate(t=>odyssey.seek(t),boundary-1e-7);
const preMorph=PNG.sync.read(await page.locator('canvas').screenshot());
await page.evaluate(t=>odyssey.seek(t),boundary+1e-7);
const postMorph=PNG.sync.read(await page.locator('canvas').screenshot());
let transitionError=0;
for(let i=1;i<preMorph.data.length;i+=4)transitionError+=Math.abs(preMorph.data[i]-postMorph.data[i]);
transitionError/=preMorph.width*preMorph.height;
check('Creator-to-signature handover preserves glyph appearance without a visible cut',()=>assert(transitionError<.08,'Mean green-channel difference: '+transitionError));
await page.evaluate(()=>odyssey.seek(17.571428571428573));const a=await page.locator('canvas').screenshot();
await page.evaluate(()=>odyssey.seek(3));await page.evaluate(()=>odyssey.seek(17.571428571428573));const b=await page.locator('canvas').screenshot();
check('Random-access timeline is pixel deterministic',()=>assert.equal(hash(a),hash(b)));
check('No JavaScript or shader errors',()=>assert.deepEqual(errors,[]));
check('Invisible creator does not consume draw calls during immersion',()=>assert.equal(info.drawCalls,1));
check('Instanced rendering uses at most five draw calls',()=>assert(info.drawCalls<=5));
await page.evaluate(()=>odyssey.seek(odyssey.creatorTime));
const orbitHashes=[];
for(const [name,pos] of [['side',[4,2.8,.2]],['back',[2,2.8,-4]],['front',[-3,2.8,4]]]){
 await page.evaluate(pos=>odyssey.viewFrom(pos,[0,1.35,.4]),pos);
 const image=await page.locator('canvas').screenshot({path:'diagnostics/r2-orbit-'+name+'.png'});orbitHashes.push(hash(image));
}
check('Three spatial viewpoints produce distinct rendered images',()=>assert.equal(new Set(orbitHashes).size,3));
const portraitShots=[];
for(const [name,pos,target] of [
 ['face-front',[0,2.12,1.08],[0,2.08,.03]],
 ['face-three-quarter',[.72,2.24,.96],[0,2.09,.03]],
 ['face-profile',[1.10,2.17,.06],[0,2.08,.03]],
 ['hands',[.75,1.90,1.05],[0,1.35,.77]]
]){
 await page.evaluate(({pos,target})=>odyssey.viewFrom(pos,target),{pos,target});
 const filename='r2-'+name+'.png';
 await page.locator('canvas').screenshot({path:'diagnostics/'+filename});portraitShots.push(filename);
}

await page.evaluate(()=>odyssey.seek(odyssey.creatorTime));
const bench=await page.evaluate(async()=>{const samples=[];for(let i=0;i<45;i++){const a=performance.now();odyssey.seek(i*.3);const gl=document.querySelector('canvas').getContext('webgl2');gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(4));samples.push(performance.now()-a)}samples.sort((a,b)=>a-b);return {medianMs:samples[22],p95Ms:samples[42],note:'Pixel-readback SwiftShader diagnostic on remote CPU. Not real GPU or display frame rate.'}});
await page.setViewportSize({width:390,height:844});await page.evaluate(()=>odyssey.seek(odyssey.creatorTime));
await page.locator('canvas').screenshot({path:'diagnostics/r2-mobile-creator.png'});
await page.evaluate(()=>odyssey.seek(25));const mobileSignature=await page.locator('canvas').screenshot({path:'diagnostics/r2-mobile-signature.png'});
const mobilePNG=PNG.sync.read(mobileSignature);let left=mobilePNG.width,right=0;
for(let y=0;y<mobilePNG.height;y++)for(let x=0;x<mobilePNG.width;x++)if(mobilePNG.data[(y*mobilePNG.width+x)*4+1]>25){left=Math.min(left,x);right=Math.max(right,x)}
check('Portrait signature has visible horizontal margins',()=>{assert(left>15);assert(right<mobilePNG.width-15)});

const reduced=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:'reduce'});
await reduced.goto(url);await reduced.waitForFunction(()=>window.odyssey?.ready);
const before=await reduced.evaluate(()=>odyssey.info());await reduced.waitForTimeout(150);const after=await reduced.evaluate(()=>odyssey.info());
check('Reduced motion starts paused on creator, no automatic motion',()=>{assert.equal(before.playing,false);assert.equal(before.current,CREATOR_TIME);assert.equal(after.current,before.current)});
const offline=await browser.newPage({viewport:{width:1280,height:720}});
const externalRequests=[];offline.on('request',req=>{if(/^https?:/.test(req.url()))externalRequests.push(req.url())});
await offline.goto(pathToFileURL(resolve('.build/odyssey.html')).href+'?test=1');
await offline.waitForFunction(()=>window.odyssey?.ready);
await offline.evaluate(()=>odyssey.seek(odyssey.creatorTime));
check('Standalone HTML works without network or installation',()=>assert.deepEqual(externalRequests,[]));
const initialCanvas=await offline.evaluate(()=>document.querySelector('canvas').toDataURL());
await offline.getByRole('button',{name:'Inspect 3D',exact:true}).click();
await offline.mouse.move(640,350);await offline.mouse.down();await offline.mouse.move(860,390,{steps:12});await offline.mouse.up();
const rotatedCanvas=await offline.evaluate(()=>document.querySelector('canvas').toDataURL());
check('Interactive inspection rotates the 3D image',()=>assert.notEqual(initialCanvas,rotatedCanvas));
await offline.getByRole('button',{name:'Return to film',exact:true}).click();
const restoredCanvas=await offline.evaluate(()=>document.querySelector('canvas').toDataURL());
check('Returning from inspection restores the exact cinematic pose',()=>assert.equal(initialCanvas,restoredCanvas));
await offline.getByRole('button',{name:'Play animation',exact:true}).click();
await offline.waitForTimeout(500);
const advanced=await offline.evaluate(()=>odyssey.info().current);
check('Real-time playback advances the timeline',()=>assert(advanced>CREATOR_TIME+.1));
await offline.getByRole('button',{name:'Pause animation',exact:true}).click();
const paused=await offline.evaluate(()=>odyssey.info().current);await offline.waitForTimeout(150);
const advancedPaused=await offline.evaluate(()=>odyssey.info().current);
check('Pause freezes the timeline',()=>assert.equal(paused,advancedPaused));
await offline.close();
// Exercise the actual GitHub-rendered Markdown image, not an inline SVG substitute.
let svgCompatibility={verified:false};
try{
 const svgPage=await browser.newPage({viewport:{width:1100,height:800}});
 await svgPage.goto('https://github.com/Tire-C/Tire-C/blob/work/binary-mind-odyssey/odyssey/compatibility/README.md',{waitUntil:'domcontentloaded',timeout:45000});
 const img=svgPage.getByRole('img',{name:'SVG declarative animation probe',exact:true});
 await img.waitFor({state:'visible',timeout:20000});
 await img.scrollIntoViewIfNeeded();await svgPage.waitForTimeout(300);
 const s0=await img.screenshot({path:'diagnostics/svg-github-a.png'});
 await svgPage.waitForTimeout(700);
 const s1=await img.screenshot({path:'diagnostics/svg-github-b.png'});
 svgCompatibility={verified:true,animated:hash(s0)!==hash(s1),src:await img.getAttribute('src'),context:'Actual GitHub rendered Markdown image in remote Chromium',hashes:[hash(s0),hash(s1)]};
 check('Actual GitHub README SVG declarative animation changes pixels',()=>assert.equal(svgCompatibility.animated,true));
 await svgPage.close();
}catch(e){svgCompatibility={verified:false,error:e.message};failures.push('GitHub SVG observation unavailable: '+e.message)}
await browser.close();
const browserCompatibility=[];
for(const [name,engine] of [['Firefox',firefox],['WebKit',webkit]]){
 let other,p,errs=[];
 try{
  other=await engine.launch({headless:name!=='Firefox',env:{...process.env,LIBGL_ALWAYS_SOFTWARE:'1'},...(name==='Firefox'?{firefoxUserPrefs:{'webgl.force-enabled':true,'webgl.disabled':false,'gfx.webrender.software':true}}:{})});
  p=await other.newPage({viewport:{width:1280,height:720}});
  p.on('pageerror',e=>errs.push(e.message));
  await p.goto(url+'/?test=1');await p.waitForFunction(()=>window.odyssey?.ready,{},{timeout:20000});
  await p.addStyleTag({content:'#ui{visibility:hidden}'});
  await p.evaluate(()=>odyssey.seek(odyssey.creatorTime));
  const screenshot=await p.locator('canvas').screenshot({path:'diagnostics/r2-'+name.toLowerCase()+'-creator.png'});
  const data=PNG.sync.read(screenshot);let lit=0;for(let i=1;i<data.data.length;i+=4)if(data.data[i]>20)lit++;
  if(lit<1000||errs.length)throw new Error('Missing geometry or runtime errors: '+errs.join(';'));
  browserCompatibility.push({name,rendered:true,info:await p.evaluate(()=>odyssey.info()),errors:errs});
 }catch(e){browserCompatibility.push({name,rendered:false,error:e.message,errors:errs,interpretation:'Remote software-rendering compatibility not established; not proof of hardware incompatibility.'})}
 finally{if(other)await other.close()}
}
server.close();
const report={revision:2,sourceCommit:process.env.GITHUB_SHA,runId:process.env.GITHUB_RUN_ID,environment:'GitHub Actions ubuntu-24.04 standard public runner',rendering:'Chromium / ANGLE SwiftShader software on remote CPU; NO real GPU validation',baseline:BASE,readmeBlob:BLOB,readmeSha256:hash(original),info,geometry,benchmark:bench,transitionError,svgCompatibility,browserCompatibility,checks,failures,shots,portraitShots,limits:['Artistic acceptance requires human review of the diagnostic frames and running program.','Physical GPU not validated. See per-engine software compatibility results.','GitHub README SVG image-context compatibility needs a separate actual GitHub observation.','Mobile composition must be visually inspected.']};
await writeFile('diagnostics/report.json',JSON.stringify(report,null,2)+'\n');
await writeFile('diagnostics/README.md','# Rendering diagnostics — review candidate\n\nSource commit: '+process.env.GITHUB_SHA+'\n\nRemote CPU rendering with Chromium / SwiftShader. These images are test evidence, never the animation product.\n\n'+checks.map(c=>'- '+(c.pass?'PASS':'FAIL')+' '+c.name).join('\n')+'\n\n'+shots.map(s=>'## '+s.t.toFixed(2)+' s — '+s.state.name+'\n\n![Diagnostic at '+s.t+' seconds]('+s.file+')\n').join('\n')+'\n## Character study\n\n'+portraitShots.map(f=>'!['+f+']('+f+')').join('\n\n')+'\n\n## Portrait checks\n\n![Creator](r2-mobile-creator.png)\n\n![Signature](r2-mobile-signature.png)\n');
console.log(JSON.stringify({info,benchmark:bench,checks,failures},null,2));
if(failures.length)process.exitCode=1;
