import os
from app.services.avatar_service import generate_talking_avatar

image = "avatar_uploads/64a87393-7c71-416b-b1fd-9b812ef70838_Image_pass_resized.JPG"
audio = "audio_outputs/0071e6d8-c6d4-43e6-9aa6-2446b7e9058b.wav"

print("Testing SadTalker with FULL preprocess, GFPGAN, and STILL MODE=True...")

try:
    vid = generate_talking_avatar(
        image_path=image,
        audio_path=audio,
        face_size=256,
        still_mode=True # THIS IS THE FIX FOR HAIR AND BODY WARPING!
    )
    print(f"\nSUCCESS! Video saved to: avatar_outputs/{vid}")
except Exception as e:
    print(f"\nFAILED: {e}")
