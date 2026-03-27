from deep_translator import GoogleTranslator
try:
    translated = GoogleTranslator(source='en', target='hi').translate("Hello")
    print(f"Translated: {translated}")
except Exception as e:
    print(f"Error: {e}")
