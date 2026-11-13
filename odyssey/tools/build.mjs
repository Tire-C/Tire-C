import {build} from 'esbuild';
import {readFile,mkdir,writeFile,copyFile} from 'node:fs/promises';
await mkdir('.build',{recursive:true});
const result=await build({entryPoints:['src/main.js'],bundle:true,format:'iife',minify:true,write:false,target:['es2022'],legalComments:'inline'});
const html=(await readFile('index.html','utf8')).replace('<script type="module" src="./src/main.js"></script>','<script>'+result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')+'</script>');
await writeFile('.build/odyssey.html',html);
await copyFile('node_modules/three/LICENSE','.build/THREE-LICENSE.txt');
console.log('Built self-contained procedural application:',Buffer.byteLength(html),'bytes');
