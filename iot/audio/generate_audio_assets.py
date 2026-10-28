"""
generate_audio_assets.py
Skrip Python untuk menghasilkan file audio suara alfabet 'A' s.d. 'Z'
dalam bahasa Indonesia untuk modul DFPlayer Mini di ESP32.

Kebutuhan:
    pip install gTTS
atau
    pip install pyttsx3
"""

import os
import sys

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
MP3_FOLDER = os.path.join(OUTPUT_DIR, "mp3")
os.makedirs(MP3_FOLDER, exist_ok=True)

# 26 Alfabet Latin
LETTERS = [chr(i) for i in range(ord('A'), ord('Z') + 1)]

# Pengucapan fonetik bahasa Indonesia agar DFPlayer Mini bersuara jelas
PHONETICS = {
    'A': "A",
    'B': "B",
    'C': "C",
    'D': "D",
    'E': "E",
    'F': "F",
    'G': "G",
    'H': "H",
    'I': "I",
    'J': "J",
    'K': "K",
    'L': "L",
    'M': "M",
    'N': "N",
    'O': "O",
    'P': "P",
    'Q': "Q",
    'R': "R",
    'S': "S",
    'T': "T",
    'U': "U",
    'V': "V",
    'W': "W",
    'X': "X",
    'Y': "Y",
    'Z': "Z",
}

def generate_with_gtts():
    try:
        from gtts import gTTS
    except ImportError:
        return False

    print("[*] Menggunakan gTTS (Google Text-to-Speech Bahasa Indonesia)...")
    for idx, char in enumerate(LETTERS, start=1):
        filename = f"{idx:04d}.mp3"  # DFPlayer Mini membutuhkan format penamaan 0001.mp3 s.d. 0026.mp3
        filepath = os.path.join(MP3_FOLDER, filename)
        text = PHONETICS[char]
        print(f"  - Membuat audio {filename} ({char})...")
        tts = gTTS(text=text, lang='id', slow=False)
        tts.save(filepath)
    return True

def generate_with_pyttsx3():
    try:
        import pyttsx3
    except ImportError:
        return False

    print("[*] Menggunakan pyttsx3 (Offline TTS)...")
    engine = pyttsx3.init()
    engine.setProperty('rate', 130)

    for idx, char in enumerate(LETTERS, start=1):
        filename = f"{idx:04d}.mp3"
        filepath = os.path.join(MP3_FOLDER, filename)
        print(f"  - Membuat audio {filename} ({char})...")
        engine.save_to_file(PHONETICS[char], filepath)
    engine.runAndWait()
    return True

if __name__ == "__main__":
    print("=" * 60)
    print("GENERATOR AUDIO ALFABET DFPLAYER MINI (SIBI TRANSLATOR)")
    print("=" * 60)

    success = generate_with_gtts()
    if not success:
        success = generate_with_pyttsx3()

    if success:
        print(f"\n[OK] Sukses membuat 26 berkas audio di direktori:\n     {MP3_FOLDER}")
        print("\nPanduan DFPlayer Mini:")
        print("1. Salin seluruh isi folder 'mp3' ke direktori '/mp3/' di kartu MicroSD.")
        print("2. DFPlayer Mini akan memutar track 0001.mp3 saat huruf A terdeteksi,")
        print("   hingga 0026.mp3 saat huruf Z terdeteksi.")
    else:
        print("\n[!] Belum terpasang gTTS atau pyttsx3.")
        print("    Jalankan perintah berikut terlebih dahulu:")
        print("    pip install gTTS")
        print("    lalu jalankan kembali skrip ini: python generate_audio_assets.py")
