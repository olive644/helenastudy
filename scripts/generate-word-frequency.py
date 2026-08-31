"""Generate the lazy-loaded English frequency subset used by HelenaStudy.

Run in an isolated development environment with: pip install wordfreq==3.1.1
The Python dependency and its full models are never shipped to the browser.
"""

import json
from pathlib import Path

from wordfreq import top_n_list, zipf_frequency

OUTPUT = Path(__file__).parents[1] / "public" / "en-frequency-10k.json"

words = top_n_list("en", 10_000, wordlist="small")
frequencies = {
    word: round(zipf_frequency(word, "en", wordlist="small"), 2)
    for word in words
    if word.isascii() and any(character.isalpha() for character in word)
}
OUTPUT.write_text(
    json.dumps(frequencies, ensure_ascii=False, separators=(",", ":"), sort_keys=True),
    encoding="utf-8",
)
print(f"Generated {len(frequencies)} entries at {OUTPUT}")
