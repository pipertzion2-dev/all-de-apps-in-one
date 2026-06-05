#!/usr/bin/env python3
"""
Test script for the hocketing system
"""

import requests
import os
import tempfile
import numpy as np
import soundfile as sf

def create_test_audio(duration=2.0, sample_rate=44100, frequency=440.0):
    """Create a simple test audio file"""
    t = np.linspace(0, duration, int(duration * sample_rate), False)
    audio = 0.3 * np.sin(2 * np.pi * frequency * t)
    
    # Create stereo audio
    stereo_audio = np.column_stack((audio, audio))
    
    # Save to temporary file
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
        sf.write(f.name, stereo_audio, sample_rate, format='WAV')
        return f.name

def test_hocketing_system():
    """Test the hocketing system"""
    print("Testing hocketing system...")
    
    # Create test audio files
    print("Creating test audio files...")
    target_file = create_test_audio(duration=2.0, frequency=440.0)
    sample_files = []
    
    # Create 4 sample files in key of C (261.63 Hz)
    for i in range(4):
        sample_file = create_test_audio(duration=1.0, frequency=261.63)
        sample_files.append(sample_file)
    
    try:
        # Test the hocketing endpoint
        print("Testing hocketing endpoint...")
        
        with open(target_file, 'rb') as f:
            target_data = f.read()
        
        sample_data = []
        for sample_file in sample_files:
            with open(sample_file, 'rb') as f:
                sample_data.append(f.read())
        
        files = {
            'target_file': ('target.wav', target_data, 'audio/wav'),
            'sound_sample_1': ('sample1.wav', sample_data[0], 'audio/wav'),
            'sound_sample_2': ('sample2.wav', sample_data[1], 'audio/wav'),
            'sound_sample_3': ('sample3.wav', sample_data[2], 'audio/wav'),
            'sound_sample_4': ('sample4.wav', sample_data[3], 'audio/wav'),
        }
        
        data = {
            'key': 'C',
            'mode': 'major',
            'tempo': 120,
            'duration': 2,
            'scale_prompt': 'major scale'
        }
        
        response = requests.post(
            'http://localhost:8007/generate-hocketing/',
            files=files,
            data=data,
            timeout=30
        )
        
        if response.status_code == 200:
            print("✅ Hocketing system test PASSED!")
            print(f"Response size: {len(response.content)} bytes")
            
            # Save the response to a file for inspection
            with open('test_hocketing_output.zip', 'wb') as f:
                f.write(response.content)
            print("Output saved to test_hocketing_output.zip")
            
        else:
            print(f"❌ Hocketing system test FAILED!")
            print(f"Status code: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
    
    finally:
        # Clean up test files
        print("Cleaning up test files...")
        os.unlink(target_file)
        for sample_file in sample_files:
            os.unlink(sample_file)

if __name__ == "__main__":
    test_hocketing_system()
