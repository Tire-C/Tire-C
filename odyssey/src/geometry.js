import {TAU,rng,norm,cross,add,mul,sub,lerp} from './math.js';
// Only spatial samples are produced. No solid mesh is ever sent to the renderer.
export class Cloud {
 constructor(seed=42){this.p=[];this.n=[];this.w=[];this.random=rng(seed)}
 point(p,n=[0,1,0],w=1){this.p.push(...p);this.n.push(...norm(n));this.w.push(w)}
 ellipsoid(c,r,count,w=1,deform=null){
  for(let i=0;i<count;i++){const y=1-2*(i+.5)/count,a=i*2.3999632297,s=Math.sqrt(1-y*y),n=[s*Math.cos(a),y,s*Math.sin(a)];
   let p=n.map((x,j)=>c[j]+x*r[j]);if(deform)p=deform(p,n);this.point(p,n.map((x,j)=>x/r[j]),w)}
 }
 line(a,b,step=.2,w=1){const count=Math.max(2,Math.ceil(Math.hypot(...sub(b,a))/step));for(let i=0;i<=count;i++)this.point(lerp(a,b,i/count),[0,1,0],w)}
 tube(a,b,r,count,w=1){
  const axis=norm(sub(b,a)),u=norm(cross(axis,Math.abs(axis[1])>.9?[1,0,0]:[0,1,0])),v=cross(axis,u);
  for(let i=0;i<count;i++){const f=(i+.5)/count,angle=i*2.3999632297,n=add(mul(u,Math.cos(angle)),mul(v,Math.sin(angle)));this.point(add(lerp(a,b,f),mul(n,r)),n,w)}
 }
 box(c,d,spacing=.15,w=1){
  for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){
   const a=(axis+1)%3,b=(axis+2)%3,na=Math.max(2,Math.ceil(d[a]/spacing)),nb=Math.max(2,Math.ceil(d[b]/spacing));
   for(let i=0;i<=na;i++)for(let j=0;j<=nb;j++){const p=[...c],n=[0,0,0];p[axis]+=sign*d[axis]/2;p[a]+=d[a]*(i/na-.5);p[b]+=d[b]*(j/nb-.5);n[axis]=sign;this.point(p,n,w)}
  }
 }
 ring(c,r,count,axis=1,w=1,minor=0){
  for(let i=0;i<count;i++){const a=i/count*TAU,b=i*2.3999632297,rr=r+minor*Math.cos(b),p=[rr*Math.cos(a),minor*Math.sin(b),rr*Math.sin(a)],n=[Math.cos(a),.2,Math.sin(a)];if(axis===0){[p[0],p[1]]=[p[1],p[0]];[n[0],n[1]]=[n[1],n[0]]}if(axis===2){[p[1],p[2]]=[p[2],p[1]];[n[1],n[2]]=[n[2],n[1]]}this.point(add(c,p),n,w)}
 }
 data(count=this.w.length,bound=Infinity){
  const p=new Float32Array(count*3),n=new Float32Array(count*3),w=new Float32Array(count);
  for(let i=0;i<count;i++){const k=Math.floor(i*this.w.length/count),v=this.p.slice(k*3,k*3+3),len=Math.hypot(...v),s=Math.min(1,bound/len);p.set(v.map(x=>x*s),i*3);n.set(this.n.slice(k*3,k*3+3),i*3);w[i]=this.w[k]}
  return {p,n,w,count};
 }
}
export function worlds(count=28000){
 const out=[],names=['Immersion','Programming','Physics','Chemistry','Mathematics','Astronomy','Intelligence','Engineering'];
 for(let k=0;k<8;k++){
  const c=new Cloud(420+k),R=c.random;
  if(k===0){
   for(let j=0;j<95;j++){const z=-32+j*.65,r=7+2*Math.sin(z*.19);for(let i=0;i<190;i++){const a=i/190*TAU+z*.12;c.point([r*Math.cos(a)+3*Math.sin(z*.1),r*Math.sin(a),z],[Math.cos(a),Math.sin(a),0],.5+.5*(j%7===0))}}
   for(let i=0;i<8000;i++){const a=R()*TAU,r=9+R()*15,z=(R()-.5)*60;c.point([r*Math.cos(a),r*Math.sin(a),z],[0,0,1],.25+R()*.6)}
  }
  if(k===1){
   // Walkable architecture: data banks on multiple levels and interconnecting bus routes.
   for(let x=-3;x<=3;x++)for(let z=-3;z<=3;z++){if(Math.abs(x)<1&&Math.abs(z)<2)continue;const h=3+R()*12;c.box([x*7,-7+h/2,z*7],[2.4,h,2.8],.55,.7);
    for(let y=-6;y<h-7;y+=1.1)c.line([x*7-1.2,y,z*7+1.5],[x*7+1.2,y,z*7+1.5],.2,1);
    c.line([x*7,-7,z*7],[0,-7,z*7],.3,.5)}
   for(let j=0;j<5;j++)for(let x=-22;x<23;x+=2)c.line([x,-8+j*4,-26],[x,-8+j*4,26],.45,.24);
   for(let j=0;j<6;j++){const a=j/6*TAU;c.ellipsoid([6*Math.cos(a),3,6*Math.sin(a)],[1,1,1],400);c.tube([0,0,0],[6*Math.cos(a),3,6*Math.sin(a)],.15,220)}
  }
  if(k===2){
   c.ellipsoid([0,0,0],[2.6,2.6,2.6],2200);
   for(let j=0;j<7;j++)for(let i=0;i<1300;i++){const a=i/1300*TAU,r=7+j*1.1,b=j*Math.PI/7,p=[r*Math.cos(a),r*Math.sin(a)*Math.sin(b),r*Math.sin(a)*Math.cos(b)];c.point(p,norm(p),.65);if(i%200===0)c.ellipsoid(p,[.5,.5,.5],100,1)}
   for(let j=-16;j<=16;j+=3)for(let i=0;i<450;i++){const a=i/450*TAU,r=13+5*Math.sin(a*2+j*.15);c.point([r*Math.cos(a),j,r*Math.sin(a)],[0,1,0],.35)}
  }
  if(k===3){
   // A double helix becomes an environment, with base-pair bridges and molecular cages.
   for(let i=0;i<55;i++){const y=(i-27)*.8,a=i*.3,A=[6*Math.cos(a),y,6*Math.sin(a)],B=[-A[0],y,-A[2]];
    c.ellipsoid(A,[.65,.65,.65],130);c.ellipsoid(B,[.65,.65,.65],130);c.tube(A,B,.14,130,.55);
    if(i<54){const b=a+.3;c.tube(A,[6*Math.cos(b),y+.8,6*Math.sin(b)],.25,110);c.tube(B,[-6*Math.cos(b),y+.8,-6*Math.sin(b)],.25,110)}}
   for(let j=0;j<7;j++){const a=j/7*TAU,center=[17*Math.cos(a),5*Math.sin(a*2),17*Math.sin(a)];for(let i=0;i<6;i++){const b=i/6*TAU,p=add(center,[3*Math.cos(b),0,3*Math.sin(b)]),q=add(center,[3*Math.cos(b+TAU/6),0,3*Math.sin(b+TAU/6)]);c.ellipsoid(p,[.5,.5,.5],100);c.tube(p,q,.12,150,.7)}}
  }
  if(k===4){
   for(let j=0;j<85;j++)for(let i=0;i<220;i++){const u=i/220*TAU,v=j/85*TAU,r=9+3*Math.cos(v*3+u*2);c.point([r*Math.cos(u),(4*Math.sin(v)+2*Math.sin(u*3)),r*Math.sin(u)],[Math.cos(u),Math.sin(v),Math.sin(u)],.65+.35*Math.cos(v)**2)}
   // Project a rotating four-dimensional hypercube into 3D before glyph sampling.
   const verts=[];for(let i=0;i<16;i++){const v=[0,1,2,3].map(b=>(i>>b&1)?1:-1),den=2.8-v[3]*.75;verts.push([v[0]*20/den,v[1]*20/den,v[2]*20/den])}
   for(let i=0;i<16;i++)for(let b=0;b<4;b++){const j=i^(1<<b);if(j>i)c.tube(verts[i],verts[j],.09,240,1)}
   for(let x=-25;x<26;x++)for(let z=-25;z<26;z++)c.point([x,-10+2*Math.sin(x*.3)*Math.cos(z*.3),z],[0,1,0],.35)
  }
  if(k===5){
   for(let i=0;i<17000;i++){const r=Math.pow(R(),.7)*29,arm=i%5,a=arm*TAU/5+r*.22+(R()-.5)*.42,y=(R()-.5)*(1.1+3*Math.exp(-r*.2));c.point([r*Math.cos(a),y,r*Math.sin(a)],[0,1,0],.35+R()*.65)}
   c.ellipsoid([0,0,0],[2.6,2.1,2.6],1600,1);
   c.ellipsoid([11,5,5],[3,3,3],2400,.9);c.ring([11,5,5],4.8,2200,1,.7,.5);
   for(let i=0;i<2200;i++){const a=R()*TAU,y=R()*2-1,r=26+R()*7;c.point([r*Math.sqrt(1-y*y)*Math.cos(a),r*y,r*Math.sqrt(1-y*y)*Math.sin(a)],[0,1,0],.3)}
  }
  if(k===6){
   const nodes=[];for(let layer=0;layer<6;layer++){const row=[];for(let j=0;j<9;j++){const a=j/9*TAU,p=[8*Math.cos(a),8*Math.sin(a),(layer-2.5)*7];row.push(p);c.ellipsoid(p,[.8,.8,.8],160,1)}nodes.push(row)}
   for(let l=0;l<5;l++)for(let i=0;i<9;i++)for(let j=0;j<9;j++)if((i+j+l)%3===0)c.tube(nodes[l][i],nodes[l+1][j],.055,90,.45);
   for(let j=0;j<22;j++)c.ring([0,0,(j-11)*2.5],14,300,2,.3);
  }
  if(k===7){
   for(const [cx,cy,cz,r,teeth] of [[-7,0,0,7,18],[6,0,0,6,15],[0,10,-7,4.5,12],[0,-10,6,4.5,12]]){
    for(let j=0;j<4;j++)for(let i=0;i<2400;i++){const a=i/2400*TAU,rr=r+(Math.cos(a*teeth)>.1?.8:0),z=cz+(j-1.5)*.7;c.point([cx+rr*Math.cos(a),cy+rr*Math.sin(a),z],[Math.cos(a),Math.sin(a),0],.9)}
    c.ring([cx,cy,cz],r*.45,1000,2,.65,.55);c.tube([cx,cy,cz-5],[cx,cy,cz+5],.7,750);
    for(let j=0;j<6;j++){const a=j/6*TAU;c.tube([cx+Math.cos(a)*r*.45,cy+Math.sin(a)*r*.45,cz],[cx+Math.cos(a)*r,cy+Math.sin(a)*r,cz],.35,300)}}
   for(let x=-20;x<=20;x+=5)c.tube([x,-16,-15],[x,16,-15],.2,240,.3)
  }
  out.push({name:names[k],...c.data(count,34)});
 }
 return out;
}

