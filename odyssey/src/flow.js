import * as THREE from 'three';
import {TAU,rng} from './math.js';

// Small coherent packets, always in the same 3D coordinate system as their host world.
export const FLOW_DESCRIPTIONS=[
 'Helical packets travel along the tunnel walls.',
 'Data packets traverse the existing floor buses and server risers.',
 'Charge packets orbit in the atomic planes.',
 'Binary pulses climb both strands of the molecular helix.',
 'Small packets follow the mathematical surface parametrization.',
 'Orbital debris circles the ringed planet and the galactic disk.',
 'Signals travel along existing connections between neural layers.',
 'Shaft pulses and rim markers follow the mechanical assemblies.'
];
export function flowWorlds(){
 return Array.from({length:8},(_,world)=>{
  const a=[],b=[],c=[],params=[],weight=[],digit=[],seed=[],R=rng(860+world);
  function point(A,B,C,mode,rate,phase,w=1){
   a.push(...A);b.push(...B);c.push(...C);params.push(mode,rate,phase,world===2?1:0);weight.push(w);digit.push(R()>.5?1:0);seed.push(R());
  }
  function packet(A,B,C,mode,rate,phase,length=18){
   const count=Math.round(length*2.4);for(let j=0;j<count;j++)point(A,B,C,mode,rate*1.8,phase-j*.0035,.40+.60*(1-j/count)**1.4);
  }
  if(world===0)for(let lane=0;lane<24;lane++)packet([lane/24*TAU,0,0],[0,0,0],[0,0,0],4,.18,lane*.137,18);
  if(world===1){
   for(let x=-3;x<=3;x++)for(let z=-3;z<=3;z++)if(x&&((x+z)%2===0)){
    packet([x*7,-6.90,z*7],[0,-6.90,z*7],[0,.035,0],0,.32,R(),14);
    packet([x*7+1.23,-6,z*7+1.5],[x*7+1.23,-4,z*7+1.5],[0,0,.03],0,.45,R(),9);
   }
  }
  if(world===2)for(let j=0;j<7;j++){
   const r=7+j*1.1,tilt=j*Math.PI/7;
   for(let cluster=0;cluster<2;cluster++)packet([0,0,0],[r,0,0],[0,r*Math.sin(tilt),r*Math.cos(tilt)],1,.16+j*.016,cluster*.5+j*.13,20);
  }
  if(world===3)for(let strand=0;strand<2;strand++)for(let j=0;j<14;j++)
   packet([strand*Math.PI,-21,0],[6,21,6],[0,0,0],2,.12,j/14,15);
  if(world===4)for(let band=0;band<12;band++)packet([band/12*TAU,0,0],[0,0,0],[0,0,0],3,.10+band*.003,band*.071,22);
  if(world===5){
   for(let j=0;j<14;j++)packet([11,5,5],[5.15+j*.026,0,0],[0,0,5.15+j*.026],1,.09,j/14,12);
   for(let j=0;j<12;j++){const r=8+j*1.5;packet([0,(j%3-1)*.6,0],[r,0,0],[0,0,r],1,.08/(1+j*.05),j*.17,14)}
  }
  if(world===6)for(let layer=0;layer<5;layer++)for(let i=0;i<9;i++){
   const j=(i+3-layer%3)%9;
   if((i+j+layer)%3!==0)continue;
   const angle=i/9*TAU,other=j/9*TAU;
   packet([8*Math.cos(angle),8*Math.sin(angle),(layer-2.5)*7],[8*Math.cos(other),8*Math.sin(other),(layer-1.5)*7],[0,0,0],0,.52, i*.11-layer*.17,22);
  }
  if(world===7)for(const [x,y,z,r,rate] of [[-7,0,0,7,.24],[6,0,0,6,-.28],[0,10,-7,4.5,-.28],[0,-10,6,4.5,-.28]]){
   for(let j=0;j<8;j++)packet([x,y,z],[r+.45,0,0],[0,r+.45,0],1,rate/TAU,j/8,8);
   for(let j=0;j<4;j++)packet([x+.72*Math.cos(j*TAU/4),y+.72*Math.sin(j*TAU/4),z-4.8],[x+.72*Math.cos(j*TAU/4),y+.72*Math.sin(j*TAU/4),z+4.8],[0,0,0],0,.32,j/4,15);
  }
  return {count:weight.length,a:new Float32Array(a),b:new Float32Array(b),c:new Float32Array(c),params:new Float32Array(params),weight:new Float32Array(weight),digit:new Float32Array(digit),seed:new Float32Array(seed)};
 });
}
export function binaryFlow(data,texture){
 const geometry=new THREE.InstancedBufferGeometry(),quad=new THREE.PlaneGeometry(.64,1);
 geometry.index=quad.index;geometry.setAttribute('position',quad.attributes.position);geometry.setAttribute('uv',quad.attributes.uv);
 const uniforms={glyphAtlas:{value:texture},time:{value:0},opacity:{value:1},viewportHeight:{value:720},fogDistance:{value:.2},intensity:{value:1.7}};
 const material=new THREE.ShaderMaterial({uniforms,depthWrite:true,depthTest:true,side:THREE.DoubleSide,
 vertexShader:`
  attribute vec3 anchorA;attribute vec3 anchorB;attribute vec3 anchorC;
  attribute vec4 flow;attribute float weight;attribute float digit;attribute float seed;
  uniform float time;uniform float viewportHeight;
  varying vec2 vUv;varying float vDigit;varying float vSeed;varying float vDepth;varying float vDensity;varying float vWeight;
  const float TAU=6.28318530718;
  void main(){
   float q=fract(time*flow.y+flow.z),angle=q*TAU;vec3 p;
   if(flow.x<.5)p=mix(anchorA,anchorB,q)+anchorC;
   else if(flow.x<1.5)p=anchorA+anchorB*cos(angle)+anchorC*sin(angle);
   else if(flow.x<2.5){float y=mix(anchorA.y,anchorB.y,q);float a=.375*y+8.1+anchorA.x;p=vec3(6.*cos(a),y,6.*sin(a));}
   else if(flow.x<3.5){float u=angle,v=anchorA.x,r=9.+3.*cos(v*3.+u*2.);p=vec3(r*cos(u),4.*sin(v)+2.*sin(u*3.),r*sin(u));}
   else{float z=mix(-32.,32.,q),a=anchorA.x+z*.12,r=7.+2.*sin(z*.19);p=vec3(r*cos(a)+3.*sin(z*.1),r*sin(a),z);}
   if(flow.w>.5){float turn=time*.12;p.xy=mat2(cos(turn),sin(turn),-sin(turn),cos(turn))*p.xy;}
   vec4 center=modelViewMatrix*vec4(p,1.);
   float size=.40*length(modelMatrix[0].xyz),projected=size*projectionMatrix[1][1]*viewportHeight/(2.*max(.0001,-center.z));
   vDensity=min(1.,pow(projected/2.2,2.))*(1.-smoothstep(65.,120.,projected));
   size=max(size,2.2*2.*max(.0001,-center.z)/(projectionMatrix[1][1]*viewportHeight));
   center.xy+=position.xy*size;gl_Position=projectionMatrix*center;
   vUv=uv;vDigit=digit;vSeed=seed;vDepth=-center.z;vWeight=weight;
   if(flow.x<.5||flow.x>3.5||flow.x>1.5&&flow.x<2.5)vWeight*=smoothstep(0.,.055,q)*(1.-smoothstep(.945,1.,q));
  }`,
 fragmentShader:`
  uniform sampler2D glyphAtlas;uniform float opacity;uniform float fogDistance;uniform float intensity;
  varying vec2 vUv;varying float vDigit;varying float vSeed;varying float vDepth;varying float vDensity;varying float vWeight;
  void main(){
   if(vWeight<.015||vSeed>opacity*vDensity)discard;
   float alpha=texture2D(glyphAtlas,vec2((vUv.x+vDigit)*.5,vUv.y)).a;
   if(alpha<.43)discard;
   float light=clamp(vWeight*intensity*exp(-vDepth/fogDistance),0.,1.);
   gl_FragColor=vec4(vec3(0.,1.,.25)*light,1.);
  }`});
 const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;
 function setData(d){
  for(const [name,values,size] of [['anchorA',d.a,3],['anchorB',d.b,3],['anchorC',d.c,3],['flow',d.params,4],['weight',d.weight,1],['digit',d.digit,1],['seed',d.seed,1]])geometry.setAttribute(name,new THREE.InstancedBufferAttribute(values,size));
  geometry.instanceCount=d.count;
 }
 setData(data);return {mesh,uniforms,setData};
}
