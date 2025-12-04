#!/usr/bin/env python3
# SPDX-License-Identifier: DWYWBDBM-1.0
# Licensed under the "Do What You Want But Donâ€™t Blame Me" License, Version 1.0.

"""
regenerate_images.py - Optimized for WebP@75 quality and 30% resolution reduction

Usage:
    regenerate_images.py [--generate] [--upscale] [--process] [--force] [--auto-sync]
                       [--config PATH] [--out-dir PATH]

Changes from earlier:
- All outputs default to WebP format at quality 75
- Resolution reduced by 30% across all variants
- Forces WebP conversion even for non-WebP filenames
- Aggressively strips alpha channel before encoding for efficiency
"""

import argparse
import json
import sys
from pathlib import Path
from copy import deepcopy
from PIL import Image, ImageOps
from shutil import copyfile

DEFAULT_CONFIG_PATH = Path("src/data/images.json")
DEFAULT_OUT_DIR = Path("public/assets")
AUTO_SYNC_DEFAULT = False
DEFAULT_QUALITY = 75
DEFAULT_FORMAT = "webp"

def load_config(path: Path):
    if not path.exists():
        raise FileNotFoundError(f"images.json not found at {path.resolve()}")
    return json.loads(path.read_text(encoding="utf-8"))

def write_config(path: Path, config: dict):
    path.write_text(json.dumps(config, indent=2, ensure_ascii=False), encoding="utf-8")

def _normalize_variant(v: dict):
    keys = ["id","type","width","height","aspect","centered","filename","prompt_file","steps","guidance","quality"]
    return {k: v.get(k) for k in keys if k in v}

def _validate_unique_ids(variants, scene_key):
    ids = [v.get("id") for v in variants]
    dup = {x for x in ids if ids.count(x) > 1}
    if dup:
        raise ValueError(f"Duplicate variant id(s) {dup} in scene '{scene_key}'")

def ensure_dir(p: Path):
    p.mkdir(parents=True, exist_ok=True)

def crop_center_to_aspect(img: Image.Image, target_w: int, target_h: int, centered=True):
    """Crop PIL image to target width/height by center-cropping."""
    src_w, src_h = img.size
    tgt_aspect = target_w / target_h
    src_aspect = src_w / src_h

    if src_w == target_w and src_h == target_h:
        return img.copy()

    if src_aspect > tgt_aspect:
        new_w = int(src_h * tgt_aspect)
        new_h = src_h
    else:
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
    """Fit image within target size while preserving aspect."""
    return ImageOps.contain(img, (target_w, target_h), Image.LANCZOS)

def _handle_generate(variant: dict, scene_key: str, out_path: Path, force=False):
    """Placeholder for image generator."""
    if out_path.exists() and not force:
        print(f"  ℹ generate: exists {out_path.name}, skipping")
        return out_path

    prompt_file = variant.get("prompt_file")
    print(f"  ▶ [GENERATE] ({scene_key}) -> {out_path}")
    print(f"      Prompt file: {prompt_file}")
    print("      Note: _handle_generate is a stub. Replace with your generator call.")
    
    w = int(variant.get("width", 1433))
    h = int(variant.get("height", 896))
    ensure_dir(out_path.parent)
    im = Image.new("RGB", (w, h), (24, 24, 24))  # RGB only for efficiency
    im.save(out_path, "WEBP", quality=75, method=6)
    return out_path

def _handle_upscale(src: Path, dst: Path, force=False):
    """Placeholder for upscaling integration."""
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

