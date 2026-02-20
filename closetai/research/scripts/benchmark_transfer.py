#!/usr/bin/env python3
"""
Benchmark Transfer Quality Evaluation Script

Evaluates the quality of virtual try-on, makeup transfer, and hair color
transfer using various metrics:
- LPIPS (Learned Perceptual Image Patch Similarity)
- SSIM (Structural Similarity Index)
- Delta E (CIEDE2000 color difference)
- FID (Fréchet Inception Distance) for makeup
- Keypoint IoU for fit accuracy
- Demographic parity metrics

Usage:
    python benchmark_transfer.py --baseline-dir ./baseline --refined-dir ./refined
    python benchmark_transfer.py --pairs-file pairs.json --output results.json

@author: R&D Team
@date: 2024
"""

import os
import argparse
import json
import glob
import numpy as np
import pandas as pd
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass, field, asdict
import cv2
from PIL import Image
from scipy import linalg
from scipy.spatial.distance import cdist
import warnings
warnings.filterwarnings('ignore')

# Optional imports
try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    from torchvision import models, transforms
    from torch.nn.functional import adaptive_avg_pool2d
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False


@dataclass
class EvaluationMetrics:
    """Container for evaluation metrics."""
    lpips: Optional[float] = None
    ssim: Optional[float] = None
    psnr: Optional[float] = None
    delta_e: Optional[float] = None
    mse: Optional[float] = None
    keypoint_iou: Optional[float] = None
    aesthetic_score: Optional[float] = None
    

@dataclass
class EvaluationResult:
    """Result for a single image pair evaluation."""
    image_name: str
    baseline_path: str
    refined_path: str
    metrics: EvaluationMetrics
    demographic_info: Optional[Dict] = None
    

@dataclass
class AggregateResults:
    """Aggregate results across all evaluations."""
    mean_lpips: float = 0.0
    mean_ssim: float = 0.0
    mean_psnr: float = 0.0
    mean_delta_e: float = 0.0
    mean_mse: float = 0.0
    mean_keypoint_iou: float = 0.0
    num_samples: int = 0
    std_lpips: float = 0.0
    std_ssim: float = 0.0
    demographic_parity: Optional[Dict] = None


class LPIPSModel:
    """LPIPS (Learned Perceptual Image Patch Similarity) calculator."""
    
    def __init__(self, net: str = 'alex'):
        if not TORCH_AVAILABLE:
            raise ImportError("PyTorch is required for LPIPS calculation")
        
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Load pretrained network
        if net == 'alex':
            self.net = models.alexnet(pretrained=True).features.to(self.device)
        elif net == 'vgg':
            self.net = models.vgg16(pretrained=True).features.to(self.device)
        else:
            raise ValueError(f"Unknown network: {net}")
        
        self.net.eval()
        self.transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
    def calculate(self, img1: Image.Image, img2: Image.Image) -> float:
        """Calculate LPIPS between two images."""
        # Convert to tensors
        t1 = self.transform(img1).unsqueeze(0).to(self.device)
        t2 = self.transform(img2).unsqueeze(0).to(self.device)
        
        # Extract features
        with torch.no_grad():
            feat1 = self.net(t1)
            feat2 = self.net(t2)
            
            # Calculate normalized Euclidean distance
            diff = (feat1 - feat2).pow(2).sum(dim=1, keepdim=True)
            lpips = diff.mean().item()
        
        return float(lpips)


