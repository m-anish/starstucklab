#!/usr/bin/env python3
# SPDX-License-Identifier: DWYWBDBM-1.0
# Licensed under the "Do What You Want But Don’t Blame Me" License, Version 1.0.
# See COPYING or https://starstucklab.com/license for details.

"""
AI Multi-Page Round-Robin Regeneration Daemon — v7
--------------------------------------------------

Now page-aware:
- Groups prompts by their `"page"` field
- Generates multiple variants per page (default 5)
- Maintains rolling buffers (max 20 per page)
- Writes /public/data/<page>.json for each
- Supports CLI options: --page, --num-variants, --model

Usage:
    python3 site/tools/regenerate_content.py
    python3 site/tools/regenerate_content.py --page about --num-variants 3
    python3 site/tools/regenerate_content.py --page all --num-variants 10
"""

import os
import json
import uuid
import argparse
import datetime
from pathlib import Path
from collections import defaultdict
from dotenv import load_dotenv

# ---- Setup ----
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

ROOT = Path(__file__).resolve().parent.parent
persona_file = ROOT / "data" / "persona_preamble.txt"
prompts_file = ROOT / "data" / "prompts.json"
DATA_DIR = ROOT / "public" / "data"

MAX_VARIANTS = 20

if not persona_file.exists() or not prompts_file.exists():
    raise SystemExit("❌ Missing persona_preamble.txt or prompts.json")

persona = persona_file.read_text(encoding="utf-8").strip()
prompts = json.loads(prompts_file.read_text(encoding="utf-8"))

# ---- CLI arguments ----
parser = argparse.ArgumentParser(description="Starstuck Lab Multi-Page Regenerator")
parser.add_argument("--page", type=str, default="all", help="Page name to regenerate (or 'all')")
parser.add_argument("--num-variants", type=int, default=5, help="Number of new variants to generate")
parser.add_argument("--model", type=str, default=None, help="Override model name")
args = parser.parse_args()

NUM_NEW = args.num_variants
MODEL_OVERRIDE = args.model
PAGE_FILTER = args.page.lower()

# ---- Group prompts by page ----
page_prompts = defaultdict(list)
for p in prompts:
    page = p.get("page", "misc").lower()
    page_prompts[page].append(p)

target_pages = (
    list(page_prompts.keys())
    if PAGE_FILTER == "all"
    else [PAGE_FILTER] if PAGE_FILTER in page_prompts else []
)

if not target_pages:
    raise SystemExit(f"❌ No prompts found for page '{PAGE_FILTER}'")

print(f"🤖 Starstuck Lab — Multi-Page Round-Robin Generator")
print(f"💫 Persona: {len(persona.split())} words")
print(f"🧩 Target pages: {', '.join(target_pages)}")
print(f"🔁 Max variants per page: {MAX_VARIANTS}")
print(f"➕ Generating {NUM_NEW} new variants per page\n")

# ---- Helper: round-robin variant selection ----
def next_variant_indexes(existing_len: int, max_variants: int, num_new: int):
    if existing_len < max_variants:
        start = existing_len + 1
        return [(start + i) for i in range(num_new)]
    else:
        # overwrite oldest N
        return [((i) % max_variants) + 1 for i in range(1, num_new + 1)]

# ---- Process each page ----
for page_name in target_pages:
    output_path = DATA_DIR / f"{page_name}.json"
    prompts_for_page = page_prompts[page_name]

    # Load existing variants
    if output_path.exists():
        try:
            existing = json.loads(output_path.read_text(encoding="utf-8"))
            print(f"📂 Loaded existing {page_name}.json ({len(existing)} variants)")
        except Exception:
            existing = {}
    else:
        existing = {}

    # Determine which variants to overwrite/append
    current_count = len(existing)
    variant_indices = next_variant_indexes(current_count, MAX_VARIANTS, NUM_NEW)
    print(f"🌌 {page_name.upper()}: Generating variants {variant_indices}")

    # Generate each new variant
    for idx in variant_indices:
        key = str(idx)
        page_data = {}

        print(f"   ➜ Variant {key}/{MAX_VARIANTS}")

        for p in prompts_for_page:
            pid = p.get("id", "<no-id>")
            block = p.get("block")
            model = MODEL_OVERRIDE or p.get("model", "gpt-5")
            temperature = p.get("temperature", 0.7)
            seed = uuid.uuid4().hex[:8]

            prompt_text = f"""
{persona}

---

Prompt ID: {pid}
Page: {p.get('page')}
Block: {block}
Variant: {key}
Seed: {seed}

{p['prompt']}

Tone: melancholic, introspective, poetic, single-human narrator.
Respond only with the content for this block. Avoid repetition.
---
"""

            print(f"      🌀 {pid} ({block}) ...")
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
        print(f"      ✅ Completed variant {key}")

    # Write combined file back
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(existing, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✨ Updated {page_name}.json with {len(existing)} variants\n")

print(f"🗓️  Done at {datetime.datetime.now().isoformat(timespec='seconds')}")
