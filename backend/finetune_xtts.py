import os

def main():
    DATASET_PATH = "my_voice_dataset"
    OUTPUT_PATH = "my_finetuned_model"
    WAVS_PATH = os.path.join(DATASET_PATH, "wavs")

    os.makedirs(OUTPUT_PATH, exist_ok=True)

    wav_files = [
        os.path.abspath(os.path.join(WAVS_PATH, f))
        for f in sorted(os.listdir(WAVS_PATH))
        if f.endswith(".wav")
    ]

    print(f"Found {len(wav_files)} wav files")

    print("Step 1: Formatting audio dataset...")
    from TTS.demos.xtts_ft_demo.utils.formatter import format_audio_list
    from TTS.demos.xtts_ft_demo.utils.gpt_train import train_gpt

    train_meta, eval_meta, audio_total_size = format_audio_list(
        wav_files,
        target_language="en",
        out_path=DATASET_PATH,
        gradio_progress=None
    )
    print(f"Total audio: {audio_total_size:.1f} seconds")

    train_meta = os.path.abspath(train_meta)
    eval_meta = os.path.abspath(eval_meta)

    print(f"Train CSV: {train_meta}")
    print(f"Eval CSV: {eval_meta}")

    print("Step 2: Starting fine-tuning...")
    train_gpt(
        language="en",
        num_epochs=6,
        batch_size=4,
        grad_acumm=1,
        train_csv=train_meta,
        eval_csv=eval_meta,
        output_path=os.path.abspath(OUTPUT_PATH),
        max_audio_length=255995
    )

    print("Fine-tuning complete! Model saved to:", OUTPUT_PATH)

if __name__ == "__main__":
    main()