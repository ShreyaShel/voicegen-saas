# EchoAI System Documentation

## 1. Executive Summary
EchoAI is a comprehensive, full-stack AI platform designed to provide powerful voice generation capabilities, high-fidelity voice cloning, and AI avatar video creation. Built with a modern Next.js React frontend and a FastAPI Python backend, it integrates leading machine learning models like Coqui TTS, F5-TTS, SadTalker, and Wav2Lip.

## 2. System Architecture

The application is built on a client-server architecture:

### 2.1 Frontend (Client)
- **Framework:** Next.js 16 (React) with TypeScript
- **Styling:** Tailwind CSS 4 for utility-first styling and Framer Motion for rich animations
- **State Management:** React Hooks and local state
- **API Communication:** Axios
- **Theme:** Dark/Light mode support with dynamic UI responses

### 2.2 Backend (API Server)
- **Framework:** FastAPI (Python 3.11)
- **Server:** Uvicorn/Gunicorn
- **Database:** PostgreSQL with SQLAlchemy ORM
- **Authentication:** JWT (JSON Web Tokens) with BCrypt password hashing
- **ML Integration:** Direct python module imports and Subprocess calls for heavy ML tasks
- **File Storage:** Local filesystem storage for uploaded media and generated outputs

## 3. Database Schema

The platform relies on a relational PostgreSQL database to manage state and user history.

### Users Table
- `id`: UUID (Primary Key)
- `email`: String (Unique, Indexed)
- `hashed_password`: String
- `full_name`: String
- `created_at`: DateTime

### ClonedVoices Table
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key to Users)
- `name`: String
- `sample_path`: String (Path to reference audio file)
- `created_at`: DateTime

### Generations History Table
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key to Users)
- `type`: String ('tts' or 'avatar')
- `text`: Text (The input text or prompt)
- `output_path`: String (Path to output media)
- `created_at`: DateTime

## 4. Detailed Feature Documentation

### 4.1 Text-to-Speech (TTS)
The TTS engine takes user text and generates realistic speech. It supports 14+ languages and offers auto-translation and grammar correction before generation.

### 4.2 Voice Cloning
Users can upload clean, non-noisy audio files of a target voice. The backend stores these reference audio samples and utilizes Zero-Shot Voice Cloning (using engines like F5-TTS/XTTS) to generate new speech matching the speaker's vocal characteristics.

### 4.3 AI Avatar Video Generation
The system processes an uploaded still portrait and an audio file (either uploaded or generated via TTS) to synthesize a talking head video where lip movements are synchronized to the audio.
- Supported Engines: Local (SadTalker / Wav2Lip) and Cloud options (Replicate API)

## 5. API Reference

> Note: All authenticated endpoints require a valid JWT token in the Authorization header: `Bearer <token>`

### Authentication API (`/api/auth`)
- `POST /register`: Create a new user account.
- `POST /login`: Authenticate and receive a JWT token.
- `GET /me`: Retrieve the authenticated user's profile.

### Text-to-Speech API (`/api/tts`)
- `GET /speakers`: Returns a list of available standard voice actors.
- `GET /languages`: Returns a list of supported languages.
- `POST /generate`: Submits text to be converted to speech. Parameters include `text`, `speaker`, `speed`, and `language`.
- `GET /audio/{filename}`: Streams the generated `.wav` or `.mp3` file.

### Voice Cloning API (`/api/voices`)
- `POST /upload`: Upload a reference `.wav` file to create a voice clone.
- `GET /list`: Retrieve all custom cloned voices owned by the user.
- `POST /generate`: Generate speech using a specific `voice_id` belonging to the user.
- `DELETE /{voice_id}`: Remove a custom cloned voice.

### Avatar Video API (`/api/avatar`)
- `POST /generate`: Submit a text prompt/audio and an image to create an animated avatar. Options include face sizing, still mode preferences, and engine selection.
- `GET /video/{filename}`: Downloads or streams the resulting `.mp4` generated video file.

## 6. Machine Learning Models & Engines

### TTS Engine Integrations
- **Coqui TTS**: Used for fast, high-quality, multilingual standard text-to-speech tasks.
- **F5-TTS**: Advanced zero-shot cloning engine for high-fidelity personalized voice generation.

### Video Generation Models
- **SadTalker**: Generates highly expressive facial animations from still images and audio input. Used for "talking head" generation.
- **Wav2Lip**: Used as a fast alternative for strict lip-syncing without full-head motion rendering.

## 7. Deployment Strategy

The application is structured for containerized and cloud deployment.
- **Backend**: Can be containerized using Docker and deployed to services like Railway, Render, or AWS ECS. It relies on standard environment variables for configuration.
- **Frontend**: Optimized for Vercel or Netlify. Next.js static and serverless deployments ensure rapid edge delivery.

## 8. Security & Best Practices
- **Data Privacy**: Passwords are never stored in plaintext (BCrypt). JWTs are short-lived.
- **CORS Configuration**: Restricts API access to authorized frontend origins.
- **File Handling**: Uploads are verified by extension and UUID-prefixed to prevent path traversal and collision attacks.
