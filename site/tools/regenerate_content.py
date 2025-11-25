#!/usr/bin/env python3
# SPDX-License-Identifier: DWYWBDBM-1.0
# Licensed under the "Do What You Want But Don’t Blame Me" License, Version 1.0.
# See COPYING or https://starstucklab.com/license for details.

"""
AI Multi-Page Round-Robin Regeneration Daemon — v8
--------------------------------------------------

Refactored for Option A (per-page prompt files)
- Reads persona + prompts from /src/data/*
- Single-file About system: about.json
- Still supports multi-page generation if more JSON files are added later
- Writes output JSONs to /public/data/<page>.json

Usage:
    python3 site/tools/regenerate_content.py
    python3 site/tools/regenerate_content.py --page about --num-variants 3
    python3 site/tools/regenerate_content.py --page all
"""

import os
import json
import uuid
import argparse
import datetime
from pathlib import Path
from collections import defaultdict
from dotenv import load_dotenv

# ---- API SETUP ----
try:
    from openai import OpenAI
except ImportError:
    raise SystemExit("❌ Missing dependency: pip install openai python-dotenv")

load_dotenv()

API_KEY = os.getenv("TOGETHER_API_KEY") or os.getenv("OPENAI_API_KEY")
if not API_KEY:
    raise SystemExit("❌ No API key found (TOGETHER_API_KEY or OPENAI_API_KEY).")

BASE_URL = os.getenv("TOGETHER_BASE_URL")
client = OpenAI(api_key=API_KEY, base_url=BASE_URL) if BASE_URL else OpenAI(api_key=API_KEY)

# ---- PATHS ----
ROOT = Path(__file__).resolve().parent.parent
DATA_SOURCE = ROOT / "src" / "data"

persona_file = DATA_SOURCE / "persona_preamble.txt"
about_prompts_file = DATA_SOURCE / "about.json"

DATA_DIR = ROOT / "public" / "data"
MAX_VARIANTS = 20

# ---- VALIDATE ----
if not persona_file.exists():
    raise SystemExit(f"❌ Missing persona file: {persona_file}")

if not about_prompts_file.exists():
    raise SystemExit(f"❌ Missing about.json prompts file: {about_prompts_file}")

# ---- LOAD DATA ----
persona = persona_file.read_text(encoding="utf-8").strip()

# Load per-page JSON file(s). For now: only About.
page_files = {
    "about": about_prompts_file
}

prompts_by_page = {}

for page_name, file_path in page_files.items():
    try:
        prompts_by_page[page_name] = json.loads(file_path.read_text(encoding="utf-8"))
    except Exception as e:
        raise SystemExit(f"❌ Failed to load {file_path}: {e}")

# ---- CLI ----
parser = argparse.ArgumentParser(description="Starstuck Lab Multi-Page Regenerator")
parser.add_argument("--page", type=str, default="all", help="Page to regenerate (about, …)")
parser.add_argument("--num-variants", type=int, default=5)
parser.add_argument("--model", type=str, default=None)
args = parser.parse_args()

TARGET_PAGE = args.page.lower()
NUM_NEW = args.num_variants
MODEL_OVERRIDE = args.model

if TARGET_PAGE == "all":
    target_pages = list(prompts_by_page.keys())
else:
    if TARGET_PAGE not in prompts_by_page:
        raise SystemExit(f"❌ No prompts defined for page '{TARGET_PAGE}'")
    target_pages = [TARGET_PAGE]

print(f"🤖 Starstuck Lab — Regenerator v8")
print(f"🔧 Persona loaded: {len(persona.split())} words")
print(f"🧩 Target pages: {', '.join(target_pages)}")
print(f"➕ Variants per page: {NUM_NEW}")
print(f"🔁 Max variants: {MAX_VARIANTS}\n")

# ---- Helper for round-robin rollover ----
def next_variant_indexes(existing_len, max_variants, num_new):
    if existing_len < max_variants:
        start = existing_len + 1
        return [start + i for i in range(num_new)]
    return [((i) % max_variants) + 1 for i in range(1, num_new + 1)]

# ---- MAIN LOOP ----
for page in target_pages:
    prompts = prompts_by_page[page]
    output_path = DATA_DIR / f"{page}.json"

    # Load old variants (if any)
    if output_path.exists():
        try:
            existing = json.loads(output_path.read_text(encoding="utf-8"))
        except Exception:
            existing = {}
    else:
        existing = {}

    current_count = len(existing)
    indices = next_variant_indexes(current_count, MAX_VARIANTS, NUM_NEW)

    print(f"🌌 {page.upper()}: Generating variants {indices}")

    for idx in indices:
        key = str(idx)
        page_data = {}

        for p in prompts:
            pid = p.get("id", "unknown-id")
            block = p.get("block", "unknown-block")

            print(f"   ➜ {pid} ({block}) ...")

            model = MODEL_OVERRIDE or p.get("model", "gpt-5")
            temperature = p.get("temperature", 0.7)
            seed = uuid.uuid4().hex[:8]

            prompt_text = f"""
{persona}

---

Page: {page}
Prompt ID: {pid}
Block: {block}
Variant: {key}
Seed: {seed}

{p['prompt']}

Tone: melancholic, introspective, poetic, single-human narrator.
Respond only with the content for this block.
Avoid repetition.

---
"""

            try:
                res = client.chat.completions.create(
                    model=model,
                    temperature=temperature,
                    messages=[
                        {"role": "system", "content": persona},
                        {"role": "user", "content": prompt_text},
                    ],
                )
                text = res.choices[0].message.content.strip()
                page_data[p["public_json_key"]] = text
            except Exception as e:
                print(f"      ❌ Error: {e}")
                page_data[p["public_json_key"]] = f"(generation error for {pid})"

        existing[key] = page_data
        print(f"      ✅ Variant {key} complete")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(existing, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"✨ Updated {page}.json with {len(existing)} variants\n")

print(f"🗓️ Done at {datetime.datetime.now().isoformat(timespec='seconds')}")
