import os
import re
import unicodedata
import subprocess
from typing import Optional, Tuple, List
import logging

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

try:
    from pdfminer.high_level import extract_text as pdfminer_extract
    from pdfminer.layout import LAParams
except ImportError:
    pdfminer_extract = None

logger = logging.getLogger(__name__)

class PDFExtractor:
    """
    Tiered PDF extraction strategy:
    1. PyMuPDF (fitz)
    2. pdfminer.six
    3. Poppler pdftotext
    4. Fallback to vision (indicated by returning None or low quality score)
    """

    TELUGU_RANGE = r'\u0C00-\u0C7F'
    # Added common newspaper punctuation, quotes, and zero-width characters used in Indic scripts
    STANDARD_PUNCT = r'\s\.,!\?\(\)\[\]\{\}:;"\'\/\\%\$\#\*\+\-\=_@\|«»„""‘’' + r'\u200B\u200C\u200D\u2010-\u201F'
    ALPHANUM = r'a-zA-Z0-9'
    
    # Combined allowed characters: Telugu + Standard Punct + Alphanum
    ALLOWED_CHARS_RE = re.compile(f'[^{TELUGU_RANGE}{STANDARD_PUNCT}{ALPHANUM}]')

    @staticmethod
    def normalize_text(text: str) -> str:
        if not text:
            return ""
        
        # 1. NFC/NFKC normalization
        text = unicodedata.normalize('NFKC', text)
        
        # 2. Replace non-breaking spaces and zero-width characters
        text = text.replace('\u00A0', ' ')  # NBSP
        text = text.replace('\u200B', '')   # Zero-width space
        text = text.replace('\u200C', '')   # ZWNJ (sometimes needed in Telugu, but user asked to remove zero-width chars)
        text = text.replace('\u200D', '')   # ZWJ
        
        # 3. Remove control characters outside Telugu and standard range
        # We keep Telugu, alphanum, and standard punctuation. 
        # Everything else is removed or replaced if it's a control char.
        # However, let's keep newlines as they preserve layout.
        
        def filter_chars(char):
            if char in '\n\r\t':
                return char
            if PDFExtractor.ALLOWED_CHARS_RE.match(char):
                # If it matches the "NOT ALLOWED" regex, it's a candidate for removal
                # but we should be careful not to remove valid Telugu characters.
                # The regex [^\u0C00-\u0C7F...] matches everything EXCEPT Telugu etc.
                return ''
            return char

        # Simplified filter using regex
        # We want to keep: Telugu, Alphanum, Punctuation, and common whitespace (space, nl, tab)
        # We want to remove: Control characters, Mojibake, etc.
        
        # Actually, let's just use the inverse of allowed
        cleaned = "".join(filter_chars(c) for c in text)
        return cleaned

    @staticmethod
    def calculate_corruption_ratio(text: str) -> Tuple[float, int]:
        """
        Returns (corruption_ratio, fffd_count)
        """
        if not text:
            return 1.0, 0
        
        fffd_count = text.count('\uFFFD')
        
        # Mojibake detection: characters that are unlikely in Telugu or English text
        # If we see many unexpected characters, it's likely corrupt.
        # For simplicity, we can count characters outside our allowed set (excluding whitespace)
        total_len = len(text)
        if total_len == 0:
            return 0.0, 0
            
        # Count characters that are NOT Telugu, English Alphanum, or Standard Punct
        unexpected_chars = len(PDFExtractor.ALLOWED_CHARS_RE.findall(text))
        
        corruption_ratio = unexpected_chars / total_len
        return corruption_ratio, fffd_count

    @classmethod
    def extract_with_pymupdf(cls, file_path: str, page_index: int) -> Optional[str]:
        if not fitz:
            return None
        try:
            doc = fitz.open(file_path)
            page = doc.load_page(page_index)
            text = page.get_text("text", sort=True)
            doc.close()
            return text
        except Exception as e:
            logger.error(f"PyMuPDF extraction failed: {e}")
            return None

    @classmethod
    def extract_with_pdfminer(cls, file_path: str, page_index: int) -> Optional[str]:
        if not pdfminer_extract:
            return None
        try:
            # pdfminer is slow, so we only extract the specific page
            # page_numbers is 0-indexed in pdfminer.six
            text = pdfminer_extract(file_path, page_numbers=[page_index], laparams=LAParams())
            return text
        except Exception as e:
            logger.error(f"pdfminer extraction failed: {e}")
            return None

    @classmethod
    def extract_with_poppler(cls, file_path: str, page_index: int) -> Optional[str]:
        """
        Try pdftotext from Poppler. 
        Expects pdftotext to be in PATH or in deps/poppler/...
        """
        poppler_bin = "pdftotext"
        # Check local path as seen in VisionAgent
        local_poppler_path = os.path.join(os.getcwd(), "deps", "poppler", "poppler-24.02.0", "Library", "bin", "pdftotext.exe")
        if os.path.exists(local_poppler_path):
            poppler_bin = local_poppler_path
            
        try:
            # pdftotext -f N -l N -enc UTF-1 path -
            # -f is first page, -l is last page (1-indexed)
            cmd = [poppler_bin, "-f", str(page_index + 1), "-l", str(page_index + 1), "-enc", "UTF-8", file_path, "-"]
            result = subprocess.run(cmd, capture_output=True, text=True, check=True, encoding='utf-8', errors='ignore')
            return result.stdout
        except Exception as e:
            logger.error(f"Poppler pdftotext failed: {e}")
            return None

    @classmethod
    def extract_page_tiered(cls, file_path: str, page_index: int) -> Tuple[str, str, dict]:
        """
        Executes the tiered strategy for a single page.
        Returns: (extracted_text, method_used, metrics)
        """
        metrics = {
            "attempts": []
        }
        
        # 1. PyMuPDF
        text = cls.extract_with_pymupdf(file_path, page_index)
        method = "pymupdf"
        if text:
            ratio, fffds = cls.calculate_corruption_ratio(text)
            metrics["attempts"].append({"method": "pymupdf", "ratio": ratio, "fffds": fffds})
            
            # Thresholds: ratio > 0.15 or any FFFD (relaxed slightly)
            if fffds > 0 or ratio > 0.15:
                logger.info(f"Page {page_index} PyMuPDF corrupt (ratio={ratio:.2f}, fffds={fffds}). Sample: {repr(text[:50])}. Trying pdfminer...")
                text = None
            else:
                return cls.normalize_text(text), method, metrics

        # 2. pdfminer.six
        if text is None:
            text = cls.extract_with_pdfminer(file_path, page_index)
            method = "pdfminer"
            if text:
                ratio, fffds = cls.calculate_corruption_ratio(text)
                metrics["attempts"].append({"method": "pdfminer", "ratio": ratio, "fffds": fffds})
                if fffds > 0 or ratio > 0.1:
                    logger.info(f"Page {page_index} pdfminer corrupt. Trying poppler...")
                    text = None
                else:
                    return cls.normalize_text(text), method, metrics

        # 3. Poppler pdftotext
        if text is None:
            text = cls.extract_with_poppler(file_path, page_index)
            method = "poppler"
            if text:
                ratio, fffds = cls.calculate_corruption_ratio(text)
                metrics["attempts"].append({"method": "poppler", "ratio": ratio, "fffds": fffds})
                if fffds > 0 or ratio > 0.1:
                    logger.info(f"Page {page_index} poppler corrupt. Fallback to vision.")
                    text = None
                else:
                    return cls.normalize_text(text), method, metrics

        # 4. Fallback to vision (indicated by empty text or flag)
        if text is None:
            return "", "vision_needed", metrics
        
        return cls.normalize_text(text), method, metrics
