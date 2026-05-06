#!/usr/bin/env python3
"""Audio analysis: BPM + Key detection.

BPM: FFT peak detection on onset envelope to find candidates,
validated by comb filter beat alignment scoring.

Key: Multi-detector voting with HPCP + KeyExtractor + librosa chroma.
"""
import sys
import json
import numpy as np


def detect_with_hybrid(filepath):
    import essentia.standard as es
    import librosa

    audio_es = es.MonoLoader(filename=filepath, sampleRate=44100)()
    bpm = detect_bpm(filepath)
    key_str, confidence = detect_key_hybrid(audio_es, filepath, es)

    sys.stderr.write(f"Hybrid final: BPM={bpm}, Key={key_str}, Confidence={confidence}\n")
    return bpm, key_str, confidence


def detect_bpm(filepath):
    import librosa
    from scipy.signal import find_peaks

    SR = 44100
    y, sr = librosa.load(filepath, sr=SR, mono=True)

    sys.stderr.write("=== BPM Detection (v7 FFT+CombFilter) ===\n")

    hop = 128
    oenv = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
    frame_rate = sr / hop

    candidates = _fft_candidates(oenv, frame_rate)
    sys.stderr.write(f"  FFT candidates: {[round(b, 1) for b in candidates]}\n")

    if not candidates:
        return 120

    scored = _comb_filter_score(oenv, frame_rate, candidates)
    sys.stderr.write(f"  Comb filter scores:\n")
    for bpm, score in scored[:10]:
        sys.stderr.write(f"    {bpm:.1f} BPM: {score:.4f}\n")

    best_bpm = scored[0][0]
    final = round(best_bpm)
    sys.stderr.write(f"BPM final decision: {final}\n")
    return final


def _fft_candidates(oenv, frame_rate):
    """Find BPM candidates from FFT peaks of onset envelope."""
    from scipy.signal import find_peaks

    oenv_centered = oenv - np.mean(oenv)
    oenv_windowed = oenv_centered * np.hanning(len(oenv_centered))

    pad_factor = 8
    padded = np.zeros(len(oenv_windowed) * pad_factor)
    padded[:len(oenv_windowed)] = oenv_windowed
    fft_mag = np.abs(np.fft.rfft(padded))
    freqs = np.fft.rfftfreq(len(padded), d=1.0 / frame_rate)
    bpm_axis = freqs * 60

    mask = (bpm_axis >= 40) & (bpm_axis <= 220)
    bpm_valid = bpm_axis[mask]
    fft_valid = fft_mag[mask]

    min_dist = max(1, int(1.5 / (freqs[1] * 60)))
    peaks, props = find_peaks(fft_valid, height=np.max(fft_valid) * 0.08, distance=min_dist)

    if len(peaks) == 0:
        return [120]

    sorted_peaks = np.argsort(-fft_valid[peaks])
    raw_bpms = []
    for i in sorted_peaks[:15]:
        raw_bpms.append(float(bpm_valid[peaks[i]]))

    candidates = set()
    for b in raw_bpms:
        normalized = b
        while normalized > 160:
            normalized /= 2
        while normalized < 60:
            normalized *= 2
        candidates.add(round(normalized, 1))
        for offset in [-1, -0.5, 0.5, 1]:
            c = normalized + offset
            if 60 <= c <= 160:
                candidates.add(round(c, 1))

    return sorted(candidates)


def _comb_filter_score(oenv, frame_rate, candidates):
    """Score each candidate BPM by comb filter beat alignment.
    Places a beat grid at each candidate tempo and measures
    how well onset energy concentrates on beat positions vs off-beat."""

    results = []
    for test_bpm in candidates:
        period_frames = frame_rate * 60 / test_bpm
        n_beats = int(len(oenv) / period_frames)
        if n_beats < 4:
            continue

        n_phases = max(32, int(period_frames))
        best_score = 0

        for p in range(n_phases):
            phase = p * period_frames / n_phases
            beat_positions = np.arange(n_beats) * period_frames + phase
            beat_indices = beat_positions.astype(int)
            beat_indices = beat_indices[beat_indices < len(oenv)]

            if len(beat_indices) < 4:
                continue

            on_beat = float(np.mean(oenv[beat_indices]))

            tolerance = max(1, int(period_frames * 0.1))
            on_mask = np.zeros(len(oenv), dtype=bool)
            for bi in beat_indices:
                lo = max(0, bi - tolerance)
                hi = min(len(oenv), bi + tolerance + 1)
                on_mask[lo:hi] = True

            off_beat = float(np.mean(oenv[~on_mask])) if np.any(~on_mask) else 0.001
            contrast = on_beat / (off_beat + 1e-10)

            if contrast > best_score:
                best_score = contrast

        results.append((test_bpm, best_score))

    results.sort(key=lambda x: -x[1])
    return results if results else [(120, 0)]


