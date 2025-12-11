# SPDX-License-Identifier: DWYWBDBM-1.0
# site/tools/generate_products_json.py
"""
Zero-touch product generator.
Authoring rule: drop one JSON file per product in site/src/data/products/*.json
Then run this script. No central registration required.

Usage:
  # dry-run (no API)
  python3 site/tools/generate_products_json.py

  # real generation (OpenAI)
  OPENAI_API_KEY="sk-..." python3 site/tools/generate_products_json.py --use-openai

Behavior:
- Uses inline "prompt" in product JSON if present.
- Else uses inline "prompt_id" pointing to templates in site/src/data/templates.json (optional).
- Else infer a template by checking product "tags" against templates_map.
- Else fall back to "_default".
"""
from __future__ import annotations
import os, sys, json, glob, argparse, datetime, pathlib, html
from typing import Dict, Any

ROOT = pathlib.Path(__file__).resolve().parents[1]  # site/
SRC_PRODUCTS_DIR = ROOT / "src" / "data" / "products"
TEMPLATES_PATH = ROOT / "src" / "data" / "templates.json"   # optional central templates file
PUBLIC_PRODUCTS_DIR = ROOT / "public" / "data" / "products"

PUBLIC_PRODUCTS_DIR.mkdir(parents=True, exist_ok=True)

# Minimal HTML-safe conversion. If you want richer HTML, plug in a Markdown renderer + sanitizer.
def text_to_safe_html(text: str) -> str:
    paras = [f"<p>{html.escape(p.strip())}</p>" for p in text.split("\n\n") if p.strip()]
    return "\n".join(paras) if paras else f"<p>{html.escape(text.strip())}</p>"

def load_templates() -> Dict[str,Any]:
    if TEMPLATES_PATH.exists():
        try:
            return json.loads(TEMPLATES_PATH.read_text(encoding='utf-8'))
        except Exception as e:
            print("Warning: could not load templates.json:", e)
            return {}
    # sensible built-in defaults (used if no templates.json present)
    return {
        "product-blurb": {
            "prompt": "Write a short (40–80 words) product blurb for '{{title}}'. Tone: Starstuck Lab persona — dry, slightly nihilistic, witty. Include one short 'What's included' sentence (not a list). Output plain text only.",
            "temperature": 0.7
        },
        "telescope-blurb": {
            "prompt": "Write a short (40–80 words) product blurb for '{{title}}' as a slightly mythic, technical but witty description that hints at the build. Include 'What's included' sentence. Output plain text only.",
            "temperature": 0.6
        },
        "weather-quick": {
            "prompt": "Write a short (25–50 words) product blurb for '{{title}}' with a playful, slightly skeptical voice. Mention one 'what's included' clause. Keep it useful for a product listing.",
            "temperature": 0.6
        },
        "_default": {
            "prompt": "Write a short product blurb for '{{title}}' in the site's persona.",
            "temperature": 0.6
        }
    }

# simple mapping of tags -> template key (you can extend in templates.json if desired)
DEFAULT_TAG_MAP = {
    "telescope": "telescope-blurb",
    "weather": "weather-quick",
    "sensor": "weather-quick",
    "3d-printed": "product-blurb"
}

# OpenAI helper (minimal)
def call_openai_chat(prompt: str, temperature: float = 0.7) -> str:
    import os, requests
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise RuntimeError("OPENAI_API_KEY not set")
    url = "https://api.openai.com/v1/chat/completions"
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": "You are a concise product copywriter in the Starstuck Lab voice; keep content friendly and safe."},
            {"role": "user", "content": prompt}
        ],
        "temperature": temperature,
        "max_tokens": 420
    }
    r = requests.post(url, headers=headers, json=payload, timeout=60)
    r.raise_for_status()
    j = r.json()
    return j["choices"][0]["message"]["content"].strip()

