import os
import urllib.request

os.makedirs("sadtalker_checkpoints", exist_ok=True)
os.makedirs("sadtalker_checkpoints/gfpgan/weights", exist_ok=True)

files = {
    "sadtalker_checkpoints/SadTalker_V0.0.2_256.safetensors":
        "https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2-rc/SadTalker_V0.0.2_256.safetensors",
    "sadtalker_checkpoints/SadTalker_V0.0.2_512.safetensors":
        "https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2-rc/SadTalker_V0.0.2_512.safetensors",
    "sadtalker_checkpoints/mapping_00109-model.pth.tar":
        "https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2-rc/mapping_00109-model.pth.tar",
    "sadtalker_checkpoints/mapping_00229-model.pth.tar":
        "https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2-rc/mapping_00229-model.pth.tar",
    "sadtalker_checkpoints/epoch_20.pth":
        "https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2/epoch_20.pth",
    "sadtalker_checkpoints/facevid2vid_00189-model.pth.tar":
        "https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2/facevid2vid_00189-model.pth.tar",
    "sadtalker_checkpoints/shape_predictor_68_face_landmarks.dat":
        "https://huggingface.co/vinthony/SadTalker/resolve/main/shape_predictor_68_face_landmarks.dat",
    "sadtalker_checkpoints/gfpgan/weights/GFPGANv1.4.pth":
        "https://github.com/TencentARC/GFPGAN/releases/download/v1.3.4/GFPGANv1.4.pth",
    "sadtalker_checkpoints/gfpgan/weights/detection_Resnet50_Final.pth":
        "https://github.com/xinntao/facexlib/releases/download/v0.1.0/detection_Resnet50_Final.pth",
    "sadtalker_checkpoints/gfpgan/weights/parsing_parsenet.pth":
        "https://github.com/xinntao/facexlib/releases/download/v0.2.2/parsing_parsenet.pth",
}

for path, url in files.items():
    if os.path.exists(path):
        print(f"Already exists, skipping: {path}")
        continue
    print(f"Downloading {os.path.basename(path)}...")
    try:
        urllib.request.urlretrieve(url, path)
        print(f"Done: {path}")
    except Exception as e:
        print(f"Failed: {path} — {e}")

print("\nAll downloads complete!")