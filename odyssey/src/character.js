import * as THREE from 'three';
import model from './generated/character-data.json' with {type:'json'};
import {TAU} from './math.js';

function ints(encoded,type=Int16Array){
 const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
 return new type(bytes.buffer);
}
function unpackCloud(data){
 const a=ints(data.samples),p=new Float32Array(data.count*3),n=new Float32Array(data.count*3),w=new Float32Array(data.count);
 for(let i=0;i<data.count;i++){for(let j=0;j<3;j++){p[i*3+j]=a[i*7+j]/8192;n[i*3+j]=a[i*7+3+j]/32767}w[i]=a[i*7+6]/32767}
 return {p,n,w,count:data.count};
}
export function buildCharacter(Cloud){
 const head=unpackCloud(model.head),skin=unpackCloud(model.body),body=new Cloud(2),desk=new Cloud(3);
 for(let i=0;i<skin.count;i++)body.point(skin.p.subarray(i*3,i*3+3),skin.n.subarray(i*3,i*3+3),skin.w[i]);
 // Original unbranded footwear wraps the anatomically posed ankle landmarks.
 for(const s of [-1,1]){
  body.ellipsoid([s*.255,.133,.638],[.113,.086,.212],850,.57,p=>{p[1]=Math.max(.052,p[1]);return p});
  for(const y of [.055,.075])for(let i=0;i<190;i++){
   const a=i/190*TAU;body.point([s*.255+.115*Math.cos(a),y,.638+.207*Math.sin(a)],[Math.cos(a),.3,Math.sin(a)],.82);
  }
  for(let j=0;j<4;j++)body.line([s*.255-.045,.204-j*.007,.575+j*.031],[s*.255+.045,.204-j*.007,.585+j*.031],.009,.88);
 }
 // Workstation keeps the established composition; chair gains a curved mesh back and casters.
 desk.box([0,.884,-.02],[.75,.09,.62],.040,.39);
 for(let i=0;i<36;i++)for(let j=0;j<42;j++){const u=(i+.5)/36,v=j/42,x=(v-.5)*.70,y=1.02+u*.61;desk.point([x,y,-.255-.065*Math.sin(u*Math.PI)+.045*(x/.35)**2],[-x*.7,0,1],.30)}
 for(const s of [-1,1])desk.tube([s*.33,.90,-.23],[s*.33,1.60,-.23],.021,180,.4);
 desk.tube([0,.18,-.1],[0,.84,-.1],.052,420,.45);
 for(let i=0;i<5;i++){const a=i/5*TAU,p=[.45*Math.cos(a),.10,-.1+.45*Math.sin(a)];desk.tube([0,.2,-.1],p,.028,150,.40);desk.ellipsoid([p[0],.065,p[2]],[.052,.045,.035],110,.46)}
 desk.box([0,1.24,1.04],[1.95,.07,.84],.045,.65);
 for(const s of [-1,1])for(const z of [.69,1.39])desk.box([s*.87,.63,z],[.06,1.18,.06],.05,.4);
 desk.box([0,1.80,1.29],[1.10,.66,.075],.032,.45);
 desk.box([0,1.42,1.31],[.07,.24,.08],.03,.6);
 desk.box([0,1.30,1.26],[.36,.035,.23],.025,.65);
 for(let j=0;j<15;j++){const y=2.05-j*.033,len=12+(j*17)%26;for(let i=0;i<len;i++)desk.point([-.46+i*.021,y,1.245],[0,0,-1],.95)}
 desk.box([0,1.30,.86],[.70,.028,.25],.022,.7);
 for(let j=0;j<5;j++)for(let i=0;i<14;i++)desk.box([-.32+i*.048,1.325,.76+j*.045],[.036,.012,.03],.024,.9);
 desk.ellipsoid([.55,1.32,.87],[.05,.025,.075],180,.8);
 desk.box([.78,.47,1.12],[.29,.78,.43],.035,.4);
 for(let j=0;j<14;j++)desk.line([.65,.75-j*.034,.9],[.9,.75-j*.034,.9],.02,.7);
 for(let j=-14;j<=14;j++){desk.line([-2.1,.015,j*.15],[2.1,.015,j*.15],.10,.14);desk.line([j*.15,.015,-2.1],[j*.15,.015,2.1],.10,.14)}

 head.sampleScale=new Float32Array(head.count).fill(1);head.sampleScale.fill(.82,model.headSurfaceCount);head.sampleScale.fill(.34,model.headFeatureStart,model.headFeatureEnd);
 const bodyData=body.data();bodyData.sampleScale=new Float32Array(bodyData.count).fill(1);bodyData.sampleScale.fill(.62,0,model.skinCount);
 return {head,body:bodyData,desk:desk.data()};
}

// Anatomical triangle proxies only write depth. They never contribute a visible colour.
// Their slightly inset surface hides back-side glyphs while leaving front-side 0/1 strokes.
export function depthOccluders(){
 return ['head','body'].map(part=>{
  const data=model.occlusion[part],v=ints(data.vertices),p=Float32Array.from(v,x=>x/8192);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));
  g.setIndex(new THREE.BufferAttribute(ints(data.indices,Uint16Array),1));g.computeVertexNormals();
  const uniforms={coverage:{value:0},cutaway:{value:0},cutRange:{value:new THREE.Vector2(...model.meta.cutRange)}};
  const material=new THREE.ShaderMaterial({uniforms,colorWrite:false,depthWrite:true,depthTest:true,side:THREE.DoubleSide,
   vertexShader:`
    varying vec3 worldPosition;varying vec3 worldNormal;
    void main(){vec3 inset=position-normal*.0017;worldPosition=(modelMatrix*vec4(inset,1.)).xyz;
     worldNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*vec4(worldPosition,1.);}
   `,
   fragmentShader:`
    uniform float coverage;uniform float cutaway;uniform vec2 cutRange;
    varying vec3 worldPosition;varying vec3 worldNormal;
    void main(){
     float facing=abs(dot(normalize(worldNormal),normalize(cameraPosition-worldPosition)));
     float cut=cutaway*smoothstep(cutRange.x,cutRange.y,worldPosition.y)*smoothstep(.15,.45,facing);
     float noise=fract(sin(dot(floor(gl_FragCoord.xy),vec2(12.9898,78.233)))*43758.5453);
     if(noise>coverage*(1.-.98*cut))discard;
     gl_FragColor=vec4(0.);
    }
   `});
  const mesh=new THREE.Mesh(g,material);mesh.renderOrder=-5;mesh.frustumCulled=false;
  return {part,mesh,uniforms};
 });
}
