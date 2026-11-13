import * as THREE from 'three';
import {rng} from './math.js';
export function atlas(){
 const canvas=document.createElement('canvas');canvas.width=128;canvas.height=96;
 const c=canvas.getContext('2d');c.clearRect(0,0,128,96);c.fillStyle='white';c.font='bold 76px monospace';c.textAlign='center';c.textBaseline='middle';c.fillText('0',32,48);c.fillText('1',96,48);
 const texture=new THREE.CanvasTexture(canvas);texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;return texture;
}
const vertex=`
attribute vec3 fromPosition;
attribute vec3 toPosition;
attribute vec3 fromNormal;
attribute vec3 toNormal;
attribute float weight;
attribute float digit;
attribute float seed;
uniform float morph;
uniform float glyphSize;
uniform float time;
uniform float turbulence;
varying vec2 vUv;
varying float vLight;
varying float vDigit;
varying float vSeed;
varying float vDepth;
void main(){
 vec3 p=mix(fromPosition,toPosition,morph);
 float envelope=sin(morph*3.14159265);
 p+=envelope*turbulence*vec3(sin(seed*71.0+time*.7),cos(seed*93.0+time*.6),sin(seed*53.0));
 vec3 n=normalize(mix(fromNormal,toNormal,morph)+vec3(.00001));
 vec3 worldN=normalize(mat3(modelMatrix)*n);
 vec4 center=modelViewMatrix*vec4(p,1.0);
 float scale=length(modelMatrix[0].xyz);
 float size=glyphSize*scale;
 // Glyphs remain in world space; only the small typographic quad faces the camera.
 center.xy+=position.xy*size;
 gl_Position=projectionMatrix*center;
 vUv=uv;vDigit=digit;vSeed=seed;vDepth=-center.z;
 vLight=weight*(.28+.72*abs(dot(worldN,normalize(vec3(-.5,.85,1.0)))));
}`;
const fragment=`
uniform sampler2D glyphAtlas;
uniform float opacity;
uniform float fogDistance;
uniform float intensity;
varying vec2 vUv;
varying float vLight;
varying float vDigit;
varying float vSeed;
varying float vDepth;
void main(){
 float a=texture2D(glyphAtlas,vec2((vUv.x+vDigit)*.5,vUv.y)).a;
 if(a<.43||vSeed>opacity)discard;
 float fog=exp(-vDepth/fogDistance);
 float light=clamp(vLight*intensity*fog,0.0,1.0);
 gl_FragColor=vec4(vec3(0.0,1.0,.25)*light,1.0);
}`;
export function binaryCloud(data,texture,{size=.2,fog=100,intensity=1.4}={}){
 const g=new THREE.InstancedBufferGeometry(),q=new THREE.PlaneGeometry(.64,1);
 g.index=q.index;g.setAttribute('position',q.attributes.position);g.setAttribute('uv',q.attributes.uv);
 for(const [key,value] of Object.entries({fromPosition:data.p,toPosition:data.p,fromNormal:data.n,toNormal:data.n}))g.setAttribute(key,new THREE.InstancedBufferAttribute(value,3));
 const random=rng(987);g.setAttribute('weight',new THREE.InstancedBufferAttribute(data.w,1));
 g.setAttribute('digit',new THREE.InstancedBufferAttribute(Float32Array.from({length:data.count},()=>random()>.5?1:0),1));
 g.setAttribute('seed',new THREE.InstancedBufferAttribute(Float32Array.from({length:data.count},()=>random()),1));
 g.instanceCount=data.count;
 const uniforms={glyphAtlas:{value:texture},morph:{value:0},glyphSize:{value:size},time:{value:0},turbulence:{value:0},opacity:{value:1},fogDistance:{value:fog},intensity:{value:intensity}};
 const material=new THREE.ShaderMaterial({uniforms,vertexShader:vertex,fragmentShader:fragment,depthTest:true,depthWrite:true,transparent:false,side:THREE.DoubleSide});
 const mesh=new THREE.Mesh(g,material);mesh.frustumCulled=false;
 return {mesh,uniforms,setTargets(a,b){for(const [key,value] of Object.entries({fromPosition:a.p,toPosition:b.p,fromNormal:a.n,toNormal:b.n}))g.setAttribute(key,new THREE.InstancedBufferAttribute(value,3));g.setAttribute('weight',new THREE.InstancedBufferAttribute(a.w,1))}};
}
