"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import {
  generateSpeech,
  getSpeakers,
  getHistory,
  uploadVoiceSample,
  listVoices,
  generateClonedAudio,
} from "@/lib/api";
import toast from "react-hot-toast";
import { LogOut, Mic, Volume2, History, Upload, Play, Square } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Dashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"tts" | "clone" | "history">("tts");

  // TTS state
  const [ttsText, setTtsText] = useState("");
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsAudio, setTtsAudio] = useState<string | null>(null);
  const [speakers, setSpeakers] = useState<Record<string, string>>({});
  const [selectedSpeaker, setSelectedSpeaker] = useState("p267");
  const [speed, setSpeed] = useState(1.0);

  // Voice cloning state
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
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // History state
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading]);

  useEffect(() => {
    if (user) {
      loadVoices();
      loadHistory();
      loadSpeakers();
    }
  }, [user]);

  async function loadSpeakers() {
    try {
      const res = await getSpeakers();
      setSpeakers(res.data);
    } catch {}
  }

  async function loadVoices() {
    try {
      const res = await listVoices();
      setVoices(res.data);
    } catch {}
  }

  async function loadHistory() {
    try {
      const res = await getHistory();
      setHistory(res.data);
    } catch {}
  }

  async function handleTTSGenerate() {
    if (!ttsText.trim()) return toast.error("Enter some text first");
    setTtsLoading(true);
    try {
      const res = await generateSpeech(ttsText, selectedSpeaker, speed);
      setTtsAudio(`${API_URL}${res.data.download_url}`);
      await loadHistory();
      toast.success("Audio generated!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Generation failed");
    } finally {
      setTtsLoading(false);
    }
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
    } else {
      setPreviewUrl(null);
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

  async function handleUploadVoice() {
    if (!uploadName.trim() || !uploadFile)
      return toast.error("Provide a name and file");
    setUploadLoading(true);
    try {
      await uploadVoiceSample(uploadName, uploadFile);
      await loadVoices();
      setUploadName("");
      setUploadFile(null);
      setPreviewUrl(null);
      toast.success("Voice sample uploaded!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Upload failed");
    } finally {
      setUploadLoading(false);
    }
  }

  async function handleCloneGenerate() {
    if (!cloneText.trim()) return toast.error("Enter some text first");
    if (!selectedVoice) return toast.error("Select a voice first");
    setCloneLoading(true);
    try {
      const res = await generateClonedAudio({
        text: cloneText,
        voice_id: selectedVoice,
        language: "en",
      });
      setCloneAudio(`${API_URL}${res.data.download_url}`);
      await loadHistory();
      toast.success("Cloned audio generated!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Cloning failed");
    } finally {
      setCloneLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-indigo-700">VoiceGen</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600 text-sm">{user?.email}</span>
          <button
            onClick={() => { logout(); router.push("/"); }}
            className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-1 shadow-sm border">
          {[
            { id: "tts", label: "Text to Speech", icon: <Volume2 size={16} /> },
            { id: "clone", label: "Voice Cloning", icon: <Mic size={16} /> },
            { id: "history", label: "History", icon: <History size={16} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* TTS Tab */}
        {activeTab === "tts" && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Generate Speech
            </h2>

            <textarea
              className="w-full border rounded-xl px-4 py-3 h-40 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700"
              placeholder="Enter text to convert to speech..."
              value={ttsText}
              onChange={(e) => setTtsText(e.target.value)}
              maxLength={1000}
            />
            <div className="flex justify-between items-center mt-1 mb-4">
              <span className="text-xs text-gray-400">{ttsText.length}/1000</span>
            </div>

            {/* Speaker selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Voice
              </label>
              <select
                className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700"
                value={selectedSpeaker}
                onChange={(e) => setSelectedSpeaker(e.target.value)}
              >
                {Object.entries(speakers).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name as string}
                  </option>
                ))}
              </select>
            </div>

            {/* Speed control */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Speed:{" "}
                <span className="text-indigo-600 font-semibold">
                  {speed.toFixed(1)}x
                </span>
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0.5x slow</span>
                <span>1.0x normal</span>
                <span>2.0x fast</span>
              </div>
            </div>

            <button
              onClick={handleTTSGenerate}
              disabled={ttsLoading}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {ttsLoading ? "Generating..." : "Generate Speech"}
            </button>

            {ttsAudio && (
              <div className="mt-6 p-4 bg-indigo-50 rounded-xl">
                <p className="text-sm font-medium text-indigo-700 mb-2">
                  Generated Audio
                </p>
                <audio controls src={ttsAudio} className="w-full" />
                <a
                  href={ttsAudio}
                  download="output.wav"
                  className="text-sm text-indigo-600 hover:underline mt-2 inline-block"
                >
                  Download
                </a>
              </div>
            )}
          </div>
        )}

        {/* Voice Cloning Tab */}
        {activeTab === "clone" && (
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Upload size={18} /> Upload Voice Sample
              </h2>
              <input
                type="text"
                placeholder="Voice name (e.g. My Voice)"
                className="w-full border rounded-xl px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
              />
              <input
                type="file"
                accept=".wav,.mp3,.ogg,.flac"
                className="w-full border rounded-xl px-4 py-3 mb-3 text-gray-600"
                onChange={handleFileSelect}
              />

              {/* Preview button */}
              {previewUrl && (
                <div className="mb-3 p-3 bg-purple-50 rounded-xl flex items-center gap-3">
                  <button
                    onClick={togglePreview}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition"
                  >
                    {isPreviewPlaying ? <Square size={14} /> : <Play size={14} />}
                    {isPreviewPlaying ? "Stop" : "Preview Sample"}
                  </button>
                  <span className="text-sm text-purple-700 truncate">
                    {uploadFile?.name}
                  </span>
                  <audio
                    ref={previewAudioRef}
                    src={previewUrl}
                    onEnded={() => setIsPreviewPlaying(false)}
                    className="hidden"
                  />
                </div>
              )}

              <p className="text-xs text-gray-400 mb-3">
                Tip: Use a 10-30 second clear recording in a quiet room for best results.
              </p>

              <button
                onClick={handleUploadVoice}
                disabled={uploadLoading}
                className="w-full bg-purple-600 text-white py-3 rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 transition"
              >
                {uploadLoading ? "Uploading..." : "Upload Sample"}
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Mic size={18} /> Generate with Cloned Voice
              </h2>
              {voices.length === 0 ? (
                <p className="text-gray-400 text-sm mb-4">
                  No voices yet. Upload a sample above.
                </p>
              ) : (
                <select
                  className="w-full border rounded-xl px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700"
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                >
                  <option value="">Select a voice...</option>
                  {voices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              )}
              <textarea
                className="w-full border rounded-xl px-4 py-3 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700"
                placeholder="Enter text to speak in the cloned voice..."
                value={cloneText}
                onChange={(e) => setCloneText(e.target.value)}
                maxLength={1000}
              />
              <button
                onClick={handleCloneGenerate}
                disabled={cloneLoading}
                className="w-full mt-3 bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {cloneLoading ? "Generating..." : "Generate Cloned Audio"}
              </button>
              {cloneAudio && (
                <div className="mt-6 p-4 bg-indigo-50 rounded-xl">
                  <p className="text-sm font-medium text-indigo-700 mb-2">
                    Cloned Audio
                  </p>
                  <audio controls src={cloneAudio} className="w-full" />
                  <a
                    href={cloneAudio}
                    download="cloned_output.wav"
                    className="text-sm text-indigo-600 hover:underline mt-2 inline-block"
                  >
                    Download
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Generation History
            </h2>
            {history.length === 0 ? (
              <p className="text-gray-400 text-sm">No generations yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-xl p-4 hover:bg-gray-50 transition"
                  >
                    <p className="text-gray-700 text-sm mb-2 line-clamp-2">
                      {item.text}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                      <a
                        href={`${API_URL}${item.download_url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        Play / Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