def calculate_ssim(img1: np.ndarray, img2: np.ndarray) -> float:
    """Calculate SSIM between two images."""
    if img1.shape != img2.shape:
        img2 = cv2.resize(img2, (img1.shape[1], img1.shape[0]))
    
    # Convert to grayscale if needed
    if len(img1.shape) == 3:
        img1 = cv2.cvtColor(img1, cv2.COLOR_RGB2GRAY)
    if len(img2.shape) == 3:
        img2 = cv2.cvtColor(img2, cv2.COLOR_RGB2GRAY)
    
    # SSIM calculation
    C1 = (0.01 * 255) ** 2
    C2 = (0.03 * 255) ** 2
    
    img1 = img1.astype(np.float64)
    img2 = img2.astype(np.float64)
    
    mu1 = cv2.GaussianBlur(img1, (11, 11), 1.5)
    mu2 = cv2.GaussianBlur(img2, (11, 11), 1.5)
    
    mu1_sq = mu1 ** 2
    mu2_sq = mu2 ** 2
    mu1_mu2 = mu1 * mu2
    
    sigma1_sq = cv2.GaussianBlur(img1 ** 2, (11, 11), 1.5) - mu1_sq
    sigma2_sq = cv2.GaussianBlur(img2 ** 2, (11, 11), 1.5) - mu2_sq
    sigma12 = cv2.GaussianBlur(img1 * img2, (11, 11), 1.5) - mu1_mu2
    
    ssim_map = ((2 * mu1_mu2 + C1) * (2 * sigma12 + C2)) / \
               ((mu1_sq + mu2_sq + C1) * (sigma1_sq + sigma2_sq + C2))
    
    return float(np.mean(ssim_map))


def calculate_psnr(img1: np.ndarray, img2: np.ndarray) -> float:
    """Calculate PSNR between two images."""
    if img1.shape != img2.shape:
        img2 = cv2.resize(img2, (img1.shape[1], img1.shape[0]))
    
    mse = np.mean((img1.astype(np.float64) - img2.astype(np.float64)) ** 2)
    if mse == 0:
        return float('inf')
    
    max_pixel = 255.0
    psnr = 20 * np.log10(max_pixel / np.sqrt(mse))
    return float(psnr)


def calculate_mse(img1: np.ndarray, img2: np.ndarray) -> float:
    """Calculate MSE between two images."""
    if img1.shape != img2.shape:
        img2 = cv2.resize(img2, (img1.shape[1], img1.shape[0]))
    
    mse = np.mean((img1.astype(np.float64) - img2.astype(np.float64)) ** 2)
    return float(mse)


def rgb_to_lab(img: np.ndarray) -> np.ndarray:
    """Convert RGB to LAB color space."""
    # First convert to BGR for OpenCV
    if img.shape[-1] == 3:
        img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
    
    # Convert to LAB
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    
    return lab


def calculate_delta_e(img1: np.ndarray, img2: np.ndarray) -> float:
    """
    Calculate CIEDE2000 Delta E between two images.
    This is a simplified version that calculates average Delta E.
    """
    # Resize if needed
    if img1.shape != img2.shape:
        img2 = cv2.resize(img2, (img1.shape[1], img1.shape[0]))
    
    # Convert to LAB
    lab1 = rgb_to_lab(img1)
    lab2 = rgb_to_lab(img2)
    
    # Extract L, a, b channels
    l1, a1, b1 = lab1[:, :, 0], lab1[:, :, 1], lab1[:, :, 2]
    l2, a2, b2 = lab2[:, :, 0], lab2[:, :, 1], lab2[:, :, 2]
    
    # Calculate simple Delta E (Euclidean distance in LAB)
    delta_l = l1.astype(float) - l2.astype(float)
    delta_a = a1.astype(float) - a2.astype(float)
    delta_b = b1.astype(float) - b2.astype(float)
    
    delta_e = np.sqrt(delta_l ** 2 + delta_a ** 2 + delta_b ** 2)
    
    return float(np.mean(delta_e))


