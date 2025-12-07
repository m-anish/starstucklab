"""
Image Processing Commands

Migrated from regenerate_images.py to use the new lib structure.
Handles image generation, upscaling, and variant processing.
"""

import sys
import json
import os
from pathlib import Path
from copy import deepcopy
from typing import Dict, Optional, List
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add parent to path for lib imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from lib import Output, Config, Paths

# Try to import PIL
try:
    from PIL import Image, ImageOps
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


def cmd_process(args):
    """Process images: generate, upscale, and create variants"""
    
    if not PIL_AVAILABLE:
        Output.error("Pillow (PIL) not installed")
        Output.info("Install with: pip install pillow")
        return False
    
    # Get configuration
    config = Config.load()
    paths = Paths()
    
    # Load images manifest
    images_config_path = paths.images_config
    if not images_config_path.exists():
        Output.error(f"Images config not found: {images_config_path}")
        return False
    
    try:
        images_config = json.loads(images_config_path.read_text(encoding='utf-8'))
    except Exception as e:
        Output.error(f"Failed to load images config: {e}")
        return False
    
    # Parse arguments
    do_generate = args.generate if hasattr(args, 'generate') else False
    do_upscale = args.upscale if hasattr(args, 'upscale') else False
    do_process = args.process if hasattr(args, 'process') else True  # Default
    force = args.force if hasattr(args, 'force') else False
    
    # If nothing specified, default to process only
    if not (do_generate or do_upscale or do_process):
        do_process = True
    
    Output.section("Image Processing")
    Output.info(f"Config: {images_config_path}")
    Output.info(f"Output: {paths.public_assets}")
    Output.info(f"Generate: {do_generate}, Upscale: {do_upscale}, Process: {do_process}, Force: {force}")
    
    # Prepare scenes (validate and sync variants)
    try:
        prepared_config = _prepare_scenes(images_config)
    except Exception as e:
        Output.error(f"Failed to prepare config: {e}")
        return False
    
    scenes = prepared_config.get('scenes', {})
    if not scenes:
        Output.error("No scenes defined in images config")
        return False
    
    Output.success(f"Loaded {len(scenes)} scene(s)")
    
    # Process each scene
    for scene_key, scene in scenes.items():
        success = _process_scene(
            scene_key=scene_key,
            scene=scene,
            output_base=paths.public_assets,
            do_generate=do_generate,
            do_upscale=do_upscale,
            do_process=do_process,
            force=force,
            config=config
        )
        
        if not success:
            Output.warning(f"Scene '{scene_key}' had errors but continuing...")
    
    Output.success("Image processing complete")
    return True


def _prepare_scenes(config: dict) -> dict:
    """Resolve shared_variants and validate scene structure"""
    cfg = deepcopy(config)
    shared_variants = cfg.get('shared_variants')
    scenes = cfg.get('scenes', {})
    
    # Expand shared_variants reference
    for scene_key, scene in scenes.items():
        variants = scene.get('variants')
        if isinstance(variants, str) and variants == 'shared_variants':
            if not shared_variants:
                raise ValueError(f"Scene '{scene_key}' references shared_variants but none found")
            scene['variants'] = deepcopy(shared_variants)
    
    return cfg


