import pandas as pd
from http import HTTPStatus
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

# In-memory model store, keyed by session_id
# TODO: possibly replace with user login
SESSION_MODELS = {}

WEIGHT_LIKED = 1.0
WEIGHT_QUIZ_DISLIKE = 1.0
WEIGHT_SIMILARITY_NEGATIVE = 0.6


def _add_rows(tracks, label, weight, feature_extractor, rows, labels, weights):
    """Extracts features for a batch of tracks and appends to the dataset."""
    for track in tracks:
        features = feature_extractor(track)
        # if feature extraction failed, skip
        if features is None:
            continue
        rows.append(features)
        labels.append(label)
        weights.append(weight)


def train_session_model(
    session_id,
    liked_tracks,
    disliked_tracks,
    similarity_negatives,
    feature_extractor,
):
    """
    Builds the weighted training set from all 4 buckets, fits a logistic
    regression classifier, and stores in memory under session_id.
    """
    rows, labels, weights = [], [], []

    _add_rows(liked_tracks, 1, WEIGHT_LIKED, feature_extractor, rows, labels, weights)
    _add_rows(
        disliked_tracks,
        0,
        WEIGHT_QUIZ_DISLIKE,
        feature_extractor,
        rows,
        labels,
        weights,
    )
    _add_rows(
        similarity_negatives,
        0,
        WEIGHT_SIMILARITY_NEGATIVE,
        feature_extractor,
        rows,
        labels,
        weights,
    )

    # low amount of data means return
    if len(rows) < 4 or len(set(labels)) < 2:
        return HTTPStatus.NOT_FOUND, {"reason": "insufficient data"}

    # preprocessing by fillna to avoid null values
    X = pd.DataFrame(rows).fillna(0.0)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X.values)

    # class_weight="balanced" handles class imbalance
    model = LogisticRegression(max_iter=1000, class_weight="balanced")
    model.fit(X_scaled, labels, sample_weight=weights)

    SESSION_MODELS[session_id] = {
        "model": model,
        "scaler": scaler,
        "feature_names": list(X.columns),
    }

    metrics = {
        "n_samples": len(rows),
        "n_positive": int(sum(labels)),
        "n_negative": int(len(labels) - sum(labels)),
        "train_accuracy": float(model.score(X_scaled, labels)),
    }
    return HTTPStatus.OK, metrics
