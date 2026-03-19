import os
import shutil
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.auth import get_current_user
from app.models.user import User
from app.models.voice import ClonedVoice
from app.models.audio import AudioGeneration
from app.schemas.voice import VoiceResponse, CloneGenerateRequest
from app.services.clone_service import clone_and_generate
from app.config import VOICE_SAMPLE_DIR, AUDIO_OUTPUT_DIR

router = APIRouter()

ALLOWED_AUDIO_EXTENSIONS = {".wav", ".mp3", ".ogg", ".flac"}

@router.post("/upload", response_model=VoiceResponse)
async def upload_voice_sample(
    name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(400, f"Invalid file type. Allowed: {ALLOWED_AUDIO_EXTENSIONS}")

    # Save raw upload first
    sample_filename = f"{current_user.id}_{name.replace(' ', '_')}{ext}"
    sample_path = os.path.join(VOICE_SAMPLE_DIR, sample_filename)

    with open(sample_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Preprocess immediately for better cloning quality
    from app.services.audio_processor import preprocess_voice_sample
    try:
        processed_path = preprocess_voice_sample(sample_path)
        # Store the processed path in DB instead of raw
        stored_path = processed_path
    except Exception as e:
        print(f"Preprocessing failed, storing raw: {e}")
        stored_path = sample_path

    voice = ClonedVoice(
        user_id=current_user.id,
        name=name,
        sample_path=stored_path
    )
    db.add(voice)
    db.commit()
    db.refresh(voice)

    return voice

@router.get("/list")
def list_voices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    voices = db.query(ClonedVoice)\
        .filter(ClonedVoice.user_id == current_user.id)\
        .order_by(ClonedVoice.created_at.desc())\
        .all()
    return [
        {
            "id": str(v.id),
            "name": v.name,
            "created_at": v.created_at
        }
        for v in voices
    ]

@router.post("/generate")
def generate_cloned_audio(
    req: CloneGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not req.text.strip():
        raise HTTPException(400, "Text cannot be empty")
    if len(req.text) > 1000:
        raise HTTPException(400, "Text too long. Max 1000 characters.")

    # Fetch the voice from DB and verify ownership
    voice = db.query(ClonedVoice).filter(
        ClonedVoice.id == req.voice_id,
        ClonedVoice.user_id == current_user.id
    ).first()

    if not voice:
        raise HTTPException(404, "Voice not found or access denied")

    if not os.path.exists(voice.sample_path):
        raise HTTPException(404, "Voice sample file missing from storage")

    try:
        filename = clone_and_generate(
            text=req.text,
            speaker_wav_path=voice.sample_path,
            language=req.language
        )

        # Save to history
        record = AudioGeneration(
            user_id=current_user.id,
            voice_id=voice.id,
            text=req.text,
            audio_filename=filename
        )
        db.add(record)
        db.commit()

        return {
            "success": True,
            "filename": filename,
            "download_url": f"/api/tts/audio/{filename}",
            "voice_used": voice.name
        }
    except Exception as e:
        raise HTTPException(500, f"Voice cloning failed: {str(e)}")

@router.delete("/{voice_id}")
def delete_voice(
    voice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    voice = db.query(ClonedVoice).filter(
        ClonedVoice.id == voice_id,
        ClonedVoice.user_id == current_user.id
    ).first()

    if not voice:
        raise HTTPException(404, "Voice not found")

    # Delete the sample file from disk
    if os.path.exists(voice.sample_path):
        os.remove(voice.sample_path)

    db.delete(voice)
    db.commit()

    return {"success": True, "message": f"Voice '{voice.name}' deleted"}