export function creator(){
 const head=new Cloud(1),body=new Cloud(2),desk=new Cloud(3);
 // Cranial vault, tapered mandible and projected facial landmarks. Front is +Z.
 head.ellipsoid([0,2.15,0],[.36,.49,.34],6500,.85,(p,n)=>{
  const lower=Math.max(0,-n[1]);p[0]*=1-.27*lower;p[2]+=.035*Math.max(0,n[2]);return p});
 head.ellipsoid([0,1.97,.19],[.245,.23,.23],1400,.82);
 head.ellipsoid([0,2.13,.354],[.055,.115,.092],650,1);
 head.ellipsoid([0,2.055,.39],[.072,.04,.045],220,.9);
 for(const s of [-1,1]){
  head.ellipsoid([s*.345,2.13,0],[.055,.115,.075],420,.7);
  head.ellipsoid([s*.125,2.23,.31],[.098,.032,.045],300,.95);
  head.ellipsoid([s*.13,2.18,.332],[.065,.025,.025],180,.24);
  head.ellipsoid([s*.17,2.09,.30],[.10,.075,.06],250,.9);
 }
 head.tube([-.095,1.99,.359],[.095,1.99,.359],.015,180,.55);
 head.ellipsoid([0,1.9,.24],[.12,.065,.09],260,.9);
 body.tube([0,1.71,0],[0,1.91,0],.13,700,.7);
 body.ellipsoid([0,1.42,-.035],[.37,.40,.23],3400,.65);
 body.ellipsoid([0,1.05,0],[.34,.21,.26],1400,.7);
 for(const s of [-1,1]){
  body.ellipsoid([s*.35,1.63,0],[.16,.17,.17],650,.75);
  body.tube([s*.36,1.61,.02],[s*.44,1.28,.31],.115,1000,.8);
  body.ellipsoid([s*.44,1.28,.31],[.12,.12,.12],350,.8);
  body.tube([s*.44,1.28,.31],[s*.26,1.36,.70],.085,900,.85);
  body.ellipsoid([s*.25,1.36,.75],[.10,.045,.13],500,.95);
  for(let f=0;f<4;f++)body.tube([s*.25+(f-1.5)*.04,1.36,.81],[s*.25+(f-1.5)*.04,1.34,.92],.016,75,1);
  body.tube([s*.19,.99,.04],[s*.25,.86,.58],.15,1500,.65);
  body.ellipsoid([s*.25,.86,.58],[.16,.15,.16],450,.8);
  body.tube([s*.25,.84,.58],[s*.28,.22,.48],.10,1200,.75);
  body.ellipsoid([s*.28,.12,.62],[.12,.095,.25],650,.7);
 }
 // Chair: separate seat, curved back, column and five legs.
 desk.box([0,.93,-.04],[.78,.12,.70],.045,.45);
 desk.box([0,1.40,-.33],[.72,.72,.10],.045,.38);
 desk.tube([0,.18,-.1],[0,.86,-.1],.06,500,.5);
 for(let i=0;i<5;i++){const a=i/5*TAU;desk.tube([0,.2,-.1],[.48*Math.cos(a),.10,-.1+.48*Math.sin(a)],.035,180,.45)}
 desk.box([0,1.24,1.04],[1.95,.07,.84],.045,.65);
 for(const s of [-1,1])for(const z of [.69,1.39])desk.box([s*.87,.63,z],[.06,1.18,.06],.05,.4);
 // Monitor has a thick shell, bezel, stand, and binary lines on the inward-facing screen.
 desk.box([0,1.80,1.29],[1.10,.66,.075],.032,.56);
 desk.box([0,1.42,1.31],[.07,.24,.08],.03,.6);
 desk.box([0,1.30,1.26],[.36,.035,.23],.025,.65);
 for(let j=0;j<15;j++){const y=2.05-j*.033,len=12+(j*17)%26;for(let i=0;i<len;i++)desk.point([-.46+i*.021,y,1.245],[0,0,-1],.95)}
 desk.box([0,1.30,.86],[.70,.028,.25],.022,.7);
 for(let j=0;j<5;j++)for(let i=0;i<14;i++)desk.box([-.32+i*.048,1.325,.76+j*.045],[.036,.012,.03],.024,.9);
 desk.ellipsoid([.55,1.32,.87],[.05,.025,.075],180,.8);
 desk.box([.78,.47,1.12],[.29,.78,.43],.035,.4);
 for(let j=0;j<14;j++)desk.line([.65,.75-j*.034,.9],[.9,.75-j*.034,.9],.02,.7);
 // Floor is a sparse binary lattice, not a filled plane.
 for(let j=-14;j<=14;j++){desk.line([-2.1,.015,j*.15],[2.1,.015,j*.15],.10,.14);desk.line([j*.15,.015,-2.1],[j*.15,.015,2.1],.10,.14)}
 return {head:head.data(),body:body.data(),desk:desk.data()};
}
