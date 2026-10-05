import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {RenderInternals} from '@remotion/renderer';
const output=path.resolve(process.argv[2]??'../../../outputs/ghost-submission');
await fs.mkdir(output,{recursive:true});
const picture=path.join(output,'ghost-picture.mp4'),final=path.join(output,'Liber-Ghost-Protocol-Demo.mp4');
function run(exe,args){const r=spawnSync(exe,args,{stdio:'inherit'});if(r.status!==0)throw new Error(`Command failed: ${r.status}`);}
run(process.execPath,['node_modules/@remotion/cli/remotion-cli.js','render','src/index.ts','Ghost',picture,'--muted','--concurrency=4','--codec=h264','--crf=18','--overwrite']);
const ffmpeg=RenderInternals.getExecutablePath({type:'ffmpeg',indent:false,logLevel:'info',binariesDirectory:null});
run(ffmpeg,['-y','-i',picture,'-i','public/audio/master.wav','-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','256k','-metadata','title=liber:Ghost Protocol — Phone off. Permission on.','-metadata:s:a:0','language=eng','-movflags','+faststart','-shortest',final]);
await fs.copyFile('liber-english.srt',path.join(output,'Liber-Ghost-English.srt'));
console.log('Final film:',final);
