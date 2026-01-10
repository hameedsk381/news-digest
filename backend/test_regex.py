
import re
import unicodedata

TELUGU_RANGE = r'\u0C00-\u0C7F'
STANDARD_PUNCT = r'\s\.,!\?\(\)\[\]\{\}:;"\'\/\\%\$\#\*\+\-\=_@'
ALPHANUM = r'a-zA-Z0-9'
ALLOWED_CHARS_RE = re.compile(f'[^{TELUGU_RANGE}{STANDARD_PUNCT}{ALPHANUM}]')

test_string = "నమస్కారం! This is a test. 123."
unexpected = ALLOWED_CHARS_RE.findall(test_string)
print(f"Test string: {test_string}")
print(f"Unexpected chars: {unexpected}")
print(f"Corruption ratio: {len(unexpected) / len(test_string)}")

# Test with garbage
garbage = "æ°\x10æôÌ’"
unexpected_g = ALLOWED_CHARS_RE.findall(garbage)
print(f"Garbage: {garbage}")
print(f"Unexpected chars count: {len(unexpected_g)}")
print(f"Corruption ratio: {len(unexpected_g) / len(garbage)}")