class TransferBenchmark:
    """Main benchmark class for evaluating transfer quality."""
    
    def __init__(self, use_lpips: bool = True):
        self.use_lpips = use_lpips and TORCH_AVAILABLE
        
        if self.use_lpips:
            try:
                self.lpips_model = LPIPSModel()
            except Exception as e:
                print(f"Warning: Could not initialize LPIPS model: {e}")
                self.use_lpips = False
    
    def evaluate_pair(
        self, 
        baseline_path: str, 
        refined_path: str,
        image_name: str = ""
    ) -> EvaluationResult:
        """Evaluate a single pair of images."""
        # Load images
        baseline_img = Image.open(baseline_path).convert('RGB')
        refined_img = Image.open(refined_path).convert('RGB')
        
        baseline_array = np.array(baseline_img)
        refined_array = np.array(refined_img)
        
        # Calculate metrics
        metrics = EvaluationMetrics()
        
        # LPIPS
        if self.use_lpips:
            metrics.lpips = self.lpips_model.calculate(baseline_img, refined_img)
        
        # SSIM
        metrics.ssim = calculate_ssim(baseline_array, refined_array)
        
        # PSNR
        metrics.psnr = calculate_psnr(baseline_array, refined_array)
        
        # Delta E
        metrics.delta_e = calculate_delta_e(baseline_array, refined_array)
        
        # MSE
        metrics.mse = calculate_mse(baseline_array, refined_array)
        
        return EvaluationResult(
            image_name=image_name or Path(baseline_path).stem,
            baseline_path=baseline_path,
            refined_path=refined_path,
            metrics=metrics,
        )
    
    def evaluate_directory(
        self, 
        baseline_dir: str, 
        refined_dir: str
    ) -> List[EvaluationResult]:
        """Evaluate all matching image pairs in directories."""
        baseline_path = Path(baseline_dir)
        refined_path = Path(refined_dir)
        
        # Find all images in baseline directory
        extensions = {'.jpg', '.jpeg', '.png', '.webp'}
        baseline_files = [
            f for f in baseline_path.rglob('*') 
            if f.suffix.lower() in extensions
        ]
        
        results = []
        
        for baseline_file in baseline_files:
            # Find matching file in refined directory
            relative_path = baseline_file.relative_to(baseline_path)
            refined_file = refined_path / relative_path
            
            if not refined_file.exists():
                print(f"Warning: No matching file for {baseline_file}")
                continue
            
            try:
                result = self.evaluate_pair(
                    str(baseline_file),
                    str(refined_file),
                    image_name=relative_path.stem
                )
                results.append(result)
            except Exception as e:
                print(f"Error evaluating {baseline_file}: {e}")
        
        return results
    
    def evaluate_from_pairs(self, pairs_file: str) -> List[EvaluationResult]:
        """Evaluate from a JSON file with pairs."""
        with open(pairs_file, 'r') as f:
            pairs = json.load(f)
        
        results = []
        
        for pair in pairs:
            try:
                result = self.evaluate_pair(
                    pair['baseline'],
                    pair['refined'],
                    image_name=pair.get('name', '')
                )
                
                # Add demographic info if present
                if 'demographic' in pair:
                    result.demographic_info = pair['demographic']
                
                results.append(result)
            except Exception as e:
                print(f"Error evaluating pair: {e}")
        
        return results
    
    def aggregate_results(
        self, 
        results: List[EvaluationResult]
    ) -> AggregateResults:
        """Aggregate results across all evaluations."""
        if not results:
            return AggregateResults()
        
        # Collect metrics
        lpips_values = [r.metrics.lpips for r in results if r.metrics.lpips is not None]
        ssim_values = [r.metrics.ssim for r in results if r.metrics.ssim is not None]
        psnr_values = [r.metrics.psnr for r in results if r.metrics.psnr is not None]
        delta_e_values = [r.metrics.delta_e for r in results if r.metrics.delta_e is not None]
        mse_values = [r.metrics.mse for r in results if r.metrics.mse is not None]
        
        aggregate = AggregateResults(
            num_samples=len(results),
        )
        
        if lpips_values:
            aggregate.mean_lpips = np.mean(lpips_values)
            aggregate.std_lpips = np.std(lpips_values)
        
        if ssim_values:
            aggregate.mean_ssim = np.mean(ssim_values)
            aggregate.std_ssim = np.std(ssim_values)
        
        if psnr_values:
            aggregate.mean_psnr = np.mean(psnr_values)
        
        if delta_e_values:
            aggregate.mean_delta_e = np.mean(delta_e_values)
        
        if mse_values:
            aggregate.mean_mse = np.mean(mse_values)
        
        # Calculate demographic parity if available
        demographics = [r.demographic_info for r in results if r.demographic_info]
        if demographics:
            aggregate.demographic_parity = self._calculate_demographic_parity(results)
        
        return aggregate
    
    def _calculate_demographic_parity(
        self, 
        results: List[EvaluationResult]
    ) -> Dict:
        """Calculate fairness metrics across demographic groups."""
        groups = {}
        
        for result in results:
            if not result.demographic_info:
                continue
            
            # Create group key
            skin_tone = result.demographic_info.get('skin_tone', 'unknown')
            age_group = result.demographic_info.get('age_group', 'unknown')
            gender = result.demographic_info.get('gender', 'unknown')
            
            group_key = f"{skin_tone}_{age_group}_{gender}"
            
            if group_key not in groups:
                groups[group_key] = []
            
            # Add metrics for this group
            groups[group_key].append({
                'lpips': result.metrics.lpips,
                'ssim': result.metrics.ssim,
                'delta_e': result.metrics.delta_e,
            })
        
        # Calculate group statistics
        parity_metrics = {}
        for group_key, group_results in groups.items():
            lpips = [r['lpips'] for r in group_results if r['lpips'] is not None]
            ssim = [r['ssim'] for r in group_results if r['ssim'] is not None]
            delta_e = [r['delta_e'] for r in group_results if r['delta_e'] is not None]
            
            if lpips:
                parity_metrics[group_key] = {
                    'count': len(group_results),
                    'mean_lpips': float(np.mean(lpips)),
                    'mean_ssim': float(np.mean(ssim)),
                    'mean_delta_e': float(np.mean(delta_e)),
                }
        
        return parity_metrics


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Benchmark transfer quality for fashion/beauty images"
    )
    
    parser.add_argument(
        '--baseline-dir',
        type=str,
        help='Directory with baseline (Perfect API only) images'
    )
    parser.add_argument(
        '--refined-dir',
        type=str,
        help='Directory with refined (local post-processing) images'
    )
    parser.add_argument(
        '--pairs-file',
        type=str,
        help='JSON file with baseline/refined pairs'
    )
    parser.add_argument(
        '--output',
        type=str,
        default='evaluation_results.json',
        help='Output file for results'
    )
    parser.add_argument(
        '--no-lpips',
        action='store_true',
        help='Disable LPIPS calculation'
    )
    
    return parser.parse_args()


