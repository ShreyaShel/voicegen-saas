import os
import yaml
import subprocess

from app.services.avatar_service import get_audio_duration

image = "avatar_uploads/64a87393-7c71-416b-b1fd-9b812ef70838_Image_pass_resized.JPG"
audio = "audio_outputs/0071e6d8-c6d4-43e6-9aa6-2446b7e9058b.wav"
duration = get_audio_duration(audio)

# Set base dir to musetalk_repo so it can import its own things
MUSE_DIR = os.path.abspath("musetalk_repo")
video_temp = os.path.abspath("musetalk_repo/temp_input.mp4")

# 1. Create a static video loop of the image
print(f"Creating {duration}s static video from image...")
subprocess.run([
    "ffmpeg", "-y", "-loop", "1", "-i", os.path.abspath(image), 
    "-c:v", "libx264", "-t", str(duration), "-pix_fmt", "yuv420p", "-r", "25", video_temp
], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

# 2. Setup MuseTalk inference config
config_path = os.path.join(MUSE_DIR, "configs/inference/test_auto.yaml")
config_data = {
    "task_0": {
        "video_path": video_temp,
        "audio_path": os.path.abspath(audio),
        "result_name": "musetalk_test_output.mp4"
    }
}
with open(config_path, "w") as f:
    yaml.dump(config_data, f)

# 3. Run MuseTalk
cmd = [
    "venv/Scripts/python.exe",
    "-m", "scripts.inference",
    "--inference_config", "configs/inference/test_auto.yaml",
    "--result_dir", os.path.abspath("avatar_outputs"),
    "--unet_model_path", "models/musetalkV15/unet.pth",
    "--unet_config", "models/musetalkV15/musetalk.json",
    "--whisper_dir", "models/whisper",
    "--version", "v15",
]

print("Running MuseTalk inference...")
res = subprocess.run(cmd, cwd=MUSE_DIR, env={**os.environ, "PYTHONPATH": MUSE_DIR})
print(f"MuseTalk Exited with code {res.returncode}")
