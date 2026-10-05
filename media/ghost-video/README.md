# Ghost demo film

Remotion source for the 120-second English Ghost explainer. See [brief](BRIEF.md) and [asset provenance](ASSETS.md). Render: 1920×1080, 30 fps, H.264/AAC, English narration and burned-in subtitles. A separate SRT is generated for YouTube accessibility.

See the [delivery review](REVIEW.md) for checks, revisions and review boundaries.

## Build

Node.js and Python with NumPy are required. Install pinned JS packages with `npm ci`. Python audio mixing needs FFmpeg; Windows uses Remotion's bundled binary, or set `FFMPEG` to an available binary.

```sh
npm ci
npm run voice
python scripts/audio.py
node scripts/captions.mjs
npm start
npm run render -- /absolute/output/directory
```

The first voice run downloads the Kokoro ONNX model into `.model-cache`. Subsequent runs use its cache. Do not commit that cache, node_modules or WAV intermediates. No paid API or account key is required by these scripts.

`script.json` is the narration/timing source. If you change durations, regenerate voice/audio and update `seconds` and composition duration to match. `scripts/frames.mjs` exports review stills and the cover. `scripts/render.mjs` creates the full film and SRT; final binary delivery is outside Git. `scripts/audio.py` writes the narration/music mix and music-only audio fallback.

The default output is the workspace's `outputs/ghost-submission`; supply a different absolute path for other checkouts. The local machine reused existing dependency/model caches; clean-install portability has not been exhaustively tested.

## Publishing

Upload the final `Liber-Ghost-Protocol-Demo.mp4`, add the matching SRT and Ghost thumbnail, and use [YouTube copy](../../submission/YOUTUBE.md). A new public URL must be added to SUBMISSION.md after upload. The earlier Liber QRIS video is not this film.

## Evidence

Current issue UI is a walkthrough, not the historical payment execution. Public payment/reclaim pages and historical replay rejection are evidence screenshots. Complete physical phone-off and printed-paper tests remain pending. The proposed pilot is not claimed customer traction.
