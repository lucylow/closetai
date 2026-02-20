#!/usr/bin/env python3
"""
Data Augmentation Script for Fashion & Beauty Images

Provides comprehensive data augmentation capabilities for:
- Pose variations
- Lighting augmentation
- Fabric deformations
- Color/contrast variations
- Skin tone augmentation for fairness
- Synthetic generation using Stable Diffusion

Usage:
    python data_augment.py --input-dir ./images --output-dir ./augmented --num-variations 5
    python data_augment.py --synthetic --prompt "elegant red dress" --output-dir ./synthetic

@author: R&D Team
@date: 2024
"""

import os
import argparse
import json
import random
import numpy as np
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, field
import cv2
from PIL import Image, ImageEnhance, ImageFilter, ImageOps
import requests
from io import BytesIO

# Try to import optional dependencies
try:
    import torch
    from torchvision import transforms
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

try:
    from diffusers import StableDiffusionImg2ImgPipeline
    DIFFUSERS_AVAILABLE = True
except ImportError:
    DIFFUSERS_AVAILABLE = False


@dataclass
class AugmentationConfig:
    """Configuration for data augmentation pipeline."""
    # Output settings
    output_dir: str = "./augmented"
    num_variations: int = 5
    output_format: str = "png"
    output_quality: int = 95
    
    # Image processing
    resize: Optional[Tuple[int, int]] = None
    normalize: bool = True
    
    # Augmentation parameters
    brightness_range: Tuple[float, float] = (0.8, 1.2)
    contrast_range: Tuple[float, float] = (0.8, 1.2)
    saturation_range: Tuple[float, float] = (0.8, 1.2)
    hue_range: Tuple[float, float] = (-0.1, 0.1)
    
    # Geometric transformations
    rotation_range: int = 15
    flip_horizontal: bool = True
    flip_vertical: bool = False
    scale_range: Tuple[float, float] = (0.9, 1.1)
    
    # Lighting augmentation
    gamma_range: Tuple[float, float] = (0.7, 1.3)
    add_noise: bool = True
    noise_sigma: float = 10.0
    
    # Fabric-specific augmentation
    fabric_warp: bool = False
    warp_strength: float = 0.1
    
    # Skin tone augmentation (for fairness)
    skin_tone_augment: bool = True
    skin_tone_variations: int = 3
    
    # Synthetic generation
    synthetic: bool = False
    synthetic_model: str = "stabilityai/stable-diffusion-2-inpainting"
    synthetic_strength: float = 0.75
    synthetic_guidance_scale: float = 7.5
    
    # API settings (for synthetic generation)
    api_url: Optional[str] = None
    api_key: Optional[str] = None