def pick_prompt_for_product(src: Dict[str,Any], templates: Dict[str,Any]) -> Dict[str,Any]:
    """
    Return dict {prompt_text, temperature, reason}
    Priority:
      1. src['prompt'] (inline full prompt)
      2. src['prompt_id'] referencing templates
      3. tag-based inference
      4. templates['_default']
    """
    title = src.get("title", src.get("slug","product"))
    # 1) inline full prompt
    if src.get("prompt"):
        return {"prompt": src["prompt"].replace("{{title}}", title).replace("{{excerpt}}", src.get("excerpt","")),
                "temperature": src.get("prompt_temperature", 0.7),
                "reason": "inline-prompt"}
    # 2) inline prompt_id
    pid = src.get("prompt_id")
    if pid and pid in templates:
        entry = templates[pid]
        return {"prompt": entry["prompt"].replace("{{title}}", title).replace("{{excerpt}}", src.get("excerpt","")),
                "temperature": entry.get("temperature", 0.7),
                "reason": f"prompt_id:{pid}"}
    # 3) tag inference
    tags = src.get("tags", [])
    for t in tags:
        mapped = templates.get(DEFAULT_TAG_MAP.get(t)) or templates.get(DEFAULT_TAG_MAP.get(t, ''))
        # prefer explicit mapping from templates dict if exists
        map_key = DEFAULT_TAG_MAP.get(t)
        if map_key:
            entry = templates.get(map_key)
            if entry:
                return {"prompt": entry["prompt"].replace("{{title}}", title).replace("{{excerpt}}", src.get("excerpt","")),
                        "temperature": entry.get("temperature", 0.7),
                        "reason": f"tag-map:{t}->{map_key}"}
    # 4) templates fallback
    entry = templates.get("_default", {"prompt": "Write a short product blurb for '{{title}}'."})
    return {"prompt": entry["prompt"].replace("{{title}}", title).replace("{{excerpt}}", src.get("excerpt","")),
            "temperature": entry.get("temperature", 0.7),
            "reason": "default"}

def generate_for_product(src_path: pathlib.Path, templates: Dict[str,Any], use_openai: bool):
    src = json.loads(src_path.read_text(encoding='utf-8'))
    slug = src.get("slug") or src_path.stem
    title = src.get("title", slug)

    choice = pick_prompt_for_product(src, templates)
    prompt_text = choice["prompt"]
    temperature = choice.get("temperature", 0.7)
    reason = choice.get("reason","unknown")

    if use_openai:
        try:
            generated_text = call_openai_chat(prompt_text, temperature=temperature)
            model = "openai"
        except Exception as e:
            print("OpenAI call failed:", e)
            generated_text = f"{title} — generated blurb temporarily unavailable (OpenAI error)."
            model = "fallback"
    else:
        # deterministic mock text (developer-friendly)
        included = src.get("included", [])
        included_txt = ", ".join(included) if included else "unit and instructions"
        generated_text = f"{title} — {src.get('excerpt','A compact device.')} What's included: {included_txt}."
        model = "mock"

    gen_id = f"g-{datetime.datetime.utcnow().isoformat(timespec='seconds').replace(':','-')}"
    meta = {
        "id": gen_id,
        "date": datetime.datetime.utcnow().isoformat(),
        "mood": src.get("mood_default", 50),
        "prompt_selection_reason": reason,
        "prompt_id_used": src.get("prompt_id") or None,
        "model": model,
        "excerpt": src.get("excerpt") or generated_text.splitlines()[0][:200]
    }

    out_obj = { **meta,
        "slug": slug,
        "title": title,
        "price": src.get("price"),
        "currency": src.get("currency","USD"),
        "status": src.get("status","available"),
        "tags": src.get("tags", []),
        "specs": src.get("specs", {}),
        "html": text_to_safe_html(generated_text),
        "raw": generated_text
    }

    out_path = PUBLIC_PRODUCTS_DIR / f"{slug}.json"
    out_path.write_text(json.dumps(out_obj, ensure_ascii=False, indent=2), encoding='utf-8')
    print("WROTE:", out_path, "(prompt reason:", reason, ")")

    if src.get("enable_audit", True):
        src.setdefault("generated", [])
        src["generated"].insert(0, { **meta, "public_file": f"/data/products/{slug}.json" })
        src_path.write_text(json.dumps(src, ensure_ascii=False, indent=2), encoding='utf-8')
        print("UPDATED SOURCE (audit):", src_path)

    return out_path

def main(argv):
    parser = argparse.ArgumentParser()
    parser.add_argument("--use-openai", action="store_true", help="Call OpenAI API (requires OPENAI_API_KEY)")
    parser.add_argument("--product", help="Only generate for a single product slug")
    args = parser.parse_args(argv)

    templates = load_templates()
    use_openai = args.use_openai
    product_files = sorted(glob.glob(str(SRC_PRODUCTS_DIR / "*.json")))
    if args.product:
        product_files = [str(SRC_PRODUCTS_DIR / f"{args.product}.json")]

    if not product_files:
        print("No product input files found in", SRC_PRODUCTS_DIR)
        return

    for p in product_files:
        generate_for_product(pathlib.Path(p), templates, use_openai)

if __name__ == "__main__":
    main(sys.argv[1:])
