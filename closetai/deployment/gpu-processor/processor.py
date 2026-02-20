"""
GPU-accelerated clothing segmentation and feature extraction for ClosetAI.
Uses SegFormer for semantic segmentation of clothing items.
"""
import io
import logging
import os
import uuid

import boto3
import numpy as np
import torch
from fastapi import File, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForSemanticSegmentation

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
from fastapi import FastAPI

app = FastAPI(title="ClosetAI GPU Processor")

# Initialize GPU
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
logger.info("Using device: %s", device)
if torch.cuda.is_available():
    logger.info("GPU: %s", torch.cuda.get_device_name(0))

# Load model
logger.info("Loading clothing segmentation model...")
processor = AutoImageProcessor.from_pretrained("mattmdjaga/segformer_b2_clothes")
model = AutoModelForSemanticSegmentation.from_pretrained("mattmdjaga/segformer_b2_clothes")
model.to(device)
model.eval()
logger.info("Model loaded successfully")

# Initialize S3 client for object storage
endpoint = os.environ.get("OBJECT_STORAGE_ENDPOINT", "us-sea-1.linodeobjects.com")
s3_client = boto3.client(
    "s3",
    endpoint_url=f"https://{endpoint}",
    aws_access_key_id=os.environ.get("OBJECT_STORAGE_ACCESS_KEY"),
    aws_secret_access_key=os.environ.get("OBJECT_STORAGE_SECRET_KEY"),
    region_name="us-east-1",
)

BUCKET = os.environ.get("OBJECT_STORAGE_BUCKET", "wardrobe-stylist-media")

# Clothing class mapping for SegFormer B2 Clothes
CLOTHING_CLASSES = {
    1: "hat",
    2: "hair",
    3: "sunglasses",
    4: "upper_clothes",
    5: "skirt",
    6: "pants",
    7: "dress",
    8: "belt",
    9: "left_shoe",
    10: "right_shoe",
    11: "bag",
    12: "scarf",
}


@app.get("/health")
async def health():
    """Health check endpoint for Kubernetes probes."""
    return {"status": "healthy", "gpu_available": torch.cuda.is_available()}


@app.post("/process-clothing")
async def process_clothing(file: UploadFile = File(...)):
    """
    Process uploaded clothing image:
    1. Segment clothing item using GPU
    2. Extract features (category, dominant color)
    3. Upload processed image to object storage
    """
    try:
        # Read image
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # Process with GPU
        with torch.no_grad():
            inputs = processor(images=image, return_tensors="pt").to(device)
            outputs = model(**inputs)
            logits = outputs.logits

        # Get segmentation mask
        upsampled_logits = torch.nn.functional.interpolate(
            logits,
            size=image.size[::-1],
            mode="bilinear",
            align_corners=False,
        )
        pred_seg = upsampled_logits.argmax(dim=1)[0].cpu().numpy()

        # Find main clothing item
        main_clothing_id = 4  # upper_clothes default
        unique_classes = np.unique(pred_seg)
        if 7 in unique_classes:  # dress present
            main_clothing_id = 7
        elif 6 in unique_classes:  # pants present
            main_clothing_id = 6
        elif 5 in unique_classes:  # skirt present
            main_clothing_id = 5

        # Generate unique ID for this image
        image_id = str(uuid.uuid4())
        original_key = f"originals/{image_id}.png"

        # Save original to object storage
        image_bytes_io = io.BytesIO(image_bytes)
        s3_client.upload_fileobj(
            image_bytes_io,
            BUCKET,
            original_key,
            ExtraArgs={"ContentType": "image/png"},
        )

        # Save mask to object storage
        mask_img = Image.fromarray((pred_seg > 0).astype(np.uint8) * 255)
        mask_bytes = io.BytesIO()
        mask_img.save(mask_bytes, format="PNG")
        mask_bytes.seek(0)
        s3_client.upload_fileobj(
            mask_bytes,
            BUCKET,
            f"masks/{image_id}.png",
            ExtraArgs={"ContentType": "image/png"},
        )

        # Generate URLs (Linode Object Storage public URL format)
        base_url = f"https://{BUCKET}.{endpoint}"
        original_url = f"{base_url}/{original_key}"
        mask_url = f"{base_url}/masks/{image_id}.png"

        # Extract dominant color (simplified - from non-background pixels)
        image_np = np.array(image)
        mask_bool = pred_seg > 0
        if mask_bool.any():
            masked_pixels = image_np[mask_bool]
            dominant_colors = np.median(masked_pixels, axis=0).astype(int)
        else:
            dominant_colors = np.mean(image_np.reshape(-1, 3), axis=0).astype(int)

        result = {
            "success": True,
            "image_id": image_id,
            "category": CLOTHING_CLASSES.get(main_clothing_id, "clothing"),
            "original_url": original_url,
            "mask_url": mask_url,
            "dominant_color": f"rgb({dominant_colors[0]}, {dominant_colors[1]}, {dominant_colors[2]})",
            "gpu_used": torch.cuda.is_available(),
        }

        return JSONResponse(result)

    except Exception as e:
        logger.exception("Processing failed: %s", str(e))
        return JSONResponse(
            {"success": False, "error": str(e)},
            status_code=500,
        )


@app.post("/generate-outfit")
async def generate_outfit(items: list):
    """
    Generate outfit combination using GPU-accelerated reasoning.
    Placeholder for production outfit generation model.
    """
    try:
        return JSONResponse(
            {
                "success": True,
                "outfit_id": str(uuid.uuid4()),
                "confidence": 0.85,
                "gpu_used": torch.cuda.is_available(),
            }
        )
    except Exception as e:
        logger.exception("Outfit generation failed: %s", str(e))
        return JSONResponse(
            {"success": False, "error": str(e)},
            status_code=500,
        )
