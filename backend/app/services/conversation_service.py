import os
import uuid
import shutil
import subprocess
from typing import List, Tuple
import cv2
import numpy as np
from PIL import Image, ImageOps

from app.services.avatar_service import (
    AVATAR_UPLOAD_DIR,
    AVATAR_OUTPUT_DIR,
    SADTALKER_REPO,
    SADTALKER_CKPT,
    resize_image
)
from app.services.tts_service import generate_speech
from app.services.clone_service import clone_and_generate
from app.schemas.conversation import ConversationRequest, ConversationTurn, FaceDetectionResult

class ConversationService:
    def __init__(self):
        # We'll initialize the detector lazily if needed, 
        # but for validation we can just use the one from SadTalker components
        self.detector = None

    def _get_detector(self):
        if self.detector is None:
            # Import here to avoid overhead if not used
            from src.face3d.extract_kp_videos_safe import KeypointExtractor
            # Note: SadTalker expects to be run from its repo root or have it in PYTHONPATH
            sys_path = os.sys.path
            if SADTALKER_REPO not in sys_path:
                os.sys.path.append(SADTALKER_REPO)
            self.detector = KeypointExtractor(device="cuda" if os.environ.get("CUDA_VISIBLE_DEVICES") else "cpu")
        return self.detector

    def validate_image(self, image_path: str) -> Tuple[bool, str, List[FaceDetectionResult]]:
        """Check if image has exactly two faces and is of good quality."""
        try:
            # Handle EXIF orientation (rotation from mobile uploads)
            with Image.open(image_path) as pil_img:
                pil_img = ImageOps.exif_transpose(pil_img)
                img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

            if img is None:
                return False, "Could not read image file.", []
            
            h, w = img.shape[:2]
            if h < 256 or w < 256:
                return False, f"Image resolution too low ({w}x{h}). Please upload at least 256x256.", []

            # Use SadTalker's detection net
            from facexlib.detection import init_detection_model
            import torch
            
            device = "cuda" if torch.cuda.is_available() else "cpu"
            det_net = init_detection_model('retinaface_resnet50', half=False, device=device)
            
            with torch.no_grad():
                bboxes = det_net.detect_faces(img, 0.97)

            if len(bboxes) != 2:
                return False, f"Detected {len(bboxes)} faces. Please upload an image with exactly 2 people.", []

            # Sort faces left to right to assign Person 1 and Person 2
            bboxes = sorted(bboxes, key=lambda x: x[0])
            
            faces = []
            for i, box in enumerate(bboxes):
                faces.append(FaceDetectionResult(
                    face_index=i,
                    box=[int(b) for b in box[:4]]
                ))

            return True, "Image qualifies for conversation generation.", faces

        except Exception as e:
            return False, f"Validation failed: {str(e)}", []

    def generate_conversation(self, image_path: str, request: ConversationRequest, user_id: int) -> str:
        """Orchestrate multi-turn generation and stitching with smart performance fallback."""
        conv_id = str(uuid.uuid4())[:8] 
        temp_dir = os.path.normpath(os.path.join(AVATAR_UPLOAD_DIR, f"c_{conv_id}"))
        os.makedirs(temp_dir, exist_ok=True)
        
        # 0. Hardware Detection & Smart Performance Mode
        import torch
        has_cuda = torch.cuda.is_available()
        
        # Fallback to 256px on CPU to avoid 3-hour waits. Use 512px only if GPU is available.
        final_face_size = 512 if has_cuda else 256
        use_enhancer = "gfpgan" if has_cuda else None
        
        print(f"[SmartMode] GPU: {has_cuda}. Using size={final_face_size}, enhancer={use_enhancer}")

        # 1. Handle EXIF and prepare "Clean" source image
        fixed_image_path = os.path.join(temp_dir, "cleaned_source.jpg")
        with Image.open(image_path) as pil_img:
            pil_img = ImageOps.exif_transpose(pil_img)
            pil_img.save(fixed_image_path, "JPEG", quality=95)

        segment_files = []
        
        try:
            for i, turn in enumerate(request.turns):
                print(f"Generating turn {i+1}/{len(request.turns)} for speaker {turn.speaker_index}...")
                
                # 2. Generate Audio
                audio_filename = None
                if turn.voice_id:
                    from app.models.voice import ClonedVoice
                    from app.database import SessionLocal
                    db = SessionLocal()
                    voice = db.query(ClonedVoice).filter(ClonedVoice.id == turn.voice_id).first()
                    db.close()
                    if voice:
                        audio_filename = clone_and_generate(
                            text=turn.text,
                            speaker_wav_path=voice.sample_path,
                            language=turn.language,
                            speed=turn.speed
                        )
                else:
                    audio_filename, _, _ = generate_speech(
                        text=turn.text,
                        speaker=turn.speaker,
                        speed=turn.speed,
                        language=turn.language
                    )
                
                audio_path = os.path.abspath(os.path.join("audio_outputs", audio_filename))
                
                # 3. Fix Lip-Sync: Force 16kHz re-sampling for SadTalker compatibility
                from pydub import AudioSegment
                export_audio_path = os.path.join(temp_dir, f"turn_{i}.wav")
                sound = AudioSegment.from_file(audio_path)
                sound = sound.set_frame_rate(16000).set_channels(1)
                sound.export(export_audio_path, format="wav")

                # 4. Generate Video Segment
                segment_id = f"s_{conv_id}_{i}"
                segment_video = self._run_sadtalker_segment(
                    image_path=fixed_image_path,
                    audio_path=export_audio_path, # Use the synced 16kHz audio
                    face_index=turn.speaker_index,
                    segment_id=segment_id,
                    still_mode=request.still_mode,
                    face_size=final_face_size,
                    enhancer=use_enhancer
                )
                segment_files.append(segment_video)

            # 3. Stitch Segments
            final_filename = f"conv_{conv_id}.mp4"
            final_path = os.path.normpath(os.path.join(AVATAR_OUTPUT_DIR, final_filename))
            self._stitch_videos(segment_files, final_path)
            
            return final_filename

        finally:
            # Cleanup segments
            for f in segment_files:
                if os.path.exists(f): os.remove(f)
            shutil.rmtree(temp_dir, ignore_errors=True)

    def _run_sadtalker_segment(self, image_path, audio_path, face_index, segment_id, still_mode, face_size, enhancer=None):
        import sys
        inference_script = os.path.join(SADTALKER_REPO, "inference.py")
        result_dir = os.path.normpath(os.path.join(AVATAR_OUTPUT_DIR, f"gs_{segment_id}")) # Shortened name
        os.makedirs(result_dir, exist_ok=True)

        cmd = [
            sys.executable,
            inference_script,
            "--driven_audio", audio_path,
            "--source_image", image_path,
            "--result_dir", result_dir,
            "--face_index", str(face_index),
            "--still",
            "--preprocess", "full",
            "--size", str(face_size),
        ]
        
        if enhancer:
            cmd += ["--enhancer", enhancer]
        
        if os.path.isdir(SADTALKER_CKPT):
            cmd += ["--checkpoint_dir", SADTALKER_CKPT]

        env = {**os.environ, "PYTHONPATH": SADTALKER_REPO}
        env.pop("PYTHONHASHSEED", None)

        subprocess.run(cmd, env=env, check=True)

        output_videos = [f for f in os.listdir(result_dir) if f.endswith(".mp4")]
        if not output_videos:
            raise RuntimeError(f"Segment {segment_id} failed: No output video.")

        gen_video = os.path.join(result_dir, output_videos[0])
        seg_dest = os.path.join(AVATAR_OUTPUT_DIR, f"{segment_id}.mp4")
        shutil.move(gen_video, seg_dest)
        shutil.rmtree(result_dir, ignore_errors=True)
        return seg_dest

    def _stitch_videos(self, video_paths, output_path):
        """Concatenate videos using ffmpeg concat demuxer."""
        list_file = output_path + ".txt"
        with open(list_file, "w") as f:
            for path in video_paths:
                f.write(f"file '{os.path.abspath(path)}'\n")
        
        try:
            cmd = [
                "ffmpeg", "-y", "-f", "concat", "-safe", "0",
                "-i", list_file, "-c", "copy", output_path
            ]
            subprocess.run(cmd, check=True)
        finally:
            if os.path.exists(list_file): os.remove(list_file)

conversation_service = ConversationService()
