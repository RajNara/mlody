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


class TrainStartResponse(BaseModel):
    started: bool


class TrainProgressResponse(BaseModel):
    done: int
    total: int
    status: str
    metrics: dict | None = None


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


class TrainingPoint(BaseModel):
    track_id: str
    track_name: str
    artist: str
    coordinates: list[float]
    label: str


class ComponentLoading(BaseModel):
    feature: str
    pc1_loading: float
    pc2_loading: float


class ComponentCoefficient(BaseModel):
    component: int
    coefficient: float


class AxisInfo(BaseModel):
    label: str
    description: str


class ModelVisualization(BaseModel):
    training_points: list[TrainingPoint]
    explained_variance: list[float]
    cumulative_variance: list[float]
    top_loadings_pc1: list[ComponentLoading]
    top_loadings_pc2: list[ComponentLoading]
    coefficients: list[ComponentCoefficient]
    n_components: int
    axes: list[AxisInfo]
    graph_pairs: list[list[int]]
