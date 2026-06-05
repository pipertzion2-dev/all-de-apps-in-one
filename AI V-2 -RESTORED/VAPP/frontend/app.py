import streamlit as st
import requests
import zipfile
import io
import base64
import librosa
import matplotlib.pyplot as plt
import numpy as np
import os

# Function to create and display waveform
def display_waveform(audio_data, title="Waveform"):
    try:
        # Load audio from bytes
        y, sr = librosa.load(io.BytesIO(audio_data), sr=None)
        
        # Create waveform plot
        fig, ax = plt.subplots(figsize=(12, 3))
        time = np.linspace(0, len(y) / sr, len(y))
        ax.plot(time, y, color='#760301', linewidth=0.5)
        ax.set_xlabel('Time (seconds)')
        ax.set_ylabel('Amplitude')
        ax.set_title(title)
        ax.grid(True, alpha=0.3)
        ax.set_xlim(0, len(y) / sr)
        
        # Display the plot
        st.pyplot(fig)
        plt.close(fig)
    except Exception as e:
        st.error(f"Error displaying waveform: {e}")

# Read and encode the font file
try:
    with open("Zc - Regular.ttf", "rb") as font_file:
        font_data = font_file.read()
        font_base64 = base64.b64encode(font_data).decode()
except FileNotFoundError:
    font_base64 = None

# Custom CSS to load and apply the Zc - Regular.ttf font
if font_base64:
    font_css = f"""
    <style>
    @font-face {{
        font-family: 'Zc-Regular';
        src: url('data:font/truetype;charset=utf-8;base64,{font_base64}') format('truetype');
        font-weight: normal;
        font-style: normal;
    }}
    """
else:
    font_css = """
    <style>
    @font-face {
        font-family: 'Zc-Regular';
        src: url('Zc - Regular.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
    }
    </style>
    """

# Complete CSS with font application
complete_css = font_css + """
/* Apply the font to all elements */
* {
    font-family: 'Zc-Regular', 'Arial', sans-serif !important;
}

/* Specific elements that might need explicit font application */
.stApp {
    font-family: 'Zc-Regular', 'Arial', sans-serif !important;
}

.stMarkdown {
    font-family: 'Zc-Regular', 'Arial', sans-serif !important;
}

.stTextInput {
    font-family: 'Zc-Regular', 'Arial', sans-serif !important;
}

.stButton {
    font-family: 'Zc-Regular', 'Arial', sans-serif !important;
}

.stSelectbox {
    font-family: 'Zc-Regular', 'Arial', sans-serif !important;
}

.stFileUploader {
    font-family: 'Zc-Regular', 'Arial', sans-serif !important;
}

.stSpinner {
    font-family: 'Zc-Regular', 'Arial', sans-serif !important;
}

.stSuccess {
    font-family: 'Zc-Regular', 'Arial', sans-serif !important;
}

.stError {
    font-family: 'Zc-Regular', 'Arial', sans-serif !important;
}

.stAudio {
    font-family: 'Zc-Regular', 'Arial', sans-serif !important;
}

.stDownloadButton {
    font-family: 'Zc-Regular', 'Arial', sans-serif !important;
}

/* Additional Streamlit-specific selectors */
div[data-testid="stText"] {
    font-family: 'Zc-Regular', 'Arial', sans-serif !important;
}

div[data-testid="stMarkdown"] {
    font-family: 'Zc-Regular', 'Arial', sans-serif !important;
}

h1, h2, h3, h4, h5, h6 {
    font-family: 'Zc-Regular', 'Arial', sans-serif !important;
}

p, span, div {
    font-family: 'Zc-Regular', 'Arial', sans-serif !important;
}
</style>
"""

st.markdown(complete_css, unsafe_allow_html=True)

st.title("VIRTUOZO.AI")

st.write("Generate 8-voice Steve Reich-style hocketing compositions")

