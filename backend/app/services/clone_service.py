import os
import uuid
import torch
from app.config import VOICE_SAMPLE_DIR, AUDIO_OUTPUT_DIR
from app.services.audio_processor import preprocess_voice_sample

os.makedirs(VOICE_SAMPLE_DIR, exist_ok=True)
os.makedirs(AUDIO_OUTPUT_DIR, exist_ok=True)

_clone_model = None
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Languages supported by XTTS v2
SUPPORTED_LANGUAGES = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "it": "Italian",
    "pt": "Portuguese",
    "pl": "Polish",
    "tr": "Turkish",
    "ru": "Russian",
    "nl": "Dutch",
    "cs": "Czech",
    "ar": "Arabic",
    "zh-cn": "Chinese",
    "hu": "Hungarian",
    "ko": "Korean",
    "hi": "Hindi",
}

def get_clone_model():
    global _clone_model
    if _clone_model is None:
        print(f"Loading XTTS v2 on {DEVICE}...")
        from TTS.api import TTS
        _clone_model = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(DEVICE)
        print("XTTS v2 loaded successfully.")
    return _clone_model

def get_supported_languages() -> dict:
    return SUPPORTED_LANGUAGES

def clone_and_generate(
    text: str,
    speaker_wav_path: str,
    language: str = "en"
) -> str:
    if language not in SUPPORTED_LANGUAGES:
        language = "en"

    try:
        processed_path = preprocess_voice_sample(speaker_wav_path)
    except Exception as e:
        print(f"Preprocessing failed, using original: {e}")
        processed_path = speaker_wav_path

    processed_path = os.path.abspath(processed_path)

    model = get_clone_model()
    filename = f"{uuid.uuid4()}.wav"
    out_path = os.path.join(AUDIO_OUTPUT_DIR, filename)

    model.tts_to_file(
        text=text,
        speaker_wav=processed_path,
        language=language,
        file_path=out_path,
        split_sentences=True
    )

    return filename