# EchoAI

AI-powered voice generation platform with text-to-speech, voice cloning, and avatar video creation.

## Features

- **Text-to-Speech (TTS)** - Generate natural speech in 14+ languages
- **Voice Cloning** - Upload audio samples to create a personalized synthetic voice
- **Avatar Videos** - Generate talking head videos from images with synchronized audio
- **Multi-Speaker Support** - Choose from a variety of pre-built voice profiles
- **Auto-Translation** - Translate text to different languages before speech synthesis
- **Grammar & Spell Check** - Automatic text correction for cleaner output
- **Generation History** - Track and replay all your generated audio and videos
- **Usage Analytics** - Monitor your generation statistics
- **Dark/Light Mode** - Toggle between themes in the dashboard

## Tech Stack

### Frontend

| Category | Technology |
|----------|------------|
| Framework | Next.js 16.2.0 |
| Language | TypeScript |
| UI Library | React 19.2.4 |
| Styling | Tailwind CSS 4 |
| HTTP Client | Axios |
| Animations | Framer Motion |
| Icons | Lucide React |

### Backend

| Category | Technology |
|----------|------------|
| Framework | FastAPI |
| Language | Python 3.11 |
| Database | PostgreSQL + SQLAlchemy |
| Authentication | JWT (python-jose) + bcrypt |
| TTS Engine | Coqui TTS, F5-TTS |
| Audio Processing | Librosa, SoundFile, Noisereduce |
| Video Generation | SadTalker, Wav2Lip |

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+ and pip
- PostgreSQL database (local or cloud)
- Git

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/ShreyaShel/voicegen-saas.git
cd voicegen-saas
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

### 3. Backend Setup

```bash
cd backend
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

## Environment Variables

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/voicegen_db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
FRONTEND_URL=http://localhost:3000
```

## Running Locally

### Start Backend

```bash
cd backend
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
```

The backend API will be available at `http://localhost:8080`

API documentation (Swagger UI) at `http://localhost:8080/docs`

### Start Frontend

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:3000`

## API Documentation

### Authentication

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | `{ email, password, full_name }` |
| POST | `/api/auth/login` | Login user | `{ email, password }` |
| GET | `/api/auth/me` | Get current user | - |

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}
```

### Text-to-Speech

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tts/speakers` | List available speakers |
| GET | `/api/tts/languages` | List supported languages |
| GET | `/api/tts/multilingual-speakers` | List multilingual speakers |
| POST | `/api/tts/generate` | Generate speech |
| GET | `/api/tts/audio/{filename}` | Download audio file |
| GET | `/api/tts/history` | Get generation history |

**Generate Request Body:**
```json
{
  "text": "Hello, this is a test.",
  "speaker": "p225",
  "speed": 1.0,
  "language": "en"
}
```

**Generate Response:**
```json
{
  "success": true,
  "filename": "output_abc123.wav",
  "download_url": "/api/tts/audio/output_abc123.wav",
  "warnings": [],
  "translation": null
}
```

### Voice Cloning

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/voices/upload` | Upload voice sample |
| GET | `/api/voices/list` | List user's cloned voices |
| POST | `/api/voices/generate` | Generate speech with cloned voice |
| DELETE | `/api/voices/{voice_id}` | Delete a cloned voice |

**Upload:** `multipart/form-data` with `name` (string) and `file` (audio file)

**Generate with Cloned Voice:**
```json
{
  "voice_id": "uuid",
  "text": "Hello from my cloned voice!",
  "language": "en"
}
```

### Avatar Videos

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/avatar/generate` | Generate avatar video |
| GET | `/api/avatar/video/{filename}` | Download video file |

**Generate Request:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| text | string | Text to convert to speech |
| language | string | Language code (e.g., "en") |
| speaker | string | Speaker ID (for non-cloned voices) |
| voice_id | string | Cloned voice ID (optional) |
| image | file | Face image (optional) |
| still_mode | boolean | Use still mode (default: true) |
| face_size | integer | Face size (default: 256) |
| engine | string | "local" or "replicate" |
| speed | float | Speech speed (default: 1.0) |

## Supported Languages

- English (en)
- Hindi (hi)
- French (fr)
- German (de)
- Spanish (es)
- Italian (it)
- Portuguese (pt)
- Russian (ru)
- Chinese (zh)
- Arabic (ar)
- Korean (ko)
- Dutch (nl)
- Turkish (tr)
- Polish (pl)


### Manual Deployment

**Backend:**
```bash
cd backend
pip install -r requirements.txt
gunicorn app.main:app --workers 4 --bind 0.0.0.0:8080
```

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

## Project Structure

```
voicegen-saas/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── config.py            # Configuration
│   │   ├── database.py          # Database setup
│   │   ├── models/              # SQLAlchemy models
│   │   ├── routers/             # API endpoints
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── services/            # Business logic
│   │   └── utils/               # Utilities
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
├── frontend/
│   ├── app/                     # Next.js app directory
│   ├── components/              # React components
│   ├── lib/                     # Utilities and API client
│   ├── package.json
│   └── .env.local
├── README.md
└── LICENSE
```

## License

This project is licensed under the MIT License.
