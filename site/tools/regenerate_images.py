#!/usr/bin/env python3
# SPDX-License-Identifier: DWYWBDBM-1.0
# Licensed under the "Do What You Want But Don’t Blame Me" License, Version 1.0.
# See the COPYING file or visit https://starstucklab.com/license for details.

"""
regenerate_images.py

Usage:
    regenerate_images.py [--generate] [--upscale] [--process] [--force] [--auto-sync]
                       [--config PATH] [--out-dir PATH]

Notes/changes from earlier:
- Config default path is `src/data/images.json` (script runs from site/).
- All generated output filenames are prefixed with the scene name to avoid collisions:
    e.g. `hero-desktop-3840x2160.png` becomes `hero-hero-desktop-3840x2160.png`.
- Fixes JPEG saving issue by converting RGBA -> RGB before writing JPEGs.
- Writes scene outputs to per-scene folders under the output base dir (default: public/assets).
- Supports shared_variants and optional auto-sync (use --auto-sync).
- Generation/upscaling functions are stubs — replace with your generator/upscaler calls.
"""

import argparse
import json
import sys
from pathlib import Path
from copy import deepcopy
from PIL import Image, ImageOps
from shutil import copyfile

# ------------------------------------------------------------------------------
# Configurable defaults
# ------------------------------------------------------------------------------
DEFAULT_CONFIG_PATH = Path("src/data/images.json")   # relative path when running from site/
DEFAULT_OUT_DIR = Path("public/assets")
AUTO_SYNC_DEFAULT = False

# ------------------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------------------
def load_config(path: Path):
    if not path.exists():
        raise FileNotFoundError(f"images.json not found at {path.resolve()}")
    return json.loads(path.read_text(encoding="utf-8"))

def write_config(path: Path, config: dict):
    path.write_text(json.dumps(config, indent=2, ensure_ascii=False), encoding="utf-8")

def _normalize_variant(v: dict):
    # Fields considered important for equality checks
    keys = ["id","type","width","height","aspect","centered","filename","prompt_file","steps","guidance","quality"]
    return {k: v.get(k) for k in keys if k in v}

def _validate_unique_ids(variants, scene_key):
    ids = [v.get("id") for v in variants]
    dup = {x for x in ids if ids.count(x) > 1}
    if dup:
        raise ValueError(f"Duplicate variant id(s) {dup} in scene '{scene_key}'")

def ensure_dir(p: Path):
    p.mkdir(parents=True, exist_ok=True)

# ------------------------------------------------------------------------------
# Image ops
# ------------------------------------------------------------------------------
def crop_center_to_aspect(img: Image.Image, target_w: int, target_h: int, centered=True):
    """
    Crop the PIL image to the target width/height by center-cropping.
    If the image is smaller than target in either dimension, it will be resized (not padded).
    """
    src_w, src_h = img.size
    tgt_aspect = target_w / target_h
    src_aspect = src_w / src_h

    # If same exact size do nothing
    if src_w == target_w and src_h == target_h:
        return img.copy()

    # Determine crop box to match aspect
    if src_aspect > tgt_aspect:
        # source is wider -> crop width
        new_w = int(src_h * tgt_aspect)
        new_h = src_h
    else:
        # source is taller -> crop height
        new_w = src_w
        new_h = int(src_w / tgt_aspect)

    left = (src_w - new_w) // 2 if centered else 0
    upper = (src_h - new_h) // 2 if centered else 0
    right = left + new_w
    lower = upper + new_h

    img_cropped = img.crop((left, upper, right, lower))
    img_resized = img_cropped.resize((target_w, target_h), Image.LANCZOS)
    return img_resized

def resize_to(img: Image.Image, target_w: int, target_h: int):
    # Contain (fit within) target size while preserving aspect
    return ImageOps.contain(img, (target_w, target_h), Image.LANCZOS)

