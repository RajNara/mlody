from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models.schema import (
    SearchRequest,
    SearchResponse,
    QuizResponse,
    TrainRequest,
    TrainResponse,
    ScoreRequest,
    ScoreResponse,
)
from app.train_model import train_session_model
from app.similarity import rank_dislikes

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
    return SearchResponse(results=[])


@app.get("/quiz", response_model=QuizResponse)
def quiz():
    return QuizResponse(tracks=[])


@app.post("/train", response_model=TrainResponse)
def train(request: TrainRequest):
    session_data = SESSION_TRACKS.get(request.session_id, {})
    liked_tracks = session_data.get("liked", [])
    disliked_tracks = session_data.get("disliked", [])

    disliked_feature_vectors = []
    candidate_pool_feature_vectors = []
    candidate_pool_tracks = []

    similarity_negatives = rank_dislikes(
        disliked_feature_vectors,
        candidate_pool_feature_vectors,
        candidate_pool_tracks,
        top_k=10,
    )

    status, metrics = train_session_model(
        session_id=request.session_id,
        liked_tracks=liked_tracks,
        disliked_tracks=disliked_tracks,
        similarity_negatives=similarity_negatives,
        feature_extractor=lambda t: None,
    )

    return TrainResponse(session_id=request.session_id, status=status, metrics=metrics)


@app.post("/score", response_model=ScoreResponse)
def score(request: ScoreRequest):
    return ScoreResponse(scores=[])