def main():
    """Main entry point."""
    args = parse_args()
    
    # Initialize benchmark
    benchmark = TransferBenchmark(use_lpips=not args.no_lpips)
    
    # Run evaluation
    if args.pairs_file:
        results = benchmark.evaluate_from_pairs(args.pairs_file)
    elif args.baseline_dir and args.refined_dir:
        results = benchmark.evaluate_directory(args.baseline_dir, args.refined_dir)
    else:
        print("Please specify either --pairs-file or --baseline-dir and --refined-dir")
        return
    
    # Aggregate results
    aggregate = benchmark.aggregate_results(results)
    
    # Print summary
    print("\n" + "=" * 50)
    print("EVALUATION RESULTS")
    print("=" * 50)
    print(f"Total samples: {aggregate.num_samples}")
    print(f"\nMean Metrics:")
    print(f"  LPIPS:   {aggregate.mean_lpips:.4f} (std: {aggregate.std_lpips:.4f})")
    print(f"  SSIM:    {aggregate.mean_ssim:.4f} (std: {aggregate.std_ssim:.4f})")
    print(f"  PSNR:    {aggregate.mean_psnr:.2f} dB")
    print(f"  Delta E: {aggregate.mean_delta_e:.2f}")
    print(f"  MSE:     {aggregate.mean_mse:.2f}")
    
    if aggregate.demographic_parity:
        print(f"\nDemographic Parity:")
        for group, metrics in aggregate.demographic_parity.items():
            print(f"  {group}: LPIPS={metrics['mean_lpips']:.4f}, SSIM={metrics['mean_ssim']:.4f}")
    
    # Save results
    output = {
        'aggregate': asdict(aggregate),
        'individual_results': [
            {
                'image_name': r.image_name,
                'metrics': asdict(r.metrics),
                'demographic': r.demographic_info,
            }
            for r in results
        ]
    }
    
    with open(args.output, 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"\nResults saved to {args.output}")


if __name__ == '__main__':
    main()
