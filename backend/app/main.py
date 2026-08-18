import os
from threading import Lock

from fastapi import BackgroundTasks, FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
from http import HTTPStatus
from models.schema import (
    SearchRequest,
    SearchResponse,
    QuizResponse,
    TrainRequest,
    TrainResponse,
    TrainStartResponse,
    TrainProgressResponse,
    ScoreRequest,
    ScoreResponse,
    SelectionRequest,
    SelectionResponse,
    ModelVisualization,
    Album,
    AlbumSearchResponse,
    RankedTrack,
    AlbumRankResponse,
)
from app.train_model import train_session_model, score_tracks
from app.similarity import rank_dislikes
from app.deezer_utils import (
    search_tracks,
    get_candidate_pool,
    process_track_preview,
    search_albums,
    get_album,
)
from app.quiz_tracks import get_quiz_tracks
from app.train_model import SESSION_MODELS

app = FastAPI(title="MLody API")
origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
SESSION_TRACKS = {}

TRAIN_PROGRESS: dict[str, dict] = {}
_progress_lock = Lock()


def _set_progress(session_id, done, total, status="in_progress", metrics=None):
    with _progress_lock:
        TRAIN_PROGRESS[session_id] = {
            "done": done,
            "total": total,
            "status": status,
            "metrics": metrics,
        }


@app.get("/health")
def health():
    return {"status": "health function"}


@app.post("/search", response_model=SearchResponse)
def search(request: SearchRequest):
    song_name = request.query.strip()
    artist_name = (request.artist or "").strip() or None

    if song_name and artist_name:
        results = search_tracks(song_name, artist=artist_name, limit=request.limit)
    elif song_name and not artist_name:
        results = search_tracks(song_name, limit=request.limit)
    else:
        results = []

    return SearchResponse(results=results)


@app.get("/quiz", response_model=QuizResponse)
def quiz():
    return QuizResponse(tracks=get_quiz_tracks())


@app.post("/select", response_model=SelectionResponse, status_code=HTTPStatus.CREATED)
def select(request: SelectionRequest):
    session = SESSION_TRACKS.setdefault(
        request.session_id, {"liked": [], "disliked": []}
    )
    bucket = "liked" if request.liked else "disliked"
    session[bucket].append(request.track)
    return SelectionResponse(status=HTTPStatus.CREATED)


def _run_training(session_id: str):
    """
    Runs the full training pipeline in the background and
    reports progress as each track's audio features are extracted.
    """
    session_data = SESSION_TRACKS.get(session_id, {})
    liked_tracks = session_data.get("liked", [])
    disliked_tracks = session_data.get("disliked", [])

    exclude_ids = {t.track_id for t in liked_tracks} | {
        t.track_id for t in disliked_tracks
    }
    candidate_pool_tracks = get_candidate_pool(
        num_genres=3, tracks_per_genre=5, exclude_track_ids=exclude_ids
    )

    total = len(liked_tracks) + len(disliked_tracks) + len(candidate_pool_tracks)
    _set_progress(session_id, 0, total, status="in_progress")

    feature_cache: dict[str, dict | None] = {}
    done = {"count": 0}

    def feature_extractor(track):
        if track.track_id in feature_cache:
            return feature_cache[track.track_id]

        feats = process_track_preview(track)
        if feats is not None:
            feats.pop("track_id", None)
        feature_cache[track.track_id] = feats

        done["count"] += 1
        _set_progress(session_id, done["count"], total, status="in_progress")
        return feats

    def to_vector(features):
        return list(features.values())

    disliked_vectors = []
    for t in disliked_tracks:
        feats = feature_extractor(t)
        if feats:
            disliked_vectors.append(to_vector(feats))

    candidate_vectors = []
    valid_candidates = []
    for t in candidate_pool_tracks:
        feats = feature_extractor(t)
        if feats:
            candidate_vectors.append(to_vector(feats))
            valid_candidates.append(t)

    similarity_negatives = rank_dislikes(
        disliked_vectors, candidate_vectors, valid_candidates, top_k=10
    )

    try:
        status, metrics = train_session_model(
            session_id=session_id,
            liked_tracks=liked_tracks,
            disliked_tracks=disliked_tracks,
            similarity_negatives=similarity_negatives,
            feature_extractor=feature_extractor,
        )
    except Exception as e:
        import traceback

        traceback.print_exc()
        _set_progress(
            session_id, done["count"], total, status="error", metrics={"reason": str(e)}
        )
        return

    _set_progress(session_id, total, total, status="complete", metrics=metrics)


