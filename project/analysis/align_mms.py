# Lyric timing by forced alignment on the isolated vocal:
#   1. HDemucs (torchaudio HDEMUCS_HIGH_MUSDB_PLUS) separates the vocal from the mix -> assets/vocals.wav
#   2. MMS_FA (torchaudio) aligns the romanised reading of every lyric character across the whole song at once
#   3. writes analysis/aligned_mms.json: per line, the start time of every displayed character
#   python3 analysis/align_mms.py
import json, os, re
import torch, torchaudio, librosa, numpy as np, soundfile as sf
from torchaudio.pipelines import HDEMUCS_HIGH_MUSDB_PLUS, MMS_FA

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
torch.set_num_threads(4)

# reading of each displayed character (after punctuation/spaces are dropped), space separated.
# '-' means "not sung under this character": it takes the time of the line's first sung character.
READ = [
    'つよ い こ ん と ら す と',
    'け が な し で は で ら れ な い めい ろ',
    'む り や り しろ く ぬ り つぶ し た きたな い ゆめ',
    'わ た し に な れ な い ひ と',
    'う る さ く し が み つ く の',
    'き を つ け て',
    'や け ど す る よ',
    'ま だ で す か',
    'ま た で す か',
    'のう ない ふ ら っ し ゅ ば っ く',
    'あやつ ろ う と し た っ て も う',
    '- - - - た い む お ば',                 # 時間切れ（タイムオーバー）: sung タイムオーバー
    'そ う と げ が な い',
    'いた いた し さ が いと し い で し ょ',
    'わ た し に な れ な い ひ と',
    'はげ し く ふ り ほ ど く の',
    'ま る で むら が っ て い る が の よ う',
    'おも しろ い ね',
    'き を つ け て',
    'や け ど す る よ',
    'り そう の り そう か',
    'か そく す る ゆ と ぴ あ',
    '- - え で ん わ はる か とお く',          # 楽園（エデン）は遥か遠く: sung エデン
    'だ か ら こ そ き れい',
    'よわ さ も つよ さ も あい せ な い の な ら',
    'わ た し が い き る い み わ な い か ら',
    'と げ の な い ば ら に ふさ わ し い',
    'い き ざま さ',
    'わ た し に な れ な く て も',
    'あ な た わ べつ の いろ',
    'ま ちが い と よ ば な い で',
    'と げ が な い ば ら な だ け',
    'み おさ め て',
    'か れ ゆ く ま で',
]
ROMA = dict(zip(
    'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ',
    'a i u e o ka ki ku ke ko sa shi su se so ta chi tsu te to na ni nu ne no ha hi fu he ho ma mi mu me mo ya yu yo ra ri ru re ro wa o n '
    'ga gi gu ge go za ji zu ze zo da ji zu de do ba bi bu be bo pa pi pu pe po'.split()))
ROMA.update({'ゃ': 'ya', 'ゅ': 'yu', 'ょ': 'yo', 'っ': ''})
def roman(kana):
    kana = ''.join(chr(ord(c) - 0x60) if 'ァ' <= c <= 'ヶ' else c for c in kana)
    return ''.join(ROMA[c] for c in kana if c in ROMA)
norm = lambda s: re.sub(r'[\s　、。，．・「」『』（）()？！?!〜ー…]', '', s)

timing = json.load(open(P('analysis/timing.json'), encoding='utf-8'))
lines = timing['lines']
assert len(READ) == len(lines)
for i, (L, r) in enumerate(zip(lines, READ)):
    assert len(norm(L['text'])) == len(r.split()), (i, norm(L['text']), r)

