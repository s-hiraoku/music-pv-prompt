# REPET-SIM style foreground (vocal) separation, then vocal activity segments
import json, numpy as np, librosa
y, sr = librosa.load('assets/song.mp3', sr=22050, mono=True)
hop=512
S_full, phase = librosa.magphase(librosa.stft(y, hop_length=hop))
S_filter = librosa.decompose.nn_filter(S_full, aggregate=np.median, metric='cosine',
                                       width=int(librosa.time_to_frames(2, sr=sr, hop_length=hop)))
S_filter = np.minimum(S_full, S_filter)
mask_v = librosa.util.softmask(S_full - S_filter, 10 * S_filter, power=2)
S_v = mask_v * S_full
freqs = librosa.fft_frequencies(sr=sr)
band = (freqs>250)&(freqs<3500)
ev = S_v[band].sum(0)
et = S_full[band].sum(0)+1e-9
ratio = librosa.util.normalize(np.convolve(ev/et, np.ones(9)/9, 'same'))
t = librosa.frames_to_time(np.arange(len(ratio)), sr=sr, hop_length=hop)
np.save('analysis/vocal_ratio.npy', np.vstack([t, ratio]))
# print per 0.25s
step=0.25
rows=[]
for s in np.arange(0, t[-1], step):
    m=(t>=s)&(t<s+step); rows.append(ratio[m].mean())
rows=np.array(rows)
thr=np.percentile(rows,45)
line=''.join('#' if v>thr*1.25 else ('+' if v>thr else '.') for v in rows)
for i in range(0,len(line),80):
    print(f"{i*step:6.1f} {line[i:i+80]}")
