import {TAU,norm,cross,sub,add,mul} from './math.js';

// Original procedural character. All surfaces are sampled into binary glyph positions.
// Dimensions share one metre-like coordinate system with the existing workstation.
const gaussian=(x,s)=>Math.exp(-.5*(x/s)**2);
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function profile(rows,t){
 let k=0;while(k<rows.length-2&&t>rows[k+1][0])k++;
 const a=rows[k],b=rows[k+1],prev=rows[Math.max(0,k-1)],next=rows[Math.min(rows.length-1,k+2)],
  dt=b[0]-a[0],s=clamp((t-a[0])/dt);
 return a.slice(1).map((x,i)=>{
  const y=b[i+1],m0=(y-prev[i+1])/(b[0]-prev[0])*dt,m1=(next[i+1]-x)/(next[0]-a[0])*dt;
  return (2*s*s*s-3*s*s+1)*x+(s*s*s-2*s*s+s)*m0+(-2*s*s*s+3*s*s)*y+(s*s*s-s*s)*m1;
 });
}
function sample(c,nu,nv,fn,weight=()=>1,transform=p=>p){
 const eps=.00008;
 for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){
  const u=(i+.5)/nu,v=(j+.5*(i%2))/nv;
  const p=transform(fn(u,v)),du=sub(transform(fn(clamp(u+eps),v)),transform(fn(clamp(u-eps),v))),
   dv=sub(transform(fn(u,v+eps)),transform(fn(u,v-eps)));
  c.point(p,cross(dv,du),weight(u,v));
 }
}
const pitch=.085;
function headTransform(p){
 const y=p[1]-1.88,z=p[2]-.025;
 return [p[0],1.88+y*Math.cos(pitch)-z*Math.sin(pitch),.025+y*Math.sin(pitch)+z*Math.cos(pitch)];
}
const headRows=[
 [0,.055,.052,.035,.098],[.055,.103,.096,.065,.072],[.15,.145,.139,.115,.040],
 [.28,.166,.153,.158,.022],[.46,.186,.166,.187,.010],[.65,.184,.173,.199,0],
 [.80,.167,.158,.184,-.006],[.93,.115,.115,.132,-.010],[1,.001,.001,.001,-.012]
];
function face(u,v){
 const y=1.835+u*.505,a=v*TAU,[width,front,back,zc]=profile(headRows,u),ca=Math.cos(a),x=width*Math.sin(a);
 let z=zc+(ca>0?front:back)*ca;
 const F=Math.max(0,ca)**5,G=(cx,cy,sx,sy)=>gaussian(x-cx,sx)*gaussian(y-cy,sy);
 // One continuous facial surface: orbital sockets, cheekbones, nasal bridge, alae,
 // philtrum, two lips and chin. There are no pasted-on eyeballs or cheek spheres.
 let dz=.025*G(0,1.884,.070,.032)+.012*G(0,2.185,.13,.07);
 for(const s of [-1,1]){
  dz+=.018*G(s*.124,2.066,.040,.043)-.030*G(s*.078,2.112,.047,.024);
  dz+=.016*G(s*.078,2.147,.051,.015);
  dz+=.027*G(s*.038,2.021,.025,.022);
  dz-=.009*G(s*.065,1.985,.011,.029);
 }
 dz+=.028*G(0,2.083,.029,.066)+.041*G(0,2.032,.050,.029);
 dz-=.010*G(0,1.987,.014,.016);
 dz+=.025*G(0,1.967,.054,.010)+.030*G(0,1.943,.058,.012);
 dz-=.010*G(0,1.954,.061,.0035);
 return [x,y,z+F*dz];
}
function skinWeight(u,v){
 const p=face(u,v),x=p[0],y=p[1],front=Math.cos(v*TAU);
 let w=.80;
 const hairline=.65+.09*Math.max(0,front);if(u>hairline)w*=.40;
 if(front>.45){
  for(const s of [-1,1]){
   const dx=(x-s*.078)/.036,eye=(dx*dx+((y-2.111)/.011)**2);
   if(eye<1){
    const iris=Math.hypot(x-s*.078,y-2.108);
    w*=iris<.004?.09:iris<.009?.30:.70;
   } // Sclera, iris and pupil remain green binary samples inside the recessed lids.
   const browY=2.148+.006*Math.cos(clamp(dx,-1,1)*Math.PI/2);
   if(Math.abs(dx)<1.12)w*=1-.68*gaussian(y-browY,.0045);
   w*=1-.88*gaussian(x-s*.031,.010)*gaussian(y-2.010,.0045);
  }
  const mouthY=1.954+.004*Math.cos(x/.065*Math.PI);
  w*=1-.82*gaussian(x,.057)*gaussian(y-mouthY,.0028);
 }
 return w;
}
function sweep(c,points,radii,count=1000,w=.7,fold=.025){
 // Smooth cubic centreline and varying elliptical section avoid cylindrical joints.
 function at(t){
  const f=clamp(t)*(points.length-1),k=Math.min(points.length-2,Math.floor(f)),s=f-k,
   a=points[Math.max(0,k-1)],b=points[k],d=points[k+1],e=points[Math.min(points.length-1,k+2)];
  const p=b.map((x,i)=>.5*((2*x)+(-a[i]+d[i])*s+(2*a[i]-5*x+4*d[i]-e[i])*s*s+(-a[i]+3*x-3*d[i]+e[i])*s*s*s));
  const rr=radii[k].map((r,i)=>r+(radii[k+1][i]-r)*s);
  return {p,rr};
 }
 const fn=(t,v)=>{
  const {p,rr}=at(t),axis=norm(sub(at(Math.min(1,t+.001)).p,at(Math.max(0,t-.001)).p)),
   u=norm(cross(axis,Math.abs(axis[1])>.9?[1,0,0]:[0,1,0])),b=cross(axis,u),a=v*TAU,
   wrinkle=1+fold*(Math.sin(t*31+a*3)+.4*Math.sin(t*63-a*5));
  return add(p,add(mul(u,Math.cos(a)*rr[0]*wrinkle),mul(b,Math.sin(a)*rr[1]*wrinkle)));
 };
 sample(c,Math.ceil(count/32),32,fn,()=>w);
}
function ellipse(c,center,rx,rz,count,w){
 for(let i=0;i<count;i++){const a=i/count*TAU;c.point([center[0]+rx*Math.sin(a),center[1],center[2]+rz*Math.cos(a)],[Math.sin(a),.45,Math.cos(a)],w)}
}
export function buildCharacter(Cloud){
 const head=new Cloud(1),body=new Cloud(2),desk=new Cloud(3);
 sample(head,100,156,face,skinWeight,headTransform);
 // Upper and lower eyelid rims follow the recessed orbital surface.
 for(const s of [-1,1])for(const side of [-1,1])for(let i=0;i<32;i++){
  const dx=-1+2*i/31,x=s*.078+dx*.036,y=2.111+side*.011*Math.sqrt(Math.max(0,1-dx*dx)),
   u=(y-1.835)/.505,width=profile(headRows,u)[0],v=Math.asin(x/width)/TAU,p=face(u,v);
  p[2]+=.003;head.point(headTransform(p),[0,0,1],side>0?.44:.32);
 }
 // Anatomically placed ears: pinna, recessed concha and curved helix; original geometry.
 for(const s of [-1,1]){
  sample(head,38,42,(u,v)=>{
   const a=v*TAU,r=Math.sqrt(Math.max(0,1-(2*u-1)**2));
   return [s*(.182+.025*r*Math.cos(a)-.017*gaussian(2*u-1,.55)*Math.max(0,Math.cos(a))**3),2.073+(2*u-1)*.060,.003+.034*r*Math.sin(a)];
  },(u,v)=>.28+.20*Math.abs(2*u-1),headTransform);
  for(let i=0;i<180;i++){const a=i/180*TAU;head.point(headTransform([s*(.199+.008*Math.cos(a)),2.073+.050*Math.sin(a),.009+.021*Math.cos(a)]),[s,.2,.3],.53)}
 }
 // Short coiled top with a graduated temple fade. No downloaded model or franchise asset.
 for(let i=0;i<460;i++){
  const a=i*2.3999632297,front=Math.max(0,Math.cos(a)),u0=.62+.375*(i+.5)/460;
  if(u0<.65+.09*front)continue;
  const p=face(u0,a/TAU),n=norm([p[0]/.186,(p[1]-2.10)/.24,p[2]/.20]),
   u=norm(cross(n,[0,0,1])),v=cross(n,u),length=.003+.011*clamp((u0-.65)/.22);
  for(let j=0;j<14;j++){
   const t=j/13,angle=t*TAU*1.35,rr=.0065*(.8+.2*Math.sin(t*Math.PI));
   const q=add(p,add(mul(n,.002+length*Math.sin(t*Math.PI)),add(mul(u,rr*Math.cos(angle)),mul(v,rr*Math.sin(angle)))));
   head.point(headTransform(q),n,.42+.16*Math.sin(t*Math.PI));
  }
 }

 // Tapered neck flows into the crew neck and jaw; head leans slightly toward the monitor.
 sweep(body,[[0,1.735,-.015],[0,1.82,.025],[0,1.925,.048]],[[.105,.096],[.097,.092],[.092,.089]],900,.72,0);
 const shirtRows=[[0,.267,.187,-.025],[.12,.290,.192,-.035],[.37,.288,.176,-.038],[.65,.318,.176,-.032],[.82,.352,.160,-.018],[.91,.334,.139,.003],[1,.105,.095,.032]];
 const shirt=(u,v)=>{
  const y=1.045+u*.782,[rx,rz,zc]=profile(shirtRows,u),a=v*TAU,
   drape=1+.016*Math.cos(a*7+y*9)+.012*Math.sin(y*34-a*3)*(1-u);
  return [rx*Math.sin(a)*drape,y,zc+rz*Math.cos(a)*drape];
 };
 sample(body,82,100,shirt,()=>.60);
 ellipse(body,[0,1.069,-.025],.270,.188,260,.78);
 ellipse(body,[0,1.090,-.027],.278,.190,260,.44);
 ellipse(body,[0,1.820,.032],.116,.101,230,.85);
 ellipse(body,[0,1.808,.028],.134,.108,240,.65);
 // A restrained seam rather than a logo keeps the garment original.
 for(const s of [-1,1]){
  sweep(body,[[s*.295,1.645,-.009],[s*.381,1.555,.101],[s*.421,1.350,.310],[s*.340,1.347,.505],[s*.240,1.365,.682]],
   [[.125,.125],[.124,.130],[.112,.118],[.100,.095],[.071,.064]],2800,.65,.035);
  sweep(body,[[s*.254,1.361,.654],[s*.231,1.366,.700]],[[.077,.070],[.073,.067]],420,.86,.015);
  sweep(body,[[s*.230,1.366,.699],[s*.221,1.365,.757]],[[.054,.036],[.060,.034]],280,.78,0);
  body.ellipsoid([s*.220,1.363,.785],[.072,.031,.074],600,.84);
  for(let f=0;f<4;f++){
   const x=s*.220+(f-1.5)*.031,reach=[.090,.112,.104,.079][f],base=.807;
   sweep(body,[[x,1.367,base],[x,1.382,base+reach*.46],[x,1.358,base+reach*.85],[x,1.346,base+reach]],
    [[.015,.014],[.014,.013],[.012,.011],[.009,.009]],160,.92,0);
  }
  sweep(body,[[s*.164,1.359,.771],[s*.129,1.351,.811],[s*.123,1.346,.849]],
   [[.019,.017],[.017,.015],[.012,.011]],200,.86,0);
  // Relaxed trousers: rounded seated thighs, shaped knees, tapered lower legs and cuffs.
  sweep(body,[[s*.165,1.020,-.045],[s*.205,.965,.240],[s*.244,.846,.548],[s*.254,.655,.580],[s*.260,.242,.522]],
   [[.167,.157],[.154,.158],[.145,.141],[.112,.122],[.090,.084]],3100,.52,.03);
  sweep(body,[[s*.260,.265,.526],[s*.260,.219,.519]],[[.094,.088],[.095,.088]],300,.75,.01);
  body.ellipsoid([s*.260,.137,.627],[.113,.087,.207],900,.61,p=>{p[1]=Math.max(.071,p[1]);return p});
  for(const y of [.075,.091])ellipse(body,[s*.260,y,.630],.114,.202,180,.87);
  for(let j=0;j<4;j++)body.line([s*.260-.045,.205-j*.007,.575+j*.030],[s*.260+.045,.205-j*.007,.585+j*.030],.009,.9);
 }
 body.ellipsoid([0,1.012,-.035],[.292,.154,.211],1200,.51);
 // Workstation keeps the established composition; chair gains a curved mesh back and casters.
 desk.box([0,.884,-.02],[.75,.09,.62],.040,.39);
 sample(desk,36,42,(u,v)=>{const x=(v-.5)*.70,y=1.02+u*.61;return [x,y,-.255-.065*Math.sin(u*Math.PI)+.045*(x/.35)**2]},()=>.30);
 for(const s of [-1,1])desk.tube([s*.33,.90,-.23],[s*.33,1.60,-.23],.021,180,.4);
 desk.tube([0,.18,-.1],[0,.84,-.1],.052,420,.45);
 for(let i=0;i<5;i++){const a=i/5*TAU,p=[.45*Math.cos(a),.10,-.1+.45*Math.sin(a)];desk.tube([0,.2,-.1],p,.028,150,.40);desk.ellipsoid([p[0],.065,p[2]],[.052,.045,.035],110,.46)}
 desk.box([0,1.24,1.04],[1.95,.07,.84],.045,.65);
 for(const s of [-1,1])for(const z of [.69,1.39])desk.box([s*.87,.63,z],[.06,1.18,.06],.05,.4);
 desk.box([0,1.80,1.29],[1.10,.66,.075],.032,.56);
 desk.box([0,1.42,1.31],[.07,.24,.08],.03,.6);
 desk.box([0,1.30,1.26],[.36,.035,.23],.025,.65);
 for(let j=0;j<15;j++){const y=2.05-j*.033,len=12+(j*17)%26;for(let i=0;i<len;i++)desk.point([-.46+i*.021,y,1.245],[0,0,-1],.95)}
 desk.box([0,1.30,.86],[.70,.028,.25],.022,.7);
 for(let j=0;j<5;j++)for(let i=0;i<14;i++)desk.box([-.32+i*.048,1.325,.76+j*.045],[.036,.012,.03],.024,.9);
 desk.ellipsoid([.55,1.32,.87],[.05,.025,.075],180,.8);
 desk.box([.78,.47,1.12],[.29,.78,.43],.035,.4);
 for(let j=0;j<14;j++)desk.line([.65,.75-j*.034,.9],[.9,.75-j*.034,.9],.02,.7);
 for(let j=-14;j<=14;j++){desk.line([-2.1,.015,j*.15],[2.1,.015,j*.15],.10,.14);desk.line([j*.15,.015,-2.1],[j*.15,.015,2.1],.10,.14)}
 return {head:head.data(),body:body.data(),desk:desk.data()};
}
