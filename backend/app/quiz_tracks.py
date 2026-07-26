from app.deezer_utils import get_track_by_id, search_tracks

QUIZ_SEED = [
    {
        "name": "SICKO MODE",
        "artist": "Travis Scott (feat. Drake)",
        "deezer_id": 536752452,
    },
    {
        "name": "Blinding Lights",
        "artist": "The Weeknd",
        "deezer_id": 908604612,
    },
    {
        "name": "Seven Nation Army",
        "artist": "The White Stripes",
        "deezer_id": 1153182282,
    },
    {
        "name": "Strobe",
        "artist": "deadmau5",
        "deezer_id": 639320501,
    },
    {
        "name": "Ain't No Sunshine",
        "artist": "Bill Withers",
        "deezer_id": 69877885,
    },
    {
        "name": "Jolene",
        "artist": "Dolly Parton",
        "deezer_id": 1015887,
    },
    {
        "name": "Take Five",
        "artist": "The Dave Brubeck Quartet",
        "deezer_id": 1031007,
    },
    {
        "name": "Clair de Lune",
        "artist": "Claude Debussy",
        "deezer_id": 4540396,
    },
    {
        "name": "Enter Sandman",
        "artist": "Metallica",
        "deezer_id": 136408134,
    },
    {
        "name": "Three Little Birds",
        "artist": "Bob Marley & The Wailers",
        "deezer_id": 530300641,
    },
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
