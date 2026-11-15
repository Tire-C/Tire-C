import assert from 'node:assert/strict';
import * as THREE from 'three';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium,firefox,webkit} from 'playwright';
import {PNG} from 'pngjs';
import {cameraAt,stateAt,DURATION,CHAMBERS,UNIVERSE_SCALE,CREATOR_TIME,JOURNEY_END,SIGNATURE_START,SIGNATURE_END,WORLD_TIMES} from '../src/timeline.js';
const BASE='0f00154f3651c7bed8cf8660780bb3c1750ed9bc',BLOB='1d0114fe01e78f186042fc760e37b66d6cf9c090',R4='8ebe01b24c3cf3e1557ac7a9adb98393040985f0';
await mkdir('diagnostics',{recursive:true});
const checks=[],failures=[],shots=[],errors=[],browserCompatibility=[];
const check=(name,fn)=>{try{fn();checks.push({name,pass:true})}catch(e){failures.push(name+': '+e.message);checks.push({name,pass:false,error:e.message})}};
const hash=b=>createHash('sha256').update(b).digest('hex');
const original=execFileSync('git',['show',BASE+':README.md']);
check('Profile README byte-for-byte intact; backup verified',()=>{
 assert.deepEqual(awaitlessRead('../README.md'),original);
 assert.deepEqual(awaitlessRead('audit/README.original.md'),original);
 assert.equal(execFileSync('git',['hash-object','../README.md']).toString().trim(),BLOB);
});
function awaitlessRead(p){return execFileSync('cat',[p])}
const previous=execFileSync('git',['show',R4+':odyssey/src/geometry.js']).toString(),now=await readFile('src/geometry.js','utf8');
const core=s=>s.split('export function worlds')[1].split('export function creator')[0];
check('Approved scientific geometry retained without a rewrite',()=>assert.equal(core(now),core(previous)));
check('14 second film; creator 200 ms; signature holds 1.35 seconds',()=>{
 assert.equal(DURATION,14);assert(Math.abs(SIGNATURE_START-11.85-.20)<1e-8);assert(Math.abs(13.8-SIGNATURE_END-1.35)<1e-8);
 assert.equal(stateAt(13).name,'Hi, I am Tire');
});
const speeds=[],turns=[];let priorQ;
const c=new THREE.PerspectiveCamera(),lastP=new THREE.Vector3();
for(let i=0;i<=14000;i++){
 const t=i*.001,p=cameraAt(t);assert(p.position.every(Number.isFinite));
 c.position.set(...p.position);c.up.set(Math.sin(p.roll),Math.cos(p.roll),0);c.lookAt(...p.target);
 if(i&&t<10.4){speeds.push(c.position.distanceTo(lastP)/.001);turns.push(c.quaternion.angleTo(priorQ)/.001)}
 lastP.copy(c.position);priorQ=c.quaternion.clone();
}
const kinematics={minSpeed:Math.min(...speeds),maxSpeed:Math.max(...speeds),maxTurnRadiansPerSecond:Math.max(...turns)};
check('Interior arc-length speed is uniform within 2 percent',()=>assert(kinematics.maxSpeed/kinematics.minSpeed<1.02,JSON.stringify(kinematics)));
check('Continuous measured orientation with no direction snaps',()=>assert(kinematics.maxTurnRadiansPerSecond<1.5,JSON.stringify(kinematics)));
check('Straight creator withdrawal with no lateral orbit',()=>{
 const dirs=[11,11.2,11.5,11.8,12.05,12.4].map(t=>{const p=cameraAt(t);return new THREE.Vector3(...p.position).sub(new THREE.Vector3(...p.target)).normalize()});
 assert(dirs.every(d=>d.distanceTo(dirs[0])<1e-8));
 for(const t of [11,12.05,12.45]){const a=cameraAt(t-1e-5),b=cameraAt(t+1e-5);assert(Math.hypot(...a.position.map((x,i)=>x-b.position[i]))<.001)}
});
check('All complete worlds lie within the cranial volume',()=>assert(CHAMBERS.every(c=>(c.p.length()+34)*UNIVERSE_SCALE<.075)));
const anatomyAudit=JSON.parse(await readFile('diagnostics/r4-character-build.json','utf8'));
check('CC0 anatomy rebuilt with 11 verified source hashes in this cloud run',()=>{
 assert.equal(anatomyAudit.sourceCommit,process.env.GITHUB_SHA);assert.equal(anatomyAudit.verifiedSources.length,11);assert(anatomyAudit.ocularGeometry.sampledEyeGlyphs>40);
});
const html=await readFile('.build/odyssey.html'),baselineHTML=execFileSync('git',['show',R4+':odyssey/review/odyssey.html'],{maxBuffer:8e6});
const server=createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end(req.url.startsWith('/r4')?baselineHTML:html)}).listen(0,'127.0.0.1');
await new Promise(r=>server.once('listening',r));const url='http://127.0.0.1:'+server.address().port;
let browser,info,benchmark,transitionError,bufferTraffic,geometry;
const activityComparisons=[],temporal=[];
function pixels(buffer){
 const p=PNG.sync.read(buffer),tiles=new Array(12).fill(0);let lit=0,green=0,left=p.width,right=0;
 for(let y=0;y<p.height;y++)for(let x=0;x<p.width;x++){
  const i=(y*p.width+x)*4;if(p.data[i+1]>20){lit++;if(p.data[i+1]>p.data[i]&&p.data[i+1]>p.data[i+2])green++;left=Math.min(left,x);right=Math.max(right,x);tiles[Math.min(2,Math.floor(y/p.height*3))*4+Math.min(3,Math.floor(x/p.width*4))]++}
 }
 return {coverage:lit/(p.width*p.height),greenRatio:green/Math.max(1,lit),occupiedTiles:tiles.filter(n=>n>100).length,left,right,width:p.width};
}
function difference(a,b){
 const p=PNG.sync.read(a),q=PNG.sync.read(b);let changed=0,mean=0;
 for(let i=1;i<p.data.length;i+=4){const d=Math.abs(p.data[i]-q.data[i]);mean+=d;if(d>12)changed++}
 return {changed,mean:mean/(p.width*p.height)};
}
async function capture(page,t,file){
 const state=await page.evaluate(t=>odyssey.seek(t),t);
 const b=await page.locator('canvas').screenshot({path:'diagnostics/'+file});return {state,b,...pixels(b)};
}
async function measure(page){
 return page.evaluate(()=>{
  const gl=document.querySelector('canvas').getContext('webgl2'),times=Array.from({length:40},(_,i)=>(i+.3)*odyssey.explorationDuration/41);
  for(const t of times)odyssey.seek(t);gl.finish();
  const samples=[];
  for(const t of times){const start=performance.now();odyssey.seek(t);gl.finish();samples.push(performance.now()-start)}
  const ordered=[...samples].sort((a,b)=>a-b);
  return {medianMs:ordered[20],p95Ms:ordered[38],samples};
 });
}
function montage(frames,cols,w=320,h=180){
 const out=new PNG({width:cols*w,height:Math.ceil(frames.length/cols)*h});out.data.fill(0);
 frames.forEach((b,i)=>{const src=PNG.sync.read(b),ox=i%cols*w,oy=Math.floor(i/cols)*h;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const from=(Math.floor(y/h*src.height)*src.width+Math.floor(x/w*src.width))*4,to=((oy+y)*out.width+ox+x)*4;src.data.copy(out.data,to,from,from+4)}
 });return PNG.sync.write(out);
}
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto(url+'/?test=1');await page.waitForFunction(()=>window.odyssey?.ready,{},{timeout:60000});
 await page.addStyleTag({content:'#ui{visibility:hidden}'});
 info=await page.evaluate(()=>odyssey.info());geometry=await page.evaluate(()=>odyssey.geometry());
 check('Software rasterizer explicitly identified',()=>assert.match(info.renderer,/SwiftShader/i));
 check('Eight volumetric domains and genuine spatial glyphs',()=>{
  assert.equal(geometry.length,8);assert(geometry.every(g=>g.max.every((v,i)=>v-g.min[i]>5)));
 });
 const surfaces=await page.evaluate(()=>odyssey.surfaces());
 check('Only binary points or binary instances contribute visible colour',()=>assert(surfaces.every(s=>!s.colorWrite||s.points||s.instanced)));
 check('Only the two anatomical depth proxies are invisible solid meshes',()=>assert.equal(surfaces.filter(s=>!s.colorWrite).length,2));
 await page.evaluate(()=>{
  const gl=document.querySelector('canvas').getContext('webgl2');window.bufferWrites={data:0,subData:0};
  for(const [method,key] of [['bufferData','data'],['bufferSubData','subData']]){const original=gl[method].bind(gl);gl[method]=(...args)=>{window.bufferWrites[key]++;return original(...args)}}
 });
 for(let t=0;t<14;t+=.071)await page.evaluate(t=>odyssey.seek(t),t);
 bufferTraffic=await page.evaluate(()=>window.bufferWrites);
 check('Zero geometry buffer allocations or uploads throughout playback after warmup',()=>assert.deepEqual(bufferTraffic,{data:0,subData:0}));
 const times=[0,.5,...WORLD_TIMES,...[1.8,3.3,4.8,6.3,7.8,9.3,10.5],11,11.25,11.45,11.6,11.75,11.85,11.94,12.05,12.18,12.32,12.5,13.4];
 const overview=[];
 for(const t of [...new Set(times)].sort((a,b)=>a-b)){
  const file='r5-frame-'+t.toFixed(2).replace('.','_')+'.png',r=await capture(page,t,file);
  shots.push({t,file,state:r.state,coverage:r.coverage,occupiedTiles:r.occupiedTiles});
  if(t<11&&WORLD_TIMES.some(w=>Math.abs(w-t)<.001))overview.push(r.b);
  check('Visible green binary geometry at '+t.toFixed(2)+' s',()=>{assert(r.coverage>.003,'Empty frame '+r.coverage);assert(r.greenRatio>.995)});
 }
 await writeFile('diagnostics/r5-worlds-contact-sheet.png',montage(overview,4));
 for(let i=0;i<8;i++){
  await page.evaluate(()=>odyssey.secondaryVisible(true));
  await page.evaluate(t=>odyssey.seek(t),WORLD_TIMES[i]);
  const a=await page.locator('canvas').screenshot();
  await page.evaluate(t=>odyssey.activityOnlyTime(t),WORLD_TIMES[i]*1.3+.3);
  const b=await page.locator('canvas').screenshot();
  await page.evaluate(()=>odyssey.secondaryVisible(false));
  const absent=await page.locator('canvas').screenshot();
  activityComparisons.push({world:i,motionPixels:difference(a,b).changed,contributionPixels:difference(a,absent).changed,...pixels(a)});
 }
 await page.evaluate(()=>odyssey.secondaryVisible(true));
 check('Moving secondary assemblies are visibly active in all eight domains',()=>assert(activityComparisons.every(a=>a.motionPixels>150&&a.contributionPixels>500),JSON.stringify(activityComparisons)));
 check('Every domain has distributed screen-space activity',()=>assert(activityComparisons.every(a=>a.occupiedTiles>=7),JSON.stringify(activityComparisons)));
 const sequence=[];
 for(let k=1;k<8;k++){
  const t=(WORLD_TIMES[k-1]+WORLD_TIMES[k])*.5,images=[];
  for(let j=-2;j<=2;j++){await page.evaluate(t=>odyssey.seek(t),t+j/30);images.push(await page.locator('canvas').screenshot())}
  sequence.push(...images);temporal.push({t,changes:images.slice(1).map((b,i)=>difference(images[i],b))});
 }
 await writeFile('diagnostics/r5-transition-sequences.png',montage(sequence,5));
 const pre=(await capture(page,SIGNATURE_START-1e-7,'r5-signature-handover-a.png')).b,post=(await capture(page,SIGNATURE_START+1e-7,'r5-signature-handover-b.png')).b;
 transitionError=difference(pre,post).mean;
 check('Creator-to-signature handover has no visible swap',()=>assert(transitionError<.2,'Mean difference '+transitionError));
 const deterministic=(await capture(page,CREATOR_TIME,'r5-creator.png')).b;
 await page.evaluate(()=>odyssey.seek(2));await page.evaluate(()=>odyssey.seek(odyssey.creatorTime));
 const repeated=await page.locator('canvas').screenshot();
 check('Random-access reproducibility after unrelated scene',()=>assert.equal(hash(deterministic),hash(repeated)));
 const r5=await measure(page);
 const old=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
 await old.goto(url+'/r4?test=1');await old.waitForFunction(()=>window.odyssey?.ready,{},{timeout:60000});
 const r4=await measure(old);await old.close();
 benchmark={r4,r5,speedup:r4.medianMs/r5.medianMs,note:'Identical remote CPU and 1280x720 framebuffer; gl.finish includes GPU-command completion in SwiftShader. NOT a hardware GPU FPS result.'};
 check('Remote software median frame cost improves at least 20 percent over R4',()=>assert(r5.medianMs<r4.medianMs*.8,JSON.stringify(benchmark)));
 await page.setViewportSize({width:390,height:844});
 await capture(page,CREATOR_TIME,'r5-mobile-creator.png');
 const mobile=await capture(page,13,'r5-mobile-signature.png');
 check('Signature remains readable inside portrait margins',()=>assert(mobile.left>15&&mobile.right<mobile.width-15));
 const reduced=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:'reduce'});
 await reduced.goto(url);await reduced.waitForFunction(()=>window.odyssey?.ready);
 const reducedInfo=await reduced.evaluate(()=>odyssey.info());await reduced.waitForTimeout(200);
 check('Reduced motion starts paused on the creator',()=>assert(!reducedInfo.playing&&reducedInfo.current===CREATOR_TIME));
 const later=await reduced.evaluate(()=>odyssey.info().current);
 check('Reduced motion stays stationary',()=>assert.equal(later,reducedInfo.current));await reduced.close();
 const offline=await browser.newPage({viewport:{width:960,height:540}});
 const requests=[];offline.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});
 await offline.goto(pathToFileURL(resolve('.build/odyssey.html')).href+'?test=1');await offline.waitForFunction(()=>window.odyssey?.ready);
 await offline.evaluate(()=>odyssey.seek(odyssey.creatorTime));
 check('Self-contained HTML runs without network requests',()=>assert.deepEqual(requests,[]));
 const initial=await offline.locator('canvas').screenshot();
 await offline.getByRole('button',{name:'Inspect 3D',exact:true}).click();
 await offline.mouse.move(480,250);await offline.mouse.down();await offline.mouse.move(660,290,{steps:8});await offline.mouse.up();
 const rotated=await offline.locator('canvas').screenshot();
 check('Interactive inspection exposes real spatial geometry',()=>assert.notEqual(hash(initial),hash(rotated)));
 await offline.getByRole('button',{name:'Return to film',exact:true}).click();
 const returned=await offline.locator('canvas').screenshot();
 check('Returning from inspection restores cinematic composition',()=>assert.equal(hash(initial),hash(returned)));
 await offline.getByRole('button',{name:'Play animation',exact:true}).click();await offline.waitForTimeout(400);
 const advanced=await offline.evaluate(()=>odyssey.info().current);
 check('Runtime advances by elapsed time',()=>assert(advanced>CREATOR_TIME));
 await offline.getByRole('button',{name:'Pause animation',exact:true}).click();
 const pause=await offline.evaluate(()=>odyssey.info().current);await offline.waitForTimeout(200);
 const pauseLater=await offline.evaluate(()=>odyssey.info().current);
 check('Pause holds position',()=>assert.equal(pause,pauseLater));
 await offline.close();
 check('No shader or JavaScript errors',()=>assert.deepEqual(errors,[]));
}catch(e){failures.push('Cloud browser execution: '+e.stack);console.error(e,errors)}
finally{if(browser)await browser.close()}
for(const [name,engine] of [['Firefox',firefox],['WebKit',webkit]]){
 let b;const errs=[];
 try{
  b=await engine.launch({headless:name!=='Firefox',env:{...process.env,LIBGL_ALWAYS_SOFTWARE:'1'},...(name==='Firefox'?{firefoxUserPrefs:{'webgl.force-enabled':true,'webgl.disabled':false,'gfx.webrender.software':true}}:{})});
  const p=await b.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>errs.push(e.message));
  await p.goto(url+'/?test=1');await p.waitForFunction(()=>window.odyssey?.ready,{},{timeout:45000});
  await p.addStyleTag({content:'#ui{visibility:hidden}'});
  const samples=[];
  for(const [label,t] of [['physics',WORLD_TIMES[2]],['creator',CREATOR_TIME],['signature',13]]){
   const r=await capture(p,t,'r5-'+name.toLowerCase()+'-'+label+'.png');samples.push({label,coverage:r.coverage});
  }
  assert(samples.every(s=>s.coverage>.003));assert.equal(errs.length,0);
  browserCompatibility.push({name,rendered:true,info:await p.evaluate(()=>odyssey.info()),samples});
 }catch(e){browserCompatibility.push({name,rendered:false,error:e.message,errors:errs,interpretation:'Software-rendering compatibility not established; not evidence of hardware incompatibility.'})}
 finally{if(b)await b.close()}
}
server.close();
const report={revision:5,sourceCommit:process.env.GITHUB_SHA,runId:process.env.GITHUB_RUN_ID,environment:'GitHub Actions ubuntu-24.04 standard public runner',rendering:'Chromium ANGLE SwiftShader on remote CPU; no physical GPU validation',baseline:BASE,readmeBlob:BLOB,readmeSha256:hash(original),info,geometry,kinematics,bufferTraffic,anatomyAudit,activityComparisons,benchmark,transitionError,temporal,browserCompatibility,checks,failures,shots,errors,limits:['Software tests measure relative render cost, not physical GPU frame rate.','Artistic approval remains with Tire.','README SVG compatibility is unchanged: a separate WebGL program is required.']};
await writeFile('diagnostics/report.json',JSON.stringify(report,null,2)+'\n');
await writeFile('diagnostics/README.md','# Revision 5 — remote visual evidence\n\nSource: '+process.env.GITHUB_SHA+'\n\nCPU software rendering only. Images are diagnostics; the delivered work is the procedural program.\n\n'+checks.map(c=>'- '+(c.pass?'PASS':'FAIL')+' '+c.name).join('\n')+'\n\n![Worlds](r5-worlds-contact-sheet.png)\n\n![Transitions at 30 Hz](r5-transition-sequences.png)\n\n'+shots.map(s=>'## '+s.t.toFixed(2)+' s\n\n!['+s.state.name+']('+s.file+')').join('\n\n'));
console.log(JSON.stringify({checks,failures,errors,benchmark:benchmark&&{r4:benchmark.r4.medianMs,r5:benchmark.r5.medianMs,speedup:benchmark.speedup}},null,2));
if(failures.length)process.exitCode=1;
