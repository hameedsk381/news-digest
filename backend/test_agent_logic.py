
import os
import sys
sys.path.append(os.getcwd())

from app.core.pdf_extractor import PDFExtractor
from app.agents.vision_agent import VisionAgent
import asyncio

async def test_agent_logic():
    # Mock some clean Telugu text result from PDFExtractor
    clean_telugu = "నమస్కారం! ఆంధ్రప్రదేశ్ రాష్ట్ర వార్తలు. ఈరోజు వాతావరణం బాగుంది."
    
    # We want to see if VisionAgent would use this or fall back
    ratio, fffds = PDFExtractor.calculate_corruption_ratio(clean_telugu)
    print(f"Clean Telugu Text: {clean_telugu}")
    print(f"Ratio: {ratio}, FFFDs: {fffds}")
    
    if len(clean_telugu) > 100 and ratio <= 0.1:
        print("RESULT: Would use DIGITAL extraction (No Vision)")
    else:
        print(f"RESULT: Would use VISION (Reason: len={len(clean_telugu)}, ratio={ratio})")

    # Now let's try with the Prajasakti sample (Mojibake)
    mojibake = "æ°\x10æôÌ’ ఏæ°\x10æôÌ’ æ°\x10æôÌ’"
    ratio_m, fffds_m = PDFExtractor.calculate_corruption_ratio(mojibake)
    print(f"\nMojibake Sample: {mojibake}")
    print(f"Ratio: {ratio_m}, FFFDs: {fffds_m}")
    if len(mojibake) > 100 and ratio_m <= 0.1:
        print("RESULT: Would use DIGITAL extraction")
    else:
        print(f"RESULT: Would use VISION")

if __name__ == "__main__":
    asyncio.run(test_agent_logic())
