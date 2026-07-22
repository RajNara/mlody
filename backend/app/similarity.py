import numpy as np
from scipy.spatial.distance import cdist


def rank_similar_to_dislikes(
    disliked_feature_vectors, candidate_pool_feature_vectors, candidate_tracks, top_k=10
):
    """
    Given feature vectors for disliked tracks and a candidate pool,
    return the top_k candidates whose audio features are closest to any disliked track.
    These become medium-confidence negatives.
    """
    if not disliked_feature_vectors or not candidate_pool_feature_vectors:
        return []

    disliked_matrix = np.array(disliked_feature_vectors)
    candidate_matrix = np.array(candidate_pool_feature_vectors)

    # pairwise euclidean distance
    distances = cdist(disliked_matrix, candidate_matrix, metric="euclidean")

    # each candidate's score is the distance to its closest dislike
    min_dist_per_candidate = distances.min(axis=0)

    # smallest distance first is most similar to a disliked song
    ranked_indices = np.argsort(min_dist_per_candidate)[:top_k]

    return [candidate_tracks[i] for i in ranked_indices]
