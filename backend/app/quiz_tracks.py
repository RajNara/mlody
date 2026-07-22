from app.deezer_utils import get_track_by_id, search_tracks

QUIZ_SEED = [
    {
        "name": "Levitating",
        "artist": "Dua Lipa (feat. DaBaby)",
        "deezer_id": 1124841752,
    },
    {
        "name": "The Less I Know the Better",
        "artist": "Tame Impala",
        "deezer_id": 103052662,
    },
    {"name": "HUMBLE.", "artist": "Kendrick Lamar", "deezer_id": 350171311},
    {"name": "Pretty Girl", "artist": "Clairo", "deezer_id": 3422603071},
    {
        "name": "Get Lucky",
        "artist": "Daft Punk (feat. Pharrell Williams)",
        "deezer_id": 67238735,
    },
    {"name": "Motion Sickness", "artist": "Phoebe Bridgers", "deezer_id": 397301582},
    {"name": "Do I Wanna Know?", "artist": "Arctic Monkeys", "deezer_id": 70322130},
    {"name": "Awake", "artist": "Tycho", "deezer_id": 71452919},
    {"name": "I'm Not Alone", "artist": "Calvin Harris", "deezer_id": 69304060},
    {"name": "bad guy", "artist": "Billie Eilish", "deezer_id": 655095912},
]


def get_quiz_tracks():
    """Resolve every seed entry to a live Track, falling back to search if the ID lookup fails."""
    tracks = []
    for seed in QUIZ_SEED:
        track = get_track_by_id(seed["deezer_id"])
        if track is None:
            results = search_tracks(seed["name"], artist=seed["artist"], limit=1)
            track = results[0] if results else None
        if track:
            tracks.append(track)
    return tracks
