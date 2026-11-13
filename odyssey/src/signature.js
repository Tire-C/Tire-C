import * as THREE from 'three';
import {cameraAt} from './timeline.js';
// Glyph locations are sampled from typography, then lifted into a genuine world-space plane.
// The only rendered marks are still 0 and 1; the phrase itself is not a DOM overlay.
export function signature(count){
 const c=document.createElement('canvas');c.width=1400;c.height=240;
 const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.font='bold 150px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('Hi, I am Tire',700,120);
 const pixels=ctx.getImageData(0,0,c.width,c.height).data,pts=[];
 for(let y=25;y<220;y+=4)for(let x=20;x<1380;x+=4)if(pixels[(y*c.width+x)*4+3]>180)pts.push([(x-700)*.006,(120-y)*.006,0]);
 const pose=cameraAt(28),camera=new THREE.PerspectiveCamera();camera.position.set(...pose.position);camera.lookAt(...pose.target);
 const center=new THREE.Vector3(0,1.3,.2),p=new Float32Array(count*3),n=new Float32Array(count*3),w=new Float32Array(count);
 for(let i=0;i<count;i++){const v=new THREE.Vector3(...pts[Math.floor(i*pts.length/count)]).applyQuaternion(camera.quaternion).add(center);p.set(v.toArray(),i*3);n.set([0,0,1],i*3);w[i]=1}
 return {p,n,w,count};
}
export function join(parts){
 const count=parts.reduce((s,d)=>s+d.count,0),p=new Float32Array(count*3),n=new Float32Array(count*3),w=new Float32Array(count);let at=0;
 for(const d of parts){p.set(d.p,at*3);n.set(d.n,at*3);w.set(d.w,at);at+=d.count}
 return {p,n,w,count};
}