# API configuration for server-side requests (Streamlit runs in Python, not the browser).
# Use absolute URL if provided; otherwise default to local backend.
_api_env = os.getenv("API_URL", "").strip()
if _api_env.startswith("http://") or _api_env.startswith("https://"):
    api_url = _api_env.rstrip("/")
else:
    # In Docker Compose, set API_URL=http://backend:8007
    # Locally, default to 127.0.0.1
    api_url = os.getenv("BACKEND_HOST", "http://127.0.0.1:8007").rstrip("/")

# Improved CSS for file uploader button color and text
st.markdown("""
<style>
section[data-testid="stFileUploader"] button {
    background-color: #760301 !important;
    color: #fff !important;
    border: none !important;
    border-radius: 4px !important;
    font-weight: bold !important;
    position: relative;
    overflow: hidden;
}
section[data-testid="stFileUploader"] button:active,
section[data-testid="stFileUploader"] button:focus,
section[data-testid="stFileUploader"] button:hover {
    background-color: #760301 !important;
    color: #fff !important;
}
/* Always show 'Import' as the button text */
section[data-testid="stFileUploader"] button::after {
    content: 'Import' !important;
    position: absolute !important;
    left: 0 !important; right: 0 !important; top: 0 !important; bottom: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    color: #fff !important;
    font-weight: bold !important;
    font-family: inherit !important;
    background: transparent !important;
    pointer-events: none !important;
    z-index: 2 !important;
    font-size: 1rem !important;
}
section[data-testid="stFileUploader"] button > div,
section[data-testid="stFileUploader"] button > span,
section[data-testid="stFileUploader"] button > * {
    opacity: 0 !important;
    z-index: 1 !important;
}
</style>
""", unsafe_allow_html=True)

st.write("### Steve Reich-Style Hocketing Generation")
st.write("**Stage 1:** Import target music to detect duration and set parameters")
st.write("**Stage 2:** Import 4 sound samples in key of C for the 8-voice hocketing")

# Stage 1: Target Music Import
st.write("#### Stage 1: Import Target Music for Duration Detection")
target_music_file = st.file_uploader("Import Target Music File (for duration)", type=["wav", "mp3"], key="target_music_uploader")

