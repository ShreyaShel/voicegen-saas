import os
import uuid
import torch
import random
import sys
from f5_tts.api import F5TTS
from app.config import AUDIO_OUTPUT_DIR

os.makedirs(AUDIO_OUTPUT_DIR, exist_ok=True)

_f5_instance = None
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

def get_f5_model():
    global _f5_instance
    if _f5_instance is None:
        print(f"Loading F5-TTS model on {DEVICE}...")
        _f5_instance = F5TTS(device=DEVICE)
        print("F5-TTS model loaded.")
    return _f5_instance

def generate_f5_clone(
    text: str,
    ref_audio_path: str,
    ref_text: str = None,
    speed: float = 1.0
) -> str:
    """
    Generate high-fidelity cloned speech using F5-TTS.
    If ref_text is None, it will be automatically transcribed.
    """
    model = get_f5_model()
    
    # Auto-transcribe if reference text not provided
    if not ref_text:
        print(f"Transcribing reference audio: {ref_audio_path}")
        ref_text = model.transcribe(ref_audio_path)
        print(f"Transcribed: {ref_text}")

    filename = f"{uuid.uuid4()}.wav"
    out_path = os.path.join(AUDIO_OUTPUT_DIR, filename)

    print(f"Generating F5-TTS clone to: {out_path} at speed {speed}")
    
    # Add subtle padding to prevent cutoff
    padded_text = text + " ."

    # Perform inference with stable default settings
    model.infer(
        ref_file=ref_audio_path,
        ref_text=ref_text,
        gen_text=padded_text,
        file_wave=out_path,
        remove_silence=False, 
        speed=speed,
        nfe_step=32,       # Revert to stable default
        cfg_strength=2.0   # Revert to stable default
    )

    return filename
