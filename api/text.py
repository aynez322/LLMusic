"""Normalisation helpers so the same song from different services compares equal."""
import re
import unicodedata

# "(Remastered 2011)", "- Live at Wembley", "[feat. X]", "(Radio Edit)" ...
_VERSION_RE = re.compile(
    r"\s*[\(\[\-–—]\s*[^\)\]]*\b(remaster(ed)?|live|version|edit|mix|mono|stereo|"
    r"feat\.?|ft\.?|featuring|acoustic|demo|bonus|deluxe|explicit|clean)\b[^\)\]]*[\)\]]?",
    re.IGNORECASE,
)
_FEAT_RE = re.compile(r"\s+(feat\.?|ft\.?|featuring|with)\s+.*$", re.IGNORECASE)


def _ascii_fold(s: str) -> str:
    return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()


def _clean(s: str) -> str:
    s = _ascii_fold(s.lower()).replace("&", " and ")
    s = re.sub(r"[^\w\s]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def normalize_title(title: str) -> str:
    return _clean(_VERSION_RE.sub("", title))


def normalize_artist(artist: str) -> str:
    artist = re.split(r"\s*[,;/]\s*|\s+x\s+", _FEAT_RE.sub("", artist))[0]
    artist = re.sub(r"^the\s+", "", artist.strip(), flags=re.IGNORECASE)
    return _clean(artist)


def song_key(title: str, artist: str) -> str:
    return f"{normalize_title(title)}|{normalize_artist(artist)}"
