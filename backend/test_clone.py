import os
import torch
import soundfile as sf

TRAINING_DIR = os.path.join(
    "my_finetuned_model", "run", "training",
    "GPT_XTTS_FT-March-20-2026_04+38PM-cdcca5cb"
)
CHECKPOINT_PATH = os.path.join(TRAINING_DIR, "best_model_162.pth")
ORIGINAL_FILES_DIR = os.path.join(
    "my_finetuned_model", "run", "training",
    "XTTS_v2.0_original_model_files"
)
CONFIG_PATH = os.path.join(ORIGINAL_FILES_DIR, "config.json")
VOCAB_PATH = os.path.join(ORIGINAL_FILES_DIR, "vocab.json")

print("Checking files...")
print(f"Checkpoint exists: {os.path.exists(CHECKPOINT_PATH)}")
print(f"Config exists: {os.path.exists(CONFIG_PATH)}")
print(f"Vocab exists: {os.path.exists(VOCAB_PATH)}")

# Check what files are in original model dir
print("\nFiles in ORIGINAL_FILES_DIR:")
for f in os.listdir(ORIGINAL_FILES_DIR):
    print(f"  {f}")

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"\nDevice: {DEVICE}")

from TTS.tts.configs.xtts_config import XttsConfig
from TTS.tts.models.xtts import Xtts

config = XttsConfig()
config.load_json(CONFIG_PATH)
print("Config loaded")

model = Xtts.init_from_config(config)
model.load_checkpoint(
    config,
    checkpoint_path=CHECKPOINT_PATH,
    vocab_path=VOCAB_PATH,
    checkpoint_dir=ORIGINAL_FILES_DIR,  # add this
    use_deepspeed=False
)
model.to(DEVICE)
print("Model loaded")

reference_wav = os.path.abspath("my_voice_dataset/wavs/001.wav")
print(f"Reference wav: {reference_wav}")
print(f"Reference wav exists: {os.path.exists(reference_wav)}")
text = "Hello, my name is Shreya and this is a test of my cloned voice."

outputs = model.synthesize(
    text=text,
    config=model.config,
    speaker_wav=reference_wav,
    language="en",
    gpt_cond_len=30,
    temperature=0.7,
)

sf.write("test_output.wav", outputs["wav"], 24000)
print("SUCCESS! Output saved to test_output.wav")