import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {worlds,creator} from './geometry.js';
import {depthOccluders} from './character.js';
import meta from './generated/character-meta.json' with {type:'json'};
import {activityWorlds,ACTIVITY_DESCRIPTIONS} from './activity.js';
import {flowWorlds,FLOW_DESCRIPTIONS} from './flow.js';
import {atlas,binaryCloud} from './renderer.js';
import {flightCloud,flightActivity,flightFlow} from './flight-renderer.js';
import {knowledgeBraid} from './braid.js';
import {cameraAt,stateAt,DURATION,HEAD,UNIVERSE_SCALE,CREATOR_TIME,CHAMBERS,WORLD_TIMES,JOURNEY_END,SIGNATURE_START,SIGNATURE_END,smooth} from './timeline.js';
import {signature,join} from './signature.js';
const canvas=document.querySelector('#stage'),message=document.querySelector('#message'),scrub=document.querySelector('#scrub'),timeLabel=document.querySelector('#time');
const query=new URLSearchParams(location.search),test=query.has('test'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance',preserveDrawingBuffer:test})}
catch(e){message.textContent='This experience needs WebGL 2. Your browser could not create a graphics context.';throw e}
renderer.setClearColor(0x000000,1);renderer.outputColorSpace=THREE.LinearSRGBColorSpace;
let quality=query.get('quality')||'auto',adaptive=1,frameEMA=16.7,badFrames=0,lastQualityChange=0;
function pixelRatio(){return test?1:Math.min(devicePixelRatio,quality==='detail'?1.5:1,Math.sqrt(1100000/(innerWidth*innerHeight)))*(quality==='flow'?.70:adaptive)}
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(66,1,.000025,100),texture=atlas();
const worldData=worlds(22000),flowData=flowWorlds(),activityData=activityWorlds(),parts=creator();
const worldGroups=CHAMBERS.map((chamber,i)=>{
 const group=new THREE.Group();group.position.copy(chamber.p).multiplyScalar(UNIVERSE_SCALE).add(new THREE.Vector3(...HEAD));
 group.quaternion.copy(chamber.q);group.scale.setScalar(UNIVERSE_SCALE);
 const core=flightCloud(worldData[i],texture),flow=flightFlow(flowData[i],texture),activity=flightActivity(activityData[i],texture);
 for(const c of [core,flow,activity])group.add(c.mesh);
 scene.add(group);return {group,core,flow,activity};
});
const braid=flightCloud(knowledgeBraid(),texture);braid.mesh.position.set(...HEAD);braid.mesh.scale.setScalar(UNIVERSE_SCALE);scene.add(braid.mesh);
braid.uniforms.intensity.value=1.35;
const all=join([
 {...parts.head,glyphScale:.0056/.024,minimum:1.9,gain:2.05/1.7,contrast:1,surface:.88,portrait:1},
 {...parts.body,glyphScale:.0115/.024,minimum:2.3,gain:2.05/1.7,contrast:1,surface:.70,portrait:1},
 {...parts.desk,glyphScale:1,minimum:4.2,gain:1.20/1.7}
]);
const head=binaryCloud(parts.head,texture,{size:.0056,fog:25,intensity:2.05,surface:.88,portrait:1});
const body=binaryCloud(parts.body,texture,{size:.0115,fog:25,intensity:2.05,surface:.70,portrait:1});
const desk=binaryCloud(parts.desk,texture,{size:.024,fog:25,intensity:1.20});
const finale=binaryCloud(all,texture,{size:.024,fog:40,intensity:1.7});finale.setTargets(all,signature(all.count,all));
const depth=depthOccluders();
for(const c of [head,body,desk])c.uniforms.lodStrength.value=.6;
head.uniforms.cutRange.value.set(...meta.cutRange);
for(const cloud of [head,body,desk,finale,...depth])scene.add(cloud.mesh);
const everyCloud=[...worldGroups.flatMap(w=>[w.core,w.flow,w.activity]),braid,head,body,desk,finale];
const controls=new OrbitControls(camera,canvas);controls.enabled=false;controls.enableDamping=false;
controls.addEventListener('change',()=>{if(controls.enabled&&!contextLost)renderer.render(scene,camera)});
let current=reduced.matches?CREATOR_TIME:0,playing=!reduced.matches&&!test,last=0,contextLost=false,ready=false,lastUI=-1;
const localCamera=new THREE.Vector3();
function resize(){
 renderer.setPixelRatio(pixelRatio());renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;
 for(const c of everyCloud)c.uniforms.viewportHeight.value=innerHeight*renderer.getPixelRatio();
 if(ready)render(current);
}
function render(t){
 current=Math.max(0,Math.min(DURATION,t));
 const state=stateAt(current),pose=cameraAt(current),reveal=smooth(11.2,11.85,current);
 camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(pose.fov)/2)*Math.max(1,1.5/camera.aspect)));camera.updateProjectionMatrix();
 camera.position.set(...pose.position);camera.up.set(Math.sin(pose.roll),Math.cos(pose.roll),0);camera.lookAt(...pose.target);camera.updateMatrixWorld();
 localCamera.copy(camera.position).sub(new THREE.Vector3(...HEAD)).divideScalar(UNIVERSE_SCALE);
 const cosmosFade=(1-smooth(11.7,12.05,current))*state.fade;
 for(let i=0;i<worldGroups.length;i++){
  const w=worldGroups[i],distance=CHAMBERS[i].p.distanceTo(localCamera);
  // Visibility is spatial and continuous. Neighbours coexist; there are no world-switch uploads.
  const opacity=(1-smooth(62,95,distance))*(1-reveal)+reveal;
  w.group.visible=current<SIGNATURE_START&&opacity*cosmosFade>.001;
  for(const c of [w.core,w.flow,w.activity]){
   c.uniforms.time.value=current*1.3;c.uniforms.opacity.value=opacity*cosmosFade;
   c.uniforms.fogDistance.value=(60+reveal*3000)*UNIVERSE_SCALE;
  }
 }
 braid.mesh.visible=current<SIGNATURE_START;braid.uniforms.time.value=current;
 braid.uniforms.opacity.value=cosmosFade;braid.uniforms.fogDistance.value=(60+reveal*3000)*UNIVERSE_SCALE;
 head.uniforms.minimumPixels.value=1.9;body.uniforms.minimumPixels.value=2.3;
 head.uniforms.cutaway.value=smooth(11.2,11.4,current)*(1-smooth(11.55,11.75,current));
 head.uniforms.opacity.value=state.head*state.fade;body.uniforms.opacity.value=desk.uniforms.opacity.value=state.body*state.fade;
 for(const c of [head,body,desk])c.mesh.visible=current<SIGNATURE_START&&c.uniforms.opacity.value>0;
 finale.mesh.visible=current>=SIGNATURE_START;finale.uniforms.morph.value=state.signature;finale.uniforms.opacity.value=state.fade;
 finale.uniforms.glyphSize.value=.024+state.signature*.026;finale.uniforms.minimumPixels.value=2;finale.uniforms.lodStrength.value=.6*(1-state.signature);
 for(const proxy of depth){
  proxy.uniforms.coverage.value=(proxy.part==='head'?smooth(11.55,11.8,current):state.body)*(1-smooth(0,.18,state.signature))*state.fade;
  proxy.uniforms.cutaway.value=proxy.part==='head'?head.uniforms.cutaway.value:0;proxy.mesh.visible=proxy.uniforms.coverage.value>0;
 }
 if(!contextLost)renderer.render(scene,camera);
 if(test||!playing||Math.abs(current-lastUI)>.1){scrub.value=current;timeLabel.textContent=current.toFixed(1)+' / '+DURATION;lastUI=current}
 return {t:current,...state,camera:pose,calls:renderer.info.render.calls,points:renderer.info.render.points,triangles:renderer.info.render.triangles};
}
function exitInspection(){controls.enabled=false;document.querySelector('#inspect').textContent='Inspect 3D'}
function syncButton(){const b=document.querySelector('#play');b.textContent=playing?'Pause':'Play';b.setAttribute('aria-label',playing?'Pause animation':'Play animation')}
function tick(now){
 if(last&&playing&&!document.hidden&&!contextLost&&ready){
  const dt=now-last;
  // Actual elapsed time, independent of display refresh. Never skip/hold at chapter boundaries.
  current+=dt/1000;if(current>DURATION)current%=DURATION;render(current);
  if(!test&&quality==='auto'&&dt<150){
   frameEMA=frameEMA*.96+dt*.04;badFrames=frameEMA>25?badFrames+1:Math.max(0,badFrames-2);
   if(badFrames>70&&now-lastQualityChange>2500&&adaptive>.56){adaptive=Math.max(.55,adaptive*.85);lastQualityChange=now;badFrames=0;resize()}
  }
 }last=now;requestAnimationFrame(tick);
}
document.querySelector('#play').onclick=()=>{exitInspection();playing=!playing;last=0;syncButton()};
document.querySelector('#restart').onclick=()=>{exitInspection();render(0);playing=true;last=0;syncButton()};
scrub.oninput=e=>{exitInspection();playing=false;render(Number(e.target.value));syncButton()};
document.querySelector('#inspect').onclick=()=>{if(controls.enabled){exitInspection();render(current)}else{playing=false;controls.target.set(...cameraAt(current).target);controls.enabled=true;controls.minDistance=.0005;controls.maxDistance=20;document.querySelector('#inspect').textContent='Return to film';controls.update()}syncButton()};
const qualitySelect=document.querySelector('#quality');qualitySelect.value=quality;qualitySelect.onchange=e=>{quality=e.target.value;adaptive=1;resize()};
addEventListener('resize',resize);document.addEventListener('visibilitychange',()=>{last=0});
reduced.addEventListener('change',e=>{if(e.matches){playing=false;render(CREATOR_TIME);syncButton()}});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;playing=false;message.textContent='Graphics context paused. Restore it or reload to continue.';syncButton()});
canvas.addEventListener('webglcontextrestored',()=>{contextLost=false;message.textContent='';render(current)});
const gl=renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');
window.odyssey={ready:false,seek:render,duration:DURATION,creatorTime:CREATOR_TIME,explorationDuration:JOURNEY_END,signatureStart:SIGNATURE_START,signatureEnd:SIGNATURE_END,worldTimes:WORLD_TIMES,cameraAt,stateAt,
 flowDescriptions:FLOW_DESCRIPTIONS,activityDescriptions:ACTIVITY_DESCRIPTIONS,
 activityOnlyTime:t=>{for(const w of worldGroups)w.activity.uniforms.time.value=t;renderer.render(scene,camera)},
 secondaryVisible:visible=>{for(const w of worldGroups){w.flow.mesh.visible=visible;w.activity.mesh.visible=visible}renderer.render(scene,camera)},
 surfaces:()=>{const a=[];scene.traverse(o=>{if(o.isMesh||o.isPoints)a.push({colorWrite:o.material.colorWrite,instanced:!!o.geometry.isInstancedBufferGeometry,points:!!o.isPoints})});return a},
 viewFrom:(position,target)=>{camera.position.set(...position);camera.lookAt(...target);renderer.render(scene,camera)},
 info:()=>({renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),webgl:gl.getParameter(gl.VERSION),revision:5,
  architecture:'Coexisting spatial chambers, arc-length flight, persistent point buffers',flowCounts:flowData.map(d=>d.count),activityCounts:activityData.map(d=>d.count),
  activityLayers:activityData.map(d=>d.layerCounts),activityObjects:activityData.map(d=>d.objectCounts),headCenter:HEAD,worldCount:worldData.length,
  worldPoints:worldData[0].count,headPoints:parts.head.count,bodyPoints:parts.body.count,deskPoints:parts.desk.count,playing,reduced:reduced.matches,current,
  drawCalls:renderer.info.render.calls,pointVertices:renderer.info.render.points,pixelRatio:renderer.getPixelRatio(),frameEMA,quality}),
 geometry:()=>worldData.map((d,i)=>({name:d.name,count:d.count,chamber:CHAMBERS[i].p.toArray(),
  min:[0,1,2].map(a=>{let m=Infinity;for(let k=a;k<d.p.length;k+=3)m=Math.min(m,d.p[k]);return m}),
  max:[0,1,2].map(a=>{let m=-Infinity;for(let k=a;k<d.p.length;k+=3)m=Math.max(m,d.p[k]);return m}),
  cranialBound:(CHAMBERS[i].p.length()+34)*UNIVERSE_SCALE}))};
async function enter(){
 message.textContent='Entering the binary mind…';resize();
 // Upload every immutable buffer and warm all programs BEFORE starting the cinematic clock.
 for(const w of worldGroups){w.group.visible=true;for(const c of [w.core,w.flow,w.activity])c.mesh.frustumCulled=false}
 camera.position.set(...cameraAt(0).position);camera.lookAt(...cameraAt(0).target);camera.updateMatrixWorld();
 await renderer.compileAsync(scene,camera);
 renderer.setSize(1,1,false);renderer.render(scene,camera);gl.finish();
 for(const w of worldGroups)for(const c of [w.core,w.flow,w.activity])c.mesh.frustumCulled=true;
 ready=true;window.odyssey.ready=true;resize();message.textContent='';syncButton();last=0;requestAnimationFrame(tick);
}
enter().catch(e=>{message.textContent='Unable to initialize the binary universe: '+e.message;console.error(e)});
