from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models.schema import (
    SearchRequest, SearchResponse,
    QuizResponse,
    TrainRequest, TrainResponse,
    ScoreRequest, ScoreResponse,
)

app = FastAPI(title="MLody API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    return TrainResponse(session_id=request.session_id, status="Not Implemented!", metrics={})

@app.post("/score", response_model=ScoreResponse)
def score(request: ScoreRequest):
    return ScoreResponse(scores=[])