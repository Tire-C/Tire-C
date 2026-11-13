export const TAU=Math.PI*2;
export const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
export const smooth=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10)};
export const ramp=(t,a,b)=>smooth((t-a)/(b-a));
export const mix=(a,b,t)=>a+(b-a)*t;
export const lerp=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t));
export function rng(seed=314159){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let v=Math.imul(seed^seed>>>15,1|seed);v=v+Math.imul(v^v>>>7,61|v)^v;return ((v^v>>>14)>>>0)/4294967296}}
export const norm=v=>{const d=Math.hypot(...v)||1;return v.map(x=>x/d)};
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const add=(a,b)=>a.map((x,i)=>x+b[i]);
export const mul=(a,s)=>a.map(x=>x*s);
export const sub=(a,b)=>a.map((x,i)=>x-b[i]);
