import fs from 'node:fs';
import {createTikTokStyleCaptions} from '@remotion/captions';
const captions=JSON.parse(fs.readFileSync('public/audio/captions.json','utf8'));
const windows=JSON.parse(fs.readFileSync('public/audio/timeline.json','utf8'));
const {pages}=createTikTokStyleCaptions({captions,combineTokensWithinMilliseconds:1700});
const stamp=(value)=>{
 const ms=Math.round(value);const s=Math.floor(ms/1000);
 return `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor(s/60)%60).padStart(2,'0')}:${String(s%60).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`;
};
const cues=pages.map(p=>{
 const window=windows.find(w=>p.startMs>=Math.round(w.start*1000)&&p.startMs<Math.round(w.end*1000));
 if(!window)throw new Error(`Caption page outside narration: ${p.startMs}`);
 return {start:p.startMs,end:Math.min(p.startMs+p.durationMs,Math.round(window.end*1000)),text:p.text.trim()};
});
fs.writeFileSync('liber-english.srt',cues.map((p,i)=>`${i+1}\n${stamp(p.start)} --> ${stamp(p.end)}\n${p.text}`).join('\n\n')+'\n');
console.log(`Wrote ${cues.length} SRT cues matching the burn-in pages and narration visibility windows.`);
