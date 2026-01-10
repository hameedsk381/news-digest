
import sys
import os
sys.path.append(os.getcwd())

from app.core.pdf_extractor import PDFExtractor




def test_extraction(file_path):
    print(f"Testing extraction for: {file_path}")
    
    from app.core.pdf_extractor import PDFExtractor
    
    print("\n--- Testing PyMuPDF ---")
    text_pm = PDFExtractor.extract_with_pymupdf(file_path, 0)
    if text_pm:
        ratio, fffds = PDFExtractor.calculate_corruption_ratio(text_pm)
        print(f"PyMuPDF Ratio: {ratio}, FFFDS: {fffds}")
        print(f"PyMuPDF Sample: {repr(text_pm[:100])}")
    
    print("\n--- Testing Poppler ---")
    text_pop = PDFExtractor.extract_with_poppler(file_path, 0)
    if text_pop:
        ratio, fffds = PDFExtractor.calculate_corruption_ratio(text_pop)
        print(f"Poppler Ratio: {ratio}, FFFDS: {fffds}")
        print(f"Poppler Sample: {repr(text_pop[:100])}")
    else:
        print("Poppler failed or returned empty.")

    print("\n--- Testing PDFMiner ---")
    text_min = PDFExtractor.extract_with_pdfminer(file_path, 0)
    if text_min:
        ratio, fffds = PDFExtractor.calculate_corruption_ratio(text_min)
        print(f"PDFMiner Ratio: {ratio}, FFFDS: {fffds}")
        print(f"PDFMiner Sample: {repr(text_min[:100])}")






if __name__ == "__main__":
    test_file = r"c:\Users\cogni\Desktop\news_digest\backend\temp_uploads\8a8855bd-e000-4163-ab30-2f9b69e39bea_Prajasakti_AP_27-12-2025-2.pdf"
    if os.path.exists(test_file):
        test_extraction(test_file)
    else:
        print(f"File not found: {test_file}")