class ImageAugmenter:
    """Main class for image augmentation operations."""
    
    def __init__(self, config: AugmentationConfig):
        self.config = config
        self.output_dir = Path(config.output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize synthetic model if requested
        self.sd_pipeline = None
        if config.synthetic and DIFFUSERS_AVAILABLE:
            self._init_synthetic_model()
        
    def _init_synthetic_model(self):
        """Initialize Stable Diffusion model."""
        if TORCH_AVAILABLE and torch.cuda.is_available():
            self.sd_pipeline = StableDiffusionImg2ImgPipeline.from_pretrained(
                self.config.synthetic_model,
                torch_dtype=torch.float16,
                safety_checker=None,
            )
            self.sd_pipeline = self.sd_pipeline.to("cuda")
        else:
            print("Warning: CUDA not available, falling back to CPU")
            self.sd_pipeline = StableDiffusionImg2ImgPipeline.from_pretrained(
                self.config.synthetic_model,
                safety_checker=None,
            )
    
    def augment_image(self, image_path: str) -> List[Dict]:
        """Augment a single image with multiple variations."""
        results = []
        
        # Load image
        img = Image.open(image_path).convert('RGB')
        original_name = Path(image_path).stem
        
        # Generate base augmentation
        for i in range(self.config.num_variations):
            augmented = self._apply_augmentations(img.copy())
            
            # Save augmented image
            output_name = f"{original_name}_aug_{i:03d}.{self.config.output_format}"
            output_path = self.output_dir / output_name
            
            # Convert to RGB if needed
            if augmented.mode != 'RGB':
                augmented = augmented.convert('RGB')
            
            augmented.save(
                output_path, 
                quality=self.config.output_quality,
                optimize=True
            )
            
            results.append({
                'original': image_path,
                'augmented': str(output_path),
                'variation_id': i,
                'metadata': self._get_augmentation_metadata(augmented)
            })
            
        # Generate skin tone variations if enabled
        if self.config.skin_tone_augment:
            skin_results = self._generate_skin_tone_variations(img, original_name)
            results.extend(skin_results)
        
        return results
    
    def _apply_augmentations(self, img: Image.Image) -> Image.Image:
        """Apply random augmentations to an image."""
        random.seed()
        
        # Resize if specified
        if self.config.resize:
            img = img.resize(self.config.resize, Image.Resampling.LANCZOS)
        
        # Color augmentations
        if random.random() > 0.5:
            img = self._adjust_brightness(img)
        
        if random.random() > 0.5:
            img = self._adjust_contrast(img)
        
        if random.random() > 0.5:
            img = self._adjust_saturation(img)
        
        # Geometric transformations
        if random.random() > 0.3:
            img = self._apply_rotation(img)
        
        if self.config.flip_horizontal and random.random() > 0.5:
            img = img.transpose(Image.FLIP_LEFT_RIGHT)
        
        if self.config.flip_vertical and random.random() > 0.7:
            img = img.transpose(Image.FLIP_TOP_BOTTOM)
        
        # Scale transformation
        if random.random() > 0.5:
            img = self._apply_scale(img)
        
        # Lighting augmentations
        if random.random() > 0.5:
            img = self._apply_gamma_correction(img)
        
        if self.config.add_noise and random.random() > 0.5:
            img = self._add_noise(img)
        
        return img
    
    def _adjust_brightness(self, img: Image.Image) -> Image.Image:
        factor = random.uniform(*self.config.brightness_range)
        enhancer = ImageEnhance.Brightness(img)
        return enhancer.enhance(factor)
    
    def _adjust_contrast(self, img: Image.Image) -> Image.Image:
        factor = random.uniform(*self.config.contrast_range)
        enhancer = ImageEnhance.Contrast(img)
        return enhancer.enhance(factor)
    
    def _adjust_saturation(self, img: Image.Image) -> Image.Image:
        factor = random.uniform(*self.config.saturation_range)
        enhancer = ImageEnhance.Color(img)
        return enhancer.enhance(factor)
    
    def _apply_rotation(self, img: Image.Image) -> Image.Image:
        angle = random.uniform(-self.config.rotation_range, self.config.rotation_range)
        return img.rotate(angle, resample=Image.Resampling.BICUBIC, expand=False)
    
    def _apply_scale(self, img: Image.Image) -> Image.Image:
        scale = random.uniform(*self.config.scale_range)
        w, h = img.size
        new_w, new_h = int(w * scale), int(h * scale)
        
        scaled = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Crop or pad back to original size
        if scale > 1:
            left = (new_w - w) // 2
            top = (new_h - h) // 2
            return scaled.crop((left, top, left + w, top + h))
        else:
            new_img = Image.new('RGB', (w, h), (255, 255, 255))
            paste_x = (w - new_w) // 2
            paste_y = (h - new_h) // 2
            new_img.paste(scaled, (paste_x, paste_y))
            return new_img
    
    def _apply_gamma_correction(self, img: Image.Image) -> Image.Image:
        gamma = random.uniform(*self.config.gamma_range)
        return img.point(lambda x: 255 * (x / 255) ** gamma)
    
    def _add_noise(self, img: Image.Image) -> Image.Image:
        img_array = np.array(img).astype(np.float32)
        noise = np.random.normal(0, self.config.noise_sigma, img_array.shape)
        noisy = np.clip(img_array + noise, 0, 255).astype(np.uint8)
        return Image.fromarray(noisy)
    
    def _generate_skin_tone_variations(
        self, 
        img: Image.Image, 
        original_name: str
    ) -> List[Dict]:
        """Generate skin tone variations for fairness in ML training."""
        results = []
        
        # Convert to LAB color space for skin tone adjustment
        img_lab = img.convert('LAB')
        img_array = np.array(img_lab).astype(np.float32)
        
        # Generate different skin tone variations
        # These multipliers simulate different skin tones
        skin_tone_factors = [
            (0.85, 0.9, 0.9),   # Darker
            (0.95, 0.95, 0.95), # Slightly darker
            (1.05, 1.0, 1.0),   # Lighter
            (1.1, 1.05, 1.05),  # Much lighter
        ]
        
        for i, factors in enumerate(skin_tone_factors[:self.config.skin_tone_variations]):
            # Apply skin tone adjustment (mainly to L and A channels)
            adjusted = img_array.copy()
            adjusted[:, :, 0] = np.clip(adjusted[:, :, 0] * factors[0], 0, 255)
            adjusted[:, :, 1] = np.clip(adjusted[:, :, 1] * factors[1], 0, 255)
            adjusted = adjusted.astype(np.uint8)
            
            adjusted_img = Image.fromarray(adjusted, 'LAB').convert('RGB')
            
            output_name = f"{original_name}_skin_{i}.{self.config.output_format}"
            output_path = self.output_dir / output_name
            adjusted_img.save(output_path, quality=self.config.output_quality)
            
            results.append({
                'original': str(img.filename),
                'augmented': str(output_path),
                'variation_id': f'skin_{i}',
                'metadata': {'type': 'skin_tone', 'factor': factors}
            })
        
        return results
    
    def _get_augmentation_metadata(self, img: Image.Image) -> Dict:
        """Extract metadata from augmented image."""
        return {
            'size': img.size,
            'mode': img.mode,
            'format': img.format,
        }
    
    def generate_synthetic(
        self, 
        prompt: str, 
        num_images: int = 5,
        reference_image: Optional[str] = None
    ) -> List[Dict]:
        """Generate synthetic images using Stable Diffusion."""
        if not self.sd_pipeline:
            print("Stable Diffusion not available, skipping synthetic generation")
            return []
        
        results = []
        
        # Load reference image if provided
        init_image = None
        if reference_image:
            init_image = Image.open(reference_image).convert('RGB')
            init_image = init_image.resize((512, 512))
        
        for i in range(num_images):
            seed = random.randint(0, 2**32 - 1)
            
            if init_image:
                # Image-to-image generation
                generator = torch.Generator(device="cuda").manual_seed(seed)
                result = self.sd_pipeline(
                    prompt=prompt,
                    image=init_image,
                    strength=self.config.synthetic_strength,
                    guidance_scale=self.config.synthetic_guidance_scale,
                    generator=generator,
                    num_inference_steps=50,
                )
            else:
                # Text-to-image generation
                generator = torch.Generator(device="cuda").manual_seed(seed)
                result = self.sd_pipeline(
                    prompt=prompt,
                    guidance_scale=self.config.synthetic_guidance_scale,
                    generator=generator,
                    num_inference_steps=50,
                )
            
            # Save generated image
            output_name = f"synthetic_{seed}.{self.config.output_format}"
            output_path = self.output_dir / output_name
            result.images[0].save(output_path)
            
            results.append({
                'prompt': prompt,
                'seed': seed,
                'output': str(output_path),
            })
        
        return results
    
    def process_directory(self, input_dir: str) -> List[Dict]:
        """Process all images in a directory."""
        input_path = Path(input_dir)
        all_results = []
        
        # Find all image files
        image_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.bmp'}
        image_files = [
            f for f in input_path.rglob('*') 
            if f.suffix.lower() in image_extensions
        ]
        
        print(f"Found {len(image_files)} images to process")
        
        for i, image_file in enumerate(image_files):
            print(f"Processing {i+1}/{len(image_files)}: {image_file}")
            try:
                results = self.augment_image(str(image_file))
                all_results.extend(results)
            except Exception as e:
                print(f"Error processing {image_file}: {e}")
        
        # Save manifest
        manifest_path = self.output_dir / "augmentation_manifest.json"
        with open(manifest_path, 'w') as f:
            json.dump(all_results, f, indent=2)
        
        print(f"Augmentation complete. Results saved to {self.output_dir}")
        return all_results


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Data augmentation for fashion and beauty images"
    )
    
    parser.add_argument(
        '--input-dir', 
        type=str, 
        help='Input directory containing images'
    )
    parser.add_argument(
        '--output-dir', 
        type=str, 
        default='./augmented',
        help='Output directory for augmented images'
    )
    parser.add_argument(
        '--num-variations', 
        type=int, 
        default=5,
        help='Number of variations per image'
    )
    parser.add_argument(
        '--synthetic',
        action='store_true',
        help='Generate synthetic images using Stable Diffusion'
    )
    parser.add_argument(
        '--prompt',
        type=str,
        help='Prompt for synthetic generation'
    )
    parser.add_argument(
        '--reference-image',
        type=str,
        help='Reference image for img2img generation'
    )
    parser.add_argument(
        '--config',
        type=str,
        help='Path to JSON configuration file'
    )
    
    return parser.parse_args()


def main():
    """Main entry point."""
    args = parse_args()
    
    # Load configuration
    if args.config:
        with open(args.config, 'r') as f:
            config_dict = json.load(f)
        config = AugmentationConfig(**config_dict)
    else:
        config = AugmentationConfig(
            output_dir=args.output_dir,
            num_variations=args.num_variations,
            synthetic=args.synthetic,
        )
    
    # Initialize augmenter
    augmenter = ImageAugmenter(config)
    
    # Process based on mode
    if args.synthetic and args.prompt:
        # Synthetic generation mode
        results = augmenter.generate_synthetic(
            prompt=args.prompt,
            reference_image=args.reference_image
        )
        print(f"Generated {len(results)} synthetic images")
        
    elif args.input_dir:
        # Augmentation mode
        results = augmenter.process_directory(args.input_dir)
        print(f"Augmented {len(results)} images")
        
    else:
        print("Please specify --input-dir or --synthetic with --prompt")


if __name__ == '__main__':
    main()
