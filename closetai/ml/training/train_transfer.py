#!/usr/bin/env python3
"""
Transfer Learning Training Script for Fashion & Beauty Refinement

Trains a refinement model to improve Perfect API outputs using:
- Paired dataset (provider output → ground truth studio photo)
- Perceptual loss (LPIPS + L1 + VGG)
- Mixed precision training
- Gradient accumulation for large images

Usage:
    python train_transfer.py --config config.yaml
    python train_transfer.py --data-dir ./pairs --epochs 100 --batch-size 4

@author: R&D Team
@date: 2024
"""

import os
import sys
import argparse
import yaml
import json
import random
import numpy as np
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from torch.cuda.amp import GradScaler, autocast
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingWarmRestarts
from torchvision import models, transforms
from PIL import Image
import cv2
from tqdm import tqdm

# Try importing optional dependencies
try:
    import lpips
    LPIPS_AVAILABLE = True
except ImportError:
    LPIPS_AVAILABLE = False
    print("Warning: lpips not available, using alternative losses")


# ============================================================================
# Model Definitions
# ============================================================================

class ResNetEncoder(nn.Module):
    """ResNet-based encoder for feature extraction."""
    
    def __init__(self, pretrained: bool = True):
        super().__init__()
        
        # Load pretrained ResNet
        resnet = models.resnet34(pretrained=pretrained)
        
        # Extract layers
        self.conv1 = resnet.conv1
        self.bn1 = resnet.bn1
        self.relu = resnet.relu
        self.maxpool = resnet.maxpool
        
        self.layer1 = resnet.layer1
        self.layer2 = resnet.layer2
        self.layer3 = resnet.layer3
        self.layer4 = resnet.layer4
        
    def forward(self, x: torch.Tensor) -> List[torch.Tensor]:
        """Extract multi-scale features."""
        features = []
        
        x = self.conv1(x)
        x = self.bn1(x)
        x = self.relu(x)
        x = self.maxpool(x)
        
        x = self.layer1(x)
        features.append(x)
        
        x = self.layer2(x)
        features.append(x)
        
        x = self.layer3(x)
        features.append(x)
        
        x = self.layer4(x)
        features.append(x)
        
        return features