def _process_scene(
    scene_key: str,
    scene: dict,
    output_base: Path,
    do_generate: bool,
    do_upscale: bool,
    do_process: bool,
    force: bool,
    config: dict
) -> bool:
    """Process a single scene"""
    
    Output.header(f"Processing scene: {scene_key}")
    
    scene_out = output_base / scene_key
    scene_out.mkdir(parents=True, exist_ok=True)
    
    variants = scene.get('variants', [])
    master_path_cfg = scene.get('master')
    
    if not master_path_cfg:
        Output.error(f"Scene '{scene_key}' missing 'master' path")
        return False
    
    master_path = Path(master_path_cfg)
    
    # Load master image if it exists
    master_img = None
    if master_path.exists():
        try:
            master_img = Image.open(master_path).convert('RGB')
            Output.info(f"Loaded master: {master_path} ({master_img.width}x{master_img.height})")
        except Exception as e:
            Output.warning(f"Failed to load master: {e}")
    else:
        Output.warning(f"Master not found at {master_path}")
    
    # Sort variants by type (generate -> master -> crop -> resize)
    type_order = {'generate': 0, 'master': 1, 'crop': 2, 'resize': 3}
    variants_sorted = sorted(variants, key=lambda v: type_order.get(v.get('type'), 99))
    
    produced = {}
    
    # Process each variant
    for variant in variants_sorted:
        vid = variant.get('id', 'unknown')
        vtype = variant.get('type', 'unknown')
        
        base_fname = variant.get('filename') or f"{vid}.webp"
        prefixed_fname = f"{scene_key}-{base_fname}"
        out_path = scene_out / prefixed_fname
        
        # Handle different variant types
        if vtype == 'master':
            if master_path.exists() and (not out_path.exists() or force):
                Output.progress(f"Copying master → {out_path.name}")
                try:
                    img = Image.open(master_path).convert('RGB')
                    _save_image(img, out_path)
                except Exception as e:
                    Output.warning(f"Master copy failed: {e}")
            produced[vid] = out_path
        
        elif vtype == 'generate':
            if do_generate:
                Output.info(f"[GENERATE] {vid} → {out_path.name}")
                Output.warning("Generation is a stub - implement with your image generator")
                # Stub: create a placeholder
                if not out_path.exists() or force:
                    w = int(variant.get('width', 1433))
                    h = int(variant.get('height', 896))
                    img = Image.new('RGB', (w, h), (24, 24, 24))
                    _save_image(img, out_path)
            produced[vid] = out_path
        
        elif do_process:
            # Crop or resize - need source image
            src_img = master_img
            
            if src_img is None:
                Output.warning(f"No source image for variant '{vid}' - skipping")
                continue
            
            w = int(variant.get('width', src_img.width))
            h = int(variant.get('height', src_img.height))
            centered = variant.get('centered', True)
            quality = variant.get('quality', 75)
            
            if not out_path.exists() or force:
                if vtype == 'crop':
                    Output.progress(f"Crop [{w}x{h}] → {out_path.name}")
                    out_img = _crop_center(src_img, w, h, centered)
                    _save_image(out_img, out_path, quality)
                
                elif vtype == 'resize':
                    Output.progress(f"Resize [{w}x{h}] → {out_path.name}")
                    out_img = _resize_contain(src_img, w, h)
                    _save_image(out_img, out_path, quality)
                
                else:
                    Output.warning(f"Unknown variant type: {vtype}")
                    continue
            
            produced[vid] = out_path
    
    Output.success(f"Scene '{scene_key}' complete: {len(produced)} variants")
    return True


def _crop_center(img: Image.Image, target_w: int, target_h: int, centered: bool = True) -> Image.Image:
    """Crop image to target dimensions from center"""
    src_w, src_h = img.size
    
    if src_w == target_w and src_h == target_h:
        return img.copy()
    
    tgt_aspect = target_w / target_h
    src_aspect = src_w / src_h
    
    # Calculate crop dimensions
    if src_aspect > tgt_aspect:
        new_w = int(src_h * tgt_aspect)
        new_h = src_h
    else:
        new_w = src_w
        new_h = int(src_w / tgt_aspect)
    
    # Calculate crop position
    if centered:
        left = (src_w - new_w) // 2
        upper = (src_h - new_h) // 2
    else:
        left = 0
        upper = 0
    
    right = left + new_w
    lower = upper + new_h
    
    # Crop and resize
    img_cropped = img.crop((left, upper, right, lower))
    img_resized = img_cropped.resize((target_w, target_h), Image.LANCZOS)
    return img_resized


def _resize_contain(img: Image.Image, target_w: int, target_h: int) -> Image.Image:
    """Resize image to fit within target dimensions while preserving aspect"""
    return ImageOps.contain(img, (target_w, target_h), Image.LANCZOS)


def _save_image(img: Image.Image, out_path: Path, quality: int = 75):
    """Save image as WebP with quality setting"""
    # Force RGB (no alpha)
    if img.mode == 'RGBA':
        bg = Image.new('RGB', img.size, (255, 255, 255))
        bg.paste(img, mask=img.split()[3])
        img = bg
    elif img.mode != 'RGB':
        img = img.convert('RGB')
    
    out_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Always save as WebP
    webp_path = out_path.with_suffix('.webp')
    img.save(webp_path, 'WEBP', quality=quality, method=6)