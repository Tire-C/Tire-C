import * as THREE from 'three';
import meta from './generated/character-meta.json' with {type:'json'};
import {ramp,lerp} from './math.js';
export const DURATION=16,HEAD=meta.head,UNIVERSE_SCALE=meta.universeScale;
// A 16 s trip: 8.8 s worlds, 2.6 s mind reveal, 1.8 s creator,
// 1 s signature assembly, 1.5 s reading and a 0.3 s fade.
const beats=[[0,0],[8.8,16],[11.4,22],[13.2,25],[14.2,28],[15.7,31.5],[16,32]];
function mapTime(t,inAxis,outAxis){
 for(let i=1;i<beats.length;i++)if(t<=beats[i][inAxis]){
  const a=beats[i-1],b=beats[i],u=(t-a[inAxis])/(b[inAxis]-a[inAxis]);
  return a[outAxis]+u*(b[outAxis]-a[outAxis]);
 }
 return beats.at(-1)[outAxis];
}
export const storyTime=t=>mapTime(t,0,1),playbackTime=t=>mapTime(t,1,0);
export const CREATOR_TIME=playbackTime(24);
const route=new THREE.CatmullRomCurve3([
 [0,1,27],[3,-1,16],[5,3,9],[-5,1,8],[-11,4,12],[-2,2,8],
 [8,6,10],[3,-3,8],[-9,-1,10],[-4,6,8],[12,9,12],[4,3,9],
 [-7,3,14],[2,-3,6],[9,-2,12],[3,5,8],[5,2,14]
].map(p=>new THREE.Vector3(...p)),false,'catmullrom',.38);
const exitPoint=[5,2,14].map((v,i)=>HEAD[i]+v*UNIVERSE_SCALE);
const portrait=HEAD.map((v,i)=>v+[.24,-.19,.57][i]),studio=[2.25,2.45,3.25];
export function cameraAt(seconds){
 const t=storyTime(seconds);let position,target,roll=0,fov=53;
 if(t<=16){
  let u=t/16;if(t>15)u=(15+(t-15)+(t-15)**2-(t-15)**3)/16;
  const p=route.getPoint(Math.min(1,u));
  position=p.toArray().map((x,i)=>HEAD[i]+x*UNIVERSE_SCALE);
  const envelope=ramp(t,0,.4)*(1-ramp(t,14.8,16));
  target=HEAD.map((v,i)=>v+UNIVERSE_SCALE*[1.3*Math.sin(t*.82),1.1*Math.sin(t*1.12),.65*Math.cos(t*.9)][i]*envelope);
  roll=(.14*Math.sin(t*1.15)+.045*Math.sin(t*2.3))*envelope;
  fov=53+(8+4*Math.sin(t*1.7))*envelope;
 }else if(t<22){
  position=lerp(exitPoint,portrait,ramp(t,16,22));
  target=lerp(HEAD,[HEAD[0],HEAD[1]-.09,HEAD[2]+.045],ramp(t,19,22));
 }else if(t<25){
  position=lerp(portrait,studio,ramp(t,22,25));
  target=lerp([HEAD[0],HEAD[1]-.09,HEAD[2]+.045],[0,1.30,.38],ramp(t,22,25));
 }else{
  position=lerp(studio,[4.4,3.3,6.4],ramp(t,25,28));
  target=lerp([0,1.30,.38],[0,1.3,.2],ramp(t,25,28));
 }
 return {position,target,roll,fov};
}
export function stateAt(seconds){
 const t=storyTime(seconds),k=Math.min(7,Math.floor(t/2)),local=t/2-k;
 return {world:k,next:Math.min(7,k+1),morph:t<16?ramp(local,.72,1):0,
 head:ramp(t,16.2,19),body:ramp(t,18.5,21.5),signature:ramp(t,25,28),
 fade:1-ramp(t,31.5,32),name:t<16?['Immersion','Programming','Physics','Chemistry','Mathematics','Astronomy','Intelligence','Engineering'][k]:t<22?'The mind':t<25?'The creator':'Hi, I am Tire'};
}
