#!/usr/bin/env python3
# SPDX-License-Identifier: DWYWBDBM-1.0
# Licensed under the "Do What You Want But Don’t Blame Me" License, Version 1.0.
# See COPYING or https://starstucklab.com/license for details.

"""
Generate About-Page Emblems (for all variants)
----------------------------------------------

This script will:
 - Read /public/data/about.json (generated text variants)
 - For each variant, if /public/data/about-emblem-<variant>.png does not exist (or --force),
   generate a matching emblem image using OpenAI gpt-image-1.
 - Images are generated at 1024x1024 then downscaled to EMBLEM_SIZE (default 320).
 - Performs OCR check (pytesseract) and retries up to 3 times if text is detected.
 - Supports both b64_json and URL-style responses.

Usage:
    python3 site/tools/generate_about_emblems.py
    python3 site/tools/generate_about_emblems.py --force
    python3 site/tools/generate_about_emblems.py --emblem-size 256 --retries 4
"""

import json
import os
import argparse
import base64
from pathlib import Path
from io import BytesIO
from dotenv import load_dotenv

load_dotenv()

# --- Configuration & environment ---
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise SystemExit("❌ Missing OPENAI_API_KEY. Required for gpt-image-1 image generation.")

# Optional reference to uploaded persona file (for debugging / provenance).
# The image prompt intentionally does NOT include persona text (keeps prompts short).
PERSONA_PATH = Path("/mnt/data/persona_preamble.txt")
if PERSONA_PATH.exists():
    print(f"ℹ️ Persona file available at: {PERSONA_PATH}")
else:
    print("ℹ️ Persona file not found at /mnt/data/persona_preamble.txt (this is optional).")

# --- Imports that may need to be installed ---
try:
    from openai import OpenAI
except Exception:
    raise SystemExit("❌ Missing dependency: pip install openai python-dotenv")

try:
    from PIL import Image
except Exception:
    raise SystemExit("❌ Missing dependency: pip install pillow")

try:
    import pytesseract
except Exception:
    raise SystemExit("❌ Missing dependency: pip install pytesseract")

try:
    import requests
except Exception:
    raise SystemExit("❌ Missing dependency: pip install requests")

# --- Clients & paths ---
openai_client = OpenAI(api_key=OPENAI_API_KEY)

ROOT = Path(__file__).resolve().parent.parent
ABOUT_JSON = ROOT / "public" / "data" / "about.json"
TEMPLATE_FILE = ROOT / "src" / "data" / "about_emblem_prompt_template.txt"
OUTPUT_DIR = ROOT / "public" / "data"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# --- CLI args ---
parser = argparse.ArgumentParser(description="Generate emblem images for all about.json variants")
parser.add_argument("--force", action="store_true", help="Regenerate images even if they exist")
parser.add_argument("--emblem-size", type=int, default=320, help="Final emblem downscale size (px)")
parser.add_argument("--retries", type=int, default=3, help="OCR retry attempts before accepting image")
parser.add_argument("--dry-run", action="store_true", help="List variants and missing images without generating")
args = parser.parse_args()

EMBLEM_SIZE = int(args.emblem_size)
MAX_RETRIES = int(args.retries)
DRY_RUN = bool(args.dry_run)
FORCE = bool(args.force)

# --- Validate files ---
if not ABOUT_JSON.exists():
    raise SystemExit(f"❌ Missing generated about.json: {ABOUT_JSON}")

if not TEMPLATE_FILE.exists():
    print(f"⚠️ Template file {TEMPLATE_FILE} not found. Using built-in compact template.")
    template_text = (
        "Make a small emblem based on this text:\n\n"
        "Title: {title}\n"
        "Lead: {lead}\n"
        "Motto: {motto}\n\n"
        "Style: restrained Studio Ghibli watercolor; muted palette; soft hand-drawn lines; "
        "one centered object or vignette; plenty of negative space; no background scene.\n\n"
        "ABSOLUTELY NO text or letters in the image. No words. No labels."
    )
else:
    template_text = TEMPLATE_FILE.read_text(encoding="utf-8")

# --- Load about.json variants ---
about_data = json.loads(ABOUT_JSON.read_text(encoding="utf-8"))
variant_keys = sorted(about_data.keys(), key=lambda x: int(x))

print(f"ℹ️ Found {len(variant_keys)} variant(s) in {ABOUT_JSON}")

