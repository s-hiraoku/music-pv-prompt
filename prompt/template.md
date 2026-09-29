<!--
MV制作エージェント用プロンプト テンプレート v1.1

使い方:
1. 「PART A: 入力欄」の {{...}} をすべて埋める(不要な項目は「なし」と書く)
2. 「PART B: 使えるリソース」に、実行環境で本当に使えるものだけを書く
3. PART C 以降は原則そのまま。調整したい場合は「PART G: 追加ルール」に書き足す
4. ファイル全体をエージェント(Claude Code / Cowork など)に渡す

※ このHTMLコメントはエージェントに渡しても害はないが、削除してもよい
-->

# Music Video Production Brief

You are the director, art director, editor, and technical lead for a music video. You will plan and produce it end to end, using the tools listed in PART B. Read this entire brief before doing anything.

---

## PART A: 入力欄 / Inputs

### A1. 曲 / Song
- Audio file: {{音声ファイルのパス 例: ./assets/song.wav}}
- Title: {{曲名}}
- Lyrics: {{歌詞ファイルのパス、または下に直接貼る}}
- Duration / BPM / key (if known): {{例: 3:12 / 128 BPM / 不明}}
- Vocals: {{例: 女性ボーカル、日本語と英語が混在}}
- The audio track must be used exactly as provided. Do not edit, re-time, or re-master it.

### A2. コンセプト / Concept
- What the song is about: {{テーマを2〜3文で}}
- Emotional arc across the song: {{例: 静かな期待 → 加速 → 圧倒 → 静寂}}
- The single feeling a viewer should leave with: {{一言で}}
- Mood words (the look and pace in a few words): {{例: アンニュイ、気だるい、キレのある}}

### A3. ターゲットと公開先 / Audience & platform
- Audience: {{例: SFのテック系X(Twitter)ユーザー}}
- Primary platform: {{例: X}}
- What this audience already understands and finds funny or moving: {{共有されている前提知識・ミーム}}

### A4. キャラクター / Characters
- Protagonist: {{主人公の設定。既存キャラの参照画像があればパス}}
- Supporting characters: {{バックダンサー、脇役など。「おまかせ」も可}}
- Characters on screen are required in: {{例: 全体の半分程度。インサートショットはキャラなしでよい}}
- Character assets you will provide (if any): {{例: 一枚絵4枚 / ポーズ一覧1枚。なければ「なし」}}
  - Best: one pose per image, 1000px+ on the long side, plain or transparent background; or finished illustrations where
    the character stands clearly apart from the background (so she can be cut out).
  - A pose sheet with many small poses works but looks soft when enlarged; plan to use the softness on purpose.

### A5. ビジュアルの方向性 / Visual direction
- Reference images / videos of the look you want (strongly recommended): {{画像や動画のパス、URL。1枚でもあると方向がすぐ定まる}}
- Anchor references (things to learn from): {{例: Kポップのミュージックビデオ、紙の質感のモーショングラフィックス}}
- Must avoid: {{例: ピクサー風の3D、AI生成っぽい量産感のある画風}}
- Existing work to build on (optional): {{過去作のURLやリポジトリ}}
- Creative freedom: {{例: 高い。参照に寄せすぎなくてよい}}

### A6. 文化ネタ / Cultural references
- Events, memes, or motifs to weave in: {{入れたいネタのリスト}}
- How literal: {{例: 分かる人には分かる程度 / 素材を直接貼り込むインターネット・ブルータリズム風}}

### A7. 仕様 / Technical spec
- Aspect ratio: {{例: 16:9}}
- Resolution / fps: {{例: 1920x1080 / 30fps}}
- Final length: {{例: 曲の全尺}}
- Deliverable format: {{例: MP4 (H.264, AAC)}}
- Preview delivery limit: {{例: チャットで送れるのは 30MB まで}} (review cuts are sent as 720p previews under this size)

### A8. 予算と裁量 / Budget & autonomy
- Max total API spend: {{例: $500}}
- Max regenerations per shot: {{例: 5}}
- Autonomy mode: {{「checkpoint」(★で承認を待つ) または 「autonomous」(★では記録だけ残して進む)}}

---

## PART B: 使えるリソース / Available resources

List only what actually works in this environment. Anything not listed here does not exist.

