from pydantic import BaseModel


class Track(BaseModel):
    track_id: str
    name: str
    artist: str
    artwork_url: str | None = None
    preview_url: str | None = None


class SearchRequest(BaseModel):
    query: str
    limit: int = 10


class SearchResponse(BaseModel):
    results: list[Track]


class QuizResponse(BaseModel):
    tracks: list[Track]


class TrainRequest(BaseModel):
    session_id: str
    liked_track_ids: list[str]
    disliked_track_ids: list[str]


class TrainResponse(BaseModel):
    session_id: str
    status: str
    metrics: dict


class ScoreRequest(BaseModel):
    session_id: str
    track_ids: list[str]


class ScoredTrack(BaseModel):
    track_id: str
    like_probability: float


class ScoreResponse(BaseModel):
    scores: list[ScoredTrack]