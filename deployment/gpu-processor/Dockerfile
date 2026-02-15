FROM pytorch/pytorch:2.0.1-cuda11.7-cudnn8-runtime

WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir \
    fastapi uvicorn pillow numpy boto3 python-multipart \
    transformers accelerate sentencepiece protobuf

# Pre-download model (cached in image)
RUN python -c "\
from transformers import AutoImageProcessor, AutoModelForSemanticSegmentation; \
AutoImageProcessor.from_pretrained('mattmdjaga/segformer_b2_clothes'); \
AutoModelForSemanticSegmentation.from_pretrained('mattmdjaga/segformer_b2_clothes')"

COPY processor.py .

EXPOSE 5000

CMD ["uvicorn", "processor:app", "--host", "0.0.0.0", "--port", "5000"]
