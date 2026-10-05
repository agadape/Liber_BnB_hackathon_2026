import fs from 'node:fs/promises';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill} from '@remotion/renderer';
const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts')});
const composition=await selectComposition({serveUrl,id:'Ghost'});
for(const sec of [2,7,13,23,33,41,49,60,72,84,98,112]){
 const output=path.resolve(`reviews/frame-${sec}.png`);
 await renderStill({serveUrl,composition,output,frame:sec*30,imageFormat:'png'});
 console.log('Frame',sec);
}
const poster=await selectComposition({serveUrl,id:'GhostPoster'});
await renderStill({serveUrl,composition:poster,output:path.resolve('../../../outputs/ghost-submission/Ghost-Cover.png'),frame:0,imageFormat:'png'});
await fs.writeFile('reviews/frame-manifest.json',JSON.stringify({fps:30,seconds:120,frames:[2,7,13,23,33,41,49,60,72,84,98,112]},null,2));
