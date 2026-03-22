"use client";
import { useState, useEffect, useRef } from "react";
import { uploadVoiceSample, listVoices, generateClonedAudio } from "@/lib/api";
import toast from "react-hot-toast";
import { Play, Square, Upload, Mic } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function CloneTab() {
  const [voices, setVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [cloneText, setCloneText] = useState("");
  const [cloneLoading, setCloneLoading] = useState(false);
  const [cloneAudio, setCloneAudio] = useState<string | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [showWave, setShowWave] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { loadVoices(); }, []);

  async function loadVoices() {
    try { const r = await listVoices(); setVoices(r.data); } catch {}
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setUploadFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setIsPreviewPlaying(false);
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.src = url;
      }
    }
  }

  function togglePreview() {
    if (!previewAudioRef.current || !previewUrl) return;
    if (isPreviewPlaying) {
      previewAudioRef.current.pause();
      setIsPreviewPlaying(false);
    } else {
      previewAudioRef.current.play();
      setIsPreviewPlaying(true);
    }
  }

  async function handleUpload() {
    if (!uploadName.trim() || !uploadFile) return toast.error("Provide a name and file");
    setUploadLoading(true);
    try {
      await uploadVoiceSample(uploadName, uploadFile);
      await loadVoices();
      setUploadName(""); setUploadFile(null); setPreviewUrl(null);
      toast.success("Voice uploaded!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Upload failed");
    } finally { setUploadLoading(false); }
  }

  async function handleClone() {
    if (!cloneText.trim()) return toast.error("Enter some text first");
    if (!selectedVoice) return toast.error("Select a voice first");
    setCloneLoading(true);
    setShowWave(false);
    try {
      const res = await generateClonedAudio({ text: cloneText, voice_id: selectedVoice, language: "en" });
      setCloneAudio(`${API_URL}${res.data.download_url}`);
      setShowWave(true);
      toast.success("Cloned audio ready!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Cloning failed");
    } finally { setCloneLoading(false); }
  }

  const card = {
    background: "var(--bg2)", border: "1px solid var(--border)",
    borderRadius: 16, padding: 20, marginBottom: 16
  };

  return (
    <div>
      <div className="accent-line" />
      <div style={card}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 12 }}>
          Upload voice sample
        </p>
        <label style={{
          display: "block", border: "2px dashed var(--border)", borderRadius: 14,
          padding: 32, textAlign: "center" as const, cursor: "pointer"
        }}>
          <input type="file" accept=".wav,.mp3,.ogg,.flac" onChange={handleFileSelect} style={{ display: "none" }} />
          <div className="upload-icon" style={{ fontSize: 36, marginBottom: 10 }}>🎙</div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
            {uploadFile ? uploadFile.name : "Drop audio file here or click to browse"}
          </p>
          <p style={{ fontSize: 12, color: "var(--text3)" }}>WAV, MP3, OGG · 10-30 seconds recommended</p>
        </label>

        {previewUrl && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginTop: 12,
            padding: "10px 14px", background: "rgba(124,111,255,0.1)",
            borderRadius: 10, border: "1px solid rgba(124,111,255,0.3)"
          }}>
            <button onClick={togglePreview} style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "var(--p)", border: "none", borderRadius: 8,
              padding: "6px 12px", color: "white", cursor: "pointer", fontSize: 12, fontWeight: 600
            }}>
              {isPreviewPlaying ? <Square size={12} /> : <Play size={12} />}
              {isPreviewPlaying ? "Stop" : "Preview"}
            </button>
            <span style={{ fontSize: 12, color: "var(--p2)" }}>{uploadFile?.name}</span>
            <audio ref={previewAudioRef} src={previewUrl} onEnded={() => setIsPreviewPlaying(false)} style={{ display: "none" }} />
          </div>
        )}

        <input
          type="text" placeholder="Voice name (e.g. My Voice)"
          value={uploadName} onChange={e => setUploadName(e.target.value)}
          style={{
            width: "100%", marginTop: 12, background: "var(--bg3)",
            border: "1px solid var(--border)", borderRadius: 10,
            padding: "10px 14px", color: "var(--text)", fontSize: 13, outline: "none"
          }}
        />
        <p style={{ fontSize: 11, color: "var(--text3)", margin: "8px 0 12px" }}>
          Tip: Quiet room · Natural pace · 10-30 seconds
        </p>
        <button onClick={handleUpload} disabled={uploadLoading} style={{
          width: "100%", padding: 14, borderRadius: 12, border: "none",
          background: uploadLoading ? "var(--bg3)" : "linear-gradient(135deg,#8b5cf6,var(--pink))",
          color: uploadLoading ? "var(--text2)" : "white", fontSize: 14,
          fontWeight: 700, cursor: uploadLoading ? "not-allowed" : "pointer"
        }}>
          {uploadLoading ? "Uploading..." : "↑ Upload Sample"}
        </button>
      </div>

      <div style={card}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 12 }}>
          Generate with cloned voice
        </p>
        {voices.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--text3)", marginBottom: 12 }}>No voices yet. Upload a sample above.</p>
        ) : (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, marginBottom: 12 }}>
            {voices.map(v => (
              <button key={v.id} onClick={() => setSelectedVoice(v.id)} style={{
                padding: "8px 16px", borderRadius: 20,
                border: `1px solid ${selectedVoice === v.id ? "var(--p)" : "var(--border)"}`,
                background: selectedVoice === v.id ? "var(--p)" : "var(--bg3)",
                color: selectedVoice === v.id ? "white" : "var(--text2)",
                fontSize: 12, fontWeight: 600, cursor: "pointer"
              }}>{v.name}</button>
            ))}
          </div>
        )}
        <textarea
          value={cloneText} onChange={e => setCloneText(e.target.value)}
          maxLength={1000} placeholder="What should your cloned voice say?"
          style={{
            width: "100%", background: "var(--bg3)", border: "1px solid var(--border)",
            borderRadius: 12, padding: 14, color: "var(--text)", fontSize: 14,
            resize: "none" as const, height: 100, outline: "none", fontFamily: "inherit"
          }}
        />
        <button onClick={handleClone} disabled={cloneLoading} style={{
          width: "100%", marginTop: 12, padding: 14, borderRadius: 12, border: "none",
          background: cloneLoading ? "var(--bg3)" : "linear-gradient(135deg,var(--p),var(--cyan))",
          color: cloneLoading ? "var(--text2)" : "white", fontSize: 14,
          fontWeight: 700, cursor: cloneLoading ? "not-allowed" : "pointer"
        }}>
          {cloneLoading ? "⟳ Cloning..." : "✦ Clone & Generate"}
        </button>

        {showWave && cloneAudio && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6, padding: "14px 16px",
            background: "var(--bg3)", borderRadius: 12, marginTop: 12,
            border: "1px solid var(--border)"
          }}>
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i} className="wave-bar" style={{
                width: 3, borderRadius: 2,
                background: "linear-gradient(to top,var(--p),var(--cyan))",
                animationDelay: `${(i * 0.07).toFixed(2)}s`
              }} />
            ))}
            <div style={{ marginLeft: 10, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Cloned audio ready</div>
            </div>
            <audio controls src={cloneAudio} style={{ height: 32, width: 160 }} />
            <a href={cloneAudio} download="cloned.wav" style={{
              padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)",
              background: "var(--bg2)", color: "var(--text2)", fontSize: 11,
              fontWeight: 600, textDecoration: "none"
            }}>↓ Save</a>
          </div>
        )}
      </div>
    </div>
  );
}