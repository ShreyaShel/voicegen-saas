import os
import uuid
import subprocess
import shutil
import requests
from typing import Optional
from PIL import Image
# ── Directory paths
# of which directory FastAPI is started from (bug #4 fix)
_BASE = os.path.dirname(os.path.abspath(__file__))
_BACKEND_ROOT = os.path.abspath(os.path.join(_BASE, "..", ".."))

AVATAR_OUTPUT_DIR = os.path.join(_BACKEND_ROOT, "avatar_outputs")
AVATAR_UPLOAD_DIR = os.path.join(_BACKEND_ROOT, "avatar_uploads")
SADTALKER_REPO    = os.path.join(_BACKEND_ROOT, "sadtalker_repo")
SADTALKER_CKPT    = os.path.join(_BACKEND_ROOT, "sadtalker_checkpoints")
SADTALKER_CKPT    = os.path.join(_BACKEND_ROOT, "sadtalker_checkpoints")

os.makedirs(AVATAR_OUTPUT_DIR, exist_ok=True)
os.makedirs(AVATAR_UPLOAD_DIR, exist_ok=True)


def resize_image(image_path: Optional[str], max_size: int = 512) -> Optional[str]:
    if not image_path:
        return None
    img = Image.open(image_path).convert("RGB")
    w, h = img.size
    if w > max_size or h > max_size:
        ratio = min(max_size / w, max_size / h)
        new_w = int(w * ratio)
        new_h = int(h * ratio)
        new_w = new_w - (new_w % 2)
        new_h = new_h - (new_h % 2)
        img = img.resize((new_w, new_h), Image.LANCZOS)
        base, _ = os.path.splitext(image_path)
        resized_path = f"{base}_resized.jpg"
        img.save(resized_path, "JPEG", quality=95)
        return resized_path
    return image_path


def get_audio_duration(audio_path: str) -> float:
    """Return audio duration in seconds using ffprobe. Defaults to 10s on error."""
    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                audio_path,
            ],
            capture_output=True, text=True, timeout=30,
        )
        return float(result.stdout.strip())
    except Exception:
        return 10.0


class VideoEngine:
    def generate(self, image_path: Optional[str] = None, audio_path: Optional[str] = None, prompt: Optional[str] = None, **kwargs) -> str:
        raise NotImplementedError()


class LocalSadTalkerEngine(VideoEngine):
    def generate(self, image_path: Optional[str] = None, audio_path: Optional[str] = None, prompt: Optional[str] = None, **kwargs) -> str:
        if not image_path or not audio_path:
            raise ValueError("LocalSadTalker requires both an image and audio.")
        
        image_path = os.path.abspath(image_path)
        audio_path = os.path.abspath(audio_path)
        
        face_size = kwargs.get("face_size", 256)
        still_mode = kwargs.get("still_mode", True)
        preprocess = kwargs.get("preprocess", "full")
        use_enhancer = kwargs.get("use_enhancer", True) # Restore True as default for quality
        
        output_id = str(uuid.uuid4())
        
        # ── Path Sanitization (Fixes "Broken Pipe" and "No such file" on Windows)
        # SadTalker's internal logic creates messy filenames with '##' if the input path is complex.
        # We copy inputs to a temp dir with simple names to avoid this.
        temp_run_dir = os.path.join(AVATAR_UPLOAD_DIR, f"tmp_{output_id}")
        os.makedirs(temp_run_dir, exist_ok=True)
        
        safe_image_path = os.path.join(temp_run_dir, "source" + (os.path.splitext(image_path)[1] or ""))
        safe_audio_path = os.path.join(temp_run_dir, "audio" + (os.path.splitext(audio_path)[1] or ""))
        
        # Final check to satisfy type checker and ensure stability
        if not image_path or not audio_path:
            raise ValueError("Paths cannot be None")
            
        shutil.copy2(image_path, safe_image_path)
        shutil.copy2(audio_path, safe_audio_path)
        
        resized_image = resize_image(safe_image_path, max_size=512)
        
        try:
            # print(f"DEBUG: face_size={face_size}")
            result = self._run_inference(resized_image, safe_audio_path, output_id, still_mode, preprocess, face_size, use_enhancer)
        finally:
            # Cleanup temp run dir
            shutil.rmtree(temp_run_dir, ignore_errors=True)
            
        return result

    def _run_inference(self, image_path, audio_path, output_id, still_mode, preprocess, size, use_enhancer):
        import sys
        inference_script = os.path.join(SADTALKER_REPO, "inference.py")

        if not os.path.exists(inference_script):
            raise RuntimeError(f"SadTalker not found at: {inference_script}")

        result_dir = os.path.join(AVATAR_OUTPUT_DIR, output_id + "_sadtalker")
        os.makedirs(result_dir, exist_ok=True)

        cmd = [
            sys.executable,
            inference_script,
            "--driven_audio", audio_path,
            "--source_image", image_path,
            "--result_dir", result_dir,
            "--preprocess", preprocess,
            "--size", str(size),
        ]
        if use_enhancer:
            cmd += ["--enhancer", "gfpgan"]
        if still_mode:
            cmd.append("--still")
        if os.path.isdir(SADTALKER_CKPT):
            cmd += ["--checkpoint_dir", SADTALKER_CKPT]

        # ── Environment Preparation
        # Some Windows environments pass an invalid PYTHONHASHSEED which causes SadTalker to crash.
        # We explicitly remove it to ensure a stable start.
        env = {**os.environ, "PYTHONPATH": SADTALKER_REPO}
        env.pop("PYTHONHASHSEED", None)

        print(f"[Engine:Local] Running SadTalker: {' '.join(cmd)}")
        process = subprocess.Popen(
            cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
            cwd=SADTALKER_REPO, env=env,
        )
        if process.stdout:
            for line in process.stdout:
                if line.strip(): print(f"[SadTalker] {line.strip()}")
        process.wait()

        if process.returncode != 0:
            shutil.rmtree(result_dir, ignore_errors=True)
            raise RuntimeError(f"SadTalker failed with code {process.returncode}")

        output_videos = [f for f in os.listdir(result_dir) if f.endswith(".mp4")]
        if not output_videos:
            shutil.rmtree(result_dir, ignore_errors=True)
            raise RuntimeError("No output video found.")

        generated_video = os.path.join(result_dir, output_videos[0])
        final_path = os.path.join(AVATAR_OUTPUT_DIR, f"{output_id}.mp4")
        shutil.move(generated_video, final_path)
        shutil.rmtree(result_dir, ignore_errors=True)
        return f"{output_id}.mp4"


def generate_video(
    image_path: Optional[str] = None,
    audio_path: Optional[str] = None,
    prompt: Optional[str] = None,
    engine: str = "local",
    **kwargs
) -> str:
    """
    Universal entry point for video generation.
    Supports local SadTalker and Cloud-based Replicate.
    """
    engine_obj = LocalSadTalkerEngine()
        
    return engine_obj.generate(image_path, audio_path, prompt, **kwargs)


# Backward compatibility alias
def generate_talking_avatar(image_path, audio_path, **kwargs) -> str:
    return generate_video(image_path=image_path, audio_path=audio_path, engine="local", **kwargs)