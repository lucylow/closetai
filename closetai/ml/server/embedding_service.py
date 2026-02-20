# simple embedding service using sentence-transformers
from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer, models
import uvicorn
import numpy as np
import requests
from io import BytesIO
from PIL import Image

app = FastAPI()
# Use small model for demo
text_model = SentenceTransformer('paraphrase-MiniLM-L6-v2')
image_model = SentenceTransformer('clip-ViT-B-32')  # supports images

class TextReq(BaseModel):
    text: str

class ImageReq(BaseModel):
    url: str

@app.post("/embed_text")
def embed_text(req: TextReq):
    vec = text_model.encode(req.text).tolist()
    return {"vector": vec}

@app.post("/embed_image")
def embed_image(req: ImageReq):
    try:
        r = requests.get(req.url, timeout=5)
        img = Image.open(BytesIO(r.content)).convert('RGB')
        vec = image_model.encode(img).tolist()
        return {"vector": vec}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
