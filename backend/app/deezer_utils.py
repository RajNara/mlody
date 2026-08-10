import os
import random
import requests
import tempfile
from app.extract_features import extract_features
from models.schema import Track

DEEZER_SEARCH_URL = "https://api.deezer.com/search"
DEEZER_GENRE_URL = "https://api.deezer.com/genre"
DEEZER_CHART_URL = "https://api.deezer.com/chart/{genre_id}/tracks"
DEEZER_ALBUM_SEARCH_URL = "https://api.deezer.com/search/album"
DEEZER_ALBUM_URL = "https://api.deezer.com/album/{album_id}"


def search_albums(query, limit=8):
    """
    Searches Deezer for albums matching a free-text query.
    """
    params = {"q": query, "limit": limit}
    try:
        response = requests.get(DEEZER_ALBUM_SEARCH_URL, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()

        albums = []
        for item in data.get("data", []):
            albums.append(
                {
                    "album_id": str(item.get("id")),
                    "title": item.get("title", ""),
                    "artist": (item.get("artist") or {}).get("name", ""),
                    "cover_url": item.get("cover_medium"),
                }
            )
        return albums

    except Exception as e:
        print(f"Error searching Deezer albums: {e}")
        return []


def get_album(album_id):
    """
    Fetches an album's metadata plus its full tracklist in one call.

    Returns (album_dict, list[Track]) or (None, []) on failure.
    """
    url = DEEZER_ALBUM_URL.format(album_id=album_id)
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        if not data or data.get("error"):
            return None, []

        album = {
            "album_id": str(data.get("id")),
            "title": data.get("title", ""),
            "artist": (data.get("artist") or {}).get("name", ""),
            "cover_url": data.get("cover_medium"),
        }

        raw_tracks = (data.get("tracks") or {}).get("data", [])
        tracks = []
        for item in raw_tracks:
            tracks.append(
                Track(
                    track_id=str(item.get("id")),
                    name=item.get("title", ""),
                    # per-track album tracklist entries don't always carry cover art,
                    # so fall back to the album's cover
                    artist=(item.get("artist") or {}).get("name") or album["artist"],
                    artwork_url=album["cover_url"],
                    preview_url=item.get("preview"),
                )
            )
        return album, tracks

    except Exception as e:
        print(f"Error fetching Deezer album {album_id}: {e}")
        return None, []


def get_available_genres():
    """
    Fetches Deezer's genre list.

    Returns a list of dicts.
    """
    try:
        response = requests.get(DEEZER_GENRE_URL, timeout=5)
        response.raise_for_status()
        data = response.json()

        # skip genre id=0 since 0 is "All genres"
        genres = [
            {"id": g.get("id"), "name": g.get("name")}
            for g in data.get("data", [])
            if g.get("id") != 0
        ]
        return genres

    except Exception as e:
        print(f"Error fetching Deezer genres: {e}")
        return []


def get_genre_chart_tracks(genre_id, limit=10):
    """
    Fetches Deezer's actual top tracks for a given genre ID.
    """
    url = DEEZER_CHART_URL.format(genre_id=genre_id)
    params = {"limit": limit}

    try:
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()

        raw_tracks = data.get("data", [])

        clean_tracks = []
        for item in raw_tracks:
            track = Track(
                track_id=str(item.get("id")),
                name=item.get("title", ""),
                artist=item.get("artist", {}).get("name", ""),
                artwork_url=item.get("album", {}).get("cover_medium"),
                preview_url=item.get("preview"),
            )
            clean_tracks.append(track)

        return clean_tracks

    except Exception as e:
        print(f"Error fetching chart tracks for genre {genre_id}: {e}")
        return []


def get_candidate_pool(num_genres=6, tracks_per_genre=8, exclude_track_ids=None):
    """
    Builds a candidate pool by sampling top tracks across Deezer's genres.

    Args:
        num_genres (int): how many distinct genres to pull from
        tracks_per_genre (int): tracks to pull per genre
        exclude_track_ids (set | None): track IDs to skip

    Returns:
        list[dict]: candidate track dicts
    """
    if exclude_track_ids is None:
        exclude_track_ids = set()

    all_genres = get_available_genres()
    if not all_genres:
        return []

    # Randomly pick a subset of genres
    random.shuffle(all_genres)
    selected_genres = all_genres[:num_genres]

    candidate_pool = []
    seen_ids = set()

    for genre in selected_genres:
        tracks = get_genre_chart_tracks(genre["id"], limit=tracks_per_genre)

        for track in tracks:
            # Skip duplicates and skip anything the user already explicitly liked/disliked
            if track.track_id in seen_ids or track.track_id in exclude_track_ids:
                continue
            seen_ids.add(track.track_id)
            candidate_pool.append(track)

    return candidate_pool


def build_search_query(name, artist=None):
    """
    Builds the query string sent to Deezer's search endpoint.

    If an artist is provided, uses Deezer's field-scoped search syntax
    to help their own relevance ranking surface the right track.
    Falls back to flat text if no artist is given.
    """
    if artist:
        return f'track:"{name}" artist:"{artist}"'
    return name


def get_score(song, query_tokens, artist_tokens):
    """
    Scores a single Deezer result against the original search query.

    Splits scoring into title overlap and artist overlap, then weights
    artist overlap more heavily than title overlap.
    """
    # compare word for word against the original search query
    title_tokens = set(song.name.lower().split())
    title_score = len(query_tokens.intersection(title_tokens))

    artist_score = 0
    if artist_tokens:
        song_artist_tokens = set(song.artist.lower().split())
        artist_score = len(artist_tokens.intersection(song_artist_tokens))

    # getting the right artist matters more than getting an exact title match
    return (artist_score * 2) + title_score


def search_tracks(name, artist=None, limit=3):
    """
    Searches Deezer for a track and returns the top (3)
    results ranked by get_score().

    Falls back to a flat-text retry if the query returns nothing.
    """
    query = build_search_query(name, artist)
    params = {"q": query, "limit": 10}

    try:
        response = requests.get(DEEZER_SEARCH_URL, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        raw_results = data.get("data", [])

        # Retry with flat text if structured query came back empty
        if not raw_results and artist:
            params["q"] = f"{name} {artist}"
            response = requests.get(DEEZER_SEARCH_URL, params=params, timeout=5)
            response.raise_for_status()
            data = response.json()
            raw_results = data.get("data", [])

        clean_results = []
        for item in raw_results:
            track = Track(
                track_id=str(item.get("id")),
                name=item.get("title", ""),
                artist=item.get("artist", {}).get("name", ""),
                artwork_url=item.get("album", {}).get("cover_medium"),
                preview_url=item.get("preview"),
            )
            clean_results.append(track)

        query_tokens = set(name.lower().split())
        artist_tokens = set(artist.lower().split()) if artist else set()

        # Re-rank Deezer's ordering using our own artist-weighted score
        clean_results.sort(
            key=lambda song: get_score(song, query_tokens, artist_tokens),
            reverse=True,
        )
        return clean_results[:limit]

    except Exception as e:
        print(f"Error during Deezer search: {e}")
        return []


def get_track_by_id(track_id):
    """
    Fetches one track directly by Deezer ID.
    """
    try:
        response = requests.get(f"https://api.deezer.com/track/{track_id}", timeout=5)
        response.raise_for_status()
        data = response.json()
        if not data or data.get("error"):
            return None
        return Track(
            track_id=str(data.get("id")),
            name=data.get("title", ""),
            artist=(data.get("artist") or {}).get("name", ""),
            artwork_url=(data.get("album") or {}).get("cover_medium"),
            preview_url=data.get("preview"),
        )
    except Exception as e:
        print(f"Error fetching Deezer track {track_id}: {e}")
        return None


def process_track_preview(track, duration=30):
    """
    Downloads a track's preview, coordinates feature extraction,
    and ensures the file is deleted after.
    """
    if not track.preview_url:
        print(f"No preview URL available for track {track.track_id}")
        return None

    tmp_path = None
    try:
        response = requests.get(track.preview_url, timeout=10)
        response.raise_for_status()

        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
            tmp.write(response.content)
            tmp_path = tmp.name
        features = extract_features(tmp_path, duration=duration)
        if features is not None:
            features["track_id"] = track.track_id

        return features
    except Exception as e:
        print(f"Feature extraction failed for track {track.track_id}: {e}")
        return None
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


if __name__ == "__main__":
    results = search_tracks("HUMBLE.", artist="Kendrick Lamar", limit=3)
    for r in results:
        print(r.name, "-", r.artist)

    print("\n--- get available genres ---")
    genres = get_available_genres()
    print(genres)

    print("\n--- candidate pool ---")
    pool = get_candidate_pool(num_genres=4, tracks_per_genre=5)
    for t in pool:
        print(t.name, "-", t.artist)

    print("\n--- testing feature extraction ---")
    if results:
        song = results[0]
        print(f"Downloading and extracting features for: {song.name}...")
        features = process_track_preview(song)
        if features:
            print(f"Success! Extracted {len(features)} features.")
            print(f"Calculated Tempo: {features.get('tempo'):.2f} BPM")
        else:
            print("Feature extraction failed.")
