import os
import uuid
import re
from app.config import AUDIO_OUTPUT_DIR

os.makedirs(AUDIO_OUTPUT_DIR, exist_ok=True)

_tts_model_en = None
_tts_model_multi = None
_language_tool = None

# English speakers (VCTK VITS model)
ENGLISH_SPEAKERS = {
    "p225": "Emma (Female, Clear)",
    "p226": "Tom (Male, Deep)",
    "p228": "Sarah (Female, Warm)",
    "p232": "David (Male, Authoritative)",
    "p243": "Emily (Female, Soft)",
    "p258": "James (Male, Clear)",
    "p294": "Zoe (Female, Expressive)",
    "p302": "Mike (Male, Calm)",
}

# Male and female speaker options for multilingual XTTS v2
MULTILINGUAL_SPEAKERS = {
    "female_1": "Claribel Dervla",
    "female_2": "Daisy Studious",
    "female_3": "Nova Hogarth",
    "male_1":   "Damien Black",
    "male_2":   "Craig Gutsy",
    "male_3":   "Baldur Sanjin",
}

MULTILINGUAL_SPEAKERS_DISPLAY = {
    "female_1": "Clara (Female, Clear)",
    "female_2": "Daisy (Female, Soft)",
    "female_3": "Nova (Female, Expressive)",
    "male_1":   "Damien (Male, Deep)",
    "male_2":   "Craig (Male, Strong)",
    "male_3":   "Baldur (Male, Neutral)",
}

# All supported languages
MULTILINGUAL_LANGUAGES = {
    "hi": "Hindi",
    "fr": "French",
    "de": "German",
    "es": "Spanish",
    "it": "Italian",
    "pt": "Portuguese",
    "ru": "Russian",
    "zh-cn": "Chinese",
    "ar": "Arabic",
    "ko": "Korean",
    "nl": "Dutch",
    "tr": "Turkish",
    "pl": "Polish",
}

ALL_LANGUAGES = {"en": "English", **MULTILINGUAL_LANGUAGES}


def get_language_tool():
    """Load LanguageTool once and reuse."""
    global _language_tool
    if _language_tool is None:
        try:
            import language_tool_python
            print("Loading LanguageTool grammar engine...")
            _language_tool = language_tool_python.LanguageTool('en-US')
            print("LanguageTool loaded.")
        except Exception as e:
            print(f"LanguageTool not available: {e}")
            _language_tool = None
    return _language_tool


def get_tts_english():
    global _tts_model_en
    if _tts_model_en is None:
        print("Loading English TTS model...")
        from TTS.api import TTS
        _tts_model_en = TTS(model_name="tts_models/en/vctk/vits")
        print("English TTS loaded.")
    return _tts_model_en


def get_tts_multilingual():
    global _tts_model_multi
    if _tts_model_multi is None:
        print("Loading multilingual TTS model...")
        import torch
        from TTS.api import TTS
        device = "cuda" if torch.cuda.is_available() else "cpu"
        _tts_model_multi = TTS(
            "tts_models/multilingual/multi-dataset/xtts_v2"
        ).to(device)
        print("Multilingual TTS loaded.")
    return _tts_model_multi


def edit_distance(s1: str, s2: str) -> int:
    """Calculate edit distance between two strings."""
    s1, s2 = s1.lower(), s2.lower()
    if abs(len(s1) - len(s2)) > 3:
        return 99
    dp = [[0] * (len(s2) + 1) for _ in range(len(s1) + 1)]
    for i in range(len(s1) + 1):
        dp[i][0] = i
    for j in range(len(s2) + 1):
        dp[0][j] = j
    for i in range(1, len(s1) + 1):
        for j in range(1, len(s2) + 1):
            dp[i][j] = min(
                dp[i-1][j] + 1,
                dp[i][j-1] + 1,
                dp[i-1][j-1] + (0 if s1[i-1] == s2[j-1] else 1)
            )
    return dp[len(s1)][len(s2)]


