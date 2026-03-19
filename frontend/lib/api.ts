import axios from "axios";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Automatically attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const registerUser = (data: {
  email: string;
  password: string;
  full_name: string;
}) => API.post("/api/auth/register", data);

export const loginUser = (data: { email: string; password: string }) =>
  API.post("/api/auth/login", data);

export const getMe = () => API.get("/api/auth/me");

// TTS
export const generateSpeech = (
  text: string,
  speaker: string = "p267",
  speed: number = 1.0
) => API.post("/api/tts/generate", { text, speaker, speed });

export const getSpeakers = () => API.get("/api/tts/speakers");

export const getHistory = () => API.get("/api/tts/history");

// Voice cloning
export const uploadVoiceSample = (name: string, file: File) => {
  const form = new FormData();
  form.append("name", name);
  form.append("file", file);
  return API.post("/api/voices/upload", form);
};

export const listVoices = () => API.get("/api/voices/list");

export const generateClonedAudio = (data: {
  text: string;
  voice_id: string;
  language: string;
}) => API.post("/api/voices/generate", data);