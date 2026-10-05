"""Deterministic original score, local voice mix and sentence-aligned subtitles."""
import json, math, subprocess, wave, os, shutil
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
FFMPEG = Path(os.environ.get('FFMPEG') or shutil.which('ffmpeg') or str(ROOT / 'node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe'))
SR = 48000
DURATION = sum(s["duration"] for s in json.loads((ROOT/"script.json").read_text()))
out = ROOT / 'public/audio'
timeline = json.loads((out/'timeline.json').read_text())

def read_wav(p):
    with wave.open(str(p)) as w:
        sr=w.getframerate(); a=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(np.float64)/32768
        a=a.reshape(-1,w.getnchannels()).mean(axis=1)
    assert sr==SR, 'Normalize clips to 48 kHz with FFmpeg first'
    return a

def save(p,a):
    with wave.open(str(p),'wb') as w:
        w.setnchannels(1 if a.ndim==1 else a.shape[1]);w.setsampwidth(2);w.setframerate(SR)
        w.writeframes((np.clip(a,-.999,.999)*32767).astype('<i2').tobytes())

voice=np.zeros(SR*DURATION); duck=np.ones_like(voice)
captions=[]
for n,clip in enumerate(timeline):
    p=ROOT/'public'/clip['file']; stretched=out/f'fit-{n}.wav'
    subprocess.run([str(FFMPEG),'-y','-v','error','-i',str(p),'-af',f"atempo={clip['rate']}",'-ar',str(SR),str(stretched)],check=True)
    a=read_wav(stretched); start=round(clip['start']*SR)
    a=a[:len(voice)-start]; voice[start:start+len(a)]+=a*.78
    # A soft duck envelope keeps the score below speech.
    left=max(0,start-round(.15*SR));right=min(len(duck),start+len(a)+round(.2*SR))
    duck[left:right]=.58
    words=clip['text'].split()
    weights=np.array([len(w.strip('.,:;'))+.7+(1.8 if w.endswith((',',';')) else 0) for w in words])
    times=np.r_[0,np.cumsum(weights)/weights.sum()]*(clip['end']-clip['start'])+clip['start']
    for j,word in enumerate(words):
        display=word
        if clip['text'].startswith('Try Liber at '):
            # Speak an accessible domain; caption it as the actual URL.
            if j==3: display='liber-bnb-web.vercel.app'
            elif j>3: continue
        captions.append({'text':(' ' if j else '')+display,'startMs':round(times[j]*1000),'endMs':round((clip['end'] if clip['text'].startswith('Try Liber at ') and j==3 else times[j+1])*1000),'timestampMs':None,'confidence':None,'pageBreakAfter':j==len(words)-1 or (clip['text'].startswith('Try Liber at ') and j==3)})

# Original warm mallet/keys score. No external track, performer or sound effects.
rng=np.random.default_rng(97)
music=np.zeros((SR*DURATION,2))
beat=60/90
chords=[[50,57,61,66],[47,54,57,62],[43,50,54,59],[45,52,57,59]]
def note(time,midi,length,gain,pan=0):
    start=round(time*SR); count=min(round(length*SR),len(music)-start)
    if count<=0:return
    t=np.arange(count)/SR;hz=440*2**((midi-69)/12)
    # Rounded attack, harmonic decay and a subtle detuned body.
    env=(1-np.exp(-t/0.013))*np.exp(-t/(length*.34))
    tone=(np.sin(2*np.pi*hz*t)+.23*np.sin(2*np.pi*2*hz*t)*np.exp(-t*5)+.08*np.sin(2*np.pi*3*hz*t)*np.exp(-t*9)+.1*np.sin(2*np.pi*hz*1.0015*t))*env*gain
    tone*=np.minimum(1,np.maximum(0,(length-t)/.05))
    music[start:start+count,0]+=tone*math.sqrt((1-pan)/2)
    music[start:start+count,1]+=tone*math.sqrt((1+pan)/2)
for b in range(math.ceil(DURATION/beat)):
    time=b*beat;chord=chords[(b//8)%4]
    if b%8==0:
        for j,m in enumerate(chord):note(time+j*.017,m+12,3.5,.035,(j-1.5)/4)
        note(time,chord[0]-12,1.6,.037)
    note(time+.0,chord[[0,2,1,3][b%4]]+24,.55,.019,(-.3 if b%2 else .3))
    if b>=12 and time<DURATION-8:
        n=round(.047*SR);start=round((time+beat*.5)*SR)
        if start+n<len(music):
            # Quiet high-frequency brushed pulse, part of the score.
            noise=rng.normal(0,1,n);noise=np.r_[0,np.diff(noise)]
            pulse=noise*np.exp(-np.arange(n)/SR*85)*.0017
            music[start:start+n,:]+=pulse[:,None]
# Resolve to D major under the closing CTA and keep a natural final ring-out.
for j,m in enumerate([50,57,61,66,74]):note(DURATION-8+j*.02,m,7.9,.035,(j-2)/5)
fade=np.minimum(1,np.arange(len(music))/SR/.04)*np.minimum(1,np.maximum(0,(DURATION-np.arange(len(music))/SR)/1.0))
music*=fade[:,None]
smooth=np.r_[0,np.cumsum(np.pad(duck,(2400,2400),mode='edge'))]
duck=(smooth[4801:]-smooth[:-4801])/4801
mixed=music*duck[:,None]+voice[:,None]
save(out/'mix.wav',mixed);save(out/'music.wav',music)
for source,target,lufs in [('mix.wav','master.wav',-16),('music.wav','music-master.wav',-23)]:
    r=subprocess.run([str(FFMPEG),'-y','-v','info','-i',str(out/source),'-af',f'loudnorm=I={lufs}:TP=-1.5:LRA=3:print_format=json','-ar',str(SR),str(out/target)],capture_output=True,text=True,check=True)
    (ROOT/'reviews'/f'{target}-loudness.txt').write_text(r.stderr)

(out/'captions.json').write_text(json.dumps(captions,indent=2))
windows=json.dumps([[round(c['start']*1000),round(c['end']*1000)] for c in timeline])
source="import {BasicCaptions} from './basic-captions';\nimport {useCurrentFrame,useVideoConfig} from 'remotion';\nexport const Subtitles=()=> {const frame=useCurrentFrame();const {fps}=useVideoConfig();const ms=frame/fps*1000;const active="+windows+".some(([start,end])=>ms>=start&&ms<end);return <BasicCaptions name=\"English subtitles\" premountFor={60} width={1650} combineTokensWithinMilliseconds={1700} style={{position:'absolute',bottom:42,left:135,zIndex:30,opacity:active?1:0}} captions={"+json.dumps(captions,indent=2)+"}/>;};\n"
(ROOT/'src/Subtitles.tsx').write_text(source)
def stamp(ms):
    s,ms=divmod(round(ms),1000);h,s=divmod(s,3600);m,s=divmod(s,60)
    return f'{h:02}:{m:02}:{s:02},{ms:03}'
pages=[];page=[]
for c in captions:
    if page and (len(page)>=7 or c['startMs']-page[0]['startMs']>2200):pages.append(page);page=[]
    page.append(c)
    if c.get('pageBreakAfter'):pages.append(page);page=[]
if page:pages.append(page)
srt='\n\n'.join(f"{i+1}\n{stamp(p[0]['startMs'])} --> {stamp(p[-1]['endMs'])}\n{''.join(c['text'] for c in p).strip()}" for i,p in enumerate(pages))+'\n'
subprocess.run(['node','scripts/captions.mjs'],cwd=ROOT,check=True)
print('Audio and subtitles complete:',len(captions),'tokens')
