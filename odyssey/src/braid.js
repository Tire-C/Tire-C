import {Cloud} from './geometry.js';
import {frameAt} from './timeline.js';
// A spatial knowledge braid stitches the domains together. Travelling illumination
// follows the same continuous curve; the material is composed exclusively of binary glyphs.
export function knowledgeBraid(){
 const c=new Cloud(563);
 for(let j=0;j<620;j++){
  const u=j/619,f=frameAt(u),phase=u*38;
  for(let lane=0;lane<10;lane++){
   const a=lane*Math.PI/5+phase,r=10.5+2.8*Math.sin(u*23+lane*.6);
   for(let width=0;width<2;width++){
    const p=f.p.clone().addScaledVector(f.right,Math.cos(a)*(r+width*.23)).addScaledVector(f.vertical,Math.sin(a)*(r+width*.23));
    c.point(p.toArray(),f.back.toArray(),.18+.17*(lane%3===0));
   }
  }
 }
 return c.data();
}
