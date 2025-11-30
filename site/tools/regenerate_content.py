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
import html
import glob
import yaml  # optional: only if you prefer YAML; json is used below
from pathlib import Path
from collections import defaultdict
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# ---- PATHS ----
ROOT = Path(__file__).resolve().parent.parent
DATA_SOURCE = ROOT / "src" / "data"

persona_file = DATA_SOURCE / "persona_preamble.txt"
about_prompts_file = DATA_SOURCE / "about.json"
hero_prompts_file = DATA_SOURCE / "hero.json"
print("🔍 data source:", DATA_SOURCE)
print("🔍 persona file:", persona_file)
print("🔍 about prompts file:", about_prompts_file)
print("🔍 hero prompts file:", hero_prompts_file)

DATA_DIR = ROOT / "public" / "data"
print("🔍 data output dir:", DATA_DIR)
MAX_VARIANTS = 20

# ---- VALIDATE ----
if not persona_file.exists():
    raise SystemExit(f"❌ Missing persona file: {persona_file}")

if not about_prompts_file.exists():
    raise SystemExit(f"❌ Missing about.json prompts file: {about_prompts_file}")

if not hero_prompts_file.exists():
    raise SystemExit(f"❌ Missing hero.json prompts file: {hero_prompts_file}")

# ---- LOAD DATA ----
persona = persona_file.read_text(encoding="utf-8").strip()

# Load per-page JSON file(s). For now: only About.
page_files = {
    "about": about_prompts_file,
    "hero": hero_prompts_file
}

prompts_by_page = {}

for page_name, file_path in page_files.items():
    try:
        prompts_by_page[page_name] = json.loads(file_path.read_text(encoding="utf-8"))
        print(f"✅ Loaded {len(prompts_by_page[page_name])} prompts for page '{page_name}'")
    except Exception as e:
        raise SystemExit(f"❌ Failed to load {file_path}: {e}")

# ===== INSERT START: Products generation helpers =====
# Insert this block into regenerate_content.py (after prompts_by_page is built, before main generation loop)

# Product templates (optional central template file)
TEMPLATES_PATH = DATA_SOURCE / "templates.json"  # optional; used only if product JSON references prompt_id
print("🔍 product templates file:", TEMPLATES_PATH)

# Tag -> template fallback map (safe small map; no edits required for new products)
DEFAULT_TAG_MAP = {
    "telescope": "telescope-blurb",
    "weather": "weather-quick",
    "sensor": "weather-quick",
    "3d-printed": "product-blurb"
}

# Built-in default templates (used when templates.json absent)
BUILTIN_TEMPLATES = {
    "product-blurb": {
        "prompt": "Write a short (40–80 words) product blurb for '{{title}}'. Tone: Starstuck Lab persona — dry, slightly nihilistic, witty. Include one short 'What's included' sentence (not a list). Output plain text only.",
        "temperature": 0.7,
    },
    "telescope-blurb": {
        "prompt": "Write a short (40–80 words) product blurb for '{{title}}' as a slightly mythic, technical but witty description that hints at the build. Include 'What's included' sentence. Output plain text only.",
        "temperature": 0.6,
    },
    "weather-quick": {
        "prompt": "Write a short (25–50 words) product blurb for '{{title}}' with a playful, slightly skeptical voice. Mention one 'what's included' clause.",
        "temperature": 0.6,
    },
    "_default": {
        "prompt": "Write a short product blurb for '{{title}}' in the site's persona.",
        "temperature": 0.6,
    }
}

# ---- Replace your existing load_product_templates() with this ----
def load_product_templates():
    """
    Load optional central templates.json; always return a dict mapping template_key -> template_entry.
    Accepts:
      - object/dict: { "key": {...}, ... }
      - list: [ {"id": "key", "prompt": "...", ...}, ... ]
    Falls back to BUILTIN_TEMPLATES on error.
    """
    try:
        if TEMPLATES_PATH.exists():
            raw = TEMPLATES_PATH.read_text(encoding="utf-8")
            # tolerant stripping of a leading /* ... */ block (if present)
            import re
            raw_stripped = re.sub(r'^\s*/\*[\s\S]*?\*/\s*', '', raw, count=1)
            raw_stripped = '\n'.join([line for line in raw_stripped.splitlines() if not line.strip().startswith('//')])
            parsed = json.loads(raw_stripped)

            # If parsed is a list -> convert to dict by using 'id' or 'key' as map key
            if isinstance(parsed, list):
                d = {}
                for entry in parsed:
                    if not isinstance(entry, dict):
                        continue
                    key = entry.get("id") or entry.get("key") or entry.get("name")
                    if not key:
                        # fall back to numeric key
                        key = f"tpl_{len(d)}"
                    d[key] = entry
                return d

            # If parsed is dict-like, return as-is
            if isinstance(parsed, dict):
                return parsed

            # If parsed is neither list nor dict, warn and fall back
            print("⚠️ templates.json parsed to unexpected type:", type(parsed), "— falling back to built-in templates")
    except Exception as e:
        print("⚠️ Could not read templates.json (tolerant load):", e)
        try:
            print("   templates.json preview:", TEMPLATES_PATH.read_text(encoding='utf-8')[:200].replace('\n',' '))
        except Exception:
            pass

    return BUILTIN_TEMPLATES

