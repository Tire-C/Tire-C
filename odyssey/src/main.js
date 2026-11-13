import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {worlds,creator} from './geometry.js';
import {atlas,binaryCloud} from './renderer.js';
import {cameraAt,stateAt,DURATION,HEAD,UNIVERSE_SCALE} from './timeline.js';
import {signature,join} from './signature.js';
import {ramp} from './math.js';
const canvas=document.querySelector('#stage'),message=document.querySelector('#message');
const query=new URLSearchParams(location.search),test=query.has('test'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'low-power',preserveDrawingBuffer:test})}
catch(e){message.textContent='This experience needs WebGL 2. Your browser could not create a graphics context.';throw e}
renderer.setClearColor(0x000000,1);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.LinearSRGBColorSpace;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(53,1,.00015,100),texture=atlas();
const worldData=worlds(),parts=creator(),all=join(Object.values(parts));
const cosmos=binaryCloud(worldData[0],texture,{size:.28,fog:.55,intensity:1.7});
cosmos.mesh.position.set(...HEAD);cosmos.mesh.scale.setScalar(UNIVERSE_SCALE);cosmos.uniforms.turbulence.value=2;
const head=binaryCloud(parts.head,texture,{size:.022,fog:25,intensity:1.35});
const body=binaryCloud(parts.body,texture,{size:.025,fog:25,intensity:1.7});
const desk=binaryCloud(parts.desk,texture,{size:.024,fog:25,intensity:1.6});
const finale=binaryCloud(all,texture,{size:.024,fog:40,intensity:1.7});finale.setTargets(all,signature(all.count));
for(const cloud of [cosmos,head,body,desk,finale])scene.add(cloud.mesh);
const controls=new OrbitControls(camera,canvas);controls.enabled=false;controls.enableDamping=false;
controls.addEventListener('change',()=>{if(controls.enabled&&!contextLost)renderer.render(scene,camera)});
let activeWorld=-1,current=reduced.matches?24:0,playing=!reduced.matches&&!test,last=0,contextLost=false;
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(53)/2)*Math.max(1,1.5/camera.aspect)));camera.updateProjectionMatrix();for(const c of [cosmos,head,body,desk,finale])c.uniforms.viewportHeight.value=innerHeight*renderer.getPixelRatio();render(current)}
function render(t){
 current=Math.max(0,Math.min(DURATION,t));
 const state=stateAt(current),pose=cameraAt(current);
 camera.position.set(...pose.position);camera.up.set(Math.sin(pose.roll),Math.cos(pose.roll),0);camera.lookAt(...pose.target);camera.updateMatrixWorld();
 if(activeWorld!==state.world){cosmos.setTargets(worldData[state.world],worldData[state.next]);activeWorld=state.world}
 cosmos.uniforms.minimumPixels.value=2.3;
 cosmos.uniforms.fogDistance.value=.55+2*ramp(current,16,19);
 cosmos.uniforms.intensity.value=1.7+1.5*ramp(current,16,19);
 head.uniforms.cutaway.value=ramp(current,17,18.5)*(1-ramp(current,21.5,23.5));
 cosmos.uniforms.morph.value=state.morph;cosmos.uniforms.time.value=current;
 cosmos.uniforms.opacity.value=(1-ramp(current,24.5,26))*state.fade;
 cosmos.mesh.visible=current<26;
 head.uniforms.opacity.value=state.head*state.fade;
 body.uniforms.opacity.value=desk.uniforms.opacity.value=state.body*state.fade;
 for(const c of [head,body,desk])c.mesh.visible=current<25;
 finale.mesh.visible=current>=25;finale.uniforms.morph.value=state.signature;finale.uniforms.opacity.value=state.fade;
 finale.uniforms.glyphSize.value=.024+state.signature*.031;
 if(!contextLost)renderer.render(scene,camera);
 document.querySelector('#scrub').value=current;
 document.querySelector('#time').textContent=current.toFixed(1)+' / '+DURATION;
 return {t:current,...state,camera:pose,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};
}
function exitInspection(){controls.enabled=false;document.querySelector('#inspect').textContent='Inspect 3D'}
function syncButton(){const b=document.querySelector('#play');b.textContent=playing?'Pause':'Play';b.setAttribute('aria-label',playing?'Pause animation':'Play animation')}
function tick(now){if(last&&playing&&!document.hidden&&!contextLost){current+=(now-last)/1000;if(current>DURATION)current%=DURATION;render(current)}last=now;requestAnimationFrame(tick)}
document.querySelector('#play').onclick=()=>{exitInspection();playing=!playing;syncButton()};
document.querySelector('#restart').onclick=()=>{exitInspection();render(0);playing=true;syncButton()};
document.querySelector('#scrub').oninput=e=>{exitInspection();playing=false;render(Number(e.target.value));syncButton()};
document.querySelector('#inspect').onclick=()=>{if(controls.enabled){exitInspection();render(current)}else{playing=false;controls.target.set(...cameraAt(current).target);controls.enabled=true;controls.minDistance=.01;controls.maxDistance=20;document.querySelector('#inspect').textContent='Return to film';controls.update()}syncButton()};
addEventListener('resize',resize);
document.addEventListener('visibilitychange',()=>{last=0});
reduced.addEventListener('change',e=>{if(e.matches){playing=false;render(24);syncButton()}});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;playing=false;message.textContent='Graphics context paused. Restore it or reload to continue.';syncButton()});
canvas.addEventListener('webglcontextrestored',()=>{contextLost=false;message.textContent='';render(current)});
const gl=renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');
window.odyssey={ready:true,seek:render,duration:DURATION,cameraAt,stateAt,
 viewFrom:(position,target)=>{camera.position.set(...position);camera.lookAt(...target);renderer.render(scene,camera)},
 info:()=>({renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),webgl:gl.getParameter(gl.VERSION),worldCount:worldData.length,worldPoints:worldData[0].count,headPoints:parts.head.count,bodyPoints:parts.body.count,deskPoints:parts.desk.count,playing,reduced:reduced.matches,current,drawCalls:renderer.info.render.calls}),
 geometry:()=>worldData.map(d=>({name:d.name,count:d.count,min:[0,1,2].map(a=>{let m=Infinity;for(let i=a;i<d.p.length;i+=3)m=Math.min(m,d.p[i]);return m}),max:[0,1,2].map(a=>{let m=-Infinity;for(let i=a;i<d.p.length;i+=3)m=Math.max(m,d.p[i]);return m}),radius:d.p.reduce((m,_,i)=>i%3?m:Math.max(m,Math.hypot(d.p[i],d.p[i+1],d.p[i+2])),0)}))};
resize();syncButton();requestAnimationFrame(tick);