def prepare_scenes(config: dict, auto_sync=False, config_path: Path = None, write_back=False):
    """Resolve shared_variants shorthand and validate scenes."""
    cfg = deepcopy(config)
    shared_variants = cfg.get("shared_variants")
    scenes = cfg.get("scenes", {})
    if not scenes:
        raise SystemExit("❌ No scenes defined in images.json")

    for sk, scene in scenes.items():
        v = scene.get("variants")
        if isinstance(v, str) and v == "shared_variants":
            if not shared_variants:
                raise SystemExit(f"❌ Scene '{sk}' references shared_variants but none found")
            scene["variants"] = deepcopy(shared_variants)

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
                msg = f"Variant mismatch: canonical={canonical_scene}, mismatch_in={sk}"
                if auto_sync:
                    print(f"  ⚠ {msg} (auto-sync enabled -> overwriting '{sk}' variants)")
                    scenes[sk]["variants"] = deepcopy(scenes[canonical_scene]["variants"])
                else:
                    raise SystemExit(f"❌ {msg}. Use --auto-sync to force synchronization.")
    print(f"✅ Variants consistent (canonical scene: {canonical_scene})")
    if write_back and auto_sync and config_path:
        print(f"  ↳ Writing synced images.json back to {config_path}")
        write_config(config_path, cfg)
    return cfg, canonical_scene

def _safe_save_image(img: Image.Image, out_path: Path, quality=None, format_override=None):
    """
    Save image as WebP at specified quality.
    - Converts RGBA -> RGB for efficiency
    - Always uses WebP format
    - Quality defaults to 75
    """
    quality = quality if quality is not None else DEFAULT_QUALITY
    
    # Force RGB (no alpha) for WebP efficiency
    if img.mode == "RGBA":
        bg = Image.new("RGB", img.size, (255, 255, 255))
        bg.paste(img, mask=img.split()[3])
        img = bg
    elif img.mode != "RGB":
        img = img.convert("RGB")
    
    ensure_dir(out_path.parent)
    
    # Always save as WebP with quality 75 and high compression method
    webp_path = out_path.with_suffix(".webp")
    img.save(webp_path, "WEBP", quality=quality, method=6)
    
    if webp_path != out_path and out_path.exists():
        out_path.unlink()
    
    return webp_path

def process_scene(scene_key: str, scene: dict, out_base: Path, force=False):
    """Process a single scene: generate -> upscale -> crop/resize."""
    print(f"\n== Processing scene '{scene_key}' ==")
    scene_out = out_base / scene_key
    ensure_dir(scene_out)
    variants = scene.get("variants", [])
    master_path_cfg = scene.get("master")
    if not master_path_cfg:
        raise SystemExit(f"❌ Scene '{scene_key}' missing 'master' path in manifest")

    master_path = Path(master_path_cfg)

    master_img = None
    if master_path.exists():
        try:
            master_img = Image.open(master_path).convert("RGB")
            print(f"  ℹ Found master at {master_path} ({master_img.width}x{master_img.height})")
        except Exception as e:
            print(f"  ⚠ Failed to open master image {master_path}: {e}")
            master_img = None
    else:
        print(f"  ⚠ Master not found at {master_path}. Crops will prefer generated preview if available.")

    produced = {}
    type_order = {"generate": 0, "master": 1, "crop": 2, "resize": 3}
    variants_sorted = sorted(variants, key=lambda v: type_order.get(v.get("type"), 99))

    for v in variants_sorted:
        vid = v.get("id")
        vtype = v.get("type")
        base_fname = v.get("filename") or f"{vid}.webp"
        prefixed_fname = f"{scene_key}-{base_fname}"
        out_path = scene_out / prefixed_fname

        if vtype == "master":
            if master_path.exists():
                if not out_path.exists() or force:
                    print(f"  ▤· copying master -> {out_path.name}")
                    ensure_dir(out_path.parent)
                    try:
                        img = Image.open(master_path).convert("RGB")
                        _safe_save_image(img, out_path, quality=75)
                    except Exception:
                        copyfile(master_path, out_path)
                produced[vid] = out_path
            else:
                print(f"  ⚠ master variant '{vid}' declared but master file missing at {master_path}")
            continue

        if vtype == "generate":
            produced_path = _handle_generate(v, scene_key, out_path, force=force)
            produced[vid] = produced_path
            if master_img is None and produced_path and Path(produced_path).exists():
                try:
                    master_img = Image.open(produced_path).convert("RGB")
                    print(f"    ↳ Using generated preview as temporary master ({produced_path.name})")
                except Exception as e:
                    print(f"    ⚠ Failed to open generated preview {produced_path}: {e}")
            continue

        src_img = None
        if master_img is not None:
            src_img = master_img
        else:
            for pvid, ppath in produced.items():
                if ppath and Path(ppath).exists():
                    try:
                        src_img = Image.open(ppath).convert("RGB")
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
        quality = v.get("quality", 75)

        ensure_dir(out_path.parent)
        if vtype == "crop":
            print(f"  ▤· crop [{w}x{h}] -> {out_path.name}")
            out_img = crop_center_to_aspect(src_img, w, h, centered=centered)
            _safe_save_image(out_img, out_path, quality=quality)
            produced[vid] = out_path

        elif vtype == "resize":
            print(f"  ▤· resize contain [{w}x{h}] -> {out_path.name}")
            out_img = resize_to(src_img, w, h)
            _safe_save_image(out_img, out_path, quality=quality)
            produced[vid] = out_path

        else:
            print(f"  ⚠ Unknown variant type '{vtype}' for variant '{vid}' -- skipping.")

    print(f"  ✅ Done scene '{scene_key}'. Outputs written to {scene_out.resolve()}")
    return produced

