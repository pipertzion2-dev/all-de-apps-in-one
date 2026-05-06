#!/usr/bin/env python3
"""Generate test audio files with known BPM and key, then verify analysis accuracy."""
import sys
import json
import numpy as np
import soundfile as sf
import os
import tempfile

def generate_test_audio(bpm, key_root, scale_type, duration=30, sr=44100):
    NOTE_FREQS = {
        "C": 261.63, "C#": 277.18, "D": 293.66, "D#": 311.13,
        "E": 329.63, "F": 349.23, "F#": 369.99, "G": 392.00,
        "G#": 415.30, "A": 440.00, "A#": 466.16, "B": 493.88
    }

    MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11]
    MINOR_INTERVALS = [0, 2, 3, 5, 7, 8, 10]

    intervals = MINOR_INTERVALS if scale_type == "minor" else MAJOR_INTERVALS
    note_names = list(NOTE_FREQS.keys())
    root_idx = note_names.index(key_root)

    scale_freqs = []
    for interval in intervals:
        note_idx = (root_idx + interval) % 12
        freq = NOTE_FREQS[note_names[note_idx]]
        scale_freqs.append(freq)

    beat_duration = 60.0 / bpm
    total_samples = int(duration * sr)
    audio = np.zeros(total_samples)
    t_global = np.arange(total_samples) / sr

    for beat_num in range(int(duration / beat_duration)):
        beat_start = beat_num * beat_duration
        note_freq = scale_freqs[beat_num % len(scale_freqs)]

        note_duration = beat_duration * 0.8
        note_samples = int(note_duration * sr)
        start_sample = int(beat_start * sr)
        end_sample = min(start_sample + note_samples, total_samples)
        if start_sample >= total_samples:
            break

        t = np.arange(end_sample - start_sample) / sr
        envelope = np.exp(-t * 3)
        tone = np.sin(2 * np.pi * note_freq * t) * envelope * 0.3
        tone += np.sin(2 * np.pi * note_freq * 2 * t) * envelope * 0.1
        audio[start_sample:end_sample] += tone

        if beat_num % 4 == 0:
            kick_t = np.arange(min(int(0.1 * sr), total_samples - start_sample)) / sr
            kick = np.sin(2 * np.pi * 60 * kick_t) * np.exp(-kick_t * 30) * 0.5
            audio[start_sample:start_sample + len(kick)] += kick

        if beat_num % 4 == 2:
            snare_samples = min(int(0.05 * sr), total_samples - start_sample)
            snare = np.random.randn(snare_samples) * np.exp(-np.arange(snare_samples) / sr * 40) * 0.2
            audio[start_sample:start_sample + snare_samples] += snare

    root_freq = NOTE_FREQS[key_root] / 2
    bass = np.sin(2 * np.pi * root_freq * t_global) * 0.15
    audio += bass

    audio = audio / (np.max(np.abs(audio)) + 1e-6) * 0.9
    return audio.astype(np.float32)

def main():
    sys.path.insert(0, os.path.dirname(__file__))
    from analyze_audio import detect_with_hybrid

    test_cases = [
        {"bpm": 93, "key_root": "C", "scale": "minor", "expected_key": "C minor"},
        {"bpm": 105, "key_root": "A", "scale": "minor", "expected_key": "A minor"},
        {"bpm": 120, "key_root": "G", "scale": "major", "expected_key": "G major"},
        {"bpm": 80, "key_root": "E", "scale": "minor", "expected_key": "E minor"},
        {"bpm": 140, "key_root": "F", "scale": "major", "expected_key": "F major"},
        {"bpm": 72, "key_root": "D", "scale": "minor", "expected_key": "D minor"},
        {"bpm": 150, "key_root": "B", "scale": "minor", "expected_key": "B minor"},
    ]

    results = []
    for tc in test_cases:
        print(f"\n{'='*60}")
        print(f"TEST: {tc['expected_key']} @ {tc['bpm']} BPM")
        print(f"{'='*60}")

        audio = generate_test_audio(tc["bpm"], tc["key_root"], tc["scale"], duration=30)
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            sf.write(f.name, audio, 44100)
            tmp_path = f.name

        try:
            bpm_detected, key_detected, confidence = detect_with_hybrid(tmp_path)
            bpm_ok = abs(bpm_detected - tc["bpm"]) <= 3
            key_ok = key_detected == tc["expected_key"]

            print(f"  BPM:  {bpm_detected} (expected {tc['bpm']}) {'OK' if bpm_ok else 'FAIL'}")
            print(f"  Key:  {key_detected} (expected {tc['expected_key']}) {'OK' if key_ok else 'FAIL'}")

            results.append({
                "test": f"{tc['expected_key']}@{tc['bpm']}",
                "bpm_ok": bpm_ok,
                "bpm_detected": bpm_detected,
                "key_ok": key_ok,
                "key_detected": key_detected,
            })
        finally:
            os.unlink(tmp_path)

    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    all_ok = True
    for r in results:
        bpm_status = "OK" if r["bpm_ok"] else "FAIL"
        key_status = "OK" if r["key_ok"] else "FAIL"
        print(f"  {r['test']}: BPM={r['bpm_detected']} [{bpm_status}], Key={r['key_detected']} [{key_status}]")
        if not r["bpm_ok"] or not r["key_ok"]:
            all_ok = False

    if all_ok:
        print("\nALL TESTS PASSED!")
    else:
        print("\nSOME TESTS FAILED - needs tuning")

    return all_ok

if __name__ == "__main__":
    sys.exit(0 if main() else 1)