# ------------------------------------------------------------------------------
# Generation & Upscale hooks (user must implement actual generator/upscaler)
# ------------------------------------------------------------------------------
def _handle_generate(variant: dict, scene_key: str, out_path: Path, force=False):
    """
    Placeholder for integration with your image generator.
    - If exists and not force, skip.
    - Otherwise create a small placeholder image so downstream cropping can run during testing.
    Replace this with an actual generator invocation (Stable Diffusion / etc).
    """
    if out_path.exists() and not force:
        print(f"  ℹ generate: exists {out_path.name}, skipping")
        return out_path

    prompt_file = variant.get("prompt_file")
    print(f"  ▶ [GENERATE] ({scene_key}) -> {out_path}")
    print(f"      Prompt file: {prompt_file}")
    print("      Note: _handle_generate is a stub. Replace with your generator call.")
    # Create a simple placeholder image for testing
    w = int(variant.get("width", 2048))
    h = int(variant.get("height", 1280))
    ensure_dir(out_path.parent)
    im = Image.new("RGBA", (w, h), (24, 24, 24, 255))
    im.save(out_path)
    return out_path

def _handle_upscale(src: Path, dst: Path, force=False):
    """
    Placeholder for upscaling integration.
    By default, copy src -> dst (no-op). Replace with a real upscaler (Real-ESRGAN etc).
    """
    if dst.exists() and not force:
        print(f"  ℹ upscale: exists {dst.name}, skipping")
        return dst
    print(f"  ▶ [UPSCALE] {src} -> {dst}")
    ensure_dir(dst.parent)
    try:
        copyfile(src, dst)
    except Exception as e:
        print(f"  ⚠ Upscale copy failed: {e}")
        raise
    return dst

# ------------------------------------------------------------------------------
# Main orchestration helpers
# ------------------------------------------------------------------------------
def prepare_scenes(config: dict, auto_sync=False, config_path: Path = None, write_back=False):
    """
    Resolve shared_variants shorthand, validate scenes, and optionally auto-sync variants.
    Returns: (updated_config, canonical_scene_key)
    """
    cfg = deepcopy(config)
    shared_variants = cfg.get("shared_variants")
    scenes = cfg.get("scenes", {})
    if not scenes:
        raise SystemExit("❌ No scenes defined in images.json")

    # Resolve shorthand references
    for sk, scene in scenes.items():
        v = scene.get("variants")
        if isinstance(v, str) and v == "shared_variants":
            if not shared_variants:
                raise SystemExit(f"❌ Scene '{sk}' references shared_variants but none found")
            scene["variants"] = deepcopy(shared_variants)

    # Build canonical variant list from first scene
    scene_keys = list(scenes.keys())
    canonical = None
    canonical_scene = None
    for sk in scene_keys:
        vlist = scenes[sk].get("variants", [])
        _validate_unique_ids(vlist, sk)
        norm = [_normalize_variant(v) for v in vlist]
        if canonical is None:
            canonical = norm
            canonical_scene = sk
        else:
            if norm != canonical:
                msg = f"Variant mismatch between scenes: canonical={canonical_scene}, mismatch_in={sk}"
                if auto_sync:
                    print(f"  ⚠ {msg}  (auto-sync enabled -> overwriting '{sk}' variants)")
                    scenes[sk]["variants"] = deepcopy(scenes[canonical_scene]["variants"])
                else:
                    raise SystemExit(f"❌ {msg}. Use --auto-sync to force synchronization.")
    print(f"✅ Variants consistent (canonical scene: {canonical_scene})")
    if write_back and auto_sync and config_path:
        print(f"  ↳ Writing synced images.json back to {config_path}")
        write_config(config_path, cfg)
    return cfg, canonical_scene

def _safe_save_image(img: Image.Image, out_path: Path, quality=None, **save_kwargs):
    """
    Save image to out_path with optimizations.
    - Supports WebP, JPEG, PNG
    - Converts RGBA -> RGB for JPEG/WebP
    - Applies quality settings and optimization
    """
    ext = out_path.suffix.lower()
    
    # Convert RGBA -> RGB for formats that don't support alpha
    if ext in [".jpg", ".jpeg", ".webp"] and img.mode == "RGBA":
        # Create white background
        bg = Image.new("RGB", img.size, (255, 255, 255))
        bg.paste(img, mask=img.split()[3] if img.mode == "RGBA" else None)
        img = bg
    
    ensure_dir(out_path.parent)
    
    if ext == ".webp":
        # WebP with quality and optimization
        q = quality if quality is not None else 85
        img.save(out_path, "WEBP", quality=q, method=6, **save_kwargs)
    elif ext in [".jpg", ".jpeg"]:
        # JPEG with quality and progressive encoding
        q = quality if quality is not None else 85
        img.save(out_path, "JPEG", quality=q, optimize=True, progressive=True, **save_kwargs)
    elif ext == ".png":
        # PNG with optimization
        img.save(out_path, "PNG", optimize=True, **save_kwargs)
    else:
        # Fallback
        img.save(out_path, **save_kwargs)

