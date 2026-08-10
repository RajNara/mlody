import re
import statistics
import pandas as pd
import numpy as np
from http import HTTPStatus
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

SESSION_MODELS = {}

WEIGHT_LIKED = 1.0
WEIGHT_QUIZ_DISLIKE = 1.0
WEIGHT_SIMILARITY_NEGATIVE = 0.6

N_COMPONENTS = 15
TOP_LOADINGS_PER_COMPONENT = 10

_SUFFIX_LABELS = {
    "mean": "(average)",
    "std": "(variability)",
    "min": "(lowest point)",
    "max": "(peak)",
}

# ordered most-specific-first: raw feature name pattern -> (friendly label, theme)
_FEATURE_PATTERNS = [
    (r"^tempo$", "Tempo", "rhythm"),
    (r"^beat_interval$", "Rhythm Steadiness", "rhythm"),
    (r"^mfcc_delta_2_\d+$", "Tone Texture (Fine Detail)", "tone"),
    (r"^mfcc_delta_\d+$", "Tone Texture (Changing Over Time)", "tone"),
    (r"^mfcc_\d+$", "Tone Color", "tone"),
    (r"^spectral_centroid$", "Brightness", "tone"),
    (r"^spectral_bandwidth$", "Tonal Width", "tone"),
    (r"^spectral_rolloff$", "Treble Content", "tone"),
    (r"^spectral_flatness$", "Noisiness", "texture"),
    (r"^spectral_contrast_\d+$", "Texture Contrast", "texture"),
    (r"^chroma_\d+$", "Musical Key Emphasis", "harmony"),
    (r"^tonnetz_\d+$", "Harmonic Complexity", "harmony"),
    (r"^harmonic_ratio$", "Harmonic vs. Percussive Balance", "harmony"),
    (r"^rms$", "Loudness", "energy"),
    (r"^zcr$", "Noisiness", "texture"),
]

_THEME_INFO = {
    "rhythm": {
        "label": "Rhythm & Tempo",
        "description": "How fast and rhythmically driven a song feels. Higher means more upbeat while lower means more laid-back.",
    },
    "tone": {
        "label": "Tone & Brightness",
        "description": "How bright or mellow a song's overall sound is. Higher means sharper tones while lower means softer tones.",
    },
    "texture": {
        "label": "Texture & Noisiness",
        "description": "How smooth or raw a song's texture is. Higher means grittier sounds while lower means smoother sounds.",
    },
    "harmony": {
        "label": "Harmony & Key",
        "description": "How harmonically rich or simple a song is. Higher means more complex chords while lower means simpler harmony.",
    },
    "energy": {
        "label": "Loudness & Energy",
        "description": "How loud and intense a song feels overall. Higher means more powerful while lower means quieter.",
    },
    "other": {
        "label": "Overall Sound Profile",
        "description": "A mix of audio traits that didn't fit neatly into one category above.",
    },
}

N_VISUALIZATION_AXES = 2


def _theme_weights_for_component(component_idx, pca, feature_names):
    loadings = pca.components_[component_idx]
    weights = {}
    for i, raw in enumerate(feature_names):
        _, theme = _friendly_feature_name(raw)
        weights[theme] = weights.get(theme, 0.0) + abs(loadings[i])
    return weights


def _assign_axis_themes(pca, feature_names, n_axes):
    """Picks a distinct theme for each of the first n_axes components, so two
    dimensions never end up labeled identically (the bug that caused
    'higher on Tone & Brightness' and 'lower on Tone & Brightness' to both
    show up when PC1 and PC2 were each independently labeled)."""
    weights_per_axis = [
        _theme_weights_for_component(i, pca, feature_names) for i in range(n_axes)
    ]
    assigned, used = [], set()
    for weights in weights_per_axis:
        ranked = sorted(weights.items(), key=lambda kv: -kv[1])
        theme = next((t for t, _ in ranked if t not in used), ranked[0][0])
        assigned.append(theme)
        used.add(theme)
    return assigned


def _split_suffix(raw):
    for suffix, label in _SUFFIX_LABELS.items():
        if raw.endswith(f"_{suffix}"):
            return raw[: -(len(suffix) + 1)], label
    return raw, ""


def _friendly_feature_name(raw):
    """Maps a raw feature column to a plain-language label."""
    base, suffix_label = _split_suffix(raw)

    for pattern, label, theme in _FEATURE_PATTERNS:
        if re.match(pattern, base):
            friendly = f"{label} {suffix_label}".strip() if suffix_label else label
            return friendly, theme

    fallback = base.replace("_", " ").title()
    friendly = f"{fallback} {suffix_label}".strip() if suffix_label else fallback
    return friendly, "other"


def _add_rows(
    tracks, label, weight, feature_extractor, rows, labels, weights, track_meta
):
    """Extracts features for a batch of tracks and appends to the dataset."""
    for track in tracks:
        features = feature_extractor(track)
        if features is None:
            continue
        rows.append(features)
        labels.append(label)
        weights.append(weight)
        track_meta.append(track)


