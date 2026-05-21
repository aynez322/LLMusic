from pydantic import BaseModel


class SongRequest(BaseModel):
    song_title: str
    artist: str = ""


class SimilarRequest(BaseModel):
    song_title: str
    artist: str = ""
    top_n: int = 5
