import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    datasetRequirements: {
      minItems: 50,
      recommendedItems: 500,
      maxDurationPerItem: 30,
      supportedFormats: ["wav", "mp3", "flac", "ogg", "aiff"],
      requiredMetadata: ["fileName", "durationSec", "bpm", "key", "genre"],
    },
    trainingTips: [
      "Use consistent audio quality across all dataset items (same sample rate and bit depth).",
      "Label BPM, key, and genre accurately to improve model conditioning.",
      "Include at least 50 items, but 500+ is recommended for best results.",
      "Keep individual clips under 30 seconds for efficient training.",
      "Balance your dataset across genres and moods to avoid bias.",
      "Remove silence, noise, and artifacts from audio before uploading.",
      "Use a learning rate between 0.00001 and 0.001 depending on model size.",
      "Start with fewer epochs (50-100) and increase if the model underfits.",
      "Monitor loss curves for signs of overfitting or divergence.",
      "Save checkpoints frequently so you can roll back to earlier states.",
    ],
    modelTypes: [
      {
        id: "diffusion",
        name: "Diffusion Model",
        description: "Generates audio by iteratively denoising a random signal. Best for high-fidelity, diverse outputs.",
      },
      {
        id: "gan",
        name: "Generative Adversarial Network",
        description: "Uses a generator and discriminator pair to produce realistic audio. Fast inference but can be harder to train.",
      },
      {
        id: "vae",
        name: "Variational Autoencoder",
        description: "Learns a compressed latent space of audio. Good for interpolation and style transfer between sounds.",
      },
      {
        id: "transformer",
        name: "Transformer",
        description: "Sequence-based model that excels at capturing long-range dependencies in audio. Great for structured compositions.",
      },
    ],
    qualityChecklist: [
      "All audio files are in a supported format (WAV, MP3, FLAC, OGG, or AIFF).",
      "Each item has accurate BPM and key metadata.",
      "Dataset contains at least 50 labeled items.",
      "Audio is free of clipping, excessive noise, and silence padding.",
      "Genre and mood tags are consistent across similar items.",
      "Sample rates are uniform across the dataset (44.1 kHz or 48 kHz recommended).",
      "No duplicate or near-duplicate files in the dataset.",
      "Items are between 5 and 30 seconds in duration.",
    ],
  });
}
