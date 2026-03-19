import uuid
import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class AudioGeneration(Base):
    __tablename__ = "audio_generations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    voice_id = Column(UUID(as_uuid=True), ForeignKey("cloned_voices.id"), nullable=True)
    text = Column(Text, nullable=False)
    audio_filename = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="audio_history")
    voice = relationship("ClonedVoice", back_populates="audio_history")