def _build_visualization(X_scaled_rated, pca, model, labels, track_meta, feature_names):
    n_axes = min(N_VISUALIZATION_AXES, pca.n_components_)
    reduced = pca.transform(X_scaled_rated)[:, :n_axes]

    training_points = [
        {
            "track_id": t.track_id,
            "track_name": t.name,
            "artist": t.artist,
            "coordinates": reduced[i].tolist(),
            "label": labels[i],
        }
        for i, t in enumerate(track_meta)
    ]

    explained_variance = pca.explained_variance_ratio_.tolist()
    cumulative_variance = np.cumsum(explained_variance).tolist()

    def top_loadings(component_idx):
        loadings = pca.components_[component_idx]
        return np.argsort(-np.abs(loadings))[:TOP_LOADINGS_PER_COMPONENT]

    def loading_entries(order):
        return [
            {
                "feature": _friendly_feature_name(feature_names[i])[0],
                "pc1_loading": float(pca.components_[0][i]),
                "pc2_loading": float(pca.components_[1][i]),
            }
            for i in order
        ]

    axis_themes = _assign_axis_themes(pca, feature_names, n_axes)
    axes = [
        {"label": _THEME_INFO[t]["label"], "description": _THEME_INFO[t]["description"]}
        for t in axis_themes
    ]

    coefficients = [
        {"component": i, "coefficient": float(c)} for i, c in enumerate(model.coef_[0])
    ]

    return {
        "training_points": training_points,
        "explained_variance": explained_variance,
        "cumulative_variance": cumulative_variance,
        "top_loadings_pc1": loading_entries(top_loadings(0)),
        "top_loadings_pc2": loading_entries(top_loadings(1)),
        "coefficients": coefficients,
        "n_components": pca.n_components_,
        "axes": axes,
    }


def train_session_model(
    session_id,
    liked_tracks,
    disliked_tracks,
    similarity_negatives,
    feature_extractor,
):
    rows, labels, weights, track_meta = [], [], [], []

    _add_rows(
        liked_tracks,
        1,
        WEIGHT_LIKED,
        feature_extractor,
        rows,
        labels,
        weights,
        track_meta,
    )
    n_liked_actual = len(rows)

    _add_rows(
        disliked_tracks,
        0,
        WEIGHT_QUIZ_DISLIKE,
        feature_extractor,
        rows,
        labels,
        weights,
        track_meta,
    )
    n_rated = len(rows)  # everything the user actually rated (liked + disliked)

    _add_rows(
        similarity_negatives,
        0,
        WEIGHT_SIMILARITY_NEGATIVE,
        feature_extractor,
        rows,
        labels,
        weights,
        track_meta,
    )
    # rows[n_rated:] are similarity-negative candidates — they help train the
    # classifier but are never shown on the taste map, since the user never
    # actually rated them

    if len(rows) < 4 or len(set(labels)) < 2:
        return HTTPStatus.NOT_FOUND, {"reason": "insufficient data"}

    X = pd.DataFrame(rows).fillna(0.0)
    feature_names = list(X.columns)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X.values)

    n_components = min(N_COMPONENTS, X_scaled.shape[0], X_scaled.shape[1])
    pca = PCA(n_components=max(n_components, 2), random_state=42)
    X_reduced = pca.fit_transform(X_scaled)

    model = LogisticRegression(max_iter=1000, class_weight="balanced")
    model.fit(X_reduced, labels, sample_weight=weights)

    viz_labels = ["liked"] * n_liked_actual + ["disliked"] * (n_rated - n_liked_actual)
    visualization = _build_visualization(
        X_scaled[:n_rated],
        pca,
        model,
        viz_labels,
        track_meta[:n_rated],
        feature_names,
    )

    SESSION_MODELS[session_id] = {
        "model": model,
        "scaler": scaler,
        "pca": pca,
        "feature_names": feature_names,
        "visualization": visualization,
    }

    metrics = {
        "n_samples": len(rows),
        "n_positive": int(sum(labels)),
        "n_negative": int(len(labels) - sum(labels)),
        "train_accuracy": float(model.score(X_reduced, labels)),
    }
    return HTTPStatus.OK, metrics


def score_tracks(session_id, tracks, feature_extractor):
    """
    Scores a list of tracks against a session's already-trained model.

    Returns list[(Track, float | None)] in the same order as `tracks`,
    or None if no trained model exists for this session yet.
    """
    session_data = SESSION_MODELS.get(session_id)
    if session_data is None:
        return None

    model = session_data["model"]
    scaler = session_data["scaler"]
    pca = session_data["pca"]
    feature_names = session_data["feature_names"]

    results = []
    for track in tracks:
        features = feature_extractor(track)
        if features is None:
            results.append((track, None))
            continue

        # align to the exact column order the scaler/pca were fit on;
        # any feature the extractor didn't produce falls back to 0
        row = [[features.get(name, 0.0) for name in feature_names]]
        X_scaled = scaler.transform(row)
        X_reduced = pca.transform(X_scaled)
        probability = float(model.predict_proba(X_reduced)[0][1])
        results.append((track, probability))

    return results
