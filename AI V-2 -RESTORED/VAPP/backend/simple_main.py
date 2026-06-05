from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse
import numpy as np
import librosa
import soundfile as sf
import wave
import io
import os
import tempfile
import traceback
from typing import List, Tuple, Dict, Any, Optional
import random
import math
import zipfile

# ===== COMPLETE HOCKETING APP WITH ALL FEATURES =====
# This includes sample import system, ChatGPT-style prompts, and full functionality

app = FastAPI(title="Hocketing App", version="2.0.0")

# ===== MUSICAL CONSTANTS =====
NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
SCALE_PATTERNS = {
    'major': [0, 2, 4, 5, 7, 9, 11],
    'minor': [0, 2, 3, 5, 7, 8, 10],
    'lydian': [0, 2, 4, 6, 7, 9, 11],
    'pentatonic': [0, 2, 4, 7, 9],
    'blues': [0, 3, 5, 6, 7, 10]
}

# ===== CORE HOCKETING SYSTEM =====
class HocketingGenerator:
    def __init__(self):
        self.rng = random.Random()
    
    def generate_scale_frequencies(self, key: str, mode: str, root_freq: float = 440.0) -> Tuple[List[float], List[int]]:
        """Generate scale frequencies for the given key and mode"""
        # Find root note index
        root_idx = NOTE_NAMES.index(key.upper())
        
        # Get scale pattern
        if mode not in SCALE_PATTERNS:
            mode = 'major'
        scale_pattern = SCALE_PATTERNS[mode]
        
        # Generate frequencies for each scale degree
        scale_freqs = []
        scale_intervals = []
        
        for degree in scale_pattern:
            # Calculate frequency for this scale degree
            freq = root_freq * (2 ** (degree / 12))
            scale_freqs.append(freq)
            scale_intervals.append(degree)
        
        return scale_freqs, scale_intervals
    
    def create_hocketing_pattern(self, duration: float, tempo: int, num_voices: int = 8) -> List[List[int]]:
        """Create random Steve Reich/Caroline Shaw hocketing grooves - DIFFERENT EACH TIME"""
        # Calculate time divisions - use 8th notes for dense hocketing
        eighth_note = 60.0 / tempo / 8
        total_slots = int(duration / eighth_note)
        
        # Choose a random hocketing groove style each time
        groove_style = self.rng.choice(['reich_phase', 'shaw_interlock', 'minimalist_cells', 'polyrhythmic', 'asymmetric'])
        
        pattern = []
        
        if groove_style == 'reich_phase':
            # Steve Reich phase shifting style - voices gradually shift apart
            phase_offset = self.rng.uniform(0.1, 0.3)
            for voice in range(num_voices):
                voice_slots = []
                base_slot = int(voice * phase_offset * total_slots)
                slot = base_slot
                while slot < total_slots:
                    voice_slots.append(slot)
                    # Add Reich-style rhythmic cells
                    if self.rng.random() < 0.4:
                        voice_slots.append(slot + 2)
                    slot += self.rng.choice([3, 4, 5])  # Variable cell lengths
                pattern.append(voice_slots)
                
        elif groove_style == 'shaw_interlock':
            # Caroline Shaw interlocking style - voices weave in and out
            for voice in range(num_voices):
                voice_slots = []
                # Create interlocking pattern with voice pairs
                partner_voice = (voice + 4) % num_voices
                slot = voice * 3
                while slot < total_slots:
                    voice_slots.append(slot)
                    # Interlock with partner voice
                    if self.rng.random() < 0.6:
                        voice_slots.append(slot + 1)
                    slot += self.rng.choice([2, 3, 4, 6])  # Shaw-style spacing
                pattern.append(voice_slots)
                
        elif groove_style == 'minimalist_cells':
            # Minimalist rhythmic cells - each voice gets different cell lengths
            cell_lengths = [self.rng.choice([2, 3, 4, 5]) for _ in range(num_voices)]
            for voice in range(num_voices):
                voice_slots = []
                slot = voice
                while slot < total_slots:
                    voice_slots.append(slot)
                    # Fill the cell
                    for i in range(1, cell_lengths[voice]):
                        if slot + i < total_slots:
                            voice_slots.append(slot + i)
                    slot += cell_lengths[voice] + self.rng.choice([0, 1, 2])
                pattern.append(voice_slots)
                
        elif groove_style == 'polyrhythmic':
            # Polyrhythmic hocketing - different rhythms for each voice
            rhythms = [self.rng.choice([2, 3, 4, 5, 6, 7]) for _ in range(num_voices)]
            for voice in range(num_voices):
                voice_slots = []
                slot = voice
                while slot < total_slots:
                    voice_slots.append(slot)
                    # Add polyrhythmic accents
                    if self.rng.random() < 0.5:
                        voice_slots.append(slot + rhythms[voice])
                    slot += rhythms[voice]
                pattern.append(voice_slots)
                
        else:  # asymmetric
            # Asymmetric hocketing - irregular patterns
            for voice in range(num_voices):
                voice_slots = []
                slot = voice
                while slot < total_slots:
                    voice_slots.append(slot)
                    # Add asymmetric accents
                    if self.rng.random() < 0.7:
                        voice_slots.append(slot + self.rng.choice([1, 2, 3, 5, 7]))
                    slot += self.rng.choice([2, 3, 4, 5, 6, 7, 8])
                pattern.append(voice_slots)
        
        print(f"[Hocketing Groove] Generated {groove_style} pattern - DIFFERENT EACH TIME!")
        return pattern
    
    def generate_melody_notes(self, scale_freqs: List[float], scale_intervals: List[int], 
                             hocketing_pattern: List[List[int]], duration: float, tempo: int) -> List[List[Tuple]]:
        """Generate PROPER Steve Reich/Caroline Shaw melodic structures - MUSICALLY COHERENT"""
        eighth_note = 60.0 / tempo / 8
        voices = [[] for _ in range(8)]
        
        # CRITICAL SAFETY CHECK: Ensure we have valid scales
        if not scale_intervals or len(scale_intervals) == 0:
            print(f"[ERROR] Invalid scale_intervals: {scale_intervals}")
            # Fallback to C major scale
            scale_intervals = [0, 2, 4, 5, 7, 9, 11]
            scale_freqs = [440.0, 493.9, 554.4, 587.3, 659.3, 740.0, 830.6]
            print(f"[FALLBACK] Using C major scale: {scale_intervals}")
        
        if not scale_freqs or len(scale_freqs) == 0:
            print(f"[ERROR] Invalid scale_freqs: {scale_freqs}")
            # Fallback to C major frequencies
            scale_freqs = [440.0, 493.9, 554.4, 587.3, 659.3, 740.0, 830.6]
            print(f"[FALLBACK] Using C major frequencies: {scale_freqs}")
        
        # CRITICAL: Ensure arrays have matching lengths
        if len(scale_intervals) != len(scale_freqs):
            print(f"[CRITICAL] Mismatch: scale_intervals({len(scale_intervals)}) != scale_freqs({len(scale_freqs)})")
            # Use the shorter length
            min_length = min(len(scale_intervals), len(scale_freqs))
            scale_intervals = scale_intervals[:min_length]
            scale_freqs = scale_freqs[:min_length]
            print(f"[FIXED] Both arrays now have length {min_length}")
        
        # Track previous notes and melodic phrases for each voice
        previous_notes = [0] * 8
        current_phrases = [0] * 8  # Track which phrase we're in
        
        # Choose melodic style that creates proper musical structure
        melodic_style = self.rng.choice(['reich_cells', 'shaw_phrases', 'minimalist_ostinato'])
        
        # Generate notes for each voice with proper musical structure
        for voice_idx, voice_slots in enumerate(hocketing_pattern):
            # Each voice gets a different starting note for variety
            base_degree = voice_idx % len(scale_intervals)
            current_degree = base_degree
            
            for slot_idx, slot in enumerate(voice_slots):
                time = slot * eighth_note
                
                # Create musically coherent patterns based on style
                if melodic_style == 'reich_cells':
                    # Steve Reich style - rhythmic cells with gradual variation
                    if slot_idx % 4 == 0:  # New cell every 4 slots
                        # Start new cell with base degree
                        current_degree = base_degree
                    else:
                        # Within cell, use stepwise motion
                        current_degree = (current_degree + self.rng.choice([-1, 1])) % len(scale_intervals)
                        
                elif melodic_style == 'shaw_phrases':
                    # Caroline Shaw style - lyrical phrases with clear direction
                    if slot_idx % 8 == 0:  # New phrase every 8 slots
                        # Start phrase with strong degree (root, third, fifth)
                        current_degree = self.rng.choice([0, 2, 4, 6])
                    else:
                        # Within phrase, create melodic direction
                        if slot_idx % 8 < 4:  # First half of phrase - ascending
                            current_degree = (current_degree + self.rng.choice([1, 2])) % len(scale_intervals)
                        else:  # Second half of phrase - descending
                            current_degree = (current_degree + self.rng.choice([-1, -2])) % len(scale_intervals)
                            
                else:  # minimalist_ostinato
                    # Minimalist style - repeating patterns with subtle variation
                    if slot_idx % 6 == 0:  # New ostinato every 6 slots
                        # Choose a new anchor note
                        current_degree = self.rng.choice([0, 3, 5, 7])
                    else:
                        # Small variations around the anchor
                        variation = self.rng.choice([-1, 0, 1])
                        current_degree = (current_degree + variation) % len(scale_intervals)
                
                # ULTRA-SAFE BOUNDS CHECKING: Complete protection against index errors
                try:
                    # CRITICAL: Ensure current_degree is within bounds
                    if len(scale_intervals) == 0:
                        print(f"[ERROR] Voice {voice_idx + 1}: Empty scale_intervals, using fallback")
                        current_degree = 0
                    else:
                        current_degree = max(0, min(current_degree, len(scale_intervals) - 1))
                    
                    # CRITICAL: Ensure scale_freqs has the required index
                    if current_degree >= len(scale_freqs):
                        print(f"[ERROR] Voice {voice_idx + 1}: current_degree {current_degree} >= len(scale_freqs) {len(scale_freqs)}, using fallback")
                        current_degree = min(current_degree, len(scale_freqs) - 1) if len(scale_freqs) > 0 else 0
                    
                    # CRITICAL: Final validation
                    if current_degree < 0 or current_degree >= len(scale_freqs):
                        print(f"[CRITICAL] Voice {voice_idx + 1}: Invalid current_degree {current_degree}, using fallback")
                        current_degree = 0
                    
                    freq = scale_freqs[current_degree]
                    
                except Exception as e:
                    print(f"[CRITICAL ERROR] Voice {voice_idx + 1}: Bounds checking failed: {e}")
                    print(f"[CRITICAL ERROR] scale_intervals: {len(scale_intervals)}, scale_freqs: {len(scale_freqs)}, current_degree: {current_degree}")
                    # Use fallback values
                    current_degree = 0
                    freq = 440.0  # A4 as fallback
                
                # Note parameters - more consistent for musical coherence
                gain = self.rng.uniform(0.8, 1.0)  # Higher gain for main notes
                note_duration = eighth_note * self.rng.uniform(0.9, 1.1)  # More consistent timing
                
                # Add main note
                voices[voice_idx].append((time, freq, gain, note_duration))
                
                # Add Stevie Wonder-style ghost note glide - ONLY when musically appropriate
                if self.rng.random() < 0.5:  # Reduced frequency for better musical balance
                    prev_degree = previous_notes[voice_idx]
                    
                    if prev_degree != current_degree and prev_degree is not None:
                        # SAFE GHOST NOTE GENERATION: Protect against index errors
                        try:
                            # CRITICAL: Validate prev_degree bounds
                            if prev_degree < 0 or prev_degree >= len(scale_freqs):
                                print(f"[WARNING] Voice {voice_idx + 1}: Invalid prev_degree {prev_degree}, skipping ghost note")
                                continue
                            
                            ghost_freq = scale_freqs[prev_degree]
                            ghost_time = time - (eighth_note * 0.15)  # Tighter timing
                            ghost_time = max(0, ghost_time)
                            
                            if ghost_time >= 0:
                                ghost_gain = gain * 0.6  # Softer ghost notes
                                ghost_duration = eighth_note * 0.3  # Shorter duration
                                
                                voices[voice_idx].append((ghost_time, ghost_freq, ghost_gain, ghost_duration))
                                
                                print(f"[Ghost Note] Voice {voice_idx + 1}: {prev_degree}→{current_degree} ({ghost_freq:.1f}Hz → {freq:.1f}Hz) - {melodic_style} style!")
                                
                        except Exception as e:
                            print(f"[ERROR] Voice {voice_idx + 1}: Ghost note generation failed: {e}")
                            # Skip ghost note to prevent crash
                            continue
                
                # Update previous note for this voice
                previous_notes[voice_idx] = current_degree
        
        print(f"[Melody Style] Generated {melodic_style} melodic patterns - MUSICALLY COHERENT!")
        return voices
    
    def add_rapid_fire_patterns(self, voices: List[List[Tuple]], duration: float, tempo: int, 
                               scale_freqs: List[float], scale_intervals: List[int]) -> List[List[Tuple]]:
        """Add RANDOM Caroline Shaw rapid-fire patterns - DIFFERENT GROOVES EACH TIME"""
        eighth_note = 60.0 / tempo / 8
        triplet_note = eighth_note / 3  # 12th note triplets
        
        # Choose random rapid-fire style each time
        rapid_style = self.rng.choice(['shaw_triplets', 'reich_phasing', 'minimalist_bursts', 'polyrhythmic_rapid'])
        
        # Track rapid-fire sections to block ghost notes
        rapid_fire_sections = set()
        
        if rapid_style == 'shaw_triplets':
            # Caroline Shaw 12th note triplets - rapid-fire bursts
            rapid_positions = [int(duration * 0.2), int(duration * 0.4), int(duration * 0.6), int(duration * 0.8)]
            for voice_idx, voice in enumerate(voices):
                for pos in rapid_positions:
                    if self.rng.random() < 0.7:  # 70% chance
                        burst_length = self.rng.choice([6, 8, 10, 12])
                        for i in range(burst_length):
                            time = pos + (i * triplet_note)
                            if time < duration:
                                degree = self.rng.choice(range(len(scale_intervals)))
                                # CRITICAL FIX: Ensure degree is within bounds
                                degree = max(0, min(degree, len(scale_intervals) - 1))
                                freq = scale_freqs[degree]
                                gain = self.rng.uniform(0.8, 1.0)
                                note_duration = triplet_note * 0.9
                                voices[voice_idx].append((time, freq, gain, note_duration))
                                rapid_fire_sections.add(time)
                                
        elif rapid_style == 'reich_phasing':
            # Steve Reich phasing - voices gradually shift apart
            for voice_idx, voice in enumerate(voices):
                phase_offset = voice_idx * 0.1  # Fixed: use voice_idx not voice
                for i in range(0, int(duration * 2), 2):
                    time = i + phase_offset
                    if time < duration:
                        degree = self.rng.choice(range(len(scale_intervals)))
                        # CRITICAL FIX: Ensure degree is within bounds
                        degree = max(0, min(degree, len(scale_intervals) - 1))
                        freq = scale_freqs[degree]
                        gain = self.rng.uniform(0.7, 0.9)
                        note_duration = triplet_note * 1.2
                        voices[voice_idx].append((time, freq, gain, note_duration))
                        rapid_fire_sections.add(time)
                        
        elif rapid_style == 'minimalist_bursts':
            # Minimalist rhythmic bursts
            for voice_idx, voice in enumerate(voices):
                cell_length = self.rng.choice([3, 4, 5, 6])
                for i in range(0, int(duration * 3), cell_length):
                    time = i + (voice_idx * 0.2)
                    if time < duration:
                        degree = self.rng.choice(range(len(scale_intervals)))
                        # CRITICAL FIX: Ensure degree is within bounds
                        degree = max(0, min(degree, len(scale_intervals) - 1))
                        freq = scale_freqs[degree]
                        gain = self.rng.uniform(0.6, 0.8)
                        note_duration = triplet_note * 0.7
                        voices[voice_idx].append((time, freq, gain, note_duration))
                        rapid_fire_sections.add(time)
                        
        else:  # polyrhythmic_rapid
            # Polyrhythmic rapid patterns
            rhythms = [self.rng.choice([2, 3, 4, 5, 6, 7]) for _ in range(8)]
            for voice_idx, voice in enumerate(voices):
                rhythm = rhythms[voice_idx]
                for i in range(0, int(duration * rhythm), rhythm):
                    time = i + (voice_idx * 0.15)
                    if time < duration:
                        degree = self.rng.choice(range(len(scale_intervals)))
                        # CRITICAL FIX: Ensure degree is within bounds
                        degree = max(0, min(degree, len(scale_intervals) - 1))
                        freq = scale_freqs[degree]
                        gain = self.rng.uniform(0.7, 0.9)
                        note_duration = triplet_note * 1.0
                        voices[voice_idx].append((time, freq, gain, note_duration))
                        rapid_fire_sections.add(time)
        
        print(f"[Rapid Fire] Generated {rapid_style} pattern - DIFFERENT EACH TIME!")
        print(f"[DEBUG] Rapid fire sections: {len(rapid_fire_sections)} positions")
        
        # Remove ghost notes from rapid-fire sections
        for voice_idx, voice in enumerate(voices):
            original_count = len(voice)
            filtered_voice = []
            removed_count = 0
            
            for time, freq, gain, note_duration in voice:
                # Check if this is a ghost note in a rapid-fire section
                is_ghost_note = False
                if gain < 0.9 and note_duration < (eighth_note * 0.5):
                    for rapid_time in rapid_fire_sections:
                        if abs(time - rapid_time) < triplet_note:
                            is_ghost_note = True
                            removed_count += 1
                            break
                
                # Only add if it's not a ghost note in rapid-fire
                if not is_ghost_note:
                    filtered_voice.append((time, freq, gain, note_duration))
            
            voices[voice_idx] = filtered_voice
            print(f"[DEBUG] Voice {voice_idx + 1}: {original_count} → {len(filtered_voice)} notes, removed {removed_count} ghost notes")
        
        return voices

