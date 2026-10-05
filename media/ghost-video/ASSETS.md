# Asset provenance and evidence boundaries

- `public/art/*`: original Liber team illustrations and logo already in this project. No customer/testimonial implied.
- `public/fonts/*`: Google Fonts Newsreader and Bricolage Grotesque, SIL Open Font License copies beside the font files.
- `public/ui/prepare.png` and `review.png`: actual public UI captured 2 October 2026. New unfunded walkthrough wallet; no reserve or payment sent during capture.
- `public/ui/payment.png`: real public canonical 5 MockUSDC receipt; voucher `0xdfad2e816fba512fdda912ced241d9464c3f1358c16427fcfd7ac3fac2067924`.
- `public/ui/reclaim.png`: separate real public 2 MockUSDC reclaim; voucher `0x5f04a6af2b67a0519ed123946b3b5834d5648974ea23edfd8c70fbf2c0a567fb`.
- `public/ui/replay.jpg` and `spent-qr.png`: historical hosted UI exercise, voucher `0xea0ade9bb3b58bcb01854d3a1ec93f13b86f6a6718ae41cae806bbe957bae860`, already redeemed. The report is `contracts/deployments/ghost-ui-e2e.json`. It is not the separate canonical payment shown later.
- UI crops retain source content. Editorial labels are outside the product surface. The comic battery and permission model are explanatory illustrations, not filmed device-off proof.
- Narration: local Kokoro-82M v1.0 ONNX, q8, `af_heart` synthetic stock voice. No cloned human voice. Model cache is not committed. Source/model repository: https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX.
- Score: original deterministic synthesized warm keys/mallet arrangement. No external music track or stock sound effect.
- Captions: Remotion's official BasicCaptions element, pinned Remotion 4.0.532, adapted typography/color. Word timing is estimated within generated sentence audio, not forced-alignment transcription.
- Planning/review reference: [echris6/motion-video-kit](https://github.com/echris6/motion-video-kit), MIT text/scripts/templates. No original reference-film footage copied. Critique is recorded separately and does not imply endorsement.

Public media does not contain private keys, active authorization packets, sessions or API secrets. The spent QR is disclosed only after redemption.
