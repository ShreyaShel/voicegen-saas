import urllib.request
import os

os.makedirs("wav2lip_checkpoints", exist_ok=True)

urls = {
    "wav2lip_checkpoints/wav2lip.pth": 
        "https://huggingface.co/numz/wav2lip_studio/resolve/main/Wav2lip/wav2lip.pth",
    "wav2lip_checkpoints/wav2lip_gan.pth":
        "https://huggingface.co/numz/wav2lip_studio/resolve/main/Wav2lip/wav2lip_gan.pth",
}

for path, url in urls.items():
    print(f"Downloading {os.path.basename(path)}...")
    urllib.request.urlretrieve(url, path)
    size = os.path.getsize(path)
    print(f"Done: {path} ({size/1024/1024:.1f} MB)")