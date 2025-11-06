#!/usr/bin/env python3
# SPDX-License-Identifier: DWYWBDBM-1.0
# Licensed under the "Do What You Want But Don’t Blame Me" License, Version 1.0.
# See COPYING or https://starstucklab.com/license for details.

"""
AI Multi-Pass Regeneration Daemon — v6
--------------------------------------

Enhancements:
- Maintains a rolling "variant buffer" (max 20)
- Appends new variants until MAX_VARIANTS reached
- Then overwrites oldest ones in round-robin fashion
- Still supports CLI flags (--num-variants, --model)
- Output: /public/data/about.json

Usage:
    python3 site/tools/regenerate_content.py
    python3 site/tools/regenerate_content.py --num-variants 5
"""

import os
import json
import uuid
import argparse
import datetime
from pathlib import Path
from dotenv import load_dotenv

# ---- Setup ----
try:
    from openai import OpenAI
except ImportError:
    raise SystemExit("❌ Missing dependency: install with 'pip install openai python-dotenv'.")

load_dotenv()

API_KEY = os.getenv("TOGETHER_API_KEY") or os.getenv("OPENAI_API_KEY")
if not API_KEY:
    raise SystemExit("❌ No API key found (TOGETHER_API_KEY or OPENAI_API_KEY).")

BASE_URL = os.getenv("TOGETHER_BASE_URL")
client = OpenAI(api_key=API_KEY, base_url=BASE_URL) if BASE_URL else OpenAI(api_key=API_KEY)

ROOT = Path(__file__).resolve().parent.parent
persona_file = ROOT / "data" / "persona_preamble.txt"
prompts_file = ROOT / "data" / "prompts.json"
OUTPUT_PATH = ROOT / "public" / "data" / "about.json"

MAX_VARIANTS = 20  # hard ceiling for stored variants

if not persona_file.exists() or not prompts_file.exists():
    raise SystemExit("❌ Missing persona_preamble.txt or prompts.json")

persona = persona_file.read_text(encoding="utf-8").strip()
prompts = json.loads(prompts_file.read_text(encoding="utf-8"))

# ---- CLI arguments ----
parser = argparse.ArgumentParser(description="Starstuck Lab AI Regenerator (Round-Robin)")
parser.add_argument("--num-variants", type=int, default=5, help="Number of new variants to generate (default 5)")
parser.add_argument("--model", type=str, default=None, help="Override model name")
args = parser.parse_args()

NUM_NEW = args.num_variants
MODEL_OVERRIDE = args.model

print(f"🤖 Starstuck Lab — Round-Robin Regenerator")
print(f"📘 Loaded persona ({len(persona.split())} words) + {len(prompts)} prompts")
print(f"🔁 Max variants stored: {MAX_VARIANTS}")
print(f"🧩 Generating {NUM_NEW} new variants...\n")

# ---- Load existing data if present ----
if OUTPUT_PATH.exists():
    try:
        existing = json.loads(OUTPUT_PATH.read_text(encoding="utf-8"))
        print(f"📂 Loaded existing variants ({len(existing)} total)")
    except Exception:
        existing = {}
else:
    existing = {}

# Ensure keys are sorted numerically as strings
existing = {str(k): v for k, v in sorted(((int(k), v) for k, v in existing.items()))}

# Determine next variant index(es)
current_count = len(existing)
if current_count < MAX_VARIANTS:
    # append mode
    start_index = current_count + 1
else:
    # round-robin overwrite mode
    start_index = 1  # overwrite from the oldest
    print(f"♻️  Variant buffer full ({MAX_VARIANTS}). Overwriting from 1 upward.")

# ---- Main generation ----
for i in range(NUM_NEW):
    variant_index = ((start_index + i - 1) % MAX_VARIANTS) + 1
    variant_key = str(variant_index)
    print(f"\n🌌 Generating variant {variant_key}/{MAX_VARIANTS}")
    page_data = {}

    for p in prompts:
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
Variant: {variant_key}
Seed: {seed}

{p['prompt']}

Tone: melancholic, introspective, poetic, single-human narrator.
Respond only with the content for this block. Avoid repetition.
---
"""

        print(f"  🌀 {pid} ({block}) ...")
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
            print(f"  ❌ Error in {pid}: {e}")
            page_data[p["public_json_key"]] = f"(generation error for {pid})"

    # save variant in memory
    existing[variant_key] = page_data
    print(f"✅  Variant {variant_key} complete ({len(page_data)} blocks).")
    print("-" * 60)

# ---- Write combined JSON ----
OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
OUTPUT_PATH.write_text(json.dumps(existing, ensure_ascii=False, indent=2), encoding="utf-8")

print(f"\n✨ Stored {len(existing)} total variants (max {MAX_VARIANTS}).")
print(f"📁 Output: {OUTPUT_PATH.relative_to(ROOT)}")
print(f"🗓️  Timestamp: {datetime.datetime.now().isoformat(timespec='seconds')}")
