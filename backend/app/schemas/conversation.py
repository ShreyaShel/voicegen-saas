from pydantic import BaseModel
from typing import List, Optional

class ConversationTurn(BaseModel):
    speaker_index: int  # 0 or 1
    text: str
    voice_id: Optional[str] = None
    speaker: str = "p225"
    speed: float = 1.0
    language: str = "en"

class ConversationRequest(BaseModel):
    turns: List[ConversationTurn]
    still_mode: bool = True
    face_size: int = 256

class FaceDetectionResult(BaseModel):
    face_index: int
    box: List[int] # [x1, y1, x2, y2]
    thumbnail_url: Optional[str] = None

class ValidationResponse(BaseModel):
    success: bool
    message: str
    faces: List[FaceDetectionResult] = []
    error_code: Optional[str] = None
