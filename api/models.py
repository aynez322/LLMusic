from pydantic import BaseModel, Field


class Track(BaseModel):
    deezer_id: int
    title: str
    artist: str
    artist_id: int
    album: str = ""
    cover: str = ""
    preview: str = ""
    link: str = ""
    rank: int = 0          # Deezer popularity (higher = more popular)
    isrc: str = ""


class RecommendRequest(BaseModel):
    deezer_id: int | None = None   # set when the user picked a suggestion
    title: str = ""                # free-text fallback when nothing was picked
    artist: str = ""
    discovery: float = Field(0.5, ge=0.0, le=1.0)   # 0 = familiar hits, 1 = deep cuts
    limit: int = Field(10, ge=1, le=25)


class Reason(BaseModel):
    kind: str      # "listeners" | "sound" | "artist" | "tags"
    text: str


class Recommendation(BaseModel):
    track: Track
    score: float
    sound_similarity: float | None = None
    listener_score: float = 0.0
    reasons: list[Reason] = []