def detect_key_hybrid(audio, filepath, es):
    import librosa

    key_results = []
    KEY_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

    windowing = es.Windowing(type='blackmanharris62')
    spectrum_algo = es.Spectrum()
    spectral_peaks = es.SpectralPeaks(
        sampleRate=44100, maxFrequency=5000, minFrequency=40,
        magnitudeThreshold=0.0001, orderBy='magnitude'
    )
    hpcp_algo = es.HPCP(
        size=36, referenceFrequency=440, harmonics=4,
        bandPreset=True, minFrequency=40, maxFrequency=5000,
        weightType='cosine', nonLinear=False
    )

    frame_size = 4096
    hop_size = 2048
    hpcp_frames = []
    for i in range(0, len(audio) - frame_size, hop_size):
        frame = audio[i:i + frame_size]
        windowed = windowing(frame)
        spec = spectrum_algo(windowed)
        freqs, mags = spectral_peaks(spec)
        if len(freqs) > 0:
            hpcp = hpcp_algo(freqs, mags)
            hpcp_frames.append(hpcp)

    if hpcp_frames:
        hpcp_avg = np.mean(hpcp_frames, axis=0).astype(np.float32)
        for profile_type in ['temperley', 'krumhansl', 'edma', 'bgate']:
            try:
                key_algo = es.Key(profileType=profile_type, pcpSize=36, usePolyphony=True, useThreeChords=True)
                key, scale, strength, _ = key_algo(hpcp_avg)
                key_results.append({"key": f"{key} {scale}", "strength": float(strength)})
            except Exception:
                pass

    for window_size in [4096, 8192]:
        for profile in ['temperley', 'krumhansl', 'edma', 'bgate']:
            try:
                key_ext = es.KeyExtractor(
                    frameSize=window_size, hopSize=window_size // 2,
                    profileType=profile
                )
                key, scale, strength = key_ext(audio)
                key_results.append({"key": f"{key} {scale}", "strength": float(strength)})
            except Exception:
                pass

    y_lib = None
    chroma_avg = None
    try:
        y_lib, sr_lib = librosa.load(filepath, sr=22050, mono=True)
        # Use higher resolution chroma for better root detection
        chroma = librosa.feature.chroma_cqt(y=y_lib, sr=sr_lib, norm=2)
        chroma_avg = np.mean(chroma, axis=1)
        # Normalize chroma to 0-1 range for better correlation
        chroma_norm = (chroma_avg - np.min(chroma_avg)) / (np.max(chroma_avg) - np.min(chroma_avg) + 1e-10)
        
        # Use multiple profile types for robust detection
        major_profiles = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
        minor_profiles = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]
        
        # Also try Temperley profiles (better for modern music)
        temperley_major = [5.0, 2.0, 3.5, 2.0, 4.5, 4.0, 2.0, 4.5, 2.0, 3.5, 1.5, 4.0]
        temperley_minor = [5.0, 2.0, 3.5, 4.5, 2.0, 4.0, 2.0, 4.5, 3.5, 2.0, 1.5, 4.0]
        
        best_results = []
        for profile_name, maj_prof, min_prof in [("krumhansl", major_profiles, minor_profiles), ("temperley", temperley_major, temperley_minor)]:
            best_corr = -2
            best_key_for_profile = "C major"
            best_root_idx = 0
            for shift in range(12):
                shifted = np.roll(chroma_norm, -shift)
                try:
                    corr_maj = float(np.corrcoef(shifted, maj_prof)[0, 1]) if len(set(shifted)) > 1 else 0.3
                    corr_min = float(np.corrcoef(shifted, min_prof)[0, 1]) if len(set(shifted)) > 1 else 0.2
                except:
                    corr_maj, corr_min = 0.3, 0.2
                    
                if corr_maj > best_corr:
                    best_corr = corr_maj
                    best_key_for_profile = f"{KEY_NAMES[shift]} major"
                    best_root_idx = shift
                if corr_min > best_corr:
                    best_corr = corr_min
                    best_key_for_profile = f"{KEY_NAMES[shift]} minor"
                    best_root_idx = shift
            best_results.append({"key": best_key_for_profile, "strength": best_corr})
        
        # Use best result from multiple profiles
        best_from_chroma = max(best_results, key=lambda x: x["strength"])
        key_results.append(best_from_chroma)
    except Exception:
        pass

    sys.stderr.write(f"Key results: {json.dumps(key_results)}\n")

    if not key_results:
        return "C major", 50

    key_votes = {}
    for r in key_results:
        k = r["key"]
        if k not in key_votes:
            key_votes[k] = {"count": 0, "max_strength": 0, "total_strength": 0, "weighted_strength": 0}
        key_votes[k]["count"] += 1
        key_votes[k]["max_strength"] = max(key_votes[k]["max_strength"], r["strength"])
        key_votes[k]["total_strength"] += r["strength"]
        # Weight by confidence: strong detections count more
        key_votes[k]["weighted_strength"] += r["strength"] ** 1.5

    sys.stderr.write(f"Key votes: {json.dumps(key_votes)}\n")

    # Weight primarily by strength (confidence), secondarily by count
    best_key = max(key_votes.keys(), key=lambda k: (key_votes[k]["weighted_strength"], key_votes[k]["count"]))

    original_key = best_key
    best_key = _disambiguate_mode(best_key, key_votes, chroma_avg, KEY_NAMES)

    if best_key in key_votes:
        confidence = min(95, max(40, int(key_votes[best_key]["max_strength"] * 100)))
    elif original_key in key_votes:
        confidence = min(95, max(40, int(key_votes[original_key]["max_strength"] * 100)))
    else:
        confidence = 65

    return best_key, confidence