@app.post("/train/start", response_model=TrainStartResponse)
def start_train(request: TrainRequest, background_tasks: BackgroundTasks):
    _set_progress(request.session_id, 0, 0, status="in_progress")
    background_tasks.add_task(_run_training, request.session_id)
    return TrainStartResponse(started=True)


@app.get("/train/progress/{session_id}", response_model=TrainProgressResponse)
def train_progress(session_id: str):
    progress = TRAIN_PROGRESS.get(session_id)
    if progress is None:
        return TrainProgressResponse(done=0, total=0, status="not_started")
    return TrainProgressResponse(**progress)


@app.post("/train", response_model=TrainResponse)
def train(request: TrainRequest, response: Response):
    """Legacy call."""
    session_data = SESSION_TRACKS.get(request.session_id, {})
    liked_tracks = session_data.get("liked", [])
    disliked_tracks = session_data.get("disliked", [])

    def feature_extractor(track):
        feats = process_track_preview(track)
        if feats is None:
            return None
        feats.pop("track_id", None)
        return feats

    def to_vector(features):
        return list(features.values())

    disliked_vectors = []
    for t in disliked_tracks:
        features = feature_extractor(t)
        if features:
            disliked_vectors.append(to_vector(features))

    exclude_ids = {t.track_id for t in liked_tracks} | {
        t.track_id for t in disliked_tracks
    }
    candidate_pool_tracks = get_candidate_pool(
        num_genres=3, tracks_per_genre=5, exclude_track_ids=exclude_ids
    )

    candidate_vectors = []
    valid_candidates = []
    for t in candidate_pool_tracks:
        feats = feature_extractor(t)
        if feats:
            candidate_vectors.append(to_vector(feats))
            valid_candidates.append(t)

    similarity_negatives = rank_dislikes(
        disliked_vectors, candidate_vectors, valid_candidates, top_k=10
    )

    status, metrics = train_session_model(
        session_id=request.session_id,
        liked_tracks=liked_tracks,
        disliked_tracks=disliked_tracks,
        similarity_negatives=similarity_negatives,
        feature_extractor=feature_extractor,
    )

    response.status_code = status.value
    return TrainResponse(session_id=request.session_id, status=status, metrics=metrics)


@app.post("/score", response_model=ScoreResponse)
def score(request: ScoreRequest):
    return ScoreResponse(scores=[])


@app.get("/train/visualization/{session_id}", response_model=ModelVisualization)
def get_visualization(session_id: str):
    session_data = SESSION_MODELS.get(session_id)
    if session_data is None:
        raise HTTPException(
            status_code=404,
            detail="No trained model exists for this session — train first.",
        )
    if "visualization" not in session_data:
        raise HTTPException(
            status_code=404,
            detail="Model exists but has no visualization data — retrain to regenerate it.",
        )
    return session_data["visualization"]


@app.get("/albums/search", response_model=AlbumSearchResponse)
def search_albums_route(query: str):
    albums = search_albums(query, limit=8)
    return AlbumSearchResponse(albums=[Album(**a) for a in albums])


@app.get("/albums/{album_id}/rank", response_model=AlbumRankResponse)
def rank_album(album_id: str, session_id: str):
    album, tracks = get_album(album_id)
    if album is None:
        raise HTTPException(status_code=404, detail="Album not found.")
    if not tracks:
        raise HTTPException(status_code=404, detail="This album has no tracks to rank.")
    if session_id not in SESSION_MODELS:
        raise HTTPException(
            status_code=404,
            detail="No trained model exists for this session — train first.",
        )

    def feature_extractor(track):
        feats = process_track_preview(track)
        if feats is not None:
            feats.pop("track_id", None)
        return feats

    scored = score_tracks(session_id, tracks, feature_extractor)

    ranked = [RankedTrack(track=t, like_probability=p) for t, p in scored]
    # highest probability first
    ranked.sort(
        key=lambda r: (r.like_probability is None, -(r.like_probability or 0.0))
    )

    return AlbumRankResponse(album=Album(**album), ranked_tracks=ranked)
