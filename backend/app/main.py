from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from app.database import engine, Base
from app.models import user, voice, audio
from app.routers import tts, auth, voices
from app.routers import avatar

Base.metadata.create_all(bind=engine)

security = HTTPBearer()

app = FastAPI(
    title="VoiceGen SaaS API",
    description="AI-powered Text-to-Speech and Voice Cloning",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(tts.router, prefix="/api/tts", tags=["Text to Speech"])
app.include_router(voices.router, prefix="/api/voices", tags=["Voice Cloning"])
app.include_router(avatar.router, prefix="/api/avatar", tags=["Avatar Video"])

@app.get("/")
def root():
    return {"message": "VoiceGen API is running", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "healthy"}