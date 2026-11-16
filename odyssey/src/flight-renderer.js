import * as THREE from 'three';
import {rng} from './math.js';
import {binaryActivity} from './activity.js';
import {binaryFlow} from './flow.js';

// One vertex per spatial glyph. Fixed buffers, no per-world attribute replacement.
// Small strokes fade in intensity as they recede rather than popping at a random LOD threshold.
const fragment=`
uniform sampler2D glyphAtlas;uniform float opacity;uniform float fogDistance;uniform float intensity;
varying float vDigit;varying float vDepth;varying float vLight;varying float vDensity;
void main(){
 vec2 uv=vec2((gl_PointCoord.x-.5)/.64+.5,1.-gl_PointCoord.y);
 if(uv.x<0.||uv.x>1.)discard;
 float a=texture2D(glyphAtlas,vec2((uv.x+vDigit)*.5,uv.y)).a;
 if(a<.15||vDepth<=0.)discard;
 float light=vLight*intensity*opacity*vDensity*exp(-vDepth/fogDistance);
 if(light<.006)discard;
 gl_FragColor=vec4(vec3(0.,1.,.25)*(1.-exp(-light*1.3)),a);
}`;
export function flightCloud(data,texture){
 const g=new THREE.BufferGeometry(),R=rng(621),packed=new Float32Array(data.count*3);
 for(let i=0;i<data.count;i++)packed.set([data.w[i],R()>.5?1:0,R()],i*3);
 g.setAttribute('position',new THREE.BufferAttribute(data.p,3));
 g.setAttribute('normal',new THREE.BufferAttribute(data.n,3));
 g.setAttribute('spin',new THREE.BufferAttribute(data.spin||new Float32Array(data.count*4),4));
 g.setAttribute('glyph',new THREE.BufferAttribute(packed,3));
 const uniforms={glyphAtlas:{value:texture},time:{value:0},opacity:{value:1},viewportHeight:{value:720},fogDistance:{value:.045},intensity:{value:1.8},glyphSize:{value:.28}};
 const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthTest:true,depthWrite:true,fragmentShader:fragment,
 vertexShader:`
 attribute vec4 spin;attribute vec3 glyph;
 uniform float time;uniform float viewportHeight;uniform float glyphSize;
 varying float vDigit;varying float vDepth;varying float vLight;varying float vDensity;
 void main(){
  float a=time*spin.w;mat2 rot=mat2(cos(a),sin(a),-sin(a),cos(a));
  vec3 p=position-spin.xyz;p.xy=rot*p.xy;p+=spin.xyz;
  vec3 n=normal;n.xy=rot*n.xy;n=normalize(mat3(modelMatrix)*n);
  vec4 cp=modelViewMatrix*vec4(p,1.);
  float scale=length(modelMatrix[0].xyz),depth=max(.000001,-cp.z);
  float projected=glyphSize*scale*projectionMatrix[1][1]*viewportHeight/(2.*depth);
  gl_PointSize=clamp(projected,1.8,32.);gl_Position=projectionMatrix*cp;
  vDensity=min(1.,pow(projected/1.8,1.35))*smoothstep(.7,2.7,depth/scale);
  vDepth=-cp.z;vDigit=glyph.y;
  vLight=glyph.x*(.42+.58*max(0.,dot(n,normalize(vec3(-.4,.7,1.)))));
 }`});
 g.computeBoundingSphere();g.boundingSphere.radius=Math.max(g.boundingSphere.radius,35);
 const mesh=new THREE.Points(g,material);mesh.frustumCulled=true;
 return {mesh,uniforms};
}
// Preserve approved world-specific motion equations, replacing only quad rasterization.
function convertToPoints(source,data,attributes,size){
 const old=source.mesh.geometry,g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(data.count*3),3));
 for(const [name,key,width] of attributes)g.setAttribute(name,new THREE.BufferAttribute(data[key],width));
 const material=source.mesh.material;
 let shader=material.vertexShader;
 shader=shader.replace('varying vec2 vUv;','');
 shader=shader.replace(/center\.xy\+=position\.xy\*size;gl_Position=projectionMatrix\*center;/,'gl_PointSize=clamp(projected,1.8,32.);gl_Position=projectionMatrix*center;');
 shader=shader.replace(/cp\.xy\+=position\.xy\*size;gl_Position=projectionMatrix\*cp;/,'gl_PointSize=clamp(projected,1.8,32.);gl_Position=projectionMatrix*cp;');
 shader=shader.replace(/vUv=uv;/g,'');
 shader=shader.replace(/vDensity=min\(1\.,pow\(projected\/2(?:\.2)?\.,2\.\)\)[^;]*;/g,'vDensity=min(1.,pow(projected/1.8,1.35));');
 // Keep linear-packet birth/death smooth. No random seed discards.
 if(shader.includes('float vWeight'))shader=shader.replace(/vWeight/g,'vLight');
 shader=shader.replace('vLight=weight;','vLight=weight;');
 shader=shader.replace('vLight=weight*','vDensity*=life;vLight=weight*');
 material.vertexShader=shader;material.fragmentShader=fragment;
 material.transparent=true;material.depthWrite=true;
 g.boundingSphere=new THREE.Sphere(new THREE.Vector3(),35);
 const mesh=new THREE.Points(g,material);mesh.frustumCulled=true;old.dispose();
 return {mesh,uniforms:source.uniforms};
}
export function flightActivity(data,texture){
 return convertToPoints(binaryActivity(data,texture),data,[['samplePosition','p',3],['sampleNormal','n',3],['centre','centres',3],['vector','vectors',4],['motion','motions',4],['weight','w',1],['digit','digit',1],['seed','seed',1]]);
}
export function flightFlow(data,texture){
 return convertToPoints(binaryFlow(data,texture),data,[['anchorA','a',3],['anchorB','b',3],['anchorC','c',3],['flow','params',4],['weight','weight',1],['digit','digit',1],['seed','seed',1]]);
}
