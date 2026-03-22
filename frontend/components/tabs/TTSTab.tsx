"use client";
import { useState, useEffect } from "react";
import { generateSpeech, getSpeakers, getLanguages, getMultilingualSpeakers } from "@/lib/api";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function TTSTab() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [audio, setAudio] = useState<string | null>(null);
  const [speakers, setSpeakers] = useState<Record<string, string>>({});
  const [languages, setLanguages] = useState<Record<string, string>>({});
  const [multiSpeakers, setMultiSpeakers] = useState<Record<string, string>>({});
  const [selectedLang, setSelectedLang] = useState("en");
  const [selectedSpeaker, setSelectedSpeaker] = useState("p225");
  const [selectedMultiSpeaker, setSelectedMultiSpeaker] = useState("female_1");
  const [speed, setSpeed] = useState(1.0);
  const [translationInfo, setTranslationInfo] = useState<any>(null);
  const [showWave, setShowWave] = useState(false);

  useEffect(() => {
    getSpeakers().then(r => setSpeakers(r.data)).catch(() => {});
    getLanguages().then(r => setLanguages(r.data)).catch(() => {});
    getMultilingualSpeakers().then(r => setMultiSpeakers(r.data)).catch(() => {});
  }, []);

  async function handleGenerate() {
    if (!text.trim()) return toast.error("Enter some text first");
    setLoading(true);
    setShowWave(false);
    setTranslationInfo(null);
    try {
      const speakerToUse = selectedLang === "en" ? selectedSpeaker : selectedMultiSpeaker;
      const res = await generateSpeech(text, speakerToUse, speed, selectedLang);
      setAudio(`${API_URL}${res.data.download_url}`);
      setTranslationInfo(res.data.translation);
      setShowWave(true);
      res.data.warnings?.forEach((w: string) => toast(w, { icon: "⚠️" }));
      toast.success("Audio generated!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  const langEntries = Object.entries(languages);
  const speakerEntries = selectedLang === "en"
    ? Object.entries(speakers)
    : Object.entries(multiSpeakers);

  return (
    <div>
      <div className="accent-line" />
      <div style={{
        background: "var(--bg2)", border: "1px solid var(--border)",
        borderRadius: 16, padding: 20, marginBottom: 16
      }}>
        {/* Language pills */}
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
          Output language
        </p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {langEntries.slice(0, 8).map(([code, name]) => (
            <button key={code} onClick={() => setSelectedLang(code)} style={{
              padding: "6px 14px", borderRadius: 20, border: `1px solid ${selectedLang === code ? "var(--p)" : "var(--border)"}`,
              background: selectedLang === code ? "var(--p)" : "var(--bg3)",
              color: selectedLang === code ? "white" : "var(--text2)",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              boxShadow: selectedLang === code ? "0 0 12px rgba(124,111,255,0.4)" : "none"
            }}>
              {name as string}
            </button>
          ))}
        </div>

        {/* Speaker pills */}
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
          Voice
        </p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {speakerEntries.map(([id, name]) => {
            const isActive = selectedLang === "en" ? selectedSpeaker === id : selectedMultiSpeaker === id;
            return (
              <button key={id} onClick={() => selectedLang === "en" ? setSelectedSpeaker(id) : setSelectedMultiSpeaker(id)} style={{
                padding: "6px 14px", borderRadius: 20,
                border: `1px solid ${isActive ? "var(--p)" : "var(--border)"}`,
                background: isActive ? "var(--p)" : "var(--bg3)",
                color: isActive ? "white" : "var(--text2)",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                boxShadow: isActive ? "0 0 12px rgba(124,111,255,0.4)" : "none"
              }}>
                {name as string}
              </button>
            );
          })}
        </div>

        {/* Text area */}
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
          Your text
        </p>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={1000}
          placeholder="Type anything — spell-check, grammar fix, and translation happen automatically..."
          style={{
            width: "100%", background: "var(--bg3)", border: "1px solid var(--border)",
            borderRadius: 12, padding: 14, color: "var(--text)", fontSize: 14,
            resize: "none", height: 100, outline: "none", fontFamily: "inherit",
            lineHeight: 1.6
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", margin: "6px 0 12px" }}>
          <span style={{ fontSize: 11, color: "var(--text3)" }}>
            Auto spell-check · Grammar fix · Auto translate
          </span>
          <span style={{ fontSize: 11, color: "var(--text3)" }}>{text.length} / 1000</span>
        </div>

        {/* Speed — English only */}
        {selectedLang === "en" && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: "var(--text2)", whiteSpace: "nowrap", fontWeight: 600 }}>Speed</span>
            <input
              type="range" min="5" max="20" step="1"
              value={Math.round(speed * 10)}
              onChange={e => setSpeed(parseInt(e.target.value) / 10)}
              style={{ flex: 1, accentColor: "var(--p)" }}
            />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--p2)", minWidth: 36 }}>
              {speed.toFixed(1)}x
            </span>
          </div>
        )}

        {/* Generate button */}
        <button onClick={handleGenerate} disabled={loading} style={{
          width: "100%", padding: 16, borderRadius: 14, border: "none",
          background: loading ? "var(--bg3)" : "linear-gradient(135deg,var(--p),var(--pink))",
          color: loading ? "var(--text2)" : "white", fontSize: 15, fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer", letterSpacing: 0.5,
          transition: "all 0.3s"
        }}>
          {loading ? "⟳ Generating..." : "✦ Generate Speech"}
        </button>

        {/* Translation info */}
        {translationInfo?.was_translated && (
          <div style={{
            marginTop: 12, padding: 12, background: "rgba(255,193,7,0.1)",
            borderRadius: 12, border: "1px solid rgba(255,193,7,0.3)"
          }}>
            <p style={{ fontSize: 12, color: "#ffc107" }}>
              Auto-translated from <strong>{translationInfo.source_language?.toUpperCase()}</strong> to <strong>{languages[translationInfo.target_language]}</strong>
            </p>
            <p style={{ fontSize: 11, color: "var(--text2)", marginTop: 4, fontStyle: "italic" }}>
              Original: "{translationInfo.original_text}"
            </p>
          </div>
        )}

        {/* Waveform player */}
        {showWave && audio && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "14px 16px", background: "var(--bg3)",
            borderRadius: 12, marginTop: 12, border: "1px solid var(--border)"
          }}>
            {Array.from({ length: 28 }, (_, i) => (
              <div key={i} className="wave-bar" style={{
                width: 3, borderRadius: 2,
                background: "linear-gradient(to top,var(--p),var(--pink))",
                animationDelay: `${(i * 0.05).toFixed(2)}s`
              }} />
            ))}
            <div style={{ marginLeft: 10, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Audio ready</div>
              <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>
                {languages[selectedLang]} · {speed.toFixed(1)}x speed
              </div>
            </div>
            <audio controls src={audio} style={{ height: 32, width: 160 }} />
            <a href={audio} download="output.wav" style={{
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