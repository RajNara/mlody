from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from http import HTTPStatus
from models.schema import (
    SearchRequest,
    SearchResponse,
    QuizResponse,
    TrainRequest,
    TrainResponse,
    ScoreRequest,
    ScoreResponse,
    SelectionRequest,
    SelectionResponse,
)
from app.train_model import train_session_model
from app.similarity import rank_dislikes
from app.deezer_utils import search_tracks, get_candidate_pool, process_track_preview
from app.quiz_tracks import get_quiz_tracks

app = FastAPI(title="MLody API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SESSION_TRACKS = {}


@app.get("/health")
def health():
    return {"status": "health function"}


@app.post("/search", response_model=SearchResponse)
def search(request: SearchRequest):
    results = search_tracks(request.query, limit=request.limit)
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


@app.post("/train", response_model=TrainResponse)
def train(request: TrainRequest, response: Response):
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
