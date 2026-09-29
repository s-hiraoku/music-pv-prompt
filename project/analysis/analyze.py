import json, numpy as np, librosa
y, sr = librosa.load('assets/song.mp3', sr=22050, mono=True)
dur = len(y)/sr
tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units='time')
tempo = float(np.atleast_1d(tempo)[0])
# RMS energy per second
hop=512
rms = librosa.feature.rms(y=y, hop_length=hop)[0]
t = librosa.times_like(rms, sr=sr, hop_length=hop)
# vocal-ish: harmonic part, band 300-3500Hz energy vs total
S = np.abs(librosa.stft(y, hop_length=hop))
freqs = librosa.fft_frequencies(sr=sr)
# section boundaries via agglomerative on chroma+mfcc
mf = librosa.feature.mfcc(y=y, sr=sr, hop_length=hop)
ch = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=hop)
feat = np.vstack([librosa.util.normalize(mf,axis=1), ch])
bnd = librosa.segment.agglomerative(feat, 12)
bt = librosa.frames_to_time(bnd, sr=sr, hop_length=hop)
out = dict(duration=dur, tempo=tempo, beats=[round(b,3) for b in beats], boundaries=[round(b,2) for b in bt])
json.dump(out, open('analysis/beats_raw.json','w'), indent=1)
print('dur', round(dur,2), 'tempo', round(tempo,2), 'nbeats', len(beats))
print('first beats', [round(b,2) for b in beats[:8]])
print('boundaries', [round(b,1) for b in bt])
sec = np.arange(0, int(dur)+1)
e = [float(rms[(t>=s)&(t<s+1)].mean()) for s in sec[:-1]]
m = max(e)
print('energy/sec:', ' '.join(f"{int(s)}:{int(9*v/m)}" for s,v in zip(sec,e)))
