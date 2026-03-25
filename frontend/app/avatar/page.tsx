"use client";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { listVoices } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AvatarPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("en");
  const [stillMode, setStillMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [step, setStep] = useState("");
  const [voices, setVoices] = useState<any[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listVoices().then(res => setVoices(res.data)).catch(() => {});
  }, []);

  // Force English for cloned voices
  useEffect(() => {
    if (selectedVoiceId) setLanguage("en");
  }, [selectedVoiceId]);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setVideoUrl(null);
  }

  async function handleGenerate() {
    if (!image) return toast.error("Upload an image first");
    if (!text.trim()) return toast.error("Enter some text");
    if (!user) { router.push("/login"); return; }

    setLoading(true);
    setVideoUrl(null);
    setStep("Generating audio...");

    try {
      const token = localStorage.getItem("token");
      const form = new FormData();
      form.append("text", text);
      form.append("language", language);
      if (selectedVoiceId) {
        form.append("voice_id", selectedVoiceId);
      } else {
        form.append("speaker", "p225");
      }
      form.append("still_mode", stillMode ? "1" : "0");
      form.append("face_size", "256");
      form.append("image", image);

      setStep("Generating talking avatar video...");

      const res = await fetch(`${API_URL}/api/avatar/generate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Generation failed");
      }

      const data = await res.json();
      setVideoUrl(`${API_URL}${data.download_url}`);
      toast.success("Avatar video generated!");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
      setStep("");
    }
  }

  const languages = [
    { code: "en", name: "English" }, { code: "hi", name: "Hindi" },
    { code: "fr", name: "French" }, { code: "es", name: "Spanish" },
    { code: "de", name: "German" }, { code: "it", name: "Italian" },
  ];

  return (
    <DashboardLayout activeTab="avatar" showLoader={true}>
      <div style={{ maxWidth: 1000, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <h1 style={{
              fontSize: 32, fontWeight: 900, marginTop: 8,
              background: "linear-gradient(135deg,var(--p2),var(--pink),var(--cyan))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
            }}>Avatar Video Generator</h1>
            <p style={{ fontSize: 14, color: "var(--text2)", marginTop: 4 }}>
              Upload any image → type text → get a talking avatar video
            </p>
          </div>
          <div style={{
            padding: "6px 14px", borderRadius: 20,
            background: "rgba(124,111,255,0.15)", border: "1px solid rgba(124,111,255,0.3)",
            color: "var(--p2)", fontSize: 12, fontWeight: 700
          }}>BETA</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Left — Image upload */}
          <div style={{
            background: "var(--bg2)", border: "1px solid var(--border)",
            borderRadius: 20, padding: 24
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 14 }}>
              Upload Image
            </p>

            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: "2px dashed var(--border)", borderRadius: 16,
                padding: imagePreview ? 8 : 40, textAlign: "center" as const,
                cursor: "pointer", transition: "all 0.3s", marginBottom: 16,
                minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" style={{
                  maxWidth: "100%", maxHeight: 220, borderRadius: 12, objectFit: "cover" as const
                }} />
              ) : (
                <div>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>🖼️</div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                    Click to upload image
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text3)" }}>
                    JPG, PNG, WEBP · Any portrait works
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileRef} type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleImageSelect}
              style={{ display: "none" }}
            />

            {imagePreview && (
              <button
                onClick={() => { setImage(null); setImagePreview(null); setVideoUrl(null); }}
                style={{
                  width: "100%", padding: "8px", borderRadius: 10,
                  border: "1px solid var(--border)", background: "var(--bg3)",
                  color: "var(--text2)", fontSize: 13, cursor: "pointer"
                }}
              >
                Remove image
              </button>
            )}

            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 10 }}>
                Options
              </p>
              <label style={{
                display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                padding: "10px 14px", background: "var(--bg3)", borderRadius: 10,
                border: "1px solid var(--border)"
              }}>
                <input
                  type="checkbox"
                  checked={stillMode}
                  onChange={e => setStillMode(e.target.checked)}
                />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Still mode</p>
                  <p style={{ fontSize: 11, color: "var(--text3)" }}>Less head movement, more stable</p>
                </div>
              </label>
            </div>
          </div>

          {/* Right — Text and generate */}
          <div style={{
            background: "var(--bg2)", border: "1px solid var(--border)",
            borderRadius: 20, padding: 24
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 14 }}>
              What should the avatar say?
            </p>

            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              maxLength={500}
              placeholder="Enter the speech text for your avatar..."
              style={{
                width: "100%", background: "var(--bg3)",
                border: "1px solid var(--border)", borderRadius: 12,
                padding: 14, color: "var(--text)", fontSize: 14,
                resize: "none" as const, height: 140, outline: "none",
                fontFamily: "inherit", lineHeight: 1.6, marginBottom: 8
              }}
            />
            <p style={{ fontSize: 11, color: "var(--text3)", marginBottom: 16 }}>
              {text.length} / 500 characters
            </p>

            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 10 }}>
              Voice Selection
            </p>
            <div style={{ marginBottom: 20 }}>
              <select
                value={selectedVoiceId}
                onChange={(e) => setSelectedVoiceId(e.target.value)}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 10,
                  background: "var(--bg3)", border: "1px solid var(--border)",
                  color: "var(--text)", fontSize: 14, outline: "none"
                }}
              >
                <option value="">Default Speaker (Emma)</option>
                {voices.map((v: any) => (
                  <option key={v.id} value={v.id}>Cloned: {v.name}</option>
                ))}
              </select>
              <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 6 }}>
                Choose a voice you've cloned or stick with the default.
              </p>
            </div>

            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 10 }}>
              Language
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, marginBottom: 20 }}>
              {selectedVoiceId ? (
                <div style={{ 
                  padding: "10px 14px", background: "rgba(124,111,255,0.1)", 
                  border: "1px solid var(--p)", borderRadius: 10, width: "100%"
                }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--p)" }}>✓ English Locked</p>
                  <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                    Cloned voices currently support English for maximum accuracy.
                  </p>
                </div>
              ) : (
                languages.map(l => (
                  <button key={l.code} onClick={() => setLanguage(l.code)} style={{
                    padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                    border: `1px solid ${language === l.code ? "var(--p)" : "var(--border)"}`,
                    background: language === l.code ? "var(--p)" : "var(--bg3)",
                    color: language === l.code ? "white" : "var(--text2)",
                    cursor: "pointer",
                    boxShadow: language === l.code ? "0 0 12px rgba(124,111,255,0.4)" : "none"
                  }}>{l.name}</button>
                ))
              )}
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !image || !text.trim()}
              style={{
                width: "100%", padding: 16, borderRadius: 14, border: "none",
                background: loading || !image || !text.trim()
                  ? "var(--bg3)"
                  : "linear-gradient(135deg,var(--p),var(--pink))",
                color: loading || !image || !text.trim() ? "var(--text2)" : "white",
                fontSize: 15, fontWeight: 700,
                cursor: loading || !image || !text.trim() ? "not-allowed" : "pointer",
                letterSpacing: 0.5
              }}
            >
              {loading ? `⟳ ${step}` : "✦ Generate Avatar Video"}
            </button>

            {loading && (
              <div style={{ marginTop: 16, padding: 14, background: "var(--bg3)", borderRadius: 12 }}>
                <p style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>{step}</p>
                <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                  {Array.from({ length: 20 }, (_, i) => (
                    <div key={i} className="wave-bar" style={{
                      width: 3, borderRadius: 2,
                      background: "linear-gradient(to top,var(--p),var(--pink))",
                      animationDelay: `${(i * 0.07).toFixed(2)}s`
                    }} />
                  ))}
                </div>
                <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 8 }}>
                  This takes 1-3 minutes depending on video length
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Output video */}
        {videoUrl && (
          <div style={{
            marginTop: 24, background: "var(--bg2)", border: "1px solid var(--border)",
            borderRadius: 20, padding: 24
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
                ✦ Your avatar video is ready
              </p>
              <a href={videoUrl} download="avatar_video.mp4" style={{
                padding: "8px 16px", borderRadius: 10,
                background: "linear-gradient(135deg,var(--p),var(--pink))",
                color: "white", fontSize: 13, fontWeight: 600,
                textDecoration: "none"
              }}>↓ Download MP4</a>
            </div>
            <video
              controls autoPlay src={videoUrl}
              style={{ width: "100%", borderRadius: 14, maxHeight: 400 }}
            />
          </div>
        )}

        {/* Tips */}
        <div style={{
          marginTop: 20, padding: 20, background: "var(--bg2)",
          border: "1px solid var(--border)", borderRadius: 16
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 12 }}>
            Tips for best results
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              "Use a clear front-facing photo",
              "Good lighting on the face",
              "Single person in the image",
              "Keep text under 30 seconds of speech",
              "Passport-style photos work great",
              "Enable Still Mode for presentations",
            ].map((tip, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ color: "var(--p2)", fontSize: 12, marginTop: 1 }}>✦</span>
                <span style={{ fontSize: 12, color: "var(--text2)" }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}