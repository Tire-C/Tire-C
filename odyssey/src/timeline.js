import * as THREE from 'three';
import {ramp,lerp} from './math.js';
export const DURATION=32,HEAD=[0,2.15,0],UNIVERSE_SCALE=.008;
const route=new THREE.CatmullRomCurve3([[0,1,24],[4,-2,12],[-11,5,15],[12,4,11],[-10,5,13],[13,9,16],[-8,3,15],[9,-2,16],[5,2,14]].map(p=>new THREE.Vector3(...p)),false,'catmullrom',.4);
export function cameraAt(t){
 let position,target,roll=0;
 if(t<=16){
  // Ease the last portion of travel into the uninterrupted backward reveal.
  let u=t/16;if(t>15)u=(15+(t-15)+(t-15)**2-(t-15)**3)/16;
  const p=route.getPoint(Math.min(1,u));
  position=p.toArray().map((x,i)=>HEAD[i]+x*UNIVERSE_SCALE);
  target=[...HEAD];roll=.035*Math.sin(t*.55)*(1-ramp(t,14.5,16));
 }else if(t<22){position=lerp([.04,2.166,.112],[1.05,2.36,1.65],ramp(t,16,22));target=[...HEAD]}
 else if(t<25){position=lerp([1.05,2.36,1.65],[3.4,2.9,4.7],ramp(t,22,25));target=lerp(HEAD,[0,1.25,.35],ramp(t,22,25))}
 else {position=lerp([3.4,2.9,4.7],[5,3.6,7],ramp(t,25,28));target=lerp([0,1.25,.35],[0,1.3,.2],ramp(t,25,28))}
 return {position,target,roll};
}
export function stateAt(t){
 const k=Math.min(7,Math.floor(t/2)),local=t/2-k;
 return {world:k,next:Math.min(7,k+1),morph:t<16?ramp(local,.65,1):0,
 head:ramp(t,16.2,19),body:ramp(t,18.5,21.5),signature:ramp(t,25,28),
 fade:1-ramp(t,31.5,32),name:t<16?['Immersion','Programming','Physics','Chemistry','Mathematics','Astronomy','Intelligence','Engineering'][k]:t<22?'The mind':t<25?'The creator':'Hi, I am Tire'};
}
