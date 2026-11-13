import * as THREE from 'three';
import {rng} from './math.js';
export function atlas(){
 const canvas=document.createElement('canvas');canvas.width=128;canvas.height=96;
 const c=canvas.getContext('2d');c.clearRect(0,0,128,96);c.fillStyle='white';c.font='bold 76px monospace';c.textAlign='center';c.textBaseline='middle';c.fillText('0',32,48);c.fillText('1',96,48);
 const texture=new THREE.CanvasTexture(canvas);texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;return texture;
}
const vertex=`
attribute vec3 fromPosition;
attribute vec4 fromSpin;
attribute vec4 toSpin;
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
uniform float viewportHeight;
uniform float minimumPixels;
uniform float cutaway;
varying float vDensity;
varying float vCut;
varying vec2 vUv;
varying float vLight;
varying float vDigit;
varying float vSeed;
varying float vDepth;
vec3 spin(vec3 p,vec4 s){float a=time*s.w;vec3 q=p-s.xyz;return s.xyz+vec3(cos(a)*q.x-sin(a)*q.y,sin(a)*q.x+cos(a)*q.y,q.z);}
void main(){
 vec3 p=mix(spin(fromPosition,fromSpin),spin(toPosition,toSpin),morph);
 float envelope=sin(morph*3.14159265);
 p+=envelope*turbulence*vec3(sin(seed*71.0+time*.7),cos(seed*93.0+time*.6),sin(seed*53.0));
 vec3 n=normalize(mix(spin(fromNormal,vec4(0.,0.,0.,fromSpin.w)),spin(toNormal,vec4(0.,0.,0.,toSpin.w)),morph)+vec3(.00001));
 vec3 worldN=normalize(mat3(modelMatrix)*n);
 vec4 center=modelViewMatrix*vec4(p,1.0);
 float scale=length(modelMatrix[0].xyz);
 float size=glyphSize*scale;
 float projected=size*projectionMatrix[1][1]*viewportHeight/(2.0*max(.0001,-center.z));
 vDensity=min(1.0,pow(projected/minimumPixels,2.0));
 size=max(size,minimumPixels*2.0*max(.0001,-center.z)/(projectionMatrix[1][1]*viewportHeight));
 float facing=abs(dot(worldN,normalize(cameraPosition-(modelMatrix*vec4(p,1.0)).xyz)));
 vCut=cutaway*smoothstep(2.10,2.23,p.y)*smoothstep(.15,.45,facing);
 vDensity*=1.0-smoothstep(65.0,120.0,projected);
 // Glyphs remain in world space; only the small typographic quad faces the camera.
 center.xy+=position.xy*size;
 gl_Position=projectionMatrix*center;
 vUv=uv;vDigit=digit;vSeed=seed;vDepth=-center.z;
 vLight=weight*(.25+.75*max(0.0,dot(worldN,normalize(vec3(-.5,.85,1.0)))));
}`;
const fragment=`
uniform sampler2D glyphAtlas;
uniform float opacity;
uniform float fogDistance;
uniform float intensity;
varying float vDensity;
varying float vCut;
varying vec2 vUv;
varying float vLight;
varying float vDigit;
varying float vSeed;
varying float vDepth;
void main(){
 float a=texture2D(glyphAtlas,vec2((vUv.x+vDigit)*.5,vUv.y)).a;
 if(a<.43||vSeed>opacity*vDensity*(1.0-.98*vCut))discard;
 float fog=exp(-vDepth/fogDistance);
 float light=clamp(vLight*intensity*fog,0.0,1.0);
 gl_FragColor=vec4(vec3(0.0,1.0,.25)*light,1.0);
}`;
export function binaryCloud(data,texture,{size=.2,fog=100,intensity=1.4}={}){
 const g=new THREE.InstancedBufferGeometry(),q=new THREE.PlaneGeometry(.64,1);
 g.index=q.index;g.setAttribute('position',q.attributes.position);g.setAttribute('uv',q.attributes.uv);
 for(const [key,value] of Object.entries({fromPosition:data.p,toPosition:data.p,fromNormal:data.n,toNormal:data.n}))g.setAttribute(key,new THREE.InstancedBufferAttribute(value,3));
 g.setAttribute('fromSpin',new THREE.InstancedBufferAttribute(data.spin||new Float32Array(data.count*4),4));
 g.setAttribute('toSpin',new THREE.InstancedBufferAttribute(data.spin||new Float32Array(data.count*4),4));
 const random=rng(987);g.setAttribute('weight',new THREE.InstancedBufferAttribute(data.w,1));
 g.setAttribute('digit',new THREE.InstancedBufferAttribute(Float32Array.from({length:data.count},()=>random()>.5?1:0),1));
 g.setAttribute('seed',new THREE.InstancedBufferAttribute(Float32Array.from({length:data.count},()=>random()),1));
 g.instanceCount=data.count;
 const uniforms={glyphAtlas:{value:texture},morph:{value:0},glyphSize:{value:size},time:{value:0},turbulence:{value:0},opacity:{value:1},fogDistance:{value:fog},intensity:{value:intensity},viewportHeight:{value:720},minimumPixels:{value:4.2},cutaway:{value:0}};
 const material=new THREE.ShaderMaterial({uniforms,vertexShader:vertex,fragmentShader:fragment,depthTest:true,depthWrite:true,transparent:false,side:THREE.DoubleSide});
 const mesh=new THREE.Mesh(g,material);mesh.frustumCulled=false;
 return {mesh,uniforms,setTargets(a,b){g.setAttribute('fromSpin',new THREE.InstancedBufferAttribute(a.spin||new Float32Array(a.count*4),4));g.setAttribute('toSpin',new THREE.InstancedBufferAttribute(b.spin||new Float32Array(b.count*4),4));for(const [key,value] of Object.entries({fromPosition:a.p,toPosition:b.p,fromNormal:a.n,toNormal:b.n}))g.setAttribute(key,new THREE.InstancedBufferAttribute(value,3));g.setAttribute('weight',new THREE.InstancedBufferAttribute(a.w,1))}};
}
