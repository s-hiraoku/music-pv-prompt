# Builds analysis/timing.json and mv/src/data.js from the song, the lyrics and (when present) the ASR result.
#   python3 analysis/build_timing.py
# Lyric timing: if analysis/asr_raw.json exists, each lyric character is matched to the ASR characters (difflib) and
# gets the time of its match; unmatched characters are interpolated. Manual corrections in analysis/line_fix.json
# ({"line index": [start, end]}) override line spans. Without ASR, lines are spread over placeholder spans.
import json, difflib, os, re
import numpy as np, librosa

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)

y, sr = librosa.load(P('assets/song.mp3'), sr=22050, mono=True)
duration = len(y) / sr

# beats (dynamic-programming tracker around 152 BPM) and strong transients ("hits") for staccato accents
tempo, beats = librosa.beat.beat_track(y=y, sr=sr, start_bpm=152, units='time')
oenv = librosa.onset.onset_strength(y=y, sr=sr, hop_length=256)
ft = librosa.times_like(oenv, sr=sr, hop_length=256)
peaks = librosa.util.peak_pick(oenv, pre_max=6, post_max=6, pre_avg=20, post_avg=20, delta=0.6, wait=8)
thr = np.percentile(oenv[peaks], 55)
hits = [round(float(ft[i]), 3) for i in peaks if oenv[i] >= thr]
strong = [round(float(ft[i]), 3) for i in peaks if oenv[i] >= np.percentile(oenv[peaks], 88)]
# loudness per 0.1 s (0..1) to drive global intensity
rms = librosa.feature.rms(y=y, hop_length=2205)[0]
energy = [round(float(v), 3) for v in rms / rms.max()]

lines = [l.strip() for l in open(P('assets/lyrics.txt'), encoding='utf-8') if l.strip()]
norm = lambda s: re.sub(r'[\s　、。，．・「」『』（）()？！?!〜ー…]', '', s)

def placeholder_spans():
    groups = [(0, 3, 7.4, 20.0), (3, 7, 20.0, 29.5), (7, 12, 29.5, 37.5), (12, 20, 37.5, 79.0),
              (20, 24, 80.0, 93.5), (24, 26, 93.5, 99.5), (26, 32, 99.5, 116.0), (32, 34, 116.0, 129.0)]
    spans = {}
    for a, b, t0, t1 in groups:
        w = np.array([max(3, len(norm(lines[i]))) for i in range(a, b)], float)
        edges = t0 + np.concatenate([[0], np.cumsum(w)]) / w.sum() * (t1 - t0)
        for k, i in enumerate(range(a, b)): spans[i] = (edges[k], edges[k + 1] - 0.25)
    return spans

char_times = {}
asr_path = P('analysis/asr_raw.json')
if os.path.exists(asr_path):
    asr = json.load(open(asr_path, encoding='utf-8'))
    seq = []                     # ASR characters with interpolated per-character times
    for seg in asr:
        for w in seg['words']:
            cs = norm(w['word'])
            for k, c in enumerate(cs):
                seq.append((c, w['start'] + (w['end'] - w['start']) * k / max(1, len(cs))))
    asr_str = ''.join(c for c, _ in seq)
    lyr = [(i, c) for i, l in enumerate(lines) for c in norm(l)]
    lyr_str = ''.join(c for _, c in lyr)
    sm = difflib.SequenceMatcher(None, lyr_str, asr_str, autojunk=False)
    times = [None] * len(lyr)
    for a, b, n in sm.get_matching_blocks():
        for k in range(n): times[a + k] = seq[b + k][1]
    known = [k for k, v in enumerate(times) if v is not None]
    for k in range(len(times)):
        if times[k] is None:
            lo = max([j for j in known if j < k], default=None); hi = min([j for j in known if j > k], default=None)
            if lo is not None and hi is not None: times[k] = times[lo] + (times[hi] - times[lo]) * (k - lo) / (hi - lo)
            elif lo is not None: times[k] = times[lo] + 0.15 * (k - lo)
            else: times[k] = times[hi] - 0.15 * (hi - k)
    for (i, c), t in zip(lyr, times): char_times.setdefault(i, []).append(t)
    print(f'ASR alignment: {len(known)}/{len(lyr)} lyric characters matched')
    spans = {i: (ts[0], ts[-1] + 0.35) for i, ts in char_times.items()}
    source = 'asr'
else:
    spans = placeholder_spans(); source = 'placeholder'
    print('no ASR result: placeholder timing')

# forced alignment on the separated vocal (analysis/align_mms.py) wins over the ASR pass when present
mms_path = P('analysis/aligned_mms.json')
if os.path.exists(mms_path):
    mms = json.load(open(mms_path, encoding='utf-8'))
    for k, v in mms.items():
        char_times[int(k)] = v['starts']; spans[int(k)] = (v['starts'][0], v['end'] + .15)
    source = 'mms-forced-alignment'
    print('using forced alignment from aligned_mms.json')

fix_path = P('analysis/line_fix.json')
fixes = json.load(open(fix_path)) if os.path.exists(fix_path) else {}

out_lines = []
for i, text in enumerate(lines):
    s, e = fixes.get(str(i), spans[i])
    visible = [c for c in text]
    core = norm(text)
    ct = char_times.get(i)
    if ct is None or str(i) in fixes:
        ct = list(np.linspace(s, max(s, e - 0.3), max(1, len(core))))
    # spread times back over the visible characters (punctuation/spaces take the next sung character's time)
    chars, k = [], 0
    for c in visible:
        if norm(c):
            chars.append([c, round(float(ct[min(k, len(ct) - 1)]), 3)]); k += 1
        else:
            chars.append([c, round(float(ct[min(k, len(ct) - 1)]), 3)])
    out_lines.append(dict(i=i, text=text, start=round(float(s), 3), end=round(float(e), 3), chars=chars))

data = dict(source=source, duration=round(duration, 3), bpm=round(float(np.atleast_1d(tempo)[0]), 2),
            beats=[round(float(b), 3) for b in beats], hits=hits, strong=strong, energy=energy, lines=out_lines)
json.dump(data, open(P('analysis/timing.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
with open(P('mv/src/data.js'), 'w', encoding='utf-8') as f:
    f.write('// generated by analysis/build_timing.py; do not edit\nwindow.DATA = ' + json.dumps(data, ensure_ascii=False) + ';\n')
print(f"duration {duration:.2f}s  bpm {data['bpm']}  beats {len(beats)}  hits {len(hits)}  strong {len(strong)}  lines {len(out_lines)}")
