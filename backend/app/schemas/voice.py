from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class VoiceCreate(BaseModel):
    name: str

class VoiceResponse(BaseModel):
    id: UUID
    name: str
    sample_path: str
    created_at: datetime

    class Config:
        from_attributes = True

class CloneGenerateRequest(BaseModel):
    text: str
    voice_id: str
    language: str = "en"