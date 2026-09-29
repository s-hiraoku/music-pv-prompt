# Word-level transcription with faster-whisper; lyrics given as prompt to bias recognition
import json
from faster_whisper import WhisperModel
lyrics = open('assets/lyrics.txt', encoding='utf-8').read()
model = WhisperModel('large-v3', device='cpu', compute_type='int8', cpu_threads=4)
segs, info = model.transcribe('assets/song.mp3', language='ja', word_timestamps=True,
                              initial_prompt=lyrics.replace('\n', '、')[:400],
                              condition_on_previous_text=False, vad_filter=False, beam_size=5)
out = []
for s in segs:
    out.append(dict(start=s.start, end=s.end, text=s.text,
                    words=[dict(start=w.start, end=w.end, word=w.word, p=w.probability) for w in s.words]))
    print(f"{s.start:7.2f}-{s.end:7.2f} {s.text}", flush=True)
json.dump(out, open('analysis/asr_raw.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
