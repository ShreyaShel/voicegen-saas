import os
import uuid
import re
import numpy as np
from scipy.io import wavfile
from app.config import AUDIO_OUTPUT_DIR

os.makedirs(AUDIO_OUTPUT_DIR, exist_ok=True)

_tts_model = None

AVAILABLE_SPEAKERS = {
    "p225": "Alice (Female, Bright)",
    "p226": "Tom (Male, Deep)",
    "p228": "Sarah (Female, Warm)",
    "p232": "David (Male, Authoritative)",
    "p243": "Emma (Female, Soft)",
    "p258": "James (Male, Clear)",
    "p294": "Zoe (Female, Expressive)",
    "p302": "Mike (Male, Calm)",
}

def get_tts():
    global _tts_model
    if _tts_model is None:
        print("Loading TTS model...")
        from TTS.api import TTS
        _tts_model = TTS(model_name="tts_models/en/vctk/vits")
        print("TTS model loaded.")
    return _tts_model

def clean_text(text: str) -> str:
    text = text.strip()
    text = re.sub(r'\s+', ' ', text)
    if text and text[-1] not in '.!?':
        text = text + '.'
    return text

def change_speed(filepath: str, speed: float) -> None:
    """High quality speed change preserving pitch."""
    if abs(speed - 1.0) < 0.05:
        return
    import librosa
    import soundfile as sf
    y, sr = librosa.load(filepath, sr=None)
    # time_stretch rate is inverse of speed
    y_stretched = librosa.effects.time_stretch(y, rate=speed)
    sf.write(filepath, y_stretched, sr)
    
def generate_speech(
    text: str,
    speaker: str = "p225",
    speed: float = 1.0
) -> str:
    text = clean_text(text)
    if len(text) < 5:
        raise ValueError("Text too short. Enter at least a full sentence.")

    if speaker not in AVAILABLE_SPEAKERS:
        speaker = "p225"

    speed = max(0.5, min(2.0, speed))

    tts = get_tts()
    filename = f"{uuid.uuid4()}.wav"
    filepath = os.path.join(AUDIO_OUTPUT_DIR, filename)

    tts.tts_to_file(
        text=text,
        file_path=filepath,
        speaker=speaker
    )

    # Apply speed change after generation
    change_speed(filepath, speed)

    return filename

def get_speakers() -> dict:
    return AVAILABLE_SPEAKERS