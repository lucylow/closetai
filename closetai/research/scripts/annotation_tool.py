#!/usr/bin/env python3
"""
Image Annotation Tool for Fashion & Beauty

A lightweight web-based annotation tool for labeling:
- Garment masks and segmentation
- Keypoints for pose and fit
- Fabric type classification
- Color palette extraction
- Fit quality annotations

Usage:
    python annotation_tool.py --port 5000 --dataset-dir ./dataset
    python annotation_tool.py --export-coco annotations.json

@author: R&D Team
@date: 2024
"""

import os
import sys
import json
import argparse
import hashlib
import mimetypes
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field, asdict
from datetime import datetime

# Try to import Flask for web interface
try:
    from flask import Flask, render_template, request, jsonify, send_from_directory
    from flask_cors import CORS
    FLASK_AVAILABLE = True
except ImportError:
    FLASK_AVAILABLE = False
    print("Warning: Flask not available. Running in CLI-only mode.")


@dataclass
class BoundingBox:
    """Bounding box annotation."""
    x: int
    y: int
    width: int
    height: int
    label: str
    confidence: float = 1.0


@dataclass
class Keypoint:
    """Keypoint annotation."""
    x: int
    y: int
    label: str
    visible: bool = True


@dataclass
class Polygon:
    """Polygon/mask annotation."""
    points: List[Tuple[int, int]]
    label: str
    confidence: float = 1.0


@dataclass
class ImageAnnotation:
    """Complete annotation for an image."""
    image_id: str
    image_path: str
    image_hash: str
    width: int
    height: int
    created_at: str
    updated_at: str
    bounding_boxes: List[Dict] = field(default_factory=list)
    keypoints: List[Dict] = field(default_factory=list)
    polygons: List[Dict] = field(default_factory=list)
    fabric_type: Optional[str] = None
    color_palette: List[str] = field(default_factory=list)
    fit_quality: Optional[str] = None
    notes: str = ""
    annotator: str = ""


class AnnotationStore:
    """In-memory store for annotations."""
    
    def __init__(self, storage_path: Optional[str] = None):
        self.annotations: Dict[str, ImageAnnotation] = {}
        self.storage_path = storage_path
        
        if storage_path and os.path.exists(storage_path):
            self.load()
    
    def add(self, annotation: ImageAnnotation) -> None:
        """Add or update an annotation."""
        self.annotations[annotation.image_id] = annotation
        self.save()
    
    def get(self, image_id: str) -> Optional[ImageAnnotation]:
        """Get annotation by image ID."""
        return self.annotations.get(image_id)
    
    def get_by_path(self, image_path: str) -> Optional[ImageAnnotation]:
        """Get annotation by image path."""
        for ann in self.annotations.values():
            if ann.image_path == image_path:
                return ann
        return None
    
    def get_all(self) -> List[ImageAnnotation]:
        """Get all annotations."""
        return list(self.annotations.values())
    
    def delete(self, image_id: str) -> bool:
        """Delete an annotation."""
        if image_id in self.annotations:
            del self.annotations[image_id]
            self.save()
            return True
        return False
    
    def save(self) -> None:
        """Save annotations to disk."""
        if not self.storage_path:
            return
        
        data = {
            image_id: asdict(ann) 
            for image_id, ann in self.annotations.items()
        }
        
        with open(self.storage_path, 'w') as f:
            json.dump(data, f, indent=2)
    
    def load(self) -> None:
        """Load annotations from disk."""
        if not self.storage_path or not os.path.exists(self.storage_path):
            return
        
        with open(self.storage_path, 'r') as f:
            data = json.load(f)
        
        for image_id, ann_data in data.items():
            self.annotations[image_id] = ImageAnnotation(**ann_data)
    
    def export_coco(self) -> Dict:
        """Export annotations in COCO format."""
        categories = [
            {"id": 1, "name": "person"},
            {"id": 2, "name": "garment"},
            {"id": 3, "name": "accessory"},
            {"id": 4, "name": "background"},
        ]
        
        images = []
        annotations = []
        annotation_id = 1
        
        for ann in self.annotations.values():
            images.append({
                "id": ann.image_id,
                "file_name": os.path.basename(ann.image_path),
                "width": ann.width,
                "height": ann.height,
            })
            
            # Convert bounding boxes to COCO format
            for box in ann.bounding_boxes:
                annotations.append({
                    "id": annotation_id,
                    "image_id": ann.image_id,
                    "category_id": 2,  # garment
                    "bbox": [box.x, box.y, box.width, box.height],
                    "area": box.width * box.height,
                    "iscrowd": 0,
                })
                annotation_id += 1
        
        return {
            "images": images,
            "annotations": annotations,
            "categories": categories,
        }


