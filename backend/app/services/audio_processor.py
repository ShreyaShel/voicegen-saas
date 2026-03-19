import os
import numpy as np
import librosa
import soundfile as sf
import noisereduce as nr

def preprocess_voice_sample(input_path: str) -> str:
    """
    Clean and enhance a voice sample for better cloning accuracy.
    Returns path to the processed file.
    """
    print(f"Preprocessing voice sample: {input_path}")

    # Load audio
    y, sr = librosa.load(input_path, sr=22050, mono=True)

    # Step 1 — Trim leading/trailing silence
    y, _ = librosa.effects.trim(y, top_db=20)

    # Step 2 — Noise reduction
    # Use the first 0.5 seconds as noise profile if audio is long enough
    if len(y) > sr * 0.5:
        noise_sample = y[:int(sr * 0.5)]
        y = nr.reduce_noise(y=y, sr=sr, y_noise=noise_sample, prop_decrease=0.8)

    # Step 3 — Normalize volume
    max_val = np.max(np.abs(y))
    if max_val > 0:
        y = y / max_val * 0.95

    # Step 4 — Ensure minimum length (pad if too short)
    min_length = sr * 3  # minimum 3 seconds
    if len(y) < min_length:
        # Repeat the audio to reach minimum length
        repeats = int(np.ceil(min_length / len(y)))
        y = np.tile(y, repeats)[:min_length]

    # Step 5 — Trim to max 30 seconds (longer doesn't help YourTTS)
    max_length = sr * 30
    if len(y) > max_length:
        y = y[:max_length]

    # Save processed file alongside original
    base, ext = os.path.splitext(input_path)
    processed_path = f"{base}_processed.wav"
    sf.write(processed_path, y, sr)

    duration = len(y) / sr
    print(f"Processed sample: {duration:.1f}s at {sr}Hz -> {processed_path}")

    return processed_path