def process_scene(scene_key: str, scene: dict, out_base: Path, force=False):
    """
    For a single scene:
     - ensure master exists
     - for each variant:
         * generate previews (generate)
         * upscale previews to master (upscale)
         * crop/resize master (or generated preview fallback) into variants
    Filenames are prefixed with the scene key to avoid collisions.
    """
    print(f"\n== Processing scene '{scene_key}' ==")
    scene_out = out_base / scene_key
    ensure_dir(scene_out)
    variants = scene.get("variants", [])
    master_path_cfg = scene.get("master")
    if not master_path_cfg:
        raise SystemExit(f"❌ Scene '{scene_key}' missing 'master' path in manifest")

    master_path = Path(master_path_cfg)
    if not master_path.is_absolute():
        # If manifest holds a relative master path, interpret relative to repository root (cwd)
        master_path = Path(master_path_cfg)

    # Try to open master if present
    master_img = None
    if master_path.exists():
        try:
            master_img = Image.open(master_path).convert("RGBA")
            print(f"  ℹ Found master at {master_path} ({master_img.width}x{master_img.height})")
        except Exception as e:
            print(f"  ⚠ Failed to open master image {master_path}: {e}")
            master_img = None
    else:
        print(f"  ⚠ Master not found at {master_path}. Crops will prefer generated preview if available.")

    produced = {}  # id -> Path

    # Ensure generate variants processed first (deterministic)
    type_order = {"generate": 0, "master": 1, "crop": 2, "resize": 3}
    variants_sorted = sorted(variants, key=lambda v: type_order.get(v.get("type"), 99))

    for v in variants_sorted:
        vid = v.get("id")
        vtype = v.get("type")
        base_fname = v.get("filename") or f"{vid}.png"
        prefixed_fname = f"{scene_key}-{base_fname}"
        out_path = scene_out / prefixed_fname

        if vtype == "master":
            # copy master into scene_out with scene prefix (if master_path exists)
            if master_path.exists():
                if not out_path.exists() or force:
                    print(f"  ⤷ copying master -> {out_path.name}")
                    ensure_dir(out_path.parent)
                    try:
                        # open and save to normalize format
                        img = Image.open(master_path)
                        # Convert JPEG target if needed
                        if out_path.suffix.lower() in [".jpg", ".jpeg"] and img.mode == "RGBA":
                            img = img.convert("RGB")
                        img.save(out_path)
                    except Exception:
                        # fallback to raw copy
                        copyfile(master_path, out_path)
                produced[vid] = out_path
            else:
                print(f"  ⚠ master variant '{vid}' declared but master file missing at {master_path}")
            continue

        if vtype == "generate":
            produced_path = _handle_generate(v, scene_key, out_path, force=force)
            produced[vid] = produced_path
            # If no master image, use this generated preview as fallback source
            if master_img is None and produced_path and Path(produced_path).exists():
                try:
                    master_img = Image.open(produced_path).convert("RGBA")
                    print(f"    ↳ Using generated preview as temporary master ({produced_path.name})")
                except Exception as e:
                    print(f"    ⚠ Failed to open generated preview {produced_path}: {e}")
            continue

        # For crop/resize we need a source image (prefer master_img)
        src_img = None
        if master_img is not None:
            src_img = master_img
        else:
            # fallback: try to find any previously produced generated preview
            for pvid, ppath in produced.items():
                if ppath and Path(ppath).exists():
                    try:
                        src_img = Image.open(ppath).convert("RGBA")
                        print(f"    ↳ Fallback using generated '{pvid}' as source for {vid}")
                        break
                    except Exception:
                        continue

        if src_img is None:
            print(f"  ⚠ No source image available for variant '{vid}' (type={vtype}). Skipping.")
            continue

        w = int(v.get("width", src_img.width))
        h = int(v.get("height", src_img.height))
        centered = v.get("centered", True)

        quality = v.get("quality")
        ensure_dir(out_path.parent)
        if vtype == "crop":
            print(f"  ⤷ crop [{w}x{h}] -> {out_path.name}")
            out_img = crop_center_to_aspect(src_img, w, h, centered=centered)
            _safe_save_image(out_img, out_path, quality=quality)
            produced[vid] = out_path

        elif vtype == "resize":
            print(f"  ⤷ resize contain [{w}x{h}] -> {out_path.name}")
            out_img = resize_to(src_img, w, h)
            _safe_save_image(out_img, out_path, quality=quality)
            produced[vid] = out_path

        else:
            print(f"  ⚠ Unknown variant type '{vtype}' for variant '{vid}' -- skipping.")

    print(f"  ✅ Done scene '{scene_key}'. Outputs written to {scene_out.resolve()}")
    return produced