def calculate_image_hash(image_path: str) -> str:
    """Calculate SHA256 hash of image file."""
    hasher = hashlib.sha256()
    with open(image_path, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b''):
            hasher.update(chunk)
    return hasher.hexdigest()


def create_flask_app(
    dataset_dir: str, 
    annotations_file: str,
    port: int = 5000
) -> Flask:
    """Create Flask application for annotation UI."""
    
    app = Flask(__name__, 
                template_folder='templates',
                static_folder='static')
    CORS(app)
    
    store = AnnotationStore(annotations_file)
    dataset_path = Path(dataset_dir)
    
    # Find all images in dataset directory
    def get_image_files():
        extensions = {'.jpg', '.jpeg', '.png', '.webp'}
        return [
            f for f in dataset_path.rglob('*') 
            if f.suffix.lower() in extensions
        ]
    
    @app.route('/')
    def index():
        return render_template('annotation_ui.html')
    
    @app.route('/api/images')
    def list_images():
        images = get_image_files()
        return jsonify([
            {
                'id': str(f.relative_to(dataset_path)),
                'path': str(f),
                'name': f.name,
            }
            for f in images
        ])
    
    @app.route('/api/annotations/<image_id>')
    def get_annotation(image_id):
        ann = store.get(image_id)
        if ann:
            return jsonify(asdict(ann))
        return jsonify(None)
    
    @app.route('/api/annotations', methods=['POST'])
    def save_annotation():
        data = request.json
        
        image_path = os.path.join(dataset_dir, data['image_id'])
        
        # Get image dimensions
        try:
            from PIL import Image
            with Image.open(image_path) as img:
                width, height = img.size
        except:
            width, height = 0, 0
        
        # Calculate hash
        image_hash = calculate_image_hash(image_path)
        
        # Create or update annotation
        existing = store.get(data['image_id'])
        now = datetime.utcnow().isoformat()
        
        annotation = ImageAnnotation(
            image_id=data['image_id'],
            image_path=image_path,
            image_hash=image_hash,
            width=width,
            height=height,
            created_at=existing.created_at if existing else now,
            updated_at=now,
            bounding_boxes=data.get('bounding_boxes', []),
            keypoints=data.get('keypoints', []),
            polygons=data.get('polygons', []),
            fabric_type=data.get('fabric_type'),
            color_palette=data.get('color_palette', []),
            fit_quality=data.get('fit_quality'),
            notes=data.get('notes', ''),
            annotator=data.get('annotator', ''),
        )
        
        store.add(annotation)
        return jsonify({'success': True})
    
    @app.route('/api/images/<path:filename>')
    def serve_image(filename):
        return send_from_directory(dataset_path, filename)
    
    @app.route('/api/export/coco')
    def export_coco():
        coco = store.export_coco()
        return jsonify(coco)
    
    return app


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Image annotation tool for fashion and beauty"
    )
    
    parser.add_argument(
        '--dataset-dir',
        type=str,
        default='./dataset',
        help='Directory containing images to annotate'
    )
    parser.add_argument(
        '--annotations-file',
        type=str,
        default='./annotations.json',
        help='File to store annotations'
    )
    parser.add_argument(
        '--port',
        type=int,
        default=5000,
        help='Port for web server'
    )
    parser.add_argument(
        '--export-coco',
        type=str,
        help='Export annotations to COCO format'
    )
    parser.add_argument(
        '--list-only',
        action='store_true',
        help='Only list images without starting web server'
    )
    
    args = parser.parse_args()
    
    # Handle export-only mode
    if args.export_coco:
        store = AnnotationStore(args.annotations_file)
        coco = store.export_coco()
        with open(args.export_coco, 'w') as f:
            json.dump(coco, f, indent=2)
        print(f"Exported {len(coco['images'])} images to {args.export_coco}")
        return
    
    # Handle list-only mode
    if args.list_only:
        dataset_path = Path(args.dataset_dir)
        extensions = {'.jpg', '.jpeg', '.png', '.webp'}
        images = [
            f for f in dataset_path.rglob('*') 
            if f.suffix.lower() in extensions
        ]
        print(f"Found {len(images)} images in {args.dataset_dir}:")
        for img in images[:10]:
            print(f"  - {img.relative_to(dataset_path)}")
        if len(images) > 10:
            print(f"  ... and {len(images) - 10} more")
        return
    
    # Start web server
    if FLASK_AVAILABLE:
        app = create_flask_app(args.dataset_dir, args.annotations_file, args.port)
        print(f"Starting annotation tool on http://localhost:{args.port}")
        print(f"Dataset: {args.dataset_dir}")
        print(f"Annotations: {args.annotations_file}")
        app.run(host='0.0.0.0', port=args.port, debug=True)
    else:
        print("Flask is required for web interface. Install with: pip install flask flask-cors")
        sys.exit(1)


if __name__ == '__main__':
    main()
