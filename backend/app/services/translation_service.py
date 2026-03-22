from deep_translator import GoogleTranslator
from langdetect import detect, LangDetectException

# Map our language codes to deep-translator codes
LANGUAGE_MAP = {
    "en": "english",
    "hi": "hindi",
    "fr": "french",
    "de": "german",
    "es": "spanish",
    "it": "italian",
    "pt": "portuguese",
    "ru": "russian",
    "zh-cn": "chinese (simplified)",
    "ar": "arabic",
    "ko": "korean",
    "ja": "japanese",
    "nl": "dutch",
    "tr": "turkish",
    "pl": "polish",
}

def detect_language(text: str) -> str:
    """Detect the language of input text."""
    try:
        return detect(text)
    except LangDetectException:
        return "en"

def translate_text(text: str, target_language: str) -> dict:
    """
    Translate text to target language.
    Returns dict with translated text and metadata.
    """
    if target_language not in LANGUAGE_MAP:
        target_language = "en"

    # Detect source language
    detected_lang = detect_language(text)

    # If already in target language, return as-is
    target_short = target_language.split("-")[0]
    if detected_lang == target_short:
        return {
            "original_text": text,
            "translated_text": text,
            "source_language": detected_lang,
            "target_language": target_language,
            "was_translated": False
        }

    # Translate
    try:
        translator = GoogleTranslator(
            source="auto",
            target=LANGUAGE_MAP[target_language]
        )
        translated = translator.translate(text)
        return {
            "original_text": text,
            "translated_text": translated,
            "source_language": detected_lang,
            "target_language": target_language,
            "was_translated": True
        }
    except Exception as e:
        print(f"Translation failed: {e}, using original text")
        return {
            "original_text": text,
            "translated_text": text,
            "source_language": detected_lang,
            "target_language": target_language,
            "was_translated": False
        }