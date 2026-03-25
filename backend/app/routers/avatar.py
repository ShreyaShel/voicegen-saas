import os
import uuid
import shutil
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.auth import get_current_user
from app.models.user import User
from app.services.tts_service import generate_speech
from app.services.avatar_service import (
    generate_video,
    AVATAR_UPLOAD_DIR,
    AVATAR_OUTPUT_DIR
)

router = APIRouter()

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


@router.post("/generate")
async def generate_avatar_video(
    text: str = Form(default=""),
    prompt: str = Form(default=""),
    language: str = Form(default="en"),
    speaker: str = Form(default="p225"),
    voice_id: str = Form(None), # Added voice_id support
    still_mode: bool = Form(default=True),
    face_size: int = Form(default=256),
    engine: str = Form(default="local"),
    speed: float = Form(default=1.0), # Added speed control
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate a talking avatar or general video.
    Supports local SadTalker and Cloud (Replicate).
    """
    # Validation
    if not text.strip() and not prompt.strip():
        raise HTTPException(400, "Either 'text' (for talking head) or 'prompt' (for video gen) must be provided.")

    image_path = None
    if image:
        ext = os.path.splitext(image.filename)[1].lower()
        if ext not in ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(400, f"Invalid image type. Allowed: {ALLOWED_IMAGE_EXTENSIONS}")
        
        image_filename = f"{current_user.id}_{uuid.uuid4()}_{image.filename}"
        image_path = os.path.join(AVATAR_UPLOAD_DIR, image_filename)
        with open(image_path, "wb") as f:
            shutil.copyfileobj(image.file, f)

    try:
        audio_path = None
        audio_filename = None
        warnings = []
        
        # Step 1 — Generate audio if text is provided (Talking head mode)
        if text.strip():
            print(f"Generating audio for avatar: {text[:50]}...")
            
            if voice_id:
                from app.models.voice import ClonedVoice
                from app.services.clone_service import clone_and_generate
                
                # Verify voice ownership
                voice = db.query(ClonedVoice).filter(
                    ClonedVoice.id == voice_id,
                    ClonedVoice.user_id == current_user.id
                ).first()
                if not voice:
                    raise HTTPException(404, "Cloned voice not found or access denied")
                
                audio_filename = clone_and_generate(
                    text=text,
                    speaker_wav_path=voice.sample_path,
                    language=language,
                    speed=speed
                )
                warnings = []
            else:
                audio_filename, warnings, _ = generate_speech(
                    text=text,
                    speaker=speaker,
                    speed=speed,
                    language=language
                )
            audio_path = os.path.abspath(os.path.join("audio_outputs", audio_filename))

        # Step 2 — Generate video
        print(f"Starting video generation using engine: {engine}...")
        from app.services.avatar_service import generate_video
        
        video_filename = generate_video(
            image_path=image_path,
            audio_path=audio_path,
            prompt=prompt,
            engine=engine,
            face_size=face_size,
            still_mode=still_mode
        )

        return {
            "success": True,
            "video_filename": video_filename,
            "download_url": f"/api/avatar/video/{video_filename}",
            "audio_filename": audio_filename,
            "warnings": warnings,
            "engine": engine
        }

    except Exception as e:
        print(f"[API Error] {str(e)}")
        raise HTTPException(500, f"Video generation failed: {str(e)}")


@router.get("/video/{filename}")
def get_video(filename: str):
    filename = os.path.basename(filename)
    filepath = os.path.join(AVATAR_OUTPUT_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(404, "Video not found")
    return FileResponse(
        path=filepath,
        media_type="video/mp4",
        filename=filename
    )