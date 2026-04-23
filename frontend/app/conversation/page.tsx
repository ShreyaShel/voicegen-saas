"use client";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { listVoices } from "@/lib/api";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { 
  Upload, User, MessageSquare, ChevronRight, 
  Trash2, Play, Download, CheckCircle2, AlertCircle 
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Turn {
  id: string;
  speaker_index: number;
  text: str;
  voice_id: string;
  speaker: string;
}

export default function ConversationPage() {
  const { user } = useAuth();
  const router = useRouter();

  // State
  const [stage, setStage] = useState<"upload" | "validating" | "studio" | "generating" | "ready">("upload");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [faces, setFaces] = useState<any[]>([]);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [voices, setVoices] = useState<any[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [valProgress, setValProgress] = useState(0);
  const [genStep, setGenStep] = useState("");
  
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listVoices().then(res => setVoices(res.data)).catch(() => {});
  }, []);

  // Handlers
  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    validateImage(file);
  }

  async function validateImage(file: File) {
    setStage("validating");
    setValProgress(20);
    
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("image", file);

    try {
      setValProgress(50);
      const res = await fetch(`${API_URL}/api/conversation/validate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      setValProgress(100);

      if (data.success) {
        setFaces(data.faces);
        // Start with 2 default turns
        setTurns([
          { id: Math.random().toString(), speaker_index: 0, text: "Hi there!", voice_id: "", speaker: "p225" },
          { id: Math.random().toString(), speaker_index: 1, text: "Hello! How are you?", voice_id: "", speaker: "p225" }
        ]);
        setTimeout(() => setStage("studio"), 500);
      } else {
        toast.error(data.message, { duration: 5000 });
        setStage("upload");
      }
    } catch (err) {
      toast.error("Validation failed. Please try a different image.");
      setStage("upload");
    }
  }

  function addTurn(speakerIndex: number) {
    setTurns([...turns, { 
      id: Math.random().toString(), 
      speaker_index: speakerIndex, 
      text: "", 
      voice_id: "", 
      speaker: "p225" 
    }]);
  }

  function updateTurn(id: string, text: string) {
    setTurns(turns.map(t => t.id === id ? { ...t, text } : t));
  }

  function removeTurn(id: string) {
    setTurns(turns.filter(t => t.id !== id));
  }

  async function handleGenerate() {
    if (!image || turns.some(t => !t.text.trim())) {
        return toast.error("Please fill in all dialogue fields.");
    }
    
    setStage("generating");
    setGenStep("Starting conversation generation...");
    
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("image", image);
    formData.append("turns_json", JSON.stringify(turns));

    try {
      const res = await fetch(`${API_URL}/api/conversation/generate-full`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Generation failed");
      
      const data = await res.json();
      setVideoUrl(`${API_URL}${data.download_url}`);
      setStage("ready");
      toast.success("Conversation video generated!");
    } catch (err) {
      toast.error("Generation failed. Check console for details.");
      setStage("studio");
    }
  }

  return (
    <DashboardLayout activeTab="conversation" showLoader={true}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontSize: 32, fontWeight: 900,
            background: "linear-gradient(135deg,var(--p2),var(--pink),var(--cyan))",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>Conversation Studio</h1>
          <p style={{ fontSize: 14, color: "var(--text2)", marginTop: 4 }}>
            Animate a dialogue between two people in a single frame.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* STAGE: UPLOAD */}
          {stage === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              style={{
                background: "var(--bg2)", border: "1px solid var(--border)",
                borderRadius: 24, padding: 60, textAlign: "center"
              }}
            >
              <div style={{
                width: 80, height: 80, borderRadius: 20, background: "rgba(124,111,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px"
              }}>
                <Upload size={40} color="var(--p)" />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Upload a photo of 2 people</h2>
              <p style={{ color: "var(--text3)", maxWidth: 400, margin: "0 auto 32px" }}>
                Make sure both faces are clearly visible and front-facing for the best animation results.
              </p>
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  padding: "16px 32px", borderRadius: 16, border: "none",
                  background: "linear-gradient(135deg,var(--p),var(--pink))",
                  color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer",
                  boxShadow: "0 10px 20px rgba(124,111,255,0.3)"
                }}
              >
                Select Image
              </button>
              <input ref={fileRef} type="file" hidden accept="image/*" onChange={handleImageSelect} />
            </motion.div>
          )}

          {/* STAGE: VALIDATING */}
          {stage === "validating" && (
            <motion.div
              key="validating"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ textAlign: "center", padding: 60 }}
            >
              <div className="processing-ring" style={{ width: 60, height: 60, margin: "0 auto 24px" }} />
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Analyzing Image...</h2>
              <div style={{ width: 300, height: 6, background: "var(--bg3)", borderRadius: 3, margin: "20px auto", overflow: "hidden" }}>
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${valProgress}%` }}
                  style={{ height: "100%", background: "var(--p)" }}
                />
              </div>
              <p style={{ color: "var(--text3)", fontSize: 14 }}>Detecting speakers and checking quality</p>
            </motion.div>
          )}

          {/* STAGE: STUDIO */}
          {stage === "studio" && (
            <motion.div
              key="studio"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: 24 }}
            >
              {/* Left Side — Cast & Preview */}
              <div style={{ position: "sticky", top: 20, height: "fit-content" }}>
                <div style={{
                  background: "var(--bg2)", border: "1px solid var(--border)",
                  borderRadius: 20, overflow: "hidden"
                }}>
                  <img src={imagePreview!} style={{ width: "100%", height: 220, objectFit: "cover" }} />
                  <div style={{ padding: 20 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
                      Detected Cast
                    </p>
                    <div style={{ display: "flex", gap: 12 }}>
                      {faces.map((face, idx) => (
                        <div key={idx} style={{ flex: 1, textAlign: "center" }}>
                          <div style={{
                            aspectRatio: "1/1", borderRadius: 12, border: "2px solid var(--border)",
                            background: "var(--bg3)", display: "flex", alignItems: "center", justifyContent: "center",
                            marginBottom: 8, fontSize: 12, fontWeight: 800, color: "var(--p)"
                          }}>
                            P{idx + 1}
                          </div>
                          <p style={{ fontSize: 11, fontWeight: 600 }}>Person {idx + 1}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ 
                    marginTop: 16, padding: 20, background: "rgba(255,255,255,0.03)", 
                    borderRadius: 20, border: "1px dashed var(--border)" 
                }}>
                    <p style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.5 }}>
                        Tip: Drag dialogue bubbles to reorder the conversation flow.
                    </p>
                </div>

                <button
                  onClick={handleGenerate}
                  style={{
                    width: "100%", marginTop: 20, padding: 18, borderRadius: 16, border: "none",
                    background: "linear-gradient(135deg,var(--p),var(--cyan))",
                    color: "white", fontSize: 15, fontWeight: 800, cursor: "pointer"
                  }}
                >
                  ✦ Generate Master Video
                </button>
              </div>

              {/* Right Side — Script Editor */}
              <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 24, padding: 24, minHeight: 600 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800 }}>Script Timeline</h3>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => addTurn(0)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg3)", color: "var(--text2)", fontSize: 12, fontWeight: 600 }}>+ Turn Person 1</button>
                        <button onClick={() => addTurn(1)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg3)", color: "var(--text2)", fontSize: 12, fontWeight: 600 }}>+ Turn Person 2</button>
                    </div>
                </div>

                <Reorder.Group axis="y" values={turns} onReorder={setTurns} style={{ listStyle: "none", padding: 0 }}>
                  {turns.map((turn) => (
                    <Reorder.Item key={turn.id} value={turn} style={{ marginBottom: 12 }}>
                      <div style={{
                        display: "flex",
                        justifyContent: turn.speaker_index === 0 ? "flex-start" : "flex-end",
                        width: "100%"
                      }}>
                        <div style={{
                          width: "85%",
                          background: turn.speaker_index === 0 ? "rgba(124,111,255,0.1)" : "rgba(0,255,255,0.05)",
                          border: `1px solid ${turn.speaker_index === 0 ? "rgba(124,111,255,0.3)" : "rgba(0,255,255,0.2)"}`,
                          borderRadius: 20, padding: 16, position: "relative"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                            <span style={{ 
                                fontSize: 10, fontWeight: 800, textTransform: "uppercase", 
                                color: turn.speaker_index === 0 ? "var(--p2)" : "var(--cyan)" 
                            }}>
                                Person {turn.speaker_index + 1}
                            </span>
                            <button onClick={() => removeTurn(turn.id)} style={{ color: "var(--text3)", border: "none", background: "none", cursor: "pointer" }}>
                                <Trash2 size={14} />
                            </button>
                          </div>
                          <textarea
                            value={turn.text}
                            onChange={(e) => updateTurn(turn.id, e.target.value)}
                            placeholder="Type dialogue here..."
                            style={{
                              width: "100%", background: "transparent", border: "none",
                              color: "var(--text)", fontSize: 14, outline: "none",
                              resize: "none", minHeight: 60, fontFamily: "inherit"
                            }}
                          />
                        </div>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
                
                {turns.length === 0 && (
                    <div style={{ textAlign: "center", padding: 60, color: "var(--text3)" }}>
                        <MessageSquare size={40} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
                        <p>No turns yet. Add one to start the script.</p>
                    </div>
                )}
              </div>
            </motion.div>
          )}

          {/* STAGE: GENERATING */}
          {stage === "generating" && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ textAlign: "center", padding: 80 }}
            >
              <div className="pulse" style={{ width: 100, height: 100, background: "rgba(124,111,255,0.1)", borderRadius: "50%", margin: "0 auto 32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Play size={40} color="var(--p)" />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800 }}>Generative Engine Running</h2>
              <p style={{ color: "var(--text2)", marginTop: 8 }}>{genStep}</p>
              <p style={{ color: "var(--text3)", fontSize: 13, marginTop: 20 }}>
                This process involves high-end video rendering for each turn. <br/>
                Please stay on this page.
              </p>
            </motion.div>
          )}

          {/* STAGE: READY */}
          {stage === "ready" && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              style={{ maxWidth: 800, margin: "0 auto" }}
            >
              <div style={{
                background: "var(--bg2)", border: "1px solid var(--border)",
                borderRadius: 24, padding: 32, textAlign: "center"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20 }}>
                    <CheckCircle2 color="var(--cyan)" size={24} />
                    <h2 style={{ fontSize: 24, fontWeight: 800 }}>Conversation Ready</h2>
                </div>
                
                <video src={videoUrl!} controls autoPlay style={{ width: "100%", borderRadius: 16, marginBottom: 24, boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }} />
                
                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                    <a href={videoUrl!} download="conversation.mp4" style={{
                      padding: "16px 32px", borderRadius: 14, background: "linear-gradient(135deg,var(--p),var(--pink))",
                      color: "white", textDecoration: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: 8
                    }}>
                        <Download size={18} /> Download Video
                    </a>
                    <button onClick={() => setStage("studio")} style={{
                      padding: "16px 32px", borderRadius: 14, background: "var(--bg3)",
                      color: "var(--text)", border: "1px solid var(--border)", fontWeight: 700, cursor: "pointer"
                    }}>
                        Edit Script
                    </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        .processing-ring {
            border: 4px solid var(--bg3);
            border-top: 4px solid var(--p);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        .pulse {
            animation: pulse 2s infinite;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes pulse { 0% { transform: scale(0.95); opacity: 0.5; } 50% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(0.95); opacity: 0.5; } }
      `}</style>
    </DashboardLayout>
  );
}
