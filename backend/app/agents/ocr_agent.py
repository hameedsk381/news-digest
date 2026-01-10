import pytesseract
from pdf2image import convert_from_path
from typing import List, Dict, Any
import time
from app.agents.base import BaseAgent
from app.schemas.ocr import OCRProcessingResult, PageOCRResult, TextBlock, BoundingBox
from PIL import Image
import os

class OCRAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="OCR Agent")
        
    async def run(self, input_data: Dict[str, Any]) -> OCRProcessingResult:
        file_id = input_data.get("file_id")
        file_path = input_data.get("file_path")
        
        if not file_path or not os.path.exists(file_path):
            raise ValueError(f"File path not found: {file_path}")
            
        self.log(f"Starting Smart OCR for file: {file_path}")
        start_time = time.time()
        
        pages_results = []
        
        try:
            from app.core.pdf_extractor import PDFExtractor
            
            # Use PyMuPDF to get total page count if possible
            import fitz
            doc = fitz.open(file_path)
            total_pages = len(doc)
            doc.close()
            
            # Helper to load images only if needed
            images = None 
            
            for i in range(total_pages):
                self.log(f"Processing page {i+1}/{total_pages}")
                
                # 1. Try Tiered Digital Extraction
                extracted_text, method, metrics = PDFExtractor.extract_page_tiered(file_path, i)
                
                # 2. Heuristic: Is this page scanned or did digital extraction fail?
                is_scanned = method == "vision_needed" or not extracted_text or len(extracted_text.strip()) < 50
                
                if not is_scanned:
                    self.log(f"Page {i+1}: Digital text extracted using {method} ({len(extracted_text)} chars). Metrics: {metrics}")
                    # Synthesis blocks from lines
                    blocks = []
                    lines = extracted_text.split('\n')
                    for line in lines:
                        line = line.strip()
                        if not line: continue
                        h = 10
                        # Simple heuristic for "header-like" lines
                        if len(line) < 100 and (line.isupper() or line.istitle()):
                            h = 20
                        blocks.append(TextBlock(text=line, confidence=1.0, box=BoundingBox(x=0, y=0, w=100, h=h)))
                        
                    pages_results.append(PageOCRResult(
                        page_number=i+1,
                        width=1000, # Placeholder
                        height=1000,
                        blocks=blocks,
                        full_text=extracted_text
                    ))
                else:
                    self.log(f"Page {i+1}: Digital extraction yielded low quality/no text. Falling back to OCR.")
                    
                    # Lazy load images if haven't yet
                    if images is None:
                        self.log("Converting PDF to images for OCR...")
                        try:
                            # Use poppler path if available
                            poppler_path = None
                            local_poppler = os.path.join(os.getcwd(), "deps", "poppler", "poppler-24.02.0", "Library", "bin")
                            if os.path.exists(local_poppler):
                                poppler_path = local_poppler
                            
                            images = convert_from_path(file_path, poppler_path=poppler_path)
                        except Exception as e:
                            self.log(f"Image conversion failed: {e}")
                            # If we can't convert, skip or return empty
                            continue
                            
                    if i < len(images):
                        page_result = self._process_page(images[i], page_number=i+1)
                        pages_results.append(page_result)
                    else:
                        self.log(f"Page {i+1}: Image not found (index out of bounds)")

        except Exception as e:
            self.log(f"Smart OCR failed: {e}")
            raise e
            
        end_time = time.time()
        duration = end_time - start_time
        
        result = OCRProcessingResult(
            file_id=file_id,
            pages=pages_results,
            total_pages=len(pages_results),
            processing_time_seconds=duration
        )
        
        self.log(f"OCR completed in {duration:.2f}s")
        return result

    def _process_page(self, image: Image.Image, page_number: int) -> PageOCRResult:
        """
        Run Tesseract on a single image page.
        """
        width, height = image.size
        
        # Get detailed data including boxes
        ocr_data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
        
        blocks = []
        full_text_parts = []
        
        n_boxes = len(ocr_data['text'])
        for i in range(n_boxes):
            text = ocr_data['text'][i].strip()
            conf = int(ocr_data['conf'][i])
            
            # Filter out low confidence or empty text
            if float(conf) > 0 and text:
                box = BoundingBox(
                    x=ocr_data['left'][i],
                    y=ocr_data['top'][i],
                    w=ocr_data['width'][i],
                    h=ocr_data['height'][i]
                )
                
                normalized_conf = float(conf) / 100.0
                
                block = TextBlock(
                    text=text,
                    confidence=normalized_conf,
                    box=box
                )
                blocks.append(block)
                full_text_parts.append(text)
        
        return PageOCRResult(
            page_number=page_number,
            width=width,
            height=height,
            blocks=blocks,
            full_text=" ".join(full_text_parts)
        )