def validate_and_clean_text(text: str) -> tuple[str, list[str]]:
    warnings = []
    text = text.strip()

    if len(text) < 3:
        raise ValueError("Text is too short. Please enter at least one sentence.")

    if len(text) > 1000:
        text = text[:1000]
        warnings.append("Text was trimmed to 1000 characters.")

    # Basic cleaning
    text = re.sub(r'(.)\1{4,}', r'\1\1', text)         # "hellooooo" -> "hello"
    text = re.sub(r'\b(\w+)( \1\b)+', r'\1', text)     # "the the" -> "the"
    text = re.sub(r'http\S+', '', text)                  # remove URLs
    text = re.sub(r'[#@$%^&*~`|\\<>{}[\]]+', '', text)  # remove symbols
    text = re.sub(r'\s+', ' ', text).strip()             # normalize spaces

    if not re.search(r'\w', text):
        raise ValueError("Text must contain actual words.")

    # Smart grammar and spelling correction using LanguageTool
    try:
        tool = get_language_tool()
        if tool:
            matches = tool.check(text)
            corrections_made = []

            # Process in reverse so string positions stay valid
            for match in reversed(matches):
                if not match.replacements:
                    continue

                original_word = text[match.offset: match.offset + match.error_length]
                replacement = match.replacements[0]

                if not original_word.strip() or not replacement.strip():
                    continue

                # For spelling errors — only fix close typos (edit distance <= 2)
                # This protects names like "Shreya" which are far from any English word
                if match.rule_id == 'MORFOLOGIK_RULE_EN_US':
                    dist = edit_distance(original_word, replacement)
                    if dist > 2:
                        continue

                # Skip if changing capitalization of a mid-sentence word
                # (protects proper nouns)
                if (len(original_word) > 0 and
                        len(replacement) > 0 and
                        original_word[0].isupper() and
                        replacement[0].islower() and
                        match.offset > 0):
                    continue

                corrections_made.append(f"{original_word} -> {replacement}")
                text = (
                    text[:match.offset]
                    + replacement
                    + text[match.offset + match.error_length:]
                )

            if corrections_made:
                warnings.append(
                    f"Auto-corrected: {', '.join(corrections_made[:3])}"
                )

    except Exception as e:
        print(f"Grammar check skipped: {e}")

    # Ensure ends with punctuation
    if text and text[-1] not in '.!?':
        text = text + '.'

    return text, warnings


def change_speed(filepath: str, speed: float) -> None:
    if abs(speed - 1.0) < 0.05:
        return
    import librosa
    import soundfile as sf
    y, sr = librosa.load(filepath, sr=None)
    y_stretched = librosa.effects.time_stretch(y, rate=speed)
    sf.write(filepath, y_stretched, sr)


def generate_speech(
    text: str,
    speaker: str = "p225",
    speed: float = 1.0,
    language: str = "en"
) -> tuple[str, list[str], dict]:
    """
    Generate speech with smart text correction and auto-translation.
    Returns (filename, warnings, translation_info)
    """
    from app.services.translation_service import translate_text

    # Step 1 — validate and clean text
    cleaned_text, warnings = validate_and_clean_text(text)

    # Step 2 — translate if needed
    translation = translate_text(cleaned_text, language)
    final_text = translation["translated_text"]

    if translation["was_translated"]:
        warnings.append(
            f"Text translated from {translation['source_language'].upper()} "
            f"to {ALL_LANGUAGES.get(language, language)}."
        )

    filename = f"{uuid.uuid4()}.wav"
    filepath = os.path.join(AUDIO_OUTPUT_DIR, filename)

    # Step 3 — generate with appropriate model
    if language == "en":
        if speaker not in ENGLISH_SPEAKERS:
            speaker = "p225"
        speed = max(0.5, min(2.0, speed))
        tts = get_tts_english()
        tts.tts_to_file(
            text=final_text,
            file_path=filepath,
            speaker=speaker
        )
        change_speed(filepath, speed)
    else:
        # Map speaker key to actual XTTS v2 speaker name
        actual_speaker = MULTILINGUAL_SPEAKERS.get(speaker, "Claribel Dervla")
        tts = get_tts_multilingual()
        tts.tts_to_file(
            text=final_text,
            file_path=filepath,
            language=language,
            speaker=actual_speaker,
            split_sentences=True
        )

    return filename, warnings, translation


def get_speakers() -> dict:
    return ENGLISH_SPEAKERS


def get_multilingual_speakers() -> dict:
    return MULTILINGUAL_SPEAKERS_DISPLAY


def get_all_languages() -> dict:
    return ALL_LANGUAGES