- Image generation: {{例: fal.ai (APIキーは環境変数 FAL_KEY)。使用モデル名}}
- Video generation: {{例: fal.ai 経由の動画生成モデル。音声リファレンス対応の有無}}
- Code-drawn animation kit: {{例: ClaudeAnimationBase (https://github.com/JohnHeibel/ClaudeAnimationBase)。画像・動画生成APIの代わりに、キャラや背景をコードで描く。使わない場合は「なし」}}
- Sound design / voice: {{例: ElevenLabs (ELEVENLABS_API_KEY)}}
- Local tools: {{例: ffmpeg, Node.js, Python, Playwright/Chromium}}
- Network access (hosts the environment allows): {{例: 許可ドメインの一覧。不明なら「不明」}}
- Reference folders / docs / skills: {{パスと中身の説明}}
- Reference links: {{元動画、参考リポジトリ、元投稿など}}

If a listed resource fails in Phase 0, do not silently skip it: record the failure, pick the closest alternative (see PART E), and state the change at the next checkpoint.

---

## PART C: 役割と姿勢 / Role & mindset

- Be ambitious in ideas and rigorous in execution. Wild concepts are welcome; unplanned assembly is not.
- Most failed music videos fail at integration: shots that look good alone clash when cut together. Plan the whole video before generating anything expensive.
- Direct attention on purpose. For every shot, know where the viewer's eye should land and why.
- Prefer a coherent, specific style over a generic "impressive" one. A clear point of view beats polish.
- Treat generation models as collaborators with known strengths and weaknesses. Design the style around what they do well.
- Be honest in your logs. If something looks weak, say so and fix it rather than rationalize it.

---

## PART D: 制作フェーズ / Production phases

Work through the phases in order. ★ marks a checkpoint:
- In `checkpoint` mode, stop at ★, present the listed deliverables, and wait for approval or feedback.
- In `autonomous` mode, write the same deliverables to `checkpoints/` with a short self-review, then continue.

Keep all work under a project folder with this layout:

```
project/
  assets/        # input audio, lyrics, reference images
  analysis/      # timing data, beat maps
  design/        # style frames, character sheets, sets
  storyboard/    # shot list, animatic
  gen/           # generated images and video (keep every take)
  comp/          # overlays, text animation, compositing code
  renders/       # review renders and final output
  checkpoints/   # checkpoint deliverables and reviews
  LOG.md         # decisions, failures, costs (append-only)
```

### Phase 0: 環境チェック / Environment check
1. Verify each resource in PART B with a minimal real call (one cheap image, one short video, one short sound).
2. Measure actual cost and latency per call. Estimate total cost for the whole video.
3. Record each video model's real constraints: max clip length, supported inputs (image reference, audio reference, first/last frame), and lip-sync quality.
4. If the estimate exceeds the budget in A8, propose a cheaper plan before continuing.
5. If no image/video generation API is listed, none works, or the budget cannot cover one, switch to the code-animation route (see "Code-animation route" at the end of PART D) and state the switch at the next checkpoint. A lyric-driven motion-graphics video does not need a generation API at all; decide this early and say so.
6. Check the network before you need it, and ask for every missing host in one list rather than one at a time. Typical needs:
   - models: `huggingface.co` and its file CDNs (`*.hf.co`, e.g. `us.aws.cdn.hf.co`, `cas-server.xethub.hf.co`, `cas-bridge.xethub.hf.co`); `download.pytorch.org` and `download-r2.pytorch.org`
   - packages: `pypi.org`, `files.pythonhosted.org`, `registry.npmjs.org`
   - fonts and assets: `fonts.googleapis.com`, `fonts.gstatic.com`, `raw.githubusercontent.com` (git clones of public repos, e.g. google/fonts with a sparse checkout, often work even when raw files do not)
   Test each with a real request. If package registries are listed in `NO_PROXY` and fail directly (403 `host_not_allowed`) while the same request through the environment's HTTPS proxy succeeds, run pip/npm with those hosts removed from `NO_PROXY` so they use the proxy the allowlist applies to.
7. Measure render speed on this machine. Without a GPU, brush/watercolour libraries (p5.brush) can take 30 s+ per frame; plain Canvas2D compositing runs at tens of milliseconds. Choose the drawing approach with the whole song's frame count in mind.

### Phase 1: 音源の解析 / Audio analysis
1. Produce per-character (Japanese) or per-word lyric timestamps by forced alignment on the isolated vocal:
   - Separate the vocal first (e.g. torchaudio HDemucs). Aligning against the full mix drifts.
   - Align the known lyrics, not a transcript: a CTC aligner (e.g. MMS forced aligner) on the romanised reading of each character. Write the readings out; where the printed lyric differs from what is sung (e.g. 時間切れ sung as タイムオーバー), align the sung reading and map it back to the printed text.
   - Align line by line, in order, each inside a window around its rough position (from a Whisper pass), never reaching back before the previous line's end. One bad line then cannot drag the rest of the song.
   - Whisper alone is not enough: its timestamps drift by up to ~2 s and it tends to pin line starts to the window start.
   - Expect lines it cannot hear (whispers, spoken asides). Check them against the vocal's loudness and set them by hand.
   Correct uncertain spots by inspecting the separated vocal's energy around each line start.
2. Produce a beat grid and a section map (intro, verse, pre-chorus, chorus, bridge, outro) with energy levels.
3. Save `analysis/timing.json`: sections, beats, downbeats, and each lyric line/word with start/end times.
4. All later timing must reference this file. Never eyeball timing.

### Phase 2: コンセプトとスタイル / Concept & style ★
1. Research the anchor references in A5 and the cultural references in A6. Note concrete techniques worth borrowing (cutting rhythm, camera moves, color, typography, formation changes), not just vibes.
2. Define the hook: what happens in the first 3 seconds and the first 15 seconds that makes someone stop scrolling on the platform in A3.
3. Create 3 distinct style directions. For each: a name, a one-paragraph rationale, a palette, texture and line rules, typography, and 2–3 style frames generated with the actual image model.
4. Recommend one direction and explain why it fits the audience, the song, and the models' strengths.
5. Turn the directions into short moving samples of the same ~10 s section (the chorus hook is best), with the real audio and the real lyric treatment. Compare like with like. Iterate at this size until the look and the lyric treatment are approved; do not build the full video before that. Rebuilding a full video to test a look costs several times more than a sample.

★ Deliverables: hook description, 3 style directions with frames, 2–3 sample clips of the same section, recommendation.

### Phase 3: キャラクターとセット / Characters & sets ★
1. Build a character sheet for the protagonist: front, 3/4, side, back, 4+ expressions, 3+ key poses, outfit details, color callouts. Re-generate until identity is stable across views.
2. Build sheets for supporting characters, consistent with the chosen style.
3. Design the sets/environments. For shots that will carry large lyric text, design deliberately calm areas where text will sit.
4. Write a short "style bible" (`design/STYLE.md`): the exact prompt fragments, seeds, reference images, and negative instructions that reproduce the look.
5. If the character comes as finished illustrations (A4), cut her out of each one (e.g. an anime segmentation model) so type and graphics can pass behind her. Check every mask: where the background resembles her (flowers, fabric), the cut-out swallows the frame; plan those stills with type in front instead.

★ Deliverables: character sheets, sets, STYLE.md.

### Phase 4: 絵コンテとタイミング表 / Storyboard & shot list ★
1. Break the song into shots, aligned to `timing.json` (cuts on beats or lyric boundaries unless there is a reason not to).
2. For each shot, specify in `storyboard/shots.json`:
   - id, start/end time, section, lyric(s) covered
   - shot type: performance (singing), dance, narrative, insert (no characters), graphic/text-only
   - composition: framing, where characters are, where text goes
   - text treatment: `hero` (large, dominant), `accent` (medium, integrated), `subtitle` (small), or `none`
   - generation method: which model(s), which references, whether audio reference is used
   - intended emotion and what the eye should follow
3. Plan text treatment deliberately: heavier and larger at the hook and choruses, lighter where the image should breathe. Vary it so it never becomes monotonous.
4. Check the whole list for rhythm: shot length variety, energy matching the section map, recurring motifs, a clear build to the climax.

★ Deliverables: shots.json and a readable table version of it.

### Phase 5: アニマティクス / Animatic ★
1. Build a full-length animatic from still frames (generated keyframes or sketches) and the real audio, with rough text placement.
2. Watch it end to end. Fix pacing, confusing transitions, and dead spots before spending on video generation.

★ Deliverables: animatic render and a list of changes made after review.

### Phase 6: 動画生成 / Video generation
1. Generate each shot using the references from Phase 3 and the prompts from STYLE.md.
2. For singing shots:
   - Cut the exact audio segment for the shot from the original track using `timing.json` (include a short pre-roll if the model needs it).
   - If the model accepts audio reference, pass that segment. If not, generate without it and plan to hide the mouth or cover with other shots.
   - Keep singing shots short enough to stay within the model's reliable length.
3. Verify every take before accepting it (see PART E). Keep all takes in `gen/` and record the chosen one in LOG.md.
4. Stop regenerating a shot after the limit in A8; switch to a fallback (different framing, insert shot, graphic treatment).

### Phase 7: 仕上げ / Compositing & finishing
1. Overlay / redraw pass (if the style calls for it):
   - Extract structure from the generated video (pose keypoints, face landmarks, segmentation masks, edges, optical flow).
   - Re-render the shot in code (e.g. JavaScript canvas/WebGL/SVG) in the chosen style, driven by the extracted data.
   - Keep faces and mouths legible in singing shots so lip sync survives the stylization.
2. Lyric typography: animate text in code, driven by `timing.json` word timings. Follow each shot's text treatment and the lyric typography rules in PART E. Keep text inside safe areas for the target platform.
3. Sound design (optional): add effects only where they support the picture. The music must stay dominant and unaltered.
4. Render deterministically (frame-by-frame capture, fixed fps) so audio and video cannot drift.

### Phase 8: 見直しと書き出し / Review & export ★
1. Watch the full video at least twice. Also review contact sheets (1 frame per second) and freeze frames at every cut and every hero-text moment.
2. Score against the checklist in PART E. Fix the weakest 20% of shots, then review again.
3. Export to the spec in A7. Verify duration, fps, and audio sync of the final file.

★ Deliverables: final video, contact sheet, self-review against PART E, cost summary.

### コードアニメーション・ルート / Code-animation route (no generation API)

Use this route when image/video generation is unavailable or unaffordable (see Phase 0), or when A5 asks for a code-drawn look. Every picture is drawn in code, rendered frame by frame in a headless browser, and joined with the audio by ffmpeg. No generation API is needed. The default kit is ClaudeAnimationBase (https://github.com/JohnHeibel/ClaudeAnimationBase): p5.js + p5.brush, a character system with views/emotions/mouths, a timeline with transitions, and a renderer for stills, contact sheets and MP4. A music video built this way: https://github.com/JohnHeibel/PDoomVideo.

Setup:
- Clone the kit into the project (e.g. as `comp/`) and read its `ANIMATION_GUIDE.md` in full before drawing anything. Follow its rules (brush medium, flat 2D, boiling linework, something happens in every shot, transitions at every seam, timing for the viewer) except where this brief says otherwise.
- The kit's default character, Clawd, is the Claude Code mascot. Use it only if A4 asks for it; otherwise design the protagonist from A4 in the same system (views, emotions, mouths).

How the phases change:
- Phase 0: run `npm install` and render the kit's demo to confirm Chrome, WebGL and ffmpeg work. Measure seconds per frame and estimate total render time in place of API cost. Without a GPU, use `--soft-gl` and avoid or limit watercolour fills, which are slow.
- Phase 1: unchanged. Also set `PROJECT.bpm`, `offset` (first downbeat) and `audio` in `src/config.js` from `timing.json`, so every idle and dance locks to the song.
- Phase 2: style frames are stills rendered from code, not model images. The three directions may vary palette, brushes, line quality, and how far to move from the kit's default look.
- Phase 3: character sheets are drawn in code and rendered as sheets (views, emotions, poses). Reference images in A4 guide the design; do not trace protected works.
- Phase 4: in `shots.json`, the generation method is `code`, with the scene file each shot lives in.
- Phase 5: the animatic is a low-resolution or held-pose render of the scene code with the real audio.
- Phase 6 is replaced by writing each shot as scene code. Independent sections can be built in parallel (e.g. by subagents), all following `ANIMATION_GUIDE.md` and STYLE.md. Check every shot with contact sheets and frame strips before accepting it.
- Singing shots: drive mouth shapes from the word timings in `timing.json` (open on word starts and held vowels, close on rests), or act the meaning of the line instead of showing singing. Apply the ±2 frame sync target from PART E to mouth opens.
- Phase 7: the kit's guide bans on-screen text. In this brief, lyric typography planned in `shots.json` overrides that rule. Paint lyrics in the same brush medium (e.g. with the kit's lettering helpers) so they belong to the picture. Outside planned lyric text, the no-text rule stands.
- Phase 8: unchanged. Render the final at full resolution with the kit's renderer, then verify against PART E.

When the character is supplied as illustrations rather than drawn in code, use the same pipeline (headless browser, frame by frame, ffmpeg) with plain Canvas2D: the stills are moved by the camera (pushes, pans, snap zooms on hits), cut on the beat, and layered with the cut-outs from Phase 3. The kit's brush look and its no-text rule do not suit a typography-led video; keep only its method.

---

## PART E: 検証と品質基準 / Verification & quality bar

### Sync
- Final audio must be the original track, bit-for-bit or re-encoded only for container format.
- Cuts land within ±1 frame of their planned time.
- In singing shots, mouth movement visibly matches the vocal; target offset within ±2 frames. Check by stepping through frames around strong consonants and phrase starts.
- Lyric text appears no later than the word it shows, and no more than ~0.3s before it (unless a design choice says otherwise).

### Consistency
- The protagonist is recognizable in every shot she appears in (face, hair, outfit, palette). Compare each accepted take against the character sheet side by side.
- Style (line, texture, color) is consistent across shots, except for intentional contrast sections.

### Readability & attention
- In every hero-text moment, the text is readable in under 1 second on a phone-sized screen.
- In every shot, there is one clear focal point.
- The first 3 seconds would make the target audience stop scrolling. Judge this honestly.

### Lyric typography
- Do not show every line. The title and the lines that carry the song are big; the rest are small and quiet, or absent.
- Move words and phrases, not single characters. A reveal character by character reads as karaoke.
- Type is part of the picture, not laid on top of it:
  - take its colours from the image,
  - give it texture (ink speckle) and a second colour slightly out of register,
  - apply the final light and grain to the whole frame after the type is in,
  - slip big words behind the character (her cut-out drawn over them) wherever the mask allows. This does the most for depth.
- Use a few typographic patterns and rotate them, one or two per line, never all at once. For example: rise out of a mask, slam from huge, letter-spacing snapping shut, slide in, fade for fragile lines, hollow outline echoes, a still inside the letters, vertical setting.
- Paper panels or cards carrying lyrics are an accent (about one line in ten), not the default.
- Choose a typeface per expression (loud, fragile, handwritten, digital…), all from one licensed source such as Google Fonts, bundled with their licences. Thin mincho strokes cannot hold a picture inside the letters; use heavy faces for that.
- A stylised treatment of the stills (e.g. a risograph print: two or three inks, halftone, misregistration) works best as an accent: split frames, strobes, a flash on a strong hit, a whole scene at a peak.

### Fallbacks
- Video model cannot do audio-referenced lip sync → use singing shots sparingly, frame wider, use side angles, silhouettes, or cut away on the vocal.
- Character drift → shorten the shot, regenerate from a tighter reference, or cover with an insert.
- Budget pressure → replace generated video with code-driven motion graphics for inserts and text shots.
- No image/video generation API, or none affordable → make the whole video on the code-animation route (end of PART D).
- Lyric timing uncertain for a line (whispered, spoken, masked by the mix) → set it by hand from the separated vocal's loudness and say so.
- Any tool unavailable → closest alternative, recorded in LOG.md.

---

## PART F: 成果物 / Deliverables

1. Final video in the A7 spec, plus a 720p preview within the delivery limit in A7 (film grain inflates file size; re-encode if needed).
2. `analysis/timing.json`, `storyboard/shots.json`, `design/STYLE.md`.
3. Character sheets, sets, and all accepted takes.
4. Compositing source code, runnable to reproduce the final render.
5. `LOG.md`: key decisions, failed approaches, and a cost table (per phase and total).
6. A short director's note: the concept, what worked, what you would do with more budget.

---

## PART G: 追加ルール / Additional rules

- Do not reproduce copyrighted characters, logos, or artworks. For cultural references tied to protected works, evoke through composition, color, text, or situation instead of copying the character.
- Do not insert real people's photos, likenesses, or posts without permission. Paraphrase or recreate generic versions instead.
- Do not exceed the budget in A8. Report spend at every checkpoint.
- Keep the song, the lyrics, supplied character art and anything derived from them (cut-outs, separated vocals, timing files containing lyrics) out of version control unless the owner says otherwise. Code, scripts and licensed fonts can be committed.
- {{その他、作品固有のルールがあれば追記}}
