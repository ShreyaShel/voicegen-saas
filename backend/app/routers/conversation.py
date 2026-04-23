import os
import uuid
import shutil
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.utils.auth import get_current_user
from app.models.user import User
from app.services.conversation_service import conversation_service
from app.services.avatar_service import AVATAR_UPLOAD_DIR
from app.schemas.conversation import ConversationRequest, ValidationResponse

router = APIRouter()

@router.post("/validate", response_model=ValidationResponse)
async def validate_img(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Analyze image for exactly two faces and quality."""
    ext = os.path.splitext(image.filename)[1].lower()
    if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
        return ValidationResponse(success=False, message="Invalid image type.")

    temp_path = os.path.join(AVATAR_UPLOAD_DIR, f"val_{uuid.uuid4()}{ext}")
    try:
        with open(temp_path, "wb") as f:
            shutil.copyfileobj(image.file, f)
        
        success, message, faces = conversation_service.validate_image(temp_path)
        return ValidationResponse(success=success, message=message, faces=faces)
    
    finally:
        # We don't delete yet if it's successful, so UI can use it? 
        # Actually validation is temporary, UI will upload again for generation 
        # or we can return a temporary ID. Let's delete for now as requested by simplicity.
        if os.path.exists(temp_path): os.remove(temp_path)

@router.post("/generate")
async def generate_conv(
    request: ConversationRequest,
    image_id: str = Form(...),
    current_user: User = Depends(get_current_user)
):
    """
    Generate the conversation video.
    Note: In a real app, this should be a background task (Celery/RQ).
    """
    # For now, let's assume image_id is a path we previously uploaded 
    # or the frontend sends the image again. 
    # The requirement says 'download mechanism same as now', 
    # and existing avatar gen takes image as File.
    # However, JSON bodies (ConversationRequest) and Files are hard to mix in one request.
    # We'll use the 'multiple dialogue' approach by having the frontend 
    # upload the image first or send it as base64 (not recommended) 
    # or we use a Form that takes a JSON string for 'turns'.
    pass

# Simplified Approach: Use Form for turns so we can include image
@router.post("/generate-full")
async def generate_conversation_full(
    turns_json: str = Form(...), # JSON string of ConversationTurn list
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    import json
    from app.schemas.conversation import ConversationTurn
    
    try:
        turns_data = json.loads(turns_json)
        turns = [ConversationTurn(**t) for t in turns_data]
        request = ConversationRequest(turns=turns)
    except Exception as e:
        raise HTTPException(400, f"Invalid turns format: {str(e)}")

    # Save image
    image_filename = f"conv_{current_user.id}_{uuid.uuid4()}_{image.filename}"
    image_path = os.path.join(AVATAR_UPLOAD_DIR, image_filename)
    with open(image_path, "wb") as f:
        shutil.copyfileobj(image.file, f)

    try:
        # Validate again before heavy processing
        success, message, _ = conversation_service.validate_image(image_path)
        if not success:
            raise HTTPException(400, message)

        video_filename = conversation_service.generate_conversation(
            image_path=image_path,
            request=request,
            user_id=current_user.id
        )

        return {
            "success": True,
            "video_filename": video_filename,
            "download_url": f"/api/avatar/video/{video_filename}"
        }

    except Exception as e:
        print(f"[Conv Error] {str(e)}")
        raise HTTPException(500, str(e))
    finally:
        if os.path.exists(image_path): os.remove(image_path)
