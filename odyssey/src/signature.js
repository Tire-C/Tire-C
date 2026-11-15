import * as THREE from 'three';
import {rng} from './math.js';
import {cameraAt,SIGNATURE_END} from './timeline.js';
// Glyph locations are sampled from typography, then lifted into a genuine world-space plane.
// The only rendered marks are still 0 and 1; the phrase itself is not a DOM overlay.
export function signature(count,source){
 const c=document.createElement('canvas');c.width=1400;c.height=240;
 const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.font='bold 150px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('Hi, I am Tire',700,120);
 const pixels=ctx.getImageData(0,0,c.width,c.height).data,pts=[];
 for(let y=25;y<220;y+=5)for(let x=20;x<1380;x+=4)if(pixels[(y*c.width+x)*4+3]>180)pts.push([(x-700)*.006,(120-y)*.006,0]);
 const pose=cameraAt(SIGNATURE_END),camera=new THREE.PerspectiveCamera();camera.position.set(...pose.position);camera.lookAt(...pose.target);
 const center=new THREE.Vector3(0,1.3,.2),p=new Float32Array(count*3),n=new Float32Array(count*3),w=new Float32Array(count);
 // Spatial correspondence prevents the old randomly crossing particle scramble.
 const inverse=camera.quaternion.clone().invert();
 const order=Array.from({length:count},(_,i)=>{
  const q=new THREE.Vector3(...source.p.subarray(i*3,i*3+3)).sub(center).applyQuaternion(inverse);
  return {i,key:Math.round(q.x*12)*10000+Math.round(q.y*12)};
 }).sort((a,b)=>a.key-b.key);
 pts.sort((a,b)=>Math.round(a[0]*12)-Math.round(b[0]*12)||a[1]-b[1]);
 for(let rank=0;rank<count;rank++){
  const i=order[rank].i,k=Math.min(pts.length-1,Math.floor(rank*pts.length/count));
  const v=new THREE.Vector3(...pts[k]).applyQuaternion(camera.quaternion).add(center);
  p.set(v.toArray(),i*3);n.set([0,0,1],i*3);
  w[i]=rank===Math.ceil(k*count/pts.length)?1:0;
 }
 return {p,n,w,count};
}
export function join(parts){
 const count=parts.reduce((s,d)=>s+d.count,0),p=new Float32Array(count*3),n=new Float32Array(count*3),w=new Float32Array(count),
  style=new Float32Array(count*3),glyphScale=new Float32Array(count),minimum=new Float32Array(count),digit=new Float32Array(count),seed=new Float32Array(count);
 let at=0;
 for(const d of parts){
  p.set(d.p,at*3);n.set(d.n,at*3);w.set(d.w.map(v=>v*(d.gain??1)),at);
  for(let i=0;i<d.count;i++)glyphScale[at+i]=(d.glyphScale??1)*(d.sampleScale?.[i]??1);
  for(let i=0;i<d.count;i++)style.set([d.contrast??1,d.surface??0,d.portrait??0],(at+i)*3);minimum.fill(d.minimum??0,at,at+d.count);
  // Match the independent clouds' digit and dissolve RNG exactly at the morph handover.
  const random=rng(987);
  digit.set(Float32Array.from({length:d.count},()=>random()>.5?1:0),at);
  seed.set(Float32Array.from({length:d.count},()=>random()),at);
  at+=d.count;
 }
 return {p,n,w,style,glyphScale,minimum,digit,seed,count};
}
