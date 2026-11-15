import {build} from 'esbuild';
import {readFile,mkdir,writeFile,copyFile} from 'node:fs/promises';
import {Script} from 'node:vm';
import assert from 'node:assert/strict';
await mkdir('.build',{recursive:true});
const result=await build({entryPoints:['src/main.js'],bundle:true,format:'iife',minify:true,write:false,target:['es2022'],legalComments:'inline'});
const bundle=result.outputFiles[0].text;
new Script(bundle,{filename:'odyssey-bundle.js'});
const safe=bundle.replace(/<\/script/gi,'<\\/script');
// A callback preserves literal $&, $' and $\x60 in minified code; replacement strings do not.
const html=(await readFile('index.html','utf8')).replace('<script type="module" src="./src/main.js"></script>',()=>'<script>'+safe+'</script>');
const embedded=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.equal(embedded,safe,'Standalone HTML must contain the exact generated program');
new Script(embedded,{filename:'odyssey-inline.js'});
await writeFile('.build/odyssey.html',html);
await copyFile('node_modules/three/LICENSE','.build/THREE-LICENSE.txt');
console.log('Built and syntax-checked self-contained procedural application:',Buffer.byteLength(html),'bytes');
