import * as THREE from 'three';
import {Cloud} from './geometry.js';
import {TAU,rng} from './math.js';

// Each world has complete secondary objects at three spatial scales. These are
// real glyph assemblies, not a screen-space particle overlay or star texture.
export const ACTIVITY_DESCRIPTIONS=[
 'Moving ribs and crossing binary streams at three depths.',
 'Data blocks, routing modules and vertical transfer traffic around the server city.',
 'Satellite nuclei and orbital systems throughout the electromagnetic volume.',
 'Rotating tetrahedral molecules and bond chains around the primary double helix.',
 'Rotating nested cubic frames around the original mathematical surfaces.',
 'Orbiting bodies and directional binary trains across the stellar field.',
 'Active neuron coronas, rotating compute clusters and propagating tensor packets.',
 'Secondary gear trains, shafts and axial transfer traffic.'
];
export function activityWorlds(){
 return Array.from({length:8},(_,world)=>{
  const R=rng(4000+world),positions=[],normals=[],centres=[],vectors=[],motions=[],weights=[],digits=[],seeds=[];
  const layers=[0,0,0],objects=[0,0,0];let radiusBound=0;
  function append(cloud,centre,layer,mode,rate,phase,axis,amplitude,scale=1){
   const d=cloud.data();objects[layer]++;
   let localRadius=0;for(let i=0;i<d.count;i++)localRadius=Math.max(localRadius,Math.hypot(...d.p.subarray(i*3,i*3+3))*scale);
   radiusBound=Math.max(radiusBound,Math.hypot(...centre)+localRadius+Math.abs(amplitude));
   for(let i=0;i<d.count;i++){
    positions.push(...d.p.subarray(i*3,i*3+3).map(v=>v*scale));
    normals.push(...d.n.subarray(i*3,i*3+3));centres.push(...centre);
    vectors.push(...axis,amplitude);motions.push(mode,rate,phase,layer);
    weights.push(d.w[i]);digits.push(R()>.5?1:0);seeds.push(R());layers[layer]++;
   }
  }
  for(let layer=0;layer<3;layer++)for(let j=0;j<[7,11,15][layer];j++){
   const angle=j/[7,11,15][layer]*TAU+layer*.53;
   const radius=[6.5,16,25][layer],size=[.65,1.0,.85][layer];
   let centre=[radius*Math.cos(angle),Math.sin(angle*2+layer)*[4,10,13][layer],radius*Math.sin(angle)];
   const c=new Cloud(700+world*100+layer*20+j);let mode=0,rate=.8+j*.037,axis=[.3,1,.2],amp=1.2;
   if(world===0){
    centre=[(9+layer*4)*Math.cos(angle),(9+layer*4)*Math.sin(angle),-23+j/[7,11,15][layer]*46];
    c.ring([0,0,0],1.3,140,2,.65,.08);
    for(let k=0;k<3;k++)c.line([-.9,k*.32-.32,0],[.9,k*.32-.32,0],.12,.83);
    mode=1;axis=[0,0,1];amp=4;rate=.9;
   }else if(world===1){
    c.box([0,0,0],[1.2,1.6,.8],.25,.73);
    for(let k=0;k<5;k++)c.line([-.48,-.6+k*.27,.45],[.48,-.6+k*.27,.45],.12,1);
    c.ring([0,0,0],1.6,70,1,.38);
    mode=1;axis=[0,1,0];amp=3.3;
   }else if(world===2){
    for(let k=0;k<3;k++){const a=k/3*TAU;c.ellipsoid([.43*Math.cos(a),.43*Math.sin(a),0],[.48,.48,.48],60,.92)}
    for(let k=0;k<3;k++)c.ring([0,0,0],1.65,100,k,.62);
    c.ellipsoid([1.65,0,0],[.18,.18,.18],34,1);
    axis=[1,.4,.7];rate=.9+j*.06;
   }else if(world===3){
    const v=[[1,1,1],[-1,-1,1],[-1,1,-1],[1,-1,-1]];
    for(const p of v)c.ellipsoid(p,[.33,.33,.33],50,.92);
    for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)c.tube(v[a],v[b],.06,24,.58);
    axis=[.5,1,.2];rate=.62+j*.045;
   }else if(world===4){
    for(const r of [.65,1.6]){
     for(let a=0;a<8;a++)for(let b=0;b<3;b++){const other=a^(1<<b);if(other>a){
      const p=[0,1,2].map(k=>(a>>k&1)?r:-r),q=[0,1,2].map(k=>(other>>k&1)?r:-r);c.line(p,q,.18,.72);
     }}
    }
    for(let a=0;a<8;a++)c.line([0,1,2].map(k=>(a>>k&1)?.65:-.65),[0,1,2].map(k=>(a>>k&1)?1.6:-1.6),.18,.45);
    axis=[.4,1,.65];rate=.7;
   }else if(world===5){
    centre=[radius*Math.cos(angle),Math.sin(angle*3)*[2,7,11][layer],radius*Math.sin(angle)];
    c.ellipsoid([0,0,0],[1,1,1],240,.7);
    c.ring([0,0,0],1.5,120,j%3,.45,.13);
    axis=[0,1,.25];amp=2;rate=.7;
   }else if(world===6){
    c.ellipsoid([0,0,0],[.63,.63,.63],150,.94);
    for(let k=0;k<3;k++)c.ring([0,0,0],1.3,85,k,.5);
    for(let k=0;k<6;k++){const a=k/6*TAU;c.line([.55*Math.cos(a),.55*Math.sin(a),0],[1.85*Math.cos(a),1.85*Math.sin(a),.5*Math.sin(a*3)],.13,.65)}
    axis=[0,0,1];mode=2;amp=.7;rate=1.2;
   }else{
    for(let ring=0;ring<2;ring++)for(let k=0;k<190;k++){
     const a=k/190*TAU,r=1.5+(Math.cos(a*12)>.1?.24:0);
     c.point([r*Math.cos(a),r*Math.sin(a),(ring-.5)*.5],[Math.cos(a),Math.sin(a),.3],.82);
    }
    c.ring([0,0,0],.55,60,2,.56);
    for(let k=0;k<5;k++){const a=k/5*TAU;c.line([.55*Math.cos(a),.55*Math.sin(a),0],[1.5*Math.cos(a),1.5*Math.sin(a),0],.14,.68)}
    c.tube([0,0,-.7],[0,0,.7],.22,70,.7);
    axis=[0,0,1];amp=0;rate=(j%2?1:-1)*1.25;
   }
   append(c,centre,layer,mode,rate,j*.31,axis,amp,size);
  }
  // Directional crossing events stay tied to each environment's structure.
  for(let layer=0;layer<3;layer++)for(let j=0;j<9;j++){
   const c=new Cloud(9000+world*100+layer*10+j),a=j/9*TAU;
   const radius=[5,13,22][layer],centre=[radius*Math.cos(a),(j-4)*2.1,radius*Math.sin(a)];
   for(let k=0;k<34;k++){
    const u=k/33;c.point([Math.sin(u*TAU)*.25,Math.cos(u*TAU)*.25,-u*2.3],[0,1,0],.28+.72*(1-u));
   }
   const axis=world===3?[0,1,0]:world===6?[0,0,1]:world===1?[1,0,0]:[Math.sin(a),.3,Math.cos(a)];
   append(c,centre,layer,1,1.8+j*.04,j*.17,axis,3.6,.8);
  }
  return {count:weights.length,radiusBound,layerCounts:layers,objectCounts:objects,
   p:new Float32Array(positions),n:new Float32Array(normals),centres:new Float32Array(centres),
   vectors:new Float32Array(vectors),motions:new Float32Array(motions),w:new Float32Array(weights),
   digit:new Float32Array(digits),seed:new Float32Array(seeds)};
 });
}
export function binaryActivity(data,texture){
 const geometry=new THREE.InstancedBufferGeometry(),quad=new THREE.PlaneGeometry(.64,1);
 geometry.index=quad.index;geometry.setAttribute('position',quad.attributes.position);geometry.setAttribute('uv',quad.attributes.uv);
 const uniforms={glyphAtlas:{value:texture},time:{value:0},opacity:{value:1},viewportHeight:{value:720},fogDistance:{value:.2},intensity:{value:1.7}};
 const material=new THREE.ShaderMaterial({uniforms,depthTest:true,depthWrite:true,side:THREE.DoubleSide,
 vertexShader:`
 attribute vec3 samplePosition;attribute vec3 sampleNormal;attribute vec3 centre;
 attribute vec4 vector;attribute vec4 motion;attribute float weight;attribute float digit;attribute float seed;
 uniform float time;uniform float viewportHeight;
 varying vec2 vUv;varying float vDigit;varying float vSeed;varying float vDepth;varying float vDensity;varying float vLight;
 vec3 rotate(vec3 p,vec3 a,float t){return p*cos(t)+cross(a,p)*sin(t)+a*dot(a,p)*(1.-cos(t));}
 void main(){
  vec3 axis=normalize(vector.xyz),up=abs(axis.y)>.9?vec3(1.,0.,0.):vec3(0.,1.,0.);
  vec3 u=normalize(cross(axis,up)),v=cross(axis,u);
  float angle=time*motion.y+motion.z*6.2831853,q=fract(angle/6.2831853),life=1.;
  vec3 c=centre;
  if(motion.x<.5)c+=vector.w*(u*cos(angle)+v*sin(angle));
  else if(motion.x<1.5){c+=axis*vector.w*(q*2.-1.);life=smoothstep(0.,.10,q)*(1.-smoothstep(.90,1.,q));}
  else c+=axis*vector.w*sin(angle*2.);
  vec3 p=c+rotate(samplePosition,axis,angle);
  vec3 n=normalize(mat3(modelMatrix)*rotate(sampleNormal,axis,angle));
  vec4 cp=modelViewMatrix*vec4(p,1.);
  float size=.26*length(modelMatrix[0].xyz);
  float projected=size*projectionMatrix[1][1]*viewportHeight/(2.*max(.0001,-cp.z));
  vDensity=min(1.,pow(projected/2.,2.))*(1.-smoothstep(80.,150.,projected))*life;
  size=max(size,2.*2.*max(.0001,-cp.z)/(projectionMatrix[1][1]*viewportHeight));
  cp.xy+=position.xy*size;gl_Position=projectionMatrix*cp;
  vUv=uv;vDigit=digit;vSeed=seed;vDepth=-cp.z;
  vLight=weight*(.34+.66*max(0.,dot(n,normalize(vec3(-.4,.7,1.)))))*(.88+.12*sin(angle*2.));
 }`,
 fragmentShader:`
 uniform sampler2D glyphAtlas;uniform float opacity;uniform float fogDistance;uniform float intensity;
 varying vec2 vUv;varying float vDigit;varying float vSeed;varying float vDepth;varying float vDensity;varying float vLight;
 void main(){
  if(vSeed>opacity*vDensity)discard;
  float a=texture2D(glyphAtlas,vec2((vUv.x+vDigit)*.5,vUv.y)).a;if(a<.43)discard;
  float light=clamp(vLight*intensity*exp(-vDepth/fogDistance),0.,1.);
  gl_FragColor=vec4(vec3(0.,1.,.25)*light,1.);
 }`});
 const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;
 function setData(d){
  for(const [name,a,size] of [['samplePosition',d.p,3],['sampleNormal',d.n,3],['centre',d.centres,3],['vector',d.vectors,4],['motion',d.motions,4],['weight',d.w,1],['digit',d.digit,1],['seed',d.seed,1]])geometry.setAttribute(name,new THREE.InstancedBufferAttribute(a,size));
  geometry.instanceCount=d.count;
 }
 setData(data);return {mesh,uniforms,setData};
}
