import * as THREE from 'three';
import meta from './generated/character-meta.json' with {type:'json'};
export const DURATION=14, JOURNEY_END=11, CREATOR_TIME=11.94, SIGNATURE_START=12.05, SIGNATURE_END=12.45;
export const HEAD=meta.head, UNIVERSE_SCALE=.00065;
export const AXIS=new THREE.Vector3(.75,.36,1).normalize();
const clamp=x=>Math.max(0,Math.min(1,x));
export const smooth=(a,b,t)=>{const x=clamp((t-a)/(b-a));return x*x*x*(10+x*(-15+6*x))};
const up=new THREE.Vector3(0,1,0),rawEnd=new THREE.Vector3(-Math.sin(5.25),0,Math.cos(5.25)).normalize();
const rotation=new THREE.Quaternion().setFromUnitVectors(rawEnd,new THREE.Vector3(-AXIS.x,0,-AXIS.z).normalize());
// An analytic C-infinity spatial curve. Arc-length mapping removes parameter-speed pulses.
// Worlds coexist around the same folded path, entirely inside the cranial volume.
class MindRoute extends THREE.Curve{
 constructor(){super();this.arcLengthDivisions=4096}
 getPoint(u,out=new THREE.Vector3()){
  const a=-.35+5.6*u;
  return out.set(62*Math.cos(a),10*Math.sin(2*a),62*Math.sin(a)).applyQuaternion(rotation);
 }
}
export const route=new MindRoute();route.updateArcLengths();
export function frameAt(u){
 const p=route.getPointAt(clamp(u)),forward=route.getTangentAt(clamp(u));
 const back=forward.clone().negate(),right=new THREE.Vector3().crossVectors(up,back).normalize(),vertical=new THREE.Vector3().crossVectors(back,right).normalize();
 const q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right,vertical,back));
 return {p,right,vertical,back,q};
}
export const CHAMBERS=Array.from({length:8},(_,i)=>{
 const u=.045+i*.139, f=frameAt(Math.min(1,u));
 const p=i===7?route.getPointAt(1).addScaledVector(AXIS,-15):f.p.clone().addScaledVector(f.right,-4.4).addScaledVector(f.vertical,-1.4);
 const q=i===7?new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(AXIS,new THREE.Vector3(),up)):f.q;
 return {name:['Immersion','Programming','Physics','Chemistry','Mathematics','Astronomy','Intelligence','Engineering'][i],u:Math.min(1,u),p,q};
});
const end=route.getPointAt(1),internalTarget=end.clone().addScaledVector(AXIS,-15).multiplyScalar(UNIVERSE_SCALE).add(new THREE.Vector3(...HEAD));
const finalTarget=new THREE.Vector3(0,1.3,.2);
// Integrating the terminal speed taper avoids a sudden stop at the pullback.
// No ease-to-zero, cut or timer reset occurs between individual worlds.
function travelProgress(t){
 const taper=.25, flat=JOURNEY_END-taper, total=flat+taper*.5;
 if(t<=flat)return clamp(t/total);
 const v=clamp((t-flat)/taper);
 const integral=v-2.5*v**4+3*v**5-v**6;
 return clamp((flat+taper*integral)/total);
}
export function cameraAt(seconds){
 const t=Math.max(0,Math.min(DURATION,seconds));
 if(t<JOURNEY_END){
  const u=travelProgress(t),p=route.getPointAt(u);
  const forward=route.getPointAt(Math.min(1,u+.025)).sub(p);
  if(forward.lengthSq()<1e-8)forward.copy(route.getTangentAt(1));
  forward.normalize().lerp(AXIS.clone().negate(),smooth(10.35,10.9,t)).normalize();
  const position=p.multiplyScalar(UNIVERSE_SCALE).add(new THREE.Vector3(...HEAD));
  return {position:position.toArray(),target:position.clone().addScaledVector(forward,.02).toArray(),
   roll:-.13*Math.sin(u*Math.PI)*(1-smooth(10.2,10.9,t)),fov:66,u};
 }
 // A single straight withdrawal, with a fixed viewing direction: no portrait orbit.
 const q=smooth(JOURNEY_END,SIGNATURE_START,t);
 const distance=15*UNIVERSE_SCALE*Math.exp(Math.log(4.8/(15*UNIVERSE_SCALE))*q);
 const target=internalTarget.clone().lerp(finalTarget,smooth(11.38,SIGNATURE_START,t));
 return {position:target.clone().addScaledVector(AXIS,distance).toArray(),target:target.toArray(),roll:0,fov:66-13*smooth(11,12.05,t),u:1};
}
export function stateAt(t){
 const pose=cameraAt(t),k=CHAMBERS.reduce((best,c,i)=>Math.abs(c.u-pose.u)<Math.abs(CHAMBERS[best].u-pose.u)?i:best,0);
 return {world:k,morph:0,head:smooth(11.15,11.55,t),body:smooth(11.48,11.77,t),
  signature:smooth(SIGNATURE_START,SIGNATURE_END,t),fade:1-smooth(13.8,14,t),
  name:t<JOURNEY_END?CHAMBERS[k].name:t<11.77?'The mind':t<SIGNATURE_START?'The creator':'Hi, I am Tire'};
}
export const WORLD_TIMES=CHAMBERS.map(c=>Math.min(10.8,c.u*(JOURNEY_END-.125)-.26));
// Compatibility hooks for diagnostics; playback itself has no piecewise story clock.
export const storyTime=t=>t,playbackTime=t=>t;
