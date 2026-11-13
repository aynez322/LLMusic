import pytest

from api.text import normalize_artist, normalize_title, song_key


@pytest.mark.parametrize("title,expected", [
    ("Bohemian Rhapsody - Remastered 2011", "bohemian rhapsody"),
    ("Hey Ya! (Radio Mix)", "hey ya"),
    ("Born to Run [Live]", "born to run"),
    ("Señorita", "senorita"),
    ("Don't Stop Me Now", "don t stop me now"),
    ("Stereo Love", "stereo love"),             # a version word that's part of the real title
])
def test_normalize_title(title, expected):
    assert normalize_title(title) == expected


@pytest.mark.parametrize("artist,expected", [
    ("The Beatles", "beatles"),
    ("Beyoncé", "beyonce"),
    ("Simon & Garfunkel", "simon and garfunkel"),
    ("Drake feat. Rihanna", "drake"),
    ("Kendrick Lamar, SZA", "kendrick lamar"),
    ("Calvin Harris x Dua Lipa", "calvin harris"),
])
def test_normalize_artist(artist, expected):
    assert normalize_artist(artist) == expected


def test_same_song_from_different_services_matches():
    assert song_key("Reckoner", "Radiohead") == song_key("Reckoner - 2007 Remaster", "radiohead")