# ---- Replace your existing pick_product_prompt() with this robust version ----
def pick_product_prompt(src: dict, templates: dict):
    """
    Choose the prompt for the product with robust handling if templates is missing/invalid.
    Priority:
      1) src['prompt'] (inline full prompt)
      2) src['prompt_id'] referencing templates
      3) tag-based inference using DEFAULT_TAG_MAP -> templates
      4) templates['_default'] or BUILTIN_TEMPLATES['_default']
    Returns dict { prompt, temperature, reason, prompt_id_used }
    """
    title = src.get("title", src.get("slug", "product"))

    # 1) inline full prompt
    if src.get("prompt"):
        return {
            "prompt": src["prompt"].replace("{{title}}", title).replace("{{excerpt}}", src.get("excerpt","")),
            "temperature": src.get("prompt_temperature", 0.7),
            "reason": "inline-prompt",
            "prompt_id_used": None
        }

    # ensure templates is a dict
    if not isinstance(templates, dict):
        templates = BUILTIN_TEMPLATES

    # 2) prompt_id
    pid = src.get("prompt_id")
    if pid and pid in templates and isinstance(templates[pid], dict):
        t = templates[pid]
        return {
            "prompt": t.get("prompt","").replace("{{title}}", title).replace("{{excerpt}}", src.get("excerpt","")),
            "temperature": t.get("temperature", 0.7),
            "reason": f"prompt_id:{pid}",
            "prompt_id_used": pid
        }

    # 3) tag-based inference -> DEFAULT_TAG_MAP -> templates
    tags = src.get("tags", []) or []
    for tag in tags:
        map_key = DEFAULT_TAG_MAP.get(tag)
        if map_key and map_key in templates:
            t = templates[map_key]
            if isinstance(t, dict):
                return {
                    "prompt": t.get("prompt","").replace("{{title}}", title).replace("{{excerpt}}", src.get("excerpt","")),
                    "temperature": t.get("temperature", 0.7),
                    "reason": f"tag-map:{tag}->{map_key}",
                    "prompt_id_used": map_key
                }

    # 4) fallback default template
    t = templates.get("_default") if isinstance(templates, dict) else None
    if not t:
        t = BUILTIN_TEMPLATES.get("_default")
    return {
        "prompt": t.get("prompt","Write a short product blurb for '{{title}}'.").replace("{{title}}", title).replace("{{excerpt}}", src.get("excerpt","")),
        "temperature": t.get("temperature", 0.7),
        "reason": "default",
        "prompt_id_used": "_default"
    }