# 1. vocal separation
voc_path = P('assets/vocals.wav')
if not os.path.exists(voc_path):
    model = HDEMUCS_HIGH_MUSDB_PLUS.get_model().eval()
    sr = HDEMUCS_HIGH_MUSDB_PLUS.sample_rate
    y, _ = librosa.load(P('assets/song.mp3'), sr=sr, mono=False)
    mix = torch.tensor(y, dtype=torch.float32)[None]
    ref = mix.mean(1, keepdim=True); mean, std = ref.mean(), ref.std(); mix = (mix - mean) / std
    seg, ov = sr * 10, sr * 1
    out = torch.zeros(1, 4, 2, mix.shape[-1]); wsum = torch.zeros(mix.shape[-1])
    fade = torch.ones(seg + ov); fade[:ov] = torch.linspace(0, 1, ov); fade[-ov:] = torch.linspace(1, 0, ov)
    with torch.inference_mode():
        for s in range(0, mix.shape[-1], seg):
            a, b = max(0, s - ov // 2), min(mix.shape[-1], s + seg + ov // 2)
            o = model(mix[..., a:b]); w = fade[:b - a] if b - a == seg + ov else torch.ones(b - a)
            out[..., a:b] += o * w; wsum[a:b] += w
            print(f'separating {b / sr:6.1f}s', flush=True)
    out = out / wsum * std + mean
    vocals = out[0, model.sources.index('vocals')]
    sf.write(voc_path, vocals.numpy().T, sr)

# 2. alignment
y, sr = sf.read(voc_path, dtype='float32'); wav = torch.tensor(y.T if y.ndim > 1 else y[None])
wav = torchaudio.functional.resample(wav.mean(0, keepdim=True), sr, 16000)
# MMS forced-alignment model (same uroman vocabulary as torchaudio's MMS_FA), hosted on Hugging Face
from transformers import AutoProcessor, Wav2Vec2ForCTC
M = 'MahmoudAshraf/mms-300m-1130-forced-aligner'
proc, fa = AutoProcessor.from_pretrained(M), Wav2Vec2ForCTC.from_pretrained(M).eval()
vocab = proc.tokenizer.get_vocab(); blank = vocab['<blank>']
x = wav[0]; x = (x - x.mean()) / (x.std() + 1e-7)
chunk, ctx_s = 16000 * 20, 16000 * 2                   # 20 s windows with 2 s context on each side
ems = []
cache = P('analysis/emission.pt')
if os.path.exists(cache): ems = [torch.load(cache)]
else:
  with torch.inference_mode():
    for s0 in range(0, len(x), chunk):
        a0, b0 = max(0, s0 - ctx_s), min(len(x), s0 + chunk + ctx_s)
        lg = torch.log_softmax(fa(x[a0:b0][None]).logits[0], -1)
        fps = lg.shape[0] / (b0 - a0)
        i0, i1 = round((s0 - a0) * fps), round((min(len(x), s0 + chunk) - a0) * fps)
        ems.append(lg[i0:i1]); print(f'emission {b0 / 16000:6.1f}s', flush=True)
  torch.save(torch.cat(ems), cache)
emission = torch.cat(ems)
ratio = len(x) / 16000 / emission.shape[0]
words, where = [], []                              # one "word" per sung character
for i, r in enumerate(READ):
    for k, kana in enumerate(r.split()):
        rm = roman(kana) if kana != '-' else ''
        if rm: words.append(rm); where.append((i, k))
# align line by line inside a window around its rough position (from the ASR pass in timing.json), so one bad
# line cannot drag the rest of the song; whispered lines 7/8 get windows from the separated vocal's energy
WIN = {7: (37.4, 40.6), 8: (40.6, 43.4)}
times, prev_end = {}, 0.0
for i, L in enumerate(lines):
    idx = [j for j, (li, _) in enumerate(where) if li == i]
    w0, w1 = WIN.get(i, (L['start'] - .7, L['end'] + .7))
    w0 = max(w0, prev_end - .05)                   # lines are sung in order: never reach back into the last one
    f0, f1 = int(w0 / ratio), min(emission.shape[0], int(w1 / ratio))
    tg = torch.tensor([[vocab[c] for j in idx for c in words[j]]], dtype=torch.int32)
    ali, sc = torchaudio.functional.forced_align(emission[f0:f1][None], tg, blank=blank)
    spans = torchaudio.functional.merge_tokens(ali[0], sc[0].exp(), blank=blank)
    n = 0
    for j in idx:
        sp = spans[n:n + len(words[j])]; n += len(words[j])
        times[where[j]] = ((f0 + sp[0].start) * ratio, (f0 + sp[-1].end) * ratio, float(np.mean([t.score for t in sp])))
    prev_end = times[where[idx[-1]]][1]

out = {}
for i, (L, r) in enumerate(zip(lines, READ)):
    n = len(r.split()); sung = [times[(i, k)] for k in range(n) if (i, k) in times]
    first = sung[0][0]
    starts = [round(times[(i, k)][0], 3) if (i, k) in times else round(first, 3) for k in range(n)]
    for k in range(n - 1, -1, -1):                 # small っ / unsung chars take the next sung time
        if (i, k) not in times and r.split()[k] != '-' and k + 1 < n: starts[k] = starts[k + 1]
    out[i] = dict(text=L['text'], starts=starts, end=round(sung[-1][1], 3), score=round(float(np.mean([s[2] for s in sung])), 3))
    print(f"{i:2d} {starts[0]:7.2f}-{out[i]['end']:7.2f}  was {L['start']:7.2f}  score {out[i]['score']:.2f}  {L['text']}")
json.dump(out, open(P('analysis/aligned_mms.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