class RefinementUNet(nn.Module):
    """
    U-Net based refinement network for image enhancement.
    Takes provider output and refines it to match ground truth quality.
    """
    
    def __init__(
        self, 
        in_channels: int = 3, 
        out_channels: int = 3,
        base_channels: int = 64,
        num_residual_blocks: int = 9
    ):
        super().__init__()
        
        # Initial convolution
        self.conv_in = nn.Conv2d(in_channels, base_channels, kernel_size=3, padding=1)
        
        # Encoder
        self.enc1 = self._make_encoder_block(base_channels, base_channels)
        self.enc2 = self._make_encoder_block(base_channels, base_channels * 2)
        self.enc3 = self._make_encoder_block(base_channels * 2, base_channels * 4)
        self.enc4 = self._make_encoder_block(base_channels * 4, base_channels * 8)
        
        # Residual blocks
        self.res_blocks = nn.ModuleList([
            self._make_residual_block(base_channels * 8)
            for _ in range(num_residual_blocks)
        ])
        
        # Decoder
        self.dec4 = self._make_decoder_block(base_channels * 8, base_channels * 4)
        self.dec3 = self._make_decoder_block(base_channels * 4, base_channels * 2)
        self.dec2 = self._make_decoder_block(base_channels * 2, base_channels)
        self.dec1 = self._make_decoder_block(base_channels, base_channels)
        
        # Output
        self.conv_out = nn.Conv2d(base_channels, out_channels, kernel_size=3, padding=1)
        
        # Skip connections
        self.pool = nn.MaxPool2d(2)
        self.upsample = nn.Upsample(scale_factor=2, mode='bilinear', align_corners=True)
        
    def _make_encoder_block(self, in_ch: int, out_ch: int) -> nn.Sequential:
        return nn.Sequential(
            nn.Conv2d(in_ch, out_ch, kernel_size=3, padding=1),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_ch, out_ch, kernel_size=3, padding=1),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
        )
    
    def _make_decoder_block(self, in_ch: int, out_ch: int) -> nn.Sequential:
        return nn.Sequential(
            nn.Conv2d(in_ch, out_ch, kernel_size=3, padding=1),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_ch, out_ch, kernel_size=3, padding=1),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
        )
    
    def _make_residual_block(self, channels: int) -> nn.Sequential:
        return nn.Sequential(
            nn.Conv2d(channels, channels, kernel_size=3, padding=1),
            nn.BatchNorm2d(channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(channels, channels, kernel_size=3, padding=1),
            nn.BatchNorm2d(channels),
        )
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Initial convolution
        x = self.conv_in(x)
        
        # Encoder with skip connections
        e1 = self.enc1(x)
        e2 = self.enc2(self.pool(e1))
        e3 = self.enc3(self.pool(e2))
        e4 = self.enc4(self.pool(e3))
        
        # Residual blocks
        for res_block in self.res_blocks:
            e4 = e4 + F.relu(res_block(e4))
        
        # Decoder with skip connections
        d4 = self.dec4(self.upsample(e4))
        d3 = self.dec3(self.upsample(d4 + e3))
        d2 = self.dec2(self.upsample(d3 + e2))
        d1 = self.dec1(self.upsample(d2 + e1))
        
        # Output
        out = self.conv_out(d1)
        
        return torch.sigmoid(out)


class VGGPerceptualLoss(nn.Module):
    """VGG-based perceptual loss."""
    
    def __init__(self, layers: List[str] = None):
        super().__init__()
        
        if layers is None:
            layers = ['relu1_2', 'relu2_2', 'relu3_3', 'relu4_3']
        
        vgg = models.vgg16(pretrained=True).features
        self.layers = layers
        
        # Extract specified layers
        self.slice = nn.Module()
        prev_idx = 0
        for i, layer in enumerate(vgg):
            if isinstance(layer, nn.MaxPool2d):
                setattr(self.slice, f'layer_{i}', nn.Sequential(*vgg[prev_idx:i+1]))
                prev_idx = i + 1
        
        # Freeze parameters
        for param in self.parameters():
            param.requires_grad = False
    
    def forward(self, x: torch.Tensor, target: torch.Tensor) -> torch.Tensor:
        loss = 0
        
        for name, module in self.slice.named_children():
            x = module(x)
            target = module(target)
            loss += F.mse_loss(x, target)
        
        return loss


# ============================================================================
# Dataset
# ============================================================================

class PairedImageDataset(Dataset):
    """Dataset of paired images (provider output, ground truth)."""
    
    def __init__(
        self, 
        data_dir: str,
        transform: Optional[transforms.Compose] = None,
        image_size: int = 512
    ):
        self.data_dir = Path(data_dir)
        self.image_size = image_size
        
        # Find all pairs
        self.pairs = []
        
        # Look for pairs in format:
        # - input/*.jpg and target/*.jpg
        # - *-input.jpg and *-target.jpg
        input_dir = self.data_dir / 'input'
        target_dir = self.data_dir / 'target'
        
        if input_dir.exists() and target_dir.exists():
            input_files = list(input_dir.glob('*.jpg')) + list(input_dir.glob('*.png'))
            for inp in input_files:
                target_file = target_dir / inp.name
                if target_file.exists():
                    self.pairs.append((str(inp), str(target_file)))
        
        # Also look for pairs in same directory (*-input.jpg, *-target.jpg)
        for file in self.data_dir.glob('*-input.jpg'):
            target = file.parent / file.name.replace('-input', '-target')
            if target.exists():
                self.pairs.append((str(file), str(target)))
        
        self.transform = transform or transforms.Compose([
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
        ])
    
    def __len__(self) -> int:
        return len(self.pairs)
    
    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        input_path, target_path = self.pairs[idx]
        
        # Load images
        input_img = Image.open(input_path).convert('RGB')
        target_img = Image.open(target_path).convert('RGB')
        
        # Apply transforms
        input_tensor = self.transform(input_img)
        target_tensor = self.transform(target_img)
        
        return input_tensor, target_tensor


# ============================================================================
# Training
# ============================================================================

class TransferTrainer:
    """Trainer for the refinement model."""
    
    def __init__(
        self,
        model: nn.Module,
        device: str = 'cuda',
        lr: float = 1e-4,
        weight_decay: float = 1e-5,
        use_amp: bool = True
    ):
        self.device = torch.device(device if torch.cuda.is_available() else 'cpu')
        self.model = model.to(self.device)
        self.use_amp = use_amp
        
        # Optimizer
        self.optimizer = AdamW(
            model.parameters(),
            lr=lr,
            weight_decay=weight_decay
        )
        
        # Loss functions
        self.l1_loss = nn.L1Loss()
        
        if LPIPS_AVAILABLE:
            self.lpips_loss = lpips.LPIPS(net='alex').to(self.device)
            self.lpips_loss.eval()
        
        self.perceptual_loss = VGGPerceptualLoss().to(self.device)
        
        # Mixed precision scaler
        self.scaler = GradScaler() if use_amp else None
        
        # Learning rate scheduler
        self.scheduler = CosineAnnealingWarmRestarts(
            self.optimizer, 
            T_0=10, 
            T_mult=2
        )
        
        # Metrics tracking
        self.train_losses = []
        self.val_losses = []
        
    def train_epoch(
        self, 
        dataloader: DataLoader,
        lambda_l1: float = 1.0,
        lambda_lpips: float = 0.5,
        lambda_perceptual: float = 0.1,
        gradient_accumulation_steps: int = 4
    ) -> float:
        """Train for one epoch."""
        self.model.train()
        
        total_loss = 0
        num_batches = 0
        
        self.optimizer.zero_grad()
        
        for batch_idx, (input_img, target_img) in enumerate(tqdm(dataloader, desc='Training')):
            input_img = input_img.to(self.device)
            target_img = target_img.to(self.device)
            
            # Forward pass with mixed precision
            if self.use_amp:
                with autocast():
                    output = self.model(input_img)
                    
                    # Calculate losses
                    loss_l1 = self.l1_loss(output, target_img)
                    loss_perceptual = self.perceptual_loss(output, target_img)
                    
                    if LPIPS_AVAILABLE:
                        loss_lpips = self.lpips_loss(output, target_img).mean()
                        loss = (lambda_l1 * loss_l1 + 
                               lambda_lpips * loss_lpips + 
                               lambda_perceptual * loss_perceptual)
                    else:
                        loss = lambda_l1 * loss_l1 + lambda_perceptual * loss_perceptual
                    
                    loss = loss / gradient_accumulation_steps
                
                # Backward pass
                self.scaler.scale(loss).backward()
                
                # Update weights
                if (batch_idx + 1) % gradient_accumulation_steps == 0:
                    self.scaler.step(self.optimizer)
                    self.scaler.update()
                    self.optimizer.zero_grad()
            else:
                output = self.model(input_img)
                
                loss_l1 = self.l1_loss(output, target_img)
                loss_perceptual = self.perceptual_loss(output, target_img)
                
                if LPIPS_AVAILABLE:
                    loss_lpips = self.lpips_loss(output, target_img).mean()
                    loss = (lambda_l1 * loss_l1 + 
                           lambda_lpips * loss_lpips + 
                           lambda_perceptual * loss_perceptual)
                else:
                    loss = lambda_l1 * loss_l1 + lambda_perceptual * loss_perceptual
                
                loss = loss / gradient_accumulation_steps
                loss.backward()
                
                if (batch_idx + 1) % gradient_accumulation_steps == 0:
                    self.optimizer.step()
                    self.optimizer.zero_grad()
            
            total_loss += loss.item() * gradient_accumulation_steps
            num_batches += 1
        
        self.scheduler.step()
        
        return total_loss / num_batches
    
    def validate(self, dataloader: DataLoader) -> float:
        """Validate the model."""
        self.model.eval()
        
        total_loss = 0
        num_batches = 0
        
        with torch.no_grad():
            for input_img, target_img in tqdm(dataloader, desc='Validating'):
                input_img = input_img.to(self.device)
                target_img = target_img.to(self.device)
                
                output = self.model(input_img)
                
                loss_l1 = self.l1_loss(output, target_img)
                total_loss += loss_l1.item()
                num_batches += 1
        
        return total_loss / num_batches
    
    def save_checkpoint(
        self, 
        path: str, 
        epoch: int, 
        best_loss: float
    ) -> None:
        """Save model checkpoint."""
        checkpoint = {
            'epoch': epoch,
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'scheduler_state_dict': self.scheduler.state_dict(),
            'train_losses': self.train_losses,
            'val_losses': self.val_losses,
            'best_loss': best_loss,
        }
        
        if self.use_amp:
            checkpoint['scaler_state_dict'] = self.scaler.state_dict()
        
        torch.save(checkpoint, path)
        print(f"Checkpoint saved to {path}")
    
    def load_checkpoint(self, path: str) -> Tuple[int, float]:
        """Load model checkpoint."""
        checkpoint = torch.load(path, map_location=self.device)
        
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        self.scheduler.load_state_dict(checkpoint['scheduler_state_dict'])
        
        self.train_losses = checkpoint.get('train_losses', [])
        self.val_losses = checkpoint.get('val_losses', [])
        
        if self.use_amp and 'scaler_state_dict' in checkpoint:
            self.scaler.load_state_dict(checkpoint['scaler_state_dict'])
        
        return checkpoint['epoch'], checkpoint.get('best_loss', float('inf'))


def set_seed(seed: int = 42):
    """Set random seed for reproducibility."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Train transfer/refinement model for fashion/beauty"
    )
    
    parser.add_argument(
        '--config',
        type=str,
        help='Path to YAML configuration file'
    )
    parser.add_argument(
        '--data-dir',
        type=str,
        default='./data/pairs',
        help='Directory with paired training data'
    )
    parser.add_argument(
        '--val-dir',
        type=str,
        default=None,
        help='Directory with paired validation data'
    )
    parser.add_argument(
        '--epochs',
        type=int,
        default=100,
        help='Number of training epochs'
    )
    parser.add_argument(
        '--batch-size',
        type=int,
        default=8,
        help='Batch size (per GPU)'
    )
    parser.add_argument(
        '--lr',
        type=float,
        default=1e-4,
        help='Learning rate'
    )
    parser.add_argument(
        '--image-size',
        type=int,
        default=512,
        help='Image size for training'
    )
    parser.add_argument(
        '--device',
        type=str,
        default='cuda',
        help='Device to use (cuda/cpu)'
    )
    parser.add_argument(
        '--output-dir',
        type=str,
        default='./outputs',
        help='Output directory for checkpoints'
    )
    parser.add_argument(
        '--resume',
        type=str,
        default=None,
        help='Resume from checkpoint'
    )
    parser.add_argument(
        '--seed',
        type=int,
        default=42,
        help='Random seed'
    )
    
    return parser.parse_args()


def load_config(config_path: str) -> Dict:
    """Load configuration from YAML file."""
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)


def main():
    """Main entry point."""
    args = parse_args()
    
    # Set seed
    set_seed(args.seed)
    
    # Load config if provided
    config = {}
    if args.config:
        config = load_config(args.config)
    
    # Override config with CLI args
    data_dir = args.data_dir or config.get('data_dir', './data/pairs')
    val_dir = args.val_dir or config.get('val_dir')
    epochs = args.epochs or config.get('epochs', 100)
    batch_size = args.batch_size or config.get('batch_size', 8)
    lr = args.lr or config.get('lr', 1e-4)
    image_size = args.image_size or config.get('image_size', 512)
    device = args.device or config.get('device', 'cuda')
    output_dir = Path(args.output_dir or config.get('output_dir', './outputs'))
    
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Create datasets
    train_dataset = PairedImageDataset(
        data_dir=data_dir,
        image_size=image_size
    )
    
    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=4,
        pin_memory=True
    )
    
    val_loader = None
    if val_dir:
        val_dataset = PairedImageDataset(
            data_dir=val_dir,
            image_size=image_size
        )
        val_loader = DataLoader(
            val_dataset,
            batch_size=batch_size,
            shuffle=False,
            num_workers=4,
            pin_memory=True
        )
    
    print(f"Training dataset: {len(train_dataset)} pairs")
    if val_loader:
        print(f"Validation dataset: {len(val_dataset)} pairs")
    
    # Create model
    model = RefinementUNet(
        in_channels=3,
        out_channels=3,
        base_channels=64,
        num_residual_blocks=9
    )
    
    # Create trainer
    trainer = TransferTrainer(
        model=model,
        device=device,
        lr=lr,
        use_amp=torch.cuda.is_available()
    )
    
    # Resume from checkpoint if specified
    start_epoch = 0
    best_loss = float('inf')
    
    if args.resume:
        start_epoch, best_loss = trainer.load_checkpoint(args.resume)
        print(f"Resumed from epoch {start_epoch}")
    
    # Training loop
    print(f"\nStarting training for {epochs} epochs...")
    
    for epoch in range(start_epoch, epochs):
        print(f"\nEpoch {epoch + 1}/{epochs}")
        
        # Train
        train_loss = trainer.train_epoch(train_loader)
        print(f"Train Loss: {train_loss:.4f}")
        trainer.train_losses.append(train_loss)
        
        # Validate
        if val_loader:
            val_loss = trainer.validate(val_loader)
            print(f"Val Loss: {val_loss:.4f}")
            trainer.val_losses.append(val_loss)
            
            # Save best model
            if val_loss < best_loss:
                best_loss = val_loss
                trainer.save_checkpoint(
                    str(output_dir / 'best_model.pt'),
                    epoch,
                    best_loss
                )
        
        # Save periodic checkpoint
        if (epoch + 1) % 10 == 0:
            trainer.save_checkpoint(
                str(output_dir / f'checkpoint_epoch_{epoch+1}.pt'),
                epoch,
                best_loss
            )
    
    # Save final model
    trainer.save_checkpoint(
        str(output_dir / 'final_model.pt'),
        epochs,
        best_loss
    )
    
    # Save training history
    history = {
        'train_losses': trainer.train_losses,
        'val_losses': trainer.val_losses,
    }
    
    with open(output_dir / 'training_history.json', 'w') as f:
        json.dump(history, f, indent=2)
    
    print(f"\nTraining complete! Best loss: {best_loss:.4f}")
    print(f"Models saved to {output_dir}")


if __name__ == '__main__':
    main()
