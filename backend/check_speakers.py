from TTS.api import TTS
t = TTS('tts_models/multilingual/multi-dataset/xtts_v2')
speakers = t.synthesizer.tts_model.speaker_manager.speakers.keys()
print("All speakers:")
for s in sorted(speakers):
    print(f"  {s}")