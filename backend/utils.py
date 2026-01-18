import io
from fastapi import UploadFile, HTTPException
import fitz
from PIL import Image
import pytesseract

from typing import List

def extract_text_from_file(file: UploadFile) -> List[str]:
    try:
        content = file.file.read()
        file.file.seek(0)
        
        if file.content_type == "application/pdf":
            return _extract_text_from_pdf(content)
        elif file.content_type.startswith("image/"):
            return [_extract_text_from_image(content)]
        else:
            try:
                return [content.decode("utf-8")]
            except Exception:
                raise HTTPException(status_code=400, detail="Unsupported file type. Please upload PDF or Image.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

def _extract_text_from_pdf(content: bytes) -> List[str]:
    pages = []
    try:
        with fitz.open(stream=content, filetype="pdf") as doc:
            for page in doc:
                pages.append(page.get_text())
    except Exception as e:
        raise Exception(f"PDF extraction failed: {str(e)}")
    return pages

def _extract_text_from_image(content: bytes) -> str:
    try:
        image = Image.open(io.BytesIO(content))
        text = pytesseract.image_to_string(image)
        return text
    except Exception as e:
        raise Exception(f"Image extraction failed: {str(e)}")
