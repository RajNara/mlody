import os

import librosa
import numpy as np


def extract_features(self, file_path, duration=30):
    """
    Extracts audio features from a track for use in the taste classifier.

    Computes rhythm, timbre, spectral shape, harmonic content,
    and energy statistics.

    Produces 250+ features from the duration of audio provided.

    Args:
        file_path (str): Path to the audio file to analyze.
        duration (int): Max seconds of audio to load/analyze.

    Returns:
        dict | None: Flat dict of scalar features, or None on failure.
    """
    try:
        # librosa.load decodes the audio, resamples to 22050 Hz and mixes down to mono
        raw_waveform, sample_rate = librosa.load(file_path, duration=duration)

        features = {}

        # onset_strength gives a graph of energy spikes over time
        # tempo estimates BPM and beat times
        onset = librosa.onset.onset_strength(y=raw_waveform, sr=sample_rate)
        tempo = librosa.feature.tempo(onset_envelope=onset, sr=sample_rate)[0]
        features["tempo"] = float(tempo)

        beat_frames = librosa.beat.beat_track(onset_envelope=onset, sr=sample_rate)[1]

        if len(beat_frames) > 1:
            # spacing between beats tells us how steady/regular the rhythm is
            beat_times = librosa.frames_to_time(beat_frames, sr=sample_rate)
            beat_intervals = np.diff(beat_times)
            features.update(self.summarize_data(beat_intervals, "beat_interval"))
        else:
            # fallback if not enough beats detected
            features.update(
                {
                    "beat_interval_mean": 0.0,
                    "beat_interval_std": 0.0,
                    "beat_interval_min": 0.0,
                    "beat_interval_max": 0.0,
                }
            )

        # MFCCs describe the shape of the sound spectrum
        # delta and delta-2 captures how that shape changes over time
        mfcc = librosa.feature.mfcc(y=raw_waveform, sr=sample_rate, n_mfcc=13)
        mfcc_delta = librosa.feature.delta(mfcc)
        mfcc_delta_2 = librosa.feature.delta(mfcc, order=2)

        for i in range(mfcc.shape[0]):
            features.update(self.summarize_data(mfcc[i], f"mfcc_{i+1}"))
            features.update(self.summarize_data(mfcc_delta[i], f"mfcc_delta_{i+1}"))
            features.update(self.summarize_data(mfcc_delta_2[i], f"mfcc_delta_2_{i+1}"))

        # spectral shape
        spectral_centroid = librosa.feature.spectral_centroid(
            y=raw_waveform, sr=sample_rate
        )[0]
        spectral_bandwidth = librosa.feature.spectral_bandwidth(
            y=raw_waveform, sr=sample_rate
        )[0]
        spectral_rolloff = librosa.feature.spectral_rolloff(
            y=raw_waveform, sr=sample_rate
        )
        spectral_contrast = librosa.feature.spectral_contrast(
            y=raw_waveform, sr=sample_rate
        )
        # flatness is how percussive the sound is
        spectral_flatness = librosa.feature.spectral_flatness(y=raw_waveform)[0]

        features.update(self.summarize_data(spectral_centroid, "spectral_centroid"))
        features.update(self.summarize_data(spectral_bandwidth, "spectral_bandwidth"))
        features.update(self.summarize_data(spectral_rolloff, "spectral_rolloff"))
        features.update(self.summarize_data(spectral_flatness, "spectral_flatness"))

        for i in range(spectral_contrast.shape[0]):
            features.update(
                self.summarize_data(spectral_contrast[i], f"spectral_contrast_{i+1}")
            )

        # harmonics and pitch
        chroma = librosa.feature.chroma_stft(y=raw_waveform, sr=sample_rate)
        for i in range(chroma.shape[0]):
            features.update(self.summarize_data(chroma[i], f"chroma_{i+1}"))

        # tonnetz captures harmonic relationships
        harmonic, percussive = librosa.effects.hpss(raw_waveform)
        tonnetz = librosa.feature.tonnetz(y=harmonic, sr=sample_rate)
        for i in range(tonnetz.shape[0]):
            features.update(self.summarize_data(tonnetz[i], f"tonnetz_{i+1}"))

        # ratio of harmonic to percussive energy
        harmonic_energy = float(np.sum(harmonic**2))
        percussive_energy = float(np.sum(percussive**2))
        total_energy = harmonic_energy + percussive_energy
        features["harmonic_ratio"] = (
            harmonic_energy / total_energy if total_energy > 0 else 0.0
        )

        # energy and dynamics
        root_mean_square_value = librosa.feature.rms(y=raw_waveform)[0]
        zero_crossing_rate = librosa.feature.zero_crossing_rate(y=raw_waveform)[0]

        features.update(self.summarize_data(root_mean_square_value, "rms"))
        features.update(self.summarize_data(zero_crossing_rate, "zcr"))

        return features
    except Exception as e:
        print(f"Error extracting features from {file_path}: {e}")
        return None
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)
