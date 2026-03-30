import os
from huggingface_hub import hf_hub_download, snapshot_download

BASE = "musetalk_repo/models"
os.makedirs(f"{BASE}/musetalkV15", exist_ok=True)
os.makedirs(f"{BASE}/dwpose", exist_ok=True)
os.makedirs(f"{BASE}/whisper", exist_ok=True)
os.makedirs(f"{BASE}/sd-vae", exist_ok=True)

# 1. MuseTalk v1.5
print("Downloading MuseTalk V1.5...")
snapshot_download(repo_id="TMElyralab/MuseTalk", local_dir=f"{BASE}/musetalkV15", allow_patterns=["*.pth", "*.json", "unet.pth"])

# 2. dwpose
print("Downloading DWPose...")
hf_hub_download(repo_id="yzd-v/DWPose", filename="dw-ll_ucoco_384.pth", local_dir=f"{BASE}/dwpose")

# 3. sd-vae-ft-mse
print("Downloading SD-VAE...")
hf_hub_download(repo_id="stabilityai/sd-vae-ft-mse", filename="config.json", local_dir=f"{BASE}/sd-vae")
hf_hub_download(repo_id="stabilityai/sd-vae-ft-mse", filename="diffusion_pytorch_model.bin", local_dir=f"{BASE}/sd-vae")

# 4. whisper tiny
print("Downloading Whisper Tiny...")
hf_hub_download(repo_id="openai/whisper-tiny", filename="config.json", local_dir=f"{BASE}/whisper")
hf_hub_download(repo_id="openai/whisper-tiny", filename="pytorch_model.bin", local_dir=f"{BASE}/whisper")
hf_hub_download(repo_id="openai/whisper-tiny", filename="preprocessor_config.json", local_dir=f"{BASE}/whisper")

print("Done downloading models!")
