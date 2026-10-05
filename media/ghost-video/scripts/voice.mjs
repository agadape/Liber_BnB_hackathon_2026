import fs from 'node:fs/promises';
import path from 'node:path';
import {KokoroTTS} from 'kokoro-js';
import {env} from '@huggingface/transformers';

env.cacheDir = path.resolve('.model-cache');
env.backends.onnx.wasm.numThreads = 4;
const script = JSON.parse(await fs.readFile('script.json', 'utf8'));
const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
  dtype: 'q8', device: 'cpu', progress_callback: (p) => {
    if (p.status === 'done') console.log('Model file ready:', p.file);
  },
});
const timeline = []; let start = 0;
for (const scene of script) {
  const sentences = scene.text.match(/[^.!?]+[.!?]+/g) ?? [scene.text];
  const clips = [];
  for (let i = 0; i < sentences.length; i++) {
    const text = sentences[i].trim();
    const file = `audio/${scene.id}-${i}.wav`;
    const audio = await tts.generate(text.replace(/QRIS/g, 'Q R I S').replace(/QR/g, 'Q R').replace(/BNB/g, 'B N B').replace(/USDC/g, 'U S D C'), {voice: 'af_heart', speed: 1.04});
    await audio.save(`public/${file}`);
    clips.push({text, file, seconds: audio.audio.length / audio.sampling_rate});
    console.log(scene.id, i, clips.at(-1).seconds.toFixed(2), text);
  }
  const spoken = clips.reduce((sum, c) => sum + c.seconds, 0);
  const available = scene.duration - 1.1 - (clips.length - 1) * 0.15;
  const rate = Math.max(1, spoken / available);
  let cursor = start + 0.45;
  for (const clip of clips) {
    timeline.push({...clip, rate, start: cursor, end: cursor + clip.seconds / rate});
    cursor += clip.seconds / rate + 0.15;
  }
  console.log(scene.id, 'playback', rate.toFixed(3), 'ends', cursor.toFixed(2));
  start += scene.duration;
}
await fs.writeFile('public/audio/timeline.json', JSON.stringify(timeline, null, 2));