# ------------------------------------------------------------------------------
# CLI and main
# ------------------------------------------------------------------------------
def parse_args():
    p = argparse.ArgumentParser(description="Regenerate images pipeline for Starstuck Lab")
    p.add_argument("--config", "-c", type=Path, default=DEFAULT_CONFIG_PATH, help="Path to images.json (default: data/images.json)")
    p.add_argument("--out-dir", "-o", type=Path, default=DEFAULT_OUT_DIR, help="Base output directory (default: public/assets)")
    p.add_argument("--generate", action="store_true", help="Run generation step for 'generate' variants (stub)")
    p.add_argument("--upscale", action="store_true", help="Run upscale step to create master from generated preview (stub)")
    p.add_argument("--process", action="store_true", help="Process scenes to create crops/resizes from master")
    p.add_argument("--force", "-f", action="store_true", help="Overwrite existing outputs")
    p.add_argument("--auto-sync", action="store_true", default=AUTO_SYNC_DEFAULT, help="Auto-sync mismatched variants between scenes")
    p.add_argument("--write-back", action="store_true", help="Write back synced images.json when --auto-sync used")
    return p.parse_args()

def main():
    args = parse_args()
    cfg_path: Path = args.config
    out_base: Path = args.out_dir
    force = args.force

    print(f"Regenerate Images - config: {cfg_path} out: {out_base}")
    config = load_config(cfg_path)

    # Prepare scenes: resolve shared_variants and validate/sync
    config_synced, canonical_scene = prepare_scenes(config, auto_sync=args.auto_sync, config_path=cfg_path, write_back=args.write_back)

    # Default to processing if no flags
    if not (args.generate or args.upscale or args.process):
        args.process = True

    scenes = config_synced.get("scenes", {})
    for scene_key, scene in scenes.items():
        # 1) Generate variants if requested
        if args.generate:
            for v in scene.get("variants", []):
                if v.get("type") == "generate":
                    scene_out = out_base / scene_key
                    ensure_dir(scene_out)
                    base_fname = v.get("filename") or f"{v.get('id')}.png"
                    prefixed_fname = f"{scene_key}-{base_fname}"
                    out_path = scene_out / prefixed_fname
                    _handle_generate(v, scene_key, out_path, force=force)

        # 2) Upscale: find generate -> master mapping and call upscaler stub
        if args.upscale:
            gen_variant = next((vv for vv in scene.get("variants", []) if vv.get("type") == "generate"), None)
            master_variant = next((vv for vv in scene.get("variants", []) if vv.get("type") == "master"), None)
            if gen_variant and master_variant:
                scene_out = out_base / scene_key
                gen_fname = gen_variant.get("filename") or f"{gen_variant.get('id')}.png"
                gen_pref = f"{scene_key}-{gen_fname}"
                gen_path = scene_out / gen_pref
                master_target_cfg = master_variant.get("filename")
                if master_target_cfg:
                    master_target_path = Path(master_target_cfg)
                else:
                    master_target_path = scene_out / f"{scene_key}-master.png"
                if gen_path.exists():
                    _handle_upscale(gen_path, master_target_path, force=force)
                else:
                    print(f"  ⚠ Upscale requested but generated preview missing at {gen_path}. Skipping upscale for '{scene_key}'")
            else:
                print(f"  ℹ Upscale: scene '{scene_key}' missing generate/master variant. Skipping upscale.")

        # 3) Process (crop/resize)
        if args.process:
            process_scene(scene_key, scene, out_base, force=force)

    print("\nAll done.")

if __name__ == "__main__":
    main()