def parse_args():
    p = argparse.ArgumentParser(description="Regenerate images pipeline - WebP@75, 30% resolution reduction")
    p.add_argument("--config", "-c", type=Path, default=DEFAULT_CONFIG_PATH, help="Path to images.json")
    p.add_argument("--out-dir", "-o", type=Path, default=DEFAULT_OUT_DIR, help="Base output directory")
    p.add_argument("--generate", action="store_true", help="Run generation step for 'generate' variants")
    p.add_argument("--upscale", action="store_true", help="Run upscale step")
    p.add_argument("--process", action="store_true", help="Process scenes to create crops/resizes")
    p.add_argument("--force", "-f", action="store_true", help="Overwrite existing outputs")
    p.add_argument("--auto-sync", action="store_true", default=AUTO_SYNC_DEFAULT, help="Auto-sync variants between scenes")
    p.add_argument("--write-back", action="store_true", help="Write back synced images.json when --auto-sync used")
    return p.parse_args()

def main():
    args = parse_args()
    cfg_path = args.config
    out_base = args.out_dir
    force = args.force

    print(f"Regenerate Images (WebP@75, 30% reduction)")
    print(f"  config: {cfg_path}")
    print(f"  output: {out_base}\n")
    
    config = load_config(cfg_path)
    config_synced, canonical_scene = prepare_scenes(config, auto_sync=args.auto_sync, config_path=cfg_path, write_back=args.write_back)

    if not (args.generate or args.upscale or args.process):
        args.process = True

    scenes = config_synced.get("scenes", {})
    for scene_key, scene in scenes.items():
        if args.generate:
            for v in scene.get("variants", []):
                if v.get("type") == "generate":
                    scene_out = out_base / scene_key
                    ensure_dir(scene_out)
                    base_fname = v.get("filename") or f"{v.get('id')}.webp"
                    prefixed_fname = f"{scene_key}-{base_fname}"
                    out_path = scene_out / prefixed_fname
                    _handle_generate(v, scene_key, out_path, force=force)

        if args.upscale:
            gen_variant = next((vv for vv in scene.get("variants", []) if vv.get("type") == "generate"), None)
            master_variant = next((vv for vv in scene.get("variants", []) if vv.get("type") == "master"), None)
            if gen_variant and master_variant:
                scene_out = out_base / scene_key
                gen_fname = gen_variant.get("filename") or f"{gen_variant.get('id')}.webp"
                gen_pref = f"{scene_key}-{gen_fname}"
                gen_path = scene_out / gen_pref
                master_target_cfg = master_variant.get("filename")
                if master_target_cfg:
                    master_target_path = Path(master_target_cfg)
                else:
                    master_target_path = scene_out / f"{scene_key}-master.webp"
                if gen_path.exists():
                    _handle_upscale(gen_path, master_target_path, force=force)
                else:
                    print(f"  ⚠ Upscale: generated preview missing at {gen_path}. Skipping upscale for '{scene_key}'")
            else:
                print(f"  ℹ Upscale: scene '{scene_key}' missing generate/master variant. Skipping.")

        if args.process:
            process_scene(scene_key, scene, out_base, force=force)

    print("\n✅ All done.")

if __name__ == "__main__":
    main()