# --- Helpers ---
def build_prompt(title, lead, motto):
    # Keep prompt short and focused for image model
    return template_text.format(title=title, lead=lead, motto=motto)

def ocr_has_text(png_bytes):
    try:
        img = Image.open(BytesIO(png_bytes))
        text = pytesseract.image_to_string(img)
        return bool(text and text.strip())
    except Exception as e:
        print(f"⚠️ OCR error (treated as no text): {e}")
        return False

def extract_image_bytes_from_response(result):
    # Defensive extraction supporting multiple response shapes.
    # result.data[0] may be an object-like with attributes or a dict.
    try:
        entry = result.data[0]
    except Exception:
        raise RuntimeError(f"Unexpected image response format: {result}")

    # Prefer b64_json if present
    b64 = None
    url = None

    # Attribute access
    b64 = getattr(entry, "b64_json", None)
    url = getattr(entry, "url", None)

    # dict access fallback
    if b64 is None and isinstance(entry, dict):
        b64 = entry.get("b64_json")
        url = entry.get("url")

    if b64:
        try:
            return base64.b64decode(b64)
        except Exception as e:
            raise RuntimeError(f"Failed to decode base64 image: {e}")

    if url:
        try:
            resp = requests.get(url, timeout=30)
            resp.raise_for_status()
            return resp.content
        except Exception as e:
            raise RuntimeError(f"Failed to download image from URL: {e}")

    raise RuntimeError("No usable image data found in the response.")

def generate_one_emblem(prompt_text):
    # Generate at 1024x1024 then return raw bytes
    try:
        result = openai_client.images.generate(
            model="gpt-image-1",
            prompt=prompt_text,
            size="1024x1024"
        )
    except Exception as e:
        raise RuntimeError(f"Image generation call failed: {e}")

    return extract_image_bytes_from_response(result)

# --- Main loop over variants ---
to_generate = []
for key in variant_keys:
    out_path = OUTPUT_DIR / f"about-emblem-{key}.png"
    if out_path.exists() and not FORCE:
        print(f"✔ Variant {key}: emblem exists -> {out_path}")
        continue
    to_generate.append(key)

if not to_generate:
    print("ℹ️ Nothing to generate. Exiting.")
    raise SystemExit(0)

print(f"🔢 Variants to generate: {len(to_generate)} -> {', '.join(to_generate)}")

if DRY_RUN:
    print("ℹ️ Dry run mode — no images will be generated.")
    raise SystemExit(0)

for key in to_generate:
    print(f"\n=== Generating emblem for variant {key} ===")
    data = about_data[key]
    title = data.get("title", "").strip()
    lead = data.get("lead", "").strip()
    motto = data.get("motto", "").strip()

    prompt = build_prompt(title, lead, motto)
    print("Prompt (short):", (prompt[:500] + ("…" if len(prompt) > 500 else "")))

    last_error = None
    png_bytes = None

    for attempt in range(1, MAX_RETRIES + 1):
        print(f"Attempt {attempt}/{MAX_RETRIES} for variant {key}…")
        try:
            png_bytes = generate_one_emblem(prompt)
        except Exception as e:
            last_error = e
            print(f"❌ Generation error: {e}")
            # don't retry on basic API errors more than once
            if attempt == MAX_RETRIES:
                print("❌ Max attempts reached for generation. Skipping this variant.")
                png_bytes = None
                break
            else:
                continue

        # OCR check
        if ocr_has_text(png_bytes):
            print("⚠️ OCR detected text in generated image. Retrying...")
            png_bytes = None
            last_error = "OCR detected text"
            continue

        # If no OCR text, accept it
        print("✅ Image passed OCR check.")
        break

    if png_bytes is None:
        print(f"⚠️ Could not produce a clean emblem for variant {key}. Reason: {last_error}")
        # Optionally proceed to save last attempt if present; here we skip saving.
        continue

    # Downscale to emblem size
    try:
        img = Image.open(BytesIO(png_bytes)).convert("RGBA")
        emblem = img.resize((EMBLEM_SIZE, EMBLEM_SIZE), Image.LANCZOS)
    except Exception as e:
        print(f"❌ Error while processing image bytes: {e}")
        continue

    out_path = OUTPUT_DIR / f"about-emblem-{key}.png"
    try:
        emblem.save(out_path, format="PNG")
        print(f"✔ Saved emblem for variant {key} → {out_path}")
    except Exception as e:
        print(f"❌ Failed to save emblem PNG: {e}")

print("\n🎉 Done. All requested emblem generations complete.")