def generate_product_json(src_path: Path, model_override=None):
    """
    Generate single product: read src JSON, pick prompt, call client, write public JSON, optionally update source (audit).
    Returns (slug, out_path, meta)
    """
    templates = load_product_templates()
    try:
        src = json.loads(src_path.read_text(encoding="utf-8"))
    except Exception as e:
        print("  ❌ Failed to read product source:", src_path, e)
        return None

    slug = src.get("slug") or src_path.stem
    title = src.get("title", slug)
    pick = pick_product_prompt(src, templates)
    prompt_text = f"""
{persona}

---

Product: {slug}
Prompt selection reason: {pick['reason']}

{pick['prompt']}

Tone: melancholic, witty, slightly nihilistic. Respond only with the product blurb paragraph (do not include lists).
"""
    temperature = pick.get("temperature", 0.7)
    model = model_override or src.get("model") or "gpt-5.1"

    print(f"   ➜ Generating product '{slug}' using prompt reason: {pick['reason']} (model={model})")

    try:
        res = client.chat.completions.create(
            model = model,
            temperature = float(temperature),
            messages = [
                {"role": "system", "content": persona},
                {"role": "user", "content": prompt_text}
            ],
        )
        text = res.choices[0].message.content.strip()
        model_used = getattr(res, 'model', model) if isinstance(res, dict) else model
    except Exception as e:
        print("      ❌ Product generation error:", e)
        text = f"(generation error for {slug})"
        model_used = model

    # Build metadata and output object
    gen_id = f"g-{datetime.datetime.utcnow().isoformat(timespec='seconds').replace(':','-')}"
    meta = {
        "id": gen_id,
        "date": datetime.datetime.utcnow().isoformat(),
        "mood": src.get("mood_default", 50),
        "prompt_selection_reason": pick.get("reason"),
        "prompt_id_used": pick.get("prompt_id_used"),
        "model": model_used,
        "excerpt": src.get("excerpt") or (text.splitlines()[0][:200]),
    }
    out_obj = {
        **meta,
        "slug": slug,
        "title": title,
        "price": src.get("price"),
        "currency": src.get("currency","USD"),
        "status": src.get("status","available"),
        "tags": src.get("tags", []),
        "specs": src.get("specs", {}),
        "html": "<p>" + html.escape(text) + "</p>",
        "raw": text
    }

    # write public JSON
    PUBLIC_PRODUCTS_DIR = DATA_DIR / "products"
    PUBLIC_PRODUCTS_DIR.mkdir(parents=True, exist_ok=True)
    out_path = PUBLIC_PRODUCTS_DIR / f"{slug}.json"
    out_path.write_text(json.dumps(out_obj, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"      ✅ Wrote {out_path}")

    # audit: update source product JSON with generated entry if enabled
    if src.get("enable_audit", True):
        src.setdefault("generated", [])
        src["generated"].insert(0, { **meta, "public_file": f"/data/products/{slug}.json" })
        try:
            src_path.write_text(json.dumps(src, indent=2, ensure_ascii=False), encoding="utf-8")
            print(f"      ✳️ Updated source audit: {src_path}")
        except Exception as e:
            print("      ⚠️ Could not update source audit:", e)

    return (slug, out_path, meta)

def regen_products(target_slugs=None, num_variants=1, model_override=None):
    """
    Generate products. If target_slugs is None -> generate for all product files in SRC_PRODUCTS_DIR.
    num_variants: how many variants to generate per product (appends numbered variants by timestamp seed).
    """
    SRC_PRODUCTS_DIR = DATA_SOURCE / "products"
    product_files = []
    if target_slugs:
        for s in target_slugs:
            p = SRC_PRODUCTS_DIR / f"{s}.json"
            if p.exists():
                product_files.append(p)
            else:
                print(f"   ⚠️ Product source not found: {p}")
    else:
        product_files = sorted(SRC_PRODUCTS_DIR.glob("*.json"))

    if not product_files:
        print("   ℹ️ No product JSON files found to generate.")
        return

    templates = load_product_templates()
    for p in product_files:
        for v in range(num_variants):
            # current approach writes a single public/json per product (overwrites). If you want multiple named variants, change naming.
            generate_product_json(p, model_override=model_override)

# ===== INSERT END: Products generation helpers =====


# ---- CLI ----
parser = argparse.ArgumentParser(description="Starstuck Lab Multi-Page Regenerator")
parser.add_argument("--page", type=str, default="all", help="Page to regenerate (about, …)")
parser.add_argument("--num-variants", type=int, default=5)
parser.add_argument("--model", type=str, default=None)
parser.add_argument("--provider", choices=["openai", "together"], default=None,
                    help="Choose which provider to use for generation.")
args = parser.parse_args()

TARGET_PAGE = args.page.lower()
NUM_NEW = args.num_variants
MODEL_OVERRIDE = args.model
provider = args.provider

if provider is None:
    # Auto-detect if not provided
    if os.getenv("TOGETHER_API_KEY"):
        provider = "together"
    elif os.getenv("OPENAI_API_KEY"):
        provider = "openai"
    else:
        raise SystemExit("❌ No API key found (TOGETHER_API_KEY or OPENAI_API_KEY).")

# Load provider-specific settings
if provider == "together":
    API_KEY = os.getenv("TOGETHER_API_KEY")
    BASE_URL = os.getenv("TOGETHER_BASE_URL")  # required when using Together
    if not API_KEY:
        raise SystemExit("❌ TOGETHER_API_KEY is not set.")
    if not BASE_URL:
        raise SystemExit("❌ TOGETHER_BASE_URL is not set for provider=together.")
    client = OpenAI(api_key=API_KEY, base_url=BASE_URL)
    print("🔌 Using Together.ai endpoint")

elif provider == "openai":
    API_KEY = os.getenv("OPENAI_API_KEY")
    if not API_KEY:
        raise SystemExit("❌ OPENAI_API_KEY is not set.")
    # OpenAI normally uses default base_url
    client = OpenAI(api_key=API_KEY)
    print("🔌 Using OpenAI endpoint")

else:
    raise SystemExit(f"❌ Unknown provider: {provider}")

if TARGET_PAGE == "all":
    target_pages = list(prompts_by_page.keys())
    # add special 'products' marker if you want to process products in 'all'
    target_pages.append("products")
else:
    # allow 'product:hadley' and 'products'
    if TARGET_PAGE.startswith("product:"):
        # single product slug generation
        target_pages = [TARGET_PAGE]  # keep it; we branch later
    elif TARGET_PAGE == "products":
        target_pages = ["products"]
    elif TARGET_PAGE not in prompts_by_page:
        raise SystemExit(f"❌ No prompts defined for page '{TARGET_PAGE}'")
    else:
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
    if page == "products":
        # generate all products; NUM_NEW acts as number of variants-per-product
        regen_products(target_slugs=None, num_variants=NUM_NEW, model_override=MODEL_OVERRIDE)
        continue
    if page.startswith("product:"):
        slug = page.split(":",1)[1]
        regen_products(target_slugs=[slug], num_variants=NUM_NEW, model_override=MODEL_OVERRIDE)
        continue

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

            model = MODEL_OVERRIDE or p.get("model", "gpt-5.1")
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
