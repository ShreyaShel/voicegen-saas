import os
import sys
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

from app.services.avatar_service import generate_video

# Use existing sample files if available
image = "avatar_uploads/64a87393-7c71-416b-b1fd-9b812ef70838_Image_pass_resized.JPG"
audio = "audio_outputs/0071e6d8-c6d4-43e6-9aa6-2446b7e9058b.wav"

def test_local_engine():
    print("--- Testing Local SadTalker Engine ---")
    try:
        if not os.path.exists(image) or not os.path.exists(audio):
            print("Skipping local test: Samples missing.")
            return
        
        vid = generate_video(image_path=image, audio_path=audio, engine="local")
        print(f"SUCCESS: {vid}")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    test_local_engine()