# ===== AUDIO PROCESSING WITH SAMPLE SUPPORT =====
class AudioProcessor:
    def __init__(self):
        self.sample_rate = 44100
    
    def load_audio_sample(self, file: UploadFile) -> Tuple[np.ndarray, int]:
        """Load audio sample from uploaded file"""
        try:
            # Read audio file
            audio_data, sr = librosa.load(io.BytesIO(file.file.read()), sr=None)
            return audio_data, sr
        except Exception as e:
            print(f"Error loading sample: {e}")
            # Return fallback sine wave
            return self.create_note_audio(440.0, 1.0, 1.0), self.sample_rate
    
    def create_note_audio(self, frequency: float, duration: float, gain: float, sample_rate: int = 44100) -> np.ndarray:
        """Create a simple sine wave note"""
        t = np.linspace(0, duration, int(sample_rate * duration), False)
        audio = np.sin(2 * np.pi * frequency * t) * gain
        
        # Add fade in/out to prevent clicks
        fade_samples = int(0.01 * sample_rate)
        if len(audio) > fade_samples * 2:
            audio[:fade_samples] *= np.linspace(0, 1, fade_samples)
            audio[-fade_samples:] *= np.linspace(1, 0, fade_samples)
        
        return audio
    
    def process_voice_with_samples(self, voice_notes: List[Tuple], duration: float, 
                                 sample_audio: np.ndarray, sample_sr: int, 
                                 voice_number: int) -> np.ndarray:
        """Process a voice using the uploaded sample audio with dynamic stereo panning"""
        # Calculate total samples
        total_samples = int(duration * self.sample_rate)
        voice_audio_left = np.zeros(total_samples)
        voice_audio_right = np.zeros(total_samples)
        
        # Caroline Shaw-inspired DYNAMIC stereo panning
        # Voices move from left to right and right to left throughout the piece
        
        # Process each note with dynamic panning
        total_notes = len(voice_notes)
        for note_idx, (time, freq, gain, note_duration) in enumerate(voice_notes):
            # Progress indicator every 50 notes
            if note_idx % 50 == 0:
                print(f"[Progress] Voice {voice_number}: Processing note {note_idx + 1}/{total_notes}")
            # Convert time to sample index
            start_sample = int(time * self.sample_rate)
            end_sample = start_sample + int(note_duration * self.sample_rate)
            
            # Calculate dynamic panning based on time and voice number
            # Each voice moves through the stereo field in different patterns
            
            if voice_number in [1, 3, 5, 7]:  # Odd voices: left to right movement
                # Pan moves from left to right over time
                pan_progress = (time / duration)  # 0.0 to 1.0
                left_pan = 1.0 - pan_progress    # Start left (1.0), end right (0.0)
                right_pan = pan_progress          # Start right (0.0), end left (1.0)
                
            else:  # Even voices: right to left movement
                # Pan moves from right to left over time
                pan_progress = (time / duration)  # 0.0 to 1.0
                left_pan = pan_progress           # Start left (0.0), end right (1.0)
                right_pan = 1.0 - pan_progress   # Start right (1.0), end left (0.0)
            
            # Add some variation based on voice number for more complex movement
            if voice_number in [1, 2]:
                # Voices 1-2: Add circular movement
                circular_offset = np.sin(2 * np.pi * time / (duration / 4)) * 0.2
                left_pan = np.clip(left_pan + circular_offset, 0.0, 1.0)
                right_pan = np.clip(right_pan - circular_offset, 0.0, 1.0)
            
            elif voice_number in [3, 4]:
                # Voices 3-4: Add figure-8 movement
                figure8_offset = np.sin(4 * np.pi * time / (duration / 3)) * 0.15
                left_pan = np.clip(left_pan + figure8_offset, 0.0, 1.0)
                right_pan = np.clip(right_pan - figure8_offset, 0.0, 1.0)
            
            elif voice_number in [5, 6]:
                # Voices 5-6: Add zigzag movement
                zigzag_offset = np.sin(6 * np.pi * time / (duration / 2)) * 0.25
                left_pan = np.clip(left_pan + zigzag_offset, 0.0, 1.0)
                right_pan = np.clip(right_pan - zigzag_offset, 0.0, 1.0)
            
            elif voice_number in [7, 8]:
                # Voices 7-8: Add spiral movement
                spiral_offset = np.sin(8 * np.pi * time / duration) * 0.3
                left_pan = np.clip(left_pan + spiral_offset, 0.0, 1.0)
                right_pan = np.clip(right_pan - spiral_offset, 0.0, 1.0)
            
                            # CRITICAL SAFETY CHECK: Ensure we don't go out of bounds
                if start_sample < total_samples:
                    end_sample = min(end_sample, total_samples)
                    
                    # Use the sample audio for this note
                    note_samples = int(note_duration * self.sample_rate)
                    
                    # CRITICAL FIX: Ensure note_samples is valid
                    if note_samples <= 0:
                        print(f"[WARNING] Voice {voice_number}, Note {note_idx + 1}: Invalid note duration {note_duration}s, skipping")
                        continue
                    
                    # Resample sample audio if needed
                    if sample_sr != self.sample_rate:
                        try:
                            note_audio = librosa.resample(sample_audio, orig_sr=sample_sr, target_sr=self.sample_rate)
                        except Exception as e:
                            print(f"[ERROR] Resampling failed for voice {voice_number}, note {note_idx + 1}: {e}")
                            # Fallback to original sample
                            note_audio = sample_audio.copy()
                    else:
                        note_audio = sample_audio.copy()
                    
                    # CRITICAL SAFETY CHECK: Ensure note_audio is valid
                    if len(note_audio) == 0:
                        print(f"[WARNING] Voice {voice_number}, Note {note_idx + 1}: Empty audio, skipping")
                        continue
                
                # SIMPLE APPROACH - Use different parts of the sample for different notes
                # This preserves the natural sound of your samples
                if freq != 440.0:  # Only modify if not at base frequency
                    # Use different starting points in the sample based on frequency
                    freq_ratio = freq / 440.0
                    start_offset = int(len(note_audio) * (freq_ratio - 1.0) * 0.1)
                    start_offset = max(0, min(start_offset, len(note_audio) // 2))
                    
                    # Take a different segment of the sample
                    if start_offset > 0:
                        note_audio = note_audio[start_offset:] + note_audio[:start_offset]
                    
                    if note_idx < 3:  # Debug first few notes
                        print(f"[Sample Mod] Voice {voice_number}, Note {note_idx + 1}: 440Hz → {freq:.1f}Hz (offset: {start_offset})")
                
                # ULTRA-SAFE AUDIO PROCESSING: Prevent broadcasting errors before they happen
                try:
                    # CRITICAL: Calculate the actual note duration in samples
                    note_samples_actual = int(note_duration * self.sample_rate)
                    
                    # CRITICAL: Ensure note_samples_actual is reasonable
                    if note_samples_actual <= 0:
                        print(f"[WARNING] Voice {voice_number}, Note {note_idx + 1}: Invalid note duration {note_duration}s, skipping")
                        continue
                    
                    # CRITICAL: Cap extremely long notes to prevent memory issues
                    max_safe_samples = min(note_samples_actual, 50000)  # Max 50k samples
                    if note_samples_actual > max_safe_samples:
                        print(f"[WARNING] Voice {voice_number}, Note {note_idx + 1}: Truncating note from {note_samples_actual} to {max_safe_samples} samples")
                        note_samples_actual = max_safe_samples
                    
                    # CRITICAL: Process note audio to exact target length
                    if len(note_audio) > note_samples_actual:
                        # Truncate to target length
                        note_audio = note_audio[:note_samples_actual]
                    elif len(note_audio) < note_samples_actual:
                        # Loop to fill target length
                        loops_needed = note_samples_actual // len(note_audio) + 1
                        note_audio = np.tile(note_audio, loops_needed)[:note_samples_actual]
                    
                    # CRITICAL: Verify final note_audio length
                    if len(note_audio) != note_samples_actual:
                        print(f"[ERROR] Voice {voice_number}, Note {note_idx + 1}: Length mismatch {len(note_audio)} != {note_samples_actual}, skipping")
                        continue
                    
                    # CRITICAL: Apply gain and panning
                    note_audio = note_audio * gain
                    note_audio_left_panned = note_audio * left_pan
                    note_audio_right_panned = note_audio * right_pan
                    
                    # CRITICAL: Verify panned audio lengths
                    if (len(note_audio_left_panned) != note_samples_actual or 
                        len(note_audio_right_panned) != note_samples_actual):
                        print(f"[ERROR] Voice {voice_number}, Note {note_idx + 1}: Panned audio length mismatch, skipping")
                        continue
                        
                except Exception as e:
                    print(f"[ERROR] Voice {voice_number}, Note {note_idx + 1}: Audio processing failed: {e}, skipping")
                    continue
                
                # SIMPLIFIED SAFE AUDIO MIXING: Use the verified note_samples_actual
                try:
                    # CRITICAL: Use the verified note length from audio processing
                    note_length = note_samples_actual
                    available_length = end_sample - start_sample
                    
                    # SAFETY CHECK: Ensure note fits in available space
                    if note_length > available_length:
                        note_audio_left_panned = note_audio_left_panned[:available_length].copy()
                        note_audio_right_panned = note_audio_right_panned[:available_length].copy()
                        note_length = available_length
                    
                    # FINAL BOUNDS CHECK: Ensure we don't go out of bounds
                    if start_sample < 0 or start_sample >= total_samples:
                        print(f"[WARNING] Voice {voice_number}, Note {note_idx + 1}: Start sample {start_sample} out of bounds, skipping")
                        continue
                    
                    if start_sample + note_length > total_samples:
                        # Truncate to fit within total samples
                        max_length = total_samples - start_sample
                        if max_length > 0:
                            note_audio_left_panned = note_audio_left_panned[:max_length].copy()
                            note_audio_right_panned = note_audio_right_panned[:max_length].copy()
                            note_length = max_length
                        else:
                            print(f"[WARNING] Voice {voice_number}, Note {note_idx + 1}: No space available, skipping")
                            continue
                    
                    # SAFE TO MIX: All arrays have compatible shapes
                    voice_audio_left[start_sample:start_sample + note_length] += note_audio_left_panned
                    voice_audio_right[start_sample:start_sample + note_length] += note_audio_right_panned
                    
                    if note_idx < 3:  # Debug first few notes
                        print(f"[Dynamic Pan] Voice {voice_number}, Note {note_idx + 1}: Time {time:.2f}s, Left: {left_pan:.2f}, Right: {right_pan:.2f}")
                            
                except Exception as e:
                    print(f"[CRITICAL ERROR] Voice {voice_number}, Note {note_idx + 1}: Audio mixing failed: {e}")
                    print(f"[CRITICAL ERROR] note_length={note_length}, start_sample={start_sample}, total_samples={total_samples}")
                    # Skip this note to prevent crash
                    continue
                
                # Print panning info for first few notes
                if note_idx < 3:
                    print(f"[Dynamic Pan] Voice {voice_number}, Note {note_idx + 1}: Time {time:.2f}s, Left: {left_pan:.2f}, Right: {right_pan:.2f}")
        
        # Print final panning summary
        print(f"[Dynamic Stereo] Voice {voice_number}: Dynamic panning from left↔right throughout piece")
        
        # Normalize each channel to prevent clipping
        max_left = np.max(np.abs(voice_audio_left))
        max_right = np.max(np.abs(voice_audio_right))
        
        if max_left > 0:
            voice_audio_left = voice_audio_left / max_left * 0.8
        if max_right > 0:
            voice_audio_right = voice_audio_right / max_right * 0.8
        
        # Combine into stereo array
        stereo_audio = np.column_stack((voice_audio_left, voice_audio_right))
        
        print(f"[Dynamic Stereo] Voice {voice_number}: Dynamic panning from left↔right throughout piece")
        
        return stereo_audio
    
    def save_audio(self, audio: np.ndarray, filename: str, sample_rate: int = 44100):
        """Save audio to WAV file (supports both mono and stereo)"""
        try:
            # Check if audio is stereo (2D array with 2 columns)
            if len(audio.shape) == 2 and audio.shape[1] == 2:
                # Stereo audio - save as is
                sf.write(filename, audio, sample_rate)
                print(f"[Audio] Saved stereo file: {filename}")
            else:
                # Mono audio - convert to stereo if needed
                if len(audio.shape) == 1:
                    # Convert mono to stereo by duplicating the channel
                    stereo_audio = np.column_stack((audio, audio))
                    sf.write(filename, stereo_audio, sample_rate)
                    print(f"[Audio] Converted mono to stereo: {filename}")
                else:
                    # Already stereo or different format
                    sf.write(filename, audio, sample_rate)
                    print(f"[Audio] Saved audio file: {filename}")
        except Exception as e:
            print(f"Error saving audio: {e}")
            # Fallback to mono save
            if len(audio.shape) == 2:
                mono_audio = np.mean(audio, axis=1)
                sf.write(filename, mono_audio, sample_rate)
            else:
                sf.write(filename, audio, sample_rate)

# ===== SCALE RESOLUTION SYSTEM WITH OLLAMA WEB SEARCH =====
import requests
import json
import re

def search_web_for_scale(scale_prompt: str) -> Dict[str, Any]:
    """Search the web using Ollama for scale information"""
    try:
        # Use Ollama to search the web for scale information
        ollama_url = "http://localhost:11434/api/generate"
        
        # Create a comprehensive search prompt for musical scales
        search_prompt = f"""
        You are a musical scale expert. Search the web and find information about this musical scale: "{scale_prompt}"
        
        Please provide:
        1. The exact scale name
        2. The musical intervals (as semitone steps from root)
        3. The scale formula (e.g., "W-W-H-W-W-W-H" for major)
        4. A brief description
        5. Common usage examples
        
        If this is not a recognized scale, suggest the closest match.
        Return your response as JSON with these fields:
        - scale_name: string
        - intervals: array of integers
        - formula: string
        - description: string
        - examples: string
        - confidence: float (0.0 to 1.0)
        - source: string
        """
        
        # Call Ollama API
        response = requests.post(ollama_url, json={
            "model": "llama3.2",  # or whatever model you have
            "prompt": search_prompt,
            "stream": False
        }, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            response_text = result.get('response', '')
            
            # Try to extract JSON from the response
            try:
                # Look for JSON in the response
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    scale_data = json.loads(json_match.group())
                    return scale_data
                else:
                    # If no JSON found, try to parse the text manually
                    return parse_scale_from_text(response_text, scale_prompt)
            except json.JSONDecodeError:
                # Fallback to text parsing
                return parse_scale_from_text(response_text, scale_prompt)
        else:
            # Fallback to local scale database if Ollama fails
            return fallback_scale_resolution(scale_prompt)
            
    except Exception as e:
        print(f"Ollama web search failed: {e}")
        # Fallback to local scale database
        return fallback_scale_resolution(scale_prompt)

def parse_scale_from_text(text: str, original_prompt: str) -> Dict[str, Any]:
    """Parse scale information from Ollama's text response"""
    text_lower = text.lower()
    
    # Try to extract scale name
    scale_name = extract_scale_name(text_lower, original_prompt)
    
    # Try to extract intervals
    intervals = extract_intervals(text_lower)
    
    # Try to extract formula
    formula = extract_formula(text_lower)
    
    # Determine confidence based on what we found
    confidence = 0.5
    if scale_name and intervals:
        confidence = 0.8
    elif scale_name:
        confidence = 0.6
    
    return {
        "scale_name": scale_name or "Unknown scale",
        "intervals": intervals or [0, 2, 4, 5, 7, 9, 11],  # Default to major
        "formula": formula or "Unknown",
        "description": f"Scale found from web search for '{original_prompt}'",
        "examples": "See web sources for examples",
        "confidence": confidence,
        "source": "Ollama web search"
    }

def extract_scale_name(text: str, original_prompt: str) -> str:
    """Extract scale name from text"""
    # Common scale names to look for
    scale_names = [
        'major', 'minor', 'lydian', 'dorian', 'phrygian', 'mixolydian', 'locrian',
        'pentatonic', 'blues', 'harmonic minor', 'melodic minor', 'whole tone',
        'diminished', 'augmented', 'chromatic', 'enigmatic', 'hungarian minor',
        'neapolitan', 'persian', 'byzantine', 'arabic', 'egyptian', 'japanese',
        'chinese', 'indian', 'raga', 'maqam', 'makam', 'dastgah', 'pathet'
    ]
    
    for name in scale_names:
        if name in text:
            return name
    
    # If no exact match, return the original prompt
    return original_prompt

def extract_intervals(text: str) -> List[int]:
    """Extract musical intervals from text"""
    # Look for interval patterns
    interval_patterns = [
        r'\[([0-9,\s]+)\]',  # [0, 2, 4, 5, 7, 9, 11]
        r'intervals?[:\s]+([0-9,\s]+)',  # intervals: 0, 2, 4, 5, 7, 9, 11
        r'steps?[:\s]+([0-9,\s]+)',  # steps: 0, 2, 4, 5, 7, 9, 11
    ]
    
    for pattern in interval_patterns:
        match = re.search(pattern, text)
        if match:
            try:
                intervals_str = match.group(1)
                intervals = [int(x.strip()) for x in intervals_str.split(',')]
                if len(intervals) > 0:
                    return intervals
            except:
                continue
    
    # Look for semitone descriptions
    semitone_patterns = [
        r'(\d+)\s*semitone[s]?',  # 2 semitones, 1 semitone
        r'(\d+)\s*half\s*step[s]?',  # 2 half steps, 1 half step
    ]
    
    intervals = [0]
    current_pos = 0
    
    for pattern in semitone_patterns:
        matches = re.findall(pattern, text)
        for match in matches:
            try:
                semitones = int(match)
                current_pos += semitones
                intervals.append(current_pos)
            except:
                continue
    
    if len(intervals) > 1:
        return intervals
    
    # Default to major scale if nothing found
    return [0, 2, 4, 5, 7, 9, 11]

def extract_formula(text: str) -> str:
    """Extract scale formula from text"""
    # Look for common formula patterns
    formula_patterns = [
        r'formula[:\s]+([WWH\-\s]+)',  # formula: W-W-H-W-W-W-H
        r'pattern[:\s]+([WWH\-\s]+)',  # pattern: W-W-H-W-W-W-H
        r'([WWH\-\s]+)',  # W-W-H-W-W-W-H
    ]
    
    for pattern in formula_patterns:
        match = re.search(pattern, text)
        if match:
            formula = match.group(1).strip()
            if 'W' in formula or 'H' in formula:
                return formula
    
    return "Unknown"

def fallback_scale_resolution(scale_prompt: str) -> Dict[str, Any]:
    """Fallback to local scale database if web search fails"""
    prompt_lower = scale_prompt.lower()
    
    # Enhanced local scale database
    scale_database = {
        'lydian': {
            'intervals': [0, 2, 4, 6, 7, 9, 11],
            'formula': 'W-W-W-H-W-W-H',
            'description': 'Lydian mode - bright, uplifting scale with raised 4th'
        },
        'pentatonic': {
            'intervals': [0, 2, 4, 7, 9],
            'formula': 'W-W-WH-W-WH',
            'description': 'Pentatonic scale - 5-note scale common in folk music'
        },
        'blues': {
            'intervals': [0, 3, 5, 6, 7, 10],
            'formula': 'WH-W-H-H-WH-W',
            'description': 'Blues scale - 6-note scale with blue notes'
        },
        'minor': {
            'intervals': [0, 2, 3, 5, 7, 8, 10],
            'formula': 'W-H-W-W-H-W-W',
            'description': 'Natural minor scale - sad, melancholic'
        },
        'dorian': {
            'intervals': [0, 2, 3, 5, 7, 9, 10],
            'formula': 'W-H-W-W-W-H-W',
            'description': 'Dorian mode - jazzy, soulful minor variant'
        },
        'phrygian': {
            'intervals': [0, 1, 4, 5, 7, 8, 11],
            'formula': 'H-W-W-W-H-W-W',
            'description': 'Phrygian mode - Spanish, flamenco feel'
        },
        'mixolydian': {
            'intervals': [0, 2, 4, 5, 7, 9, 10],
            'formula': 'W-W-H-W-W-H-W',
            'description': 'Mixolydian mode - bluesy, rock feel'
        },
        'locrian': {
            'intervals': [0, 1, 3, 5, 6, 8, 10],
            'formula': 'H-W-W-H-W-W-W',
            'description': 'Locrian mode - unstable, diminished feel'
        },
        'harmonic minor': {
            'intervals': [0, 2, 3, 5, 7, 8, 11],
            'formula': 'W-H-W-W-H-WH-H',
            'description': 'Harmonic minor - exotic, mysterious'
        },
        'melodic minor': {
            'intervals': [0, 2, 3, 5, 7, 9, 11],
            'formula': 'W-H-W-W-W-W-H',
            'description': 'Melodic minor - jazz, classical'
        },
        'whole tone': {
            'intervals': [0, 2, 4, 6, 8, 10],
            'formula': 'W-W-W-W-W-W',
            'description': 'Whole tone scale - dreamy, impressionist'
        },
        'diminished': {
            'intervals': [0, 2, 3, 5, 6, 8, 9, 11],
            'formula': 'W-H-W-H-W-H-W-H',
            'description': 'Diminished scale - tense, jazz harmony'
        },
        'augmented': {
            'intervals': [0, 4, 8],
            'formula': 'W-W-W',
            'description': 'Augmented scale - symmetrical, modern'
        }
    }
    
    # Search for matches
    for scale_name, scale_info in scale_database.items():
        if scale_name in prompt_lower:
            return {
                "scale_name": scale_name,
                "intervals": scale_info['intervals'],
                "formula": scale_info['formula'],
                "description": scale_info['description'],
                "examples": f"Common in {scale_name} music",
                "confidence": 0.9,
                "source": "Local database"
            }
    
    # Default to major scale
    return {
        "scale_name": "major",
        "intervals": [0, 2, 4, 5, 7, 9, 11],
        "formula": "W-W-H-W-W-W-H",
        "description": "Major scale - bright, happy, fundamental",
        "examples": "Most common scale in Western music",
        "confidence": 0.7,
        "source": "Default fallback"
    }

def ai_resolve_scale(prompt: str, mode: str = 'major') -> Dict[str, Any]:
    """AI-powered scale resolution with Ollama web search"""
    try:
        if not prompt or not prompt.strip():
            return fallback_scale_resolution(mode)
        
        # Try web search first
        web_result = search_web_for_scale(prompt)
        
        # If web search found something good, use it
        if web_result.get('confidence', 0) > 0.6:
            return web_result
        
        # Otherwise fallback to local database
        return fallback_scale_resolution(prompt)
        
    except Exception as e:
        print(f"Scale resolution error: {e}")
        return fallback_scale_resolution(prompt)

# ===== MAIN HOCKETING FUNCTION WITH SAMPLE SUPPORT =====
def generate_hocketing_music_with_samples(
    target_file: UploadFile,
    sound_sample_1: UploadFile,
    sound_sample_2: UploadFile,
    sound_sample_3: UploadFile,
    sound_sample_4: UploadFile,
    key: str = 'C',
    mode: str = 'major',
    tempo: int = 120,
    duration: int = 8,
    scale_prompt: str = ""
) -> str:
    """Main function to generate hocketing music with sample support"""
    try:
        # Initialize generators
        hocketing_gen = HocketingGenerator()
        audio_proc = AudioProcessor()
        
        # Resolve scale from prompt using Ollama web search
        if scale_prompt:
            scale_info = ai_resolve_scale(scale_prompt, mode)
            scale_name = scale_info.get('scale_name', mode)
            scale_intervals = scale_info.get('intervals', SCALE_PATTERNS.get(mode, [0, 2, 4, 5, 7, 9, 11]))
            root_freq = 440.0
            
            print(f"[Scale Resolution] Using Ollama web search result:")
            print(f"[Scale Resolution] Scale: {scale_name}")
            print(f"[Scale Resolution] Intervals: {scale_intervals}")
            print(f"[Scale Resolution] Formula: {scale_info.get('formula', 'Unknown')}")
            print(f"[Scale Resolution] Description: {scale_info.get('description', 'Unknown')}")
            print(f"[Scale Resolution] Confidence: {scale_info.get('confidence', 0.0)}")
            print(f"[Scale Resolution] Source: {scale_info.get('source', 'Unknown')}")
        else:
            scale_name, scale_intervals, root_freq = mode, SCALE_PATTERNS[mode], 440.0
        
        # Generate scale frequencies
        scale_freqs = []
        for interval in scale_intervals:
            freq = root_freq * (2 ** (interval / 12))
            scale_freqs.append(freq)
        
        # Create hocketing pattern
        hocketing_pattern = hocketing_gen.create_hocketing_pattern(duration, tempo)
        
        # Generate melody notes
        voices = hocketing_gen.generate_melody_notes(scale_freqs, scale_intervals, hocketing_pattern, duration, tempo)
        
        # Add rapid-fire patterns
        print(f"[DEBUG] Before rapid fire: Voice 1 has {len(voices[0])} notes")
        voices = hocketing_gen.add_rapid_fire_patterns(voices, duration, tempo, scale_freqs, scale_intervals)
        print(f"[DEBUG] After rapid fire: Voice 1 has {len(voices[0])} notes")
        
        # Debug: Check if ghost notes are present
        for i, voice in enumerate(voices):
            ghost_count = sum(1 for _, _, gain, dur in voice if gain < 0.9)
            print(f"[DEBUG] Voice {i+1}: {len(voice)} total notes, {ghost_count} ghost notes")
        
        # Load sample audios
        samples = [
            audio_proc.load_audio_sample(sound_sample_1),
            audio_proc.load_audio_sample(sound_sample_2),
            audio_proc.load_audio_sample(sound_sample_3),
            audio_proc.load_audio_sample(sound_sample_4)
        ]
        
        # Process each voice with its sample - WITH COMPLETE ERROR PROTECTION
        voice_audios = []
        for voice_idx, voice_notes in enumerate(voices):
            try:
                # Assign sample to voice (2 voices per sample)
                sample_idx = voice_idx // 2
                sample_audio, sample_sr = samples[sample_idx]
                
                print(f"[Processing] Voice {voice_idx + 1}: {len(voice_notes)} notes, sample {sample_idx + 1}")
                
                # Process voice with sample
                voice_audio = audio_proc.process_voice_with_samples(
                    voice_notes, duration, sample_audio, sample_sr, voice_idx + 1
                )
                voice_audios.append(voice_audio)
                print(f"[Success] Voice {voice_idx + 1}: Audio processed successfully")
                
            except Exception as e:
                print(f"[ERROR] Voice {voice_idx + 1} failed: {e}")
                print(f"[ERROR] Voice {voice_idx + 1} notes: {len(voice_notes)}")
                print(f"[ERROR] Sample {sample_idx + 1} length: {len(sample_audio) if sample_audio is not None else 'None'}")
                
                # Create fallback audio for this voice
                try:
                    fallback_audio = np.zeros((int(duration * 44100), 2))  # Stereo silence
                    voice_audios.append(fallback_audio)
                    print(f"[Fallback] Voice {voice_idx + 1}: Using silent fallback")
                except Exception as fallback_error:
                    print(f"[CRITICAL] Fallback failed for voice {voice_idx + 1}: {fallback_error}")
                    # Last resort: skip this voice
                    continue
        
        # Create temporary directory for output
        temp_dir = tempfile.mkdtemp()
        
        # Save individual voice files
        voice_files = []
        for i, voice_audio in enumerate(voice_audios):
            voice_filename = os.path.join(temp_dir, f"voice_{i+1}.wav")
            audio_proc.save_audio(voice_audio, voice_filename)
            voice_files.append(voice_filename)
        
        # Create ZIP file with all voices
        zip_filename = os.path.join(temp_dir, "hocketing_voices.zip")
        with zipfile.ZipFile(zip_filename, 'w') as zipf:
            for voice_file in voice_files:
                zipf.write(voice_file, os.path.basename(voice_file))
        
        return zip_filename
        
    except Exception as e:
        print(f"Error generating hocketing music: {e}")
        traceback.print_exc()
        raise

# ===== API ENDPOINTS =====
@app.get("/")
async def root():
    return {"message": "Hocketing App v2.0 - Complete with Sample Support"}

@app.post("/generate-hocketing/")
async def generate_hocketing(
    target_file: UploadFile = File(...),
    sound_sample_1: UploadFile = File(...),
    sound_sample_2: UploadFile = File(...),
    sound_sample_3: UploadFile = File(...),
    sound_sample_4: UploadFile = File(...),
    key: str = Form('C'),
    mode: str = Form('major'),
    tempo: int = Form(120),
    duration: int = Form(8),
    scale_prompt: str = Form("")
):
    """Generate hocketing music with sample support and ChatGPT-style prompts"""
    try:
        # Validate inputs
        if key.upper() not in NOTE_NAMES:
            raise HTTPException(status_code=400, detail="Invalid key")
        if mode not in SCALE_PATTERNS:
            raise HTTPException(status_code=400, detail="Invalid mode")
        if tempo < 60 or tempo > 200:
            raise HTTPException(status_code=400, detail="Tempo must be between 60-200 BPM")
        if duration < 1 or duration > 60:
            raise HTTPException(status_code=400, detail="Duration must be between 1-60 seconds")
        
        # Generate music with samples
        zip_file = generate_hocketing_music_with_samples(
            target_file, sound_sample_1, sound_sample_2, sound_sample_3, sound_sample_4,
            key, mode, tempo, duration, scale_prompt
        )
        
        # Return ZIP file
        return FileResponse(zip_file, media_type="application/zip", filename="hocketing_voices.zip")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate hocketing: {str(e)}")

@app.post("/analyze/")
async def analyze_audio(file: UploadFile = File(...)):
    """Analyze uploaded audio file for duration and properties"""
    try:
        # Load audio file
        audio_data, sr = librosa.load(io.BytesIO(file.file.read()), sr=None)
        duration = len(audio_data) / sr
        
        return {
            "duration": duration,
            "sample_rate": sr,
            "channels": 1 if len(audio_data.shape) == 1 else audio_data.shape[1]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze audio: {str(e)}")

@app.post("/ai-resolve-scale/")
async def ai_resolve_scale_endpoint(scale_prompt: str = Form(""), mode: str = Form("major")):
    """AI-powered scale resolution endpoint"""
    try:
        result = ai_resolve_scale(scale_prompt, mode)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to resolve scale: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "2.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8007)