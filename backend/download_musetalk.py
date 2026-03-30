import os
from huggingface_hub import hf_hub_download, snapshot_download

os.makedirs("musetalk_checkpoints", exist_ok=True)

print("Downloading MuseTalk models from HuggingFace...")
snapshot_download(
    repo_id="TMElyralab/MuseTalk",
    local_dir="musetalk_checkpoints",
    ignore_patterns=["*.md", "*.txt"]
)

print("Downloading face detection model...")
os.makedirs("musetalk_checkpoints/dwpose", exist_ok=True)
hf_hub_download(
    repo_id="yzd-v/DWPose",
    filename="dw-ll_ucoco_384.pth",
    local_dir="musetalk_checkpoints/dwpose"
)

print("All MuseTalk models downloaded!")