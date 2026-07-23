from http import HTTPStatus
from pydantic import BaseModel, ConfigDict


class Track(BaseModel):
    track_id: str
    name: str
    artist: str
    artwork_url: str | None = None
    preview_url: str | None = None


class SearchRequest(BaseModel):
    query: str
    artist: str | None = None
    limit: int = 10


class SearchResponse(BaseModel):
    results: list[Track]


class QuizResponse(BaseModel):
    tracks: list[Track]


class TrainRequest(BaseModel):
    session_id: str


class TrainResponse(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    session_id: str
    status: HTTPStatus
    metrics: dict


class ScoreRequest(BaseModel):
    session_id: str
    track_ids: list[str]


class ScoredTrack(BaseModel):
    track_id: str
    like_probability: float


class ScoreResponse(BaseModel):
    scores: list[ScoredTrack]


class SelectionRequest(BaseModel):
    session_id: str
    track: Track
    liked: bool


class SelectionResponse(BaseModel):
    model_config = ConfigDict(use_enum_values=True)
    status: HTTPStatus
