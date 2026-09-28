<!--
記入例: 「Claude Pop」MVリメイク
元のプロンプトの内容を、テンプレートの PART A / B / G に書き写したもの。
PART C〜F は prompt/template.md と同じなので省略している。
実際に使うときは、prompt/template.md の PART A / B / G をこの内容で置き換える。
「要記入」は元のプロンプトに情報がなかった項目。
-->

## PART A: 入力欄 / Inputs

### A1. 曲 / Song
- Audio file: ./assets/claude-pop.wav (元動画のMP4から音声を抽出)
- Title: Claude Pop
- Lyrics: ./assets/lyrics.txt (要記入: 歌詞テキストを用意する)
- Duration / BPM / key (if known): 不明(Phase 1 で解析)
- Vocals: 女性ボーカル
- The audio track must be used exactly as provided. Do not edit, re-time, or re-master it.

### A2. コンセプト / Concept
- What the song is about: AIの進歩が加速していく感覚と、シンギュラリティが近づいてくる体験を歌ったポップソング。
- Emotional arc across the song: 高揚感のあるワクワク → 加速していく速さ → 追いつけないほどの圧倒 → (要記入: 曲の終わり方に合わせる)
- The single feeling a viewer should leave with: 「すべてが加速している」

### A3. ターゲットと公開先 / Audience & platform
- Audience: サンフランシスコのテック系X(Twitter)ユーザー
- Primary platform: X
- What this audience already understands and finds funny or moving: AIの進歩をめぐるタイムラインの空気感、「数学がAIに食われていく」系の盛り上がり、Navier–Stokesなどの話題、エヴァンゲリオンのシンジのミームとそれに付く言葉、「make no mistakes」

### A4. キャラクター / Characters
- Protagonist: Claudeを擬人化したポップアイドル。既存のひまわり風Claudeキャラをベースに、女性ボーカルに合う、より人間らしい造形にする。参照画像: ./assets/ref/claude-sunflower.png (要記入)
- Supporting characters: バックダンサー数名、その他の脇役はおまかせ
- Characters on screen are required in: 全体の半分程度。キャラが映らないインサートや、歌っていない場面も入れる

### A5. ビジュアルの方向性 / Visual direction
- Anchor references (things to learn from): Kポップのミュージックビデオ(視線の誘導、パターンの使い方、構図)、紙の質感のJavaScriptアニメーション、現代のモーションデザイン
- Must avoid: ピクサー風の3D、AI生成っぽい量産感のある画風
- Existing work to build on (optional): 元のJSアニメ版 https://github.com/JohnHeibel/PDoomVideo 、元のBlender版MP4、元投稿 https://x.com/other__reality/status/2102514581684052169 (いずれも出発点。これを超えることが目標)
- Creative freedom: 非常に高い。抽象的なモーショングラフィックスも可。元のスタイルに縛られなくてよい

### A6. 文化ネタ / Cultural references
- Events, memes, or motifs to weave in: AI進歩の出来事やタイムラインの盛り上がり(Navier–Stokes、数学分野の話題など)、シンジのミームとその周りの言葉、「加速」を感じさせるモチーフ
- How literal: インターネット・ブルータリズム風に、テキストや素材を直接画面に貼り込む表現を使ってよい(PART G の権利ルールの範囲内で)

### A7. 仕様 / Technical spec
- Aspect ratio: 16:9
- Resolution / fps: 1920x1080 / 30fps
- Final length: 曲の全尺
- Deliverable format: MP4 (H.264, AAC)

### A8. 予算と裁量 / Budget & autonomy
- Max total API spend: $2,000 (fal.ai のクレジット)
- Max regenerations per shot: 8
- Autonomy mode: checkpoint

---

## PART B: 使えるリソース / Available resources

- Image generation: fal.ai (FAL_KEY)。使用モデルは Phase 0 で選定
- Video generation: fal.ai 経由の Seedance 2.5 (音声リファレンスによる口パクに対応しているかは Phase 0 で確認)。ドキュメント: ./docs/seedance.md (要記入)
- Sound design / voice: ElevenLabs (ELEVENLABS_API_KEY)。ドキュメント: ./docs/elevenlabs.md (要記入)
- Local tools: ffmpeg, Node.js, Python, Playwright/Chromium
- Reference folders / docs / skills: 過去作のフォルダ(要記入: パス)、参考資料集のスキル(要記入: スキル名)、JSで曲を扱うスキル(要記入: スキル名)
- Reference links: A5 のリンクを参照

---

## PART G: 追加ルール / Additional rules

- Do not reproduce copyrighted characters, logos, or artworks. For cultural references tied to protected works, evoke through composition, color, text, or situation instead of copying the character.
- Do not insert real people's photos, likenesses, or posts without permission. Paraphrase or recreate generic versions instead.
- Do not exceed the budget in A8. Report spend at every checkpoint.
- The hook matters most: lyrics should be large and dominant in the opening section.
- The generated video is primarily a base layer. Prefer a final look where the code-drawn overlay (Phase 7) carries the image, with a paper-like texture.
- Compose shots with text in mind: e.g. characters on the right while hero lyrics sit on the left. Vary this across the video.