def _disambiguate_mode(best_key, key_votes, chroma_avg, KEY_NAMES):
    """Use total scale energy from chroma to disambiguate major vs minor.
    Compares the sum of all 7 scale degrees for major vs minor interpretation.
    This handles chromatic borrowing (common in modern music) better than
    checking individual degrees."""
    parts = best_key.split()
    if len(parts) != 2:
        return best_key

    root_name, mode = parts[0], parts[1]

    if chroma_avg is None:
        return best_key

    root_idx = KEY_NAMES.index(root_name) if root_name in KEY_NAMES else -1
    if root_idx < 0:
        return best_key

    major_intervals = [0, 2, 4, 5, 7, 9, 11]
    minor_intervals = [0, 2, 3, 5, 7, 8, 10]

    major_energy = sum(float(chroma_avg[(root_idx + i) % 12]) for i in major_intervals)
    minor_energy = sum(float(chroma_avg[(root_idx + i) % 12]) for i in minor_intervals)

    maj3 = float(chroma_avg[(root_idx + 4) % 12])
    min3 = float(chroma_avg[(root_idx + 3) % 12])
    
    # Weight the 3rd more heavily - it's the key discriminator
    major_energy_weighted = major_energy + (maj3 * 2)
    minor_energy_weighted = minor_energy + (min3 * 2)

    sys.stderr.write(f"Mode disambiguation for {best_key}:\n")
    sys.stderr.write(f"  Total scale energy: major={major_energy:.4f}, minor={minor_energy:.4f}\n")
    sys.stderr.write(f"  Weighted (3rd x2): major={major_energy_weighted:.4f}, minor={minor_energy_weighted:.4f}\n")
    sys.stderr.write(f"  3rd degree: major({KEY_NAMES[(root_idx+4)%12]})={maj3:.4f}, minor({KEY_NAMES[(root_idx+3)%12]})={min3:.4f}\n")

    chroma_winner = "major" if major_energy_weighted > minor_energy_weighted else "minor"

    if chroma_winner != mode:
        ratio = max(major_energy_weighted, minor_energy_weighted) / (min(major_energy_weighted, minor_energy_weighted) + 1e-10)
        sys.stderr.write(f"  Scale energy says {chroma_winner} (ratio={ratio:.4f}), votes say {mode}\n")

        parallel = f"{root_name} {'minor' if mode == 'major' else 'major'}"
        has_parallel_votes = parallel in key_votes

        if has_parallel_votes:
            best_votes = key_votes[best_key]
            parallel_votes = key_votes[parallel]
            vote_margin = (best_votes["count"] * 2 + best_votes["total_strength"]) - (parallel_votes["count"] * 2 + parallel_votes["total_strength"])
        else:
            vote_margin = 0

        # Use lower threshold (1.002 instead of 1.005) to catch more mode corrections
        if ratio > 1.002 or vote_margin < 3.5:
            corrected = f"{root_name} {chroma_winner}"
            sys.stderr.write(f"  CORRECTING: {best_key} -> {corrected}\n")
            return corrected
        else:
            sys.stderr.write(f"  Keeping {best_key} (vote margin={vote_margin:.2f} too strong)\n")

    return best_key


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file specified"}))
        sys.exit(1)

    filepath = sys.argv[1]
    try:
        bpm, key, conf = detect_with_hybrid(filepath)
        print(json.dumps({"bpm": int(bpm), "key": key, "keyConfidence": conf}))
    except Exception as e:
        sys.stderr.write(f"Analysis failed: {e}\n")
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
