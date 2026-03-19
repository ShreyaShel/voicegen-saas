from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.services.tts_service import generate_speech, get_speakers
from app.config import AUDIO_OUTPUT_DIR, MAX_TEXT_LENGTH
from app.database import get_db
from app.utils.auth import get_current_user
from app.models.user import User
from app.models.audio import AudioGeneration
import os

router = APIRouter()

class TTSRequest(BaseModel):
    text: str
    speaker: str = "p267"
    speed: float = 1.0

@router.get("/speakers")
def list_speakers():
    """Returns all available TTS speakers — no auth needed."""
    return get_speakers()

@router.post("/generate")
def generate(
    req: TTSRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    if len(req.text) > MAX_TEXT_LENGTH:
        raise HTTPException(status_code=400, detail=f"Max {MAX_TEXT_LENGTH} characters allowed")

    try:
        filename = generate_speech(
            text=req.text,
            speaker=req.speaker,
            speed=req.speed
        )

        record = AudioGeneration(
            user_id=current_user.id,
            text=req.text,
            audio_filename=filename
        )
        db.add(record)
        db.commit()

        return {
            "success": True,
            "filename": filename,
            "download_url": f"/api/tts/audio/{filename}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")

@router.get("/audio/{filename}")
def get_audio(filename: str):
    filename = os.path.basename(filename)
    filepath = os.path.join(AUDIO_OUTPUT_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(path=filepath, media_type="audio/wav", filename=filename)

@router.get("/history")
def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    records = db.query(AudioGeneration)\
        .filter(AudioGeneration.user_id == current_user.id)\
        .order_by(AudioGeneration.created_at.desc())\
        .all()
    return [
        {
            "id": str(r.id),
            "text": r.text,
            "audio_filename": r.audio_filename,
            "download_url": f"/api/tts/audio/{r.audio_filename}",
            "created_at": r.created_at
        }
        for r in records
    ]