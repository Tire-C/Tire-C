import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {cameraAt,stateAt,DURATION,UNIVERSE_SCALE} from '../src/timeline.js';
const BASE='0f00154f3651c7bed8cf8660780bb3c1750ed9bc',BLOB='1d0114fe01e78f186042fc760e37b66d6cf9c090';
await mkdir('diagnostics',{recursive:true});
const checks=[],failures=[],shots=[];
function check(name,fn){try{fn();checks.push({name,pass:true})}catch(e){failures.push(name+': '+e.message);checks.push({name,pass:false,error:e.message})}}
const original=execFileSync('git',['show',BASE+':README.md']);
check('README is byte-for-byte identical to baseline',()=>assert.deepEqual(execFileSync('git',['show','HEAD:README.md']),original));
check('README original blob',()=>assert.equal(execFileSync('git',['hash-object','../README.md']).toString().trim(),BLOB));
const backup=await readFile('audit/README.original.md');
check('Verified backup',()=>assert.deepEqual(backup,original));
function hash(b){return createHash('sha256').update(b).digest('hex')}
for(let t=0;t<32;t+=.01){const a=cameraAt(t),b=cameraAt(t+.001);assert(a.position.every(Number.isFinite));assert(Math.hypot(...a.position.map((v,i)=>v-b.position[i]))<.02)}
checks.push({name:'Camera continuity and finite coordinates over 3200 samples',pass:true});
check('Final phrase exact and held for 3.5 seconds',()=>{assert.equal(stateAt(28).name,'Hi, I am Tire');assert.equal(stateAt(31.4).signature,1)});
const html=await readFile('.build/odyssey.html');
const server=createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end(html)}).listen(0,'127.0.0.1');
await new Promise(r=>server.once('listening',r));
const url='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.goto(url+'/?test=1');await page.waitForFunction(()=>window.odyssey?.ready);
const info=await page.evaluate(()=>odyssey.info()),geometry=await page.evaluate(()=>odyssey.geometry());
check('Eight genuine 3D environments inside the head',()=>{assert.equal(geometry.length,8);for(const g of geometry){for(let a=0;a<3;a++)assert(g.max[a]-g.min[a]>5,g.name+' is flat');assert(g.radius*UNIVERSE_SCALE<.28)}}); 
check('Software rendering explicitly identified',()=>assert.match(info.renderer,/SwiftShader/i));
for(const t of [0,1,2.6,4.6,6.6,8.6,10.6,12.6,14.6,16,17.5,19,20.5,22,24,25.8,27,28.5,30.5]){
 const state=await page.evaluate(t=>odyssey.seek(t),t);
 const filename='frame-'+String(t).replace('.','_')+'.png',buffer=await page.locator('canvas').screenshot({path:'diagnostics/'+filename});
 const png=PNG.sync.read(buffer);let lit=0,green=0,white=0;
 for(let i=0;i<png.data.length;i+=4){if(png.data[i+1]>18){lit++;if(png.data[i+1]>png.data[i]&&png.data[i+1]>png.data[i+2])green++;else white++}}
 const coverage=lit/(png.width*png.height);
 check('Frame '+t+' contains monochrome rendered geometry',()=>{assert(coverage>.002,'nearly empty frame: '+coverage);assert(green/Math.max(1,lit)>.995,'non-green geometry')});
 shots.push({t,file:filename,coverage,hash:hash(buffer),state});
}
await page.evaluate(()=>odyssey.seek(20.5));const a=await page.locator('canvas').screenshot();
await page.evaluate(()=>odyssey.seek(3));await page.evaluate(()=>odyssey.seek(20.5));const b=await page.locator('canvas').screenshot();
check('Random-access timeline is pixel deterministic',()=>assert.equal(hash(a),hash(b)));
check('No JavaScript or shader errors',()=>assert.deepEqual(errors,[]));
check('Instanced rendering uses at most five draw calls',()=>assert(info.drawCalls<=5));
const bench=await page.evaluate(async()=>{const samples=[];for(let i=0;i<45;i++){const a=performance.now();odyssey.seek(i*.3);const gl=document.querySelector('canvas').getContext('webgl2');gl.finish();samples.push(performance.now()-a)}samples.sort((a,b)=>a-b);return {medianMs:samples[22],p95Ms:samples[42],note:'Synchronous SwiftShader diagnostic. Not real GPU or display frame rate.'}});
await page.setViewportSize({width:390,height:844});await page.evaluate(()=>odyssey.seek(24));
await page.locator('canvas').screenshot({path:'diagnostics/mobile-creator.png'});
await page.evaluate(()=>odyssey.seek(29));await page.locator('canvas').screenshot({path:'diagnostics/mobile-signature.png'});
const reduced=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:'reduce'});
await reduced.goto(url);await reduced.waitForFunction(()=>window.odyssey?.ready);
const before=await reduced.evaluate(()=>odyssey.info());await reduced.waitForTimeout(150);const after=await reduced.evaluate(()=>odyssey.info());
check('Reduced motion starts paused on creator, no automatic motion',()=>{assert.equal(before.playing,false);assert.equal(before.current,24);assert.equal(after.current,before.current)});
await browser.close();server.close();
const report={sourceCommit:process.env.GITHUB_SHA,runId:process.env.GITHUB_RUN_ID,environment:'GitHub Actions ubuntu-24.04 standard public runner',rendering:'Chromium / ANGLE SwiftShader software on remote CPU; NO real GPU validation',baseline:BASE,readmeBlob:BLOB,readmeSha256:hash(original),info,geometry,benchmark:bench,checks,failures,shots,limits:['Artistic acceptance requires human review of the diagnostic frames and running program.','Firefox, WebKit and physical GPU not validated in this run.','GitHub README SVG image-context compatibility needs a separate actual GitHub observation.','Mobile composition must be visually inspected.']};
await writeFile('diagnostics/report.json',JSON.stringify(report,null,2)+'\n');
await writeFile('diagnostics/README.md','# Rendering diagnostics — review candidate\n\nSource commit: '+process.env.GITHUB_SHA+'\n\nRemote CPU rendering with Chromium / SwiftShader. These images are test evidence, never the animation product.\n\n'+checks.map(c=>'- '+(c.pass?'PASS':'FAIL')+' '+c.name).join('\n')+'\n\n'+shots.map(s=>'## '+s.t+' s — '+s.state.name+'\n\n![Diagnostic at '+s.t+' seconds]('+s.file+')\n').join('\n')+'\n## Portrait checks\n\n![Creator](mobile-creator.png)\n\n![Signature](mobile-signature.png)\n');
console.log(JSON.stringify({info,benchmark:bench,checks,failures},null,2));
if(failures.length)process.exitCode=1;
