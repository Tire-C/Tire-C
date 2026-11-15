import * as THREE from 'three';
import meta from './generated/character-meta.json' with {type:'json'};
import {ramp,lerp} from './math.js';
export const DURATION=24,HEAD=meta.head,UNIVERSE_SCALE=meta.universeScale;
// 20.5 s moving story, then 3 s readable signature and a half-second fade.
export const storyTime=t=>t<20.5?t*56/41:t<23.5?28+(t-20.5)*7/6:31.5+t-23.5;
export const playbackTime=t=>t<28?t*41/56:t<31.5?20.5+(t-28)*6/7:23.5+t-31.5;
export const CREATOR_TIME=playbackTime(24);
const route=new THREE.CatmullRomCurve3([[0,1,24],[4,-2,12],[-11,5,15],[12,4,11],[-10,5,13],[13,9,16],[-8,3,15],[9,-2,16],[5,2,14]].map(p=>new THREE.Vector3(...p)),false,'catmullrom',.4);
const exitPoint=[5,2,14].map((v,i)=>HEAD[i]+v*UNIVERSE_SCALE),portrait=HEAD.map((v,i)=>v+[.44,.05,.68][i]),studio=[2.65,2.55,3.8];
export function cameraAt(seconds){
 const t=storyTime(seconds);let position,target,roll=0;
 if(t<=16){
  let u=t/16;if(t>15)u=(15+(t-15)+(t-15)**2-(t-15)**3)/16;
  const p=route.getPoint(Math.min(1,u));
  position=p.toArray().map((x,i)=>HEAD[i]+x*UNIVERSE_SCALE);
  target=[...HEAD];roll=.035*Math.sin(t*.55)*(1-ramp(t,14.5,16));
 }else if(t<22){position=lerp(exitPoint,portrait,ramp(t,16,22));target=lerp(HEAD,[HEAD[0],HEAD[1]-.06,HEAD[2]+.035],ramp(t,20,22))}
 else if(t<25){position=lerp(portrait,studio,ramp(t,22,25));target=lerp([HEAD[0],HEAD[1]-.06,HEAD[2]+.035],[0,1.22,.35],ramp(t,22,25))}
 else {position=lerp(studio,[5,3.6,7],ramp(t,25,28));target=lerp([0,1.22,.35],[0,1.3,.2],ramp(t,25,28))}
 return {position,target,roll};
}
export function stateAt(seconds){
 const t=storyTime(seconds),k=Math.min(7,Math.floor(t/2)),local=t/2-k;
 return {world:k,next:Math.min(7,k+1),morph:t<16?ramp(local,.65,1):0,
 head:ramp(t,16.2,19),body:ramp(t,18.5,21.5),signature:ramp(t,25,28),
 fade:1-ramp(t,31.5,32),name:t<16?['Immersion','Programming','Physics','Chemistry','Mathematics','Astronomy','Intelligence','Engineering'][k]:t<22?'The mind':t<25?'The creator':'Hi, I am Tire'};
}