target_music_analysis = None
if target_music_file:
    with st.spinner("Analyzing target music duration..."):
        files = {"file": (target_music_file.name, target_music_file, target_music_file.type)}
        response = requests.post(f"{api_url}/analyze/", files=files)
        if response.ok:
            target_music_analysis = response.json()
            
            # Display waveform for uploaded target music
            st.write("### Target Music Audio Waveform")
            target_music_file.seek(0)  # Reset file pointer
            display_waveform(target_music_file.read(), "Target Music Audio")
            
            # Show target music analysis results
            st.write("### Target Music Analysis Results")
            st.write(f"**Duration:** {target_music_analysis['duration']:.2f} seconds")
            
            # Stage 2: Sound Sample Imports
            st.write("#### Stage 2: Import 4 Sound Samples for 8-Voice Hocketing")
            st.write("Upload 4 sound samples in key of C. Each sample will be used for 2 voices in the hocketing sequence.")
            
            # Create 4 file uploaders for sound samples
            col1, col2 = st.columns(2)
            with col1:
                sound_sample_1 = st.file_uploader("Sound Sample 1 (Voices 1-2)", type=["wav", "mp3"], key="sound_sample_1")
                sound_sample_2 = st.file_uploader("Sound Sample 2 (Voices 3-4)", type=["wav", "mp3"], key="sound_sample_2")
            with col2:
                sound_sample_3 = st.file_uploader("Sound Sample 3 (Voices 5-6)", type=["wav", "mp3"], key="sound_sample_3")
                sound_sample_4 = st.file_uploader("Sound Sample 4 (Voices 7-8)", type=["wav", "mp3"], key="sound_sample_4")
            
            # Check if all samples are uploaded
            all_samples_uploaded = all([sound_sample_1, sound_sample_2, sound_sample_3, sound_sample_4])
            
            if all_samples_uploaded:
                # Display waveforms for uploaded samples
                st.write("### Sound Sample Audio Waveforms")
                sample_files = [sound_sample_1, sound_sample_2, sound_sample_3, sound_sample_4]
                sample_names = ["Sample 1 (Voices 1-2)", "Sample 2 (Voices 3-4)", "Sample 3 (Voices 5-6)", "Sample 4 (Voices 7-8)"]
                
                for i, (sample_file, name) in enumerate(zip(sample_files, sample_names)):
                    sample_file.seek(0)
                    display_waveform(sample_file.read(), name)
                
                # Manual input for hocketing generation
                st.write("### Generation Parameters")
                col1, col2 = st.columns(2)
                with col1:
                    key = st.selectbox("Key", ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C♭", "D♭", "E♭", "F♭", "G♭", "A♭", "B♭"], index=0, key="key")
                    mode = st.selectbox("Mode", ["major", "minor"], index=0, key="mode")
                with col2:
                    tempo = st.number_input("Tempo (BPM)", min_value=60, max_value=200, value=120, step=1, key="tempo")
                    duration = st.number_input("Duration (seconds)", min_value=1, max_value=60, value=int(target_music_analysis['duration']), step=1, key="duration")

                # Single chat-style scale prompt (with web/AI lookup on backend)
                st.write("### Scale Prompt (ChatGPT-style)")
                scale_prompt = st.text_input(
                    "Describe the scale (name, steps, or notes). Example: 'Hungarian minor', 'C D Eb F G Ab B', or '2-1-2-2-1-2-2'",
                    value="",
                    key="scale_prompt",
                    placeholder="Type any scale name or pattern...",
                )
                st.caption("This uses AI with free web lookup to resolve scales outside the built-in database.")

                # Auto-indicate resolved scale (no button). Cached to reduce re-calls while typing.
                @st.cache_data(show_spinner=False, ttl=10)
                def _auto_resolve_scale(api_url: str, prompt: str, mode: str):
                    try:
                        if not prompt or not prompt.strip():
                            return None
                        resp = requests.post(f"{api_url}/ai-resolve-scale/", data={"scale_prompt": prompt, "mode": mode}, timeout=15)
                        if resp.ok:
                            return resp.json()
                        return None
                    except Exception:
                        return None

                if scale_prompt and scale_prompt.strip():
                    info = _auto_resolve_scale(api_url, scale_prompt, mode)
                    if info:
                        # Display enhanced scale information from Ollama
                        st.success(f"🎵 **Scale Detected: {info.get('scale_name', 'Unknown')}**")
                        
                        col1, col2 = st.columns(2)
                        with col1:
                            st.write(f"**Intervals:** {info.get('intervals', [])}")
                            st.write(f"**Formula:** {info.get('formula', 'Unknown')}")
                            st.write(f"**Confidence:** {info.get('confidence', 0.0):.2f}")
                        
                        with col2:
                            st.write(f"**Description:** {info.get('description', 'Unknown')}")
                            st.write(f"**Examples:** {info.get('examples', 'Unknown')}")
                            st.write(f"**Source:** {info.get('source', 'Unknown')}")
                        
                        # Show confidence indicator
                        confidence = info.get('confidence', 0.0)
                        if confidence >= 0.8:
                            st.info("✅ High confidence scale detection")
                        elif confidence >= 0.6:
                            st.warning("⚠️ Medium confidence scale detection")
                        else:
                            st.error("❌ Low confidence scale detection")
                    else:
                        st.info("🔍 Type a scale description to search the web for musical scales...")

                st.write("**Note:** This will generate 8 voices with Steve Reich-style hocketing patterns using your 4 sound samples. Each sample creates 2 voices with Caroline Shaw-style stereo panning.")
                
                # Display dynamic stereo panning information
                st.write("### 🎧 Dynamic Stereo Panning (Caroline Shaw-inspired)")
                st.write("**Voices move through the stereo field throughout the piece:**")
                
                pan_info = {
                    "Voices 1, 3, 5, 7": "🔄 **Left → Right Movement** - Start left, end right",
                    "Voices 2, 4, 6, 8": "🔄 **Right → Left Movement** - Start right, end left"
                }
                
                for voice_group, description in pan_info.items():
                    st.write(f"**{voice_group}:** {description}")
                
                st.write("### 🎯 Movement Patterns:")
                movement_patterns = {
                    "Voices 1-2": "🔄 **Circular Movement** - Smooth circular panning",
                    "Voices 3-4": "🔄 **Figure-8 Movement** - Complex figure-8 pattern", 
                    "Voices 5-6": "🔄 **Zigzag Movement** - Sharp left-right zigzags",
                    "Voices 7-8": "🔄 **Spiral Movement** - Spiral through stereo field"
                }
                
                col1, col2 = st.columns(2)
                with col1:
                    for i in range(1, 3):
                        st.write(f"**{list(movement_patterns.keys())[i-1]}:** {list(movement_patterns.values())[i-1]}")
                with col2:
                    for i in range(3, 5):
                        st.write(f"**{list(movement_patterns.keys())[i-1]}:** {list(movement_patterns.values())[i-1]}")
                
                st.info("🎵 **Dynamic Stereo Features:** Voices continuously move from left to right and right to left throughout the piece, creating an immersive 3D spatial experience like Caroline Shaw's moving spatial effects!")

                if st.button("Generate Hocketing Melodies", key="generate_hocketing"):
                    with st.spinner("Generating 8-voice hocketing melodies..."):
                        # Prepare all files for upload
                        target_music_file.seek(0)
                        for sample_file in sample_files:
                            sample_file.seek(0)
                        
                        files = {
                            "target_file": (target_music_file.name, target_music_file, target_music_file.type),
                            "sound_sample_1": (sound_sample_1.name, sound_sample_1, sound_sample_1.type),
                            "sound_sample_2": (sound_sample_2.name, sound_sample_2, sound_sample_2.type),
                            "sound_sample_3": (sound_sample_3.name, sound_sample_3, sound_sample_3.type),
                            "sound_sample_4": (sound_sample_4.name, sound_sample_4, sound_sample_4.type),
                        }
                        
                        data = {
                            "key": key,
                            "mode": mode,
                            "tempo": tempo,
                            "duration": duration,
                            "scale_prompt": scale_prompt,
                        }
                        
                        response = requests.post(f"{api_url}/generate-hocketing/", data=data, files=files)
                        if response.ok:
                            st.success("8-voice hocketing melodies generated!")
                            # Read ZIP and extract WAVs
                            zip_bytes = io.BytesIO(response.content)
                            with zipfile.ZipFile(zip_bytes, 'r') as zipf:
                                wav_files = [name for name in zipf.namelist() if name.endswith('.wav')]
                                for i, wav_name in enumerate(sorted(wav_files), 1):
                                    wav_data = zipf.read(wav_name)
                                    
                                    # Display melody title
                                    st.write(f"### Voice {i}")
                                    
                                    # Display waveform
                                    display_waveform(wav_data, f"Voice {i} (Stereo)")
                                    
                                    # Display audio player
                                    st.audio(wav_data, format="audio/wav")
                                    
                                    # Download button
                                    st.download_button(f"Download {wav_name}", wav_data, file_name=wav_name)
                                    
                                    # Add spacing between melodies
                                    st.write("---")
                            
                            # Add download button for the entire ZIP
                            zip_bytes.seek(0)
                            st.download_button("Download All 8 Voices (ZIP)", zip_bytes.getvalue(), file_name="hocketing_8_voices.zip")
                        else:
                            st.error(f"Hocketing generation failed: {response.text}")
            else:
                st.info("Please upload all 4 sound samples to proceed with hocketing generation.")
        else:
            st.error(f"Target music analysis failed: {response.text}") 