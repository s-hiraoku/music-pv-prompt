# Forced alignment of each lyric line with faster-whisper: the line's text is given as the decoder prefix, so the
# model only has to place it in time; word timestamps then give per-character times.
#   python3 analysis/align_lines.py        (reads analysis/timing.json for rough windows, writes analysis/aligned.json)
import json, os, re
import numpy as np, librosa
from faster_whisper import WhisperModel
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
SR = 16000
audio, _ = librosa.load(P('assets/song.mp3'), sr=SR, mono=True)
timing = json.load(open(P('analysis/timing.json'), encoding='utf-8'))
lines = timing['lines']
# what is actually sung where the printed lyric differs
SUNG = {11: 'タイムオーバー', 22: 'エデンは遥か遠く'}
norm = lambda s: re.sub(r'[\s　、。，．・「」『』（）()？！?!〜ー…]', '', s)
model = WhisperModel('large-v3', device='cpu', compute_type='int8', cpu_threads=4)
out = {}
for i, L in enumerate(lines):
    a = max(0.0, L['start'] - 1.2)
    b = min(len(audio) / SR, (lines[i + 1]['start'] + 0.6) if i + 1 < len(lines) else L['end'] + 2.0)
    text = SUNG.get(i, re.sub(r'[「」（）()]', '', L['text']).replace('（タイムオーバー）', ''))
    segs, _ = model.transcribe(audio[int(a * SR):int(b * SR)], language='ja', prefix=text, word_timestamps=True,
                               without_timestamps=False, condition_on_previous_text=False, beam_size=5, vad_filter=False)
    chars = []
    for s in segs:
        for w in s.words:
            cs = norm(w.word)
            for k, c in enumerate(cs):
                chars.append((c, a + w.start + (w.end - w.start) * k / max(1, len(cs)), w.probability))
        break          # only the first segment carries the forced prefix
    want = norm(text)
    got = ''.join(c for c, _, _ in chars)
    ok = got.startswith(want[:max(1, len(want) - 1)])
    out[i] = dict(text=text, sung=want, got=got, ok=ok, times=[round(t, 3) for _, t, _ in chars[:len(want)]],
                  prob=round(float(np.mean([p for _, _, p in chars[:len(want)]] or [0])), 3))
    print(f"{i:2d} {'OK ' if ok else 'BAD'} {out[i]['times'][0] if out[i]['times'] else -1:7.2f}  was {L['start']:7.2f}  p={out[i]['prob']:.2f}  {want} / {got[:len(want)+4]}", flush=True)
json.dump(out, open(P('analysis/aligned.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
