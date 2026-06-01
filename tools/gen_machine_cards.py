#!/usr/bin/env python3
"""
gen_machine_cards.py — fill in each spoke's machine-card blurb + image.

For every machine in src/data/machines.json that has its own external spoke
site (jigawatt, lokki, clear-skies, …), this:

  1. Finds the spoke's index.html — preferring the local sibling repo
     (../<repo>/{docs,site,.}/index.html), else fetching the live URL.
  2. Extracts og:title / og:description / og:image as the "facts".
  3. Generates a ~30-word card blurb in the house voice (the canonical
     src/data/persona_preamble.txt) via the hub's AIClient.
  4. Imports the spoke's og:image into public/assets/machine-<slug>/ (or
     AI-generates one with --generate-images), optimised to a card thumb.
  5. Writes `blurb` and `image` back into machines.json.

The voice comes from one place — persona_preamble.txt — so spoke blurbs read
like the rest of the family. See kit/VOICE.md.

Usage:
  python3 tools/gen_machine_cards.py                  # all spokes: blurb + import image
  python3 tools/gen_machine_cards.py --slug lokki     # just one machine
  python3 tools/gen_machine_cards.py --no-blurb       # images only (no API key needed)
  python3 tools/gen_machine_cards.py --generate-images # AI-generate the image instead of importing
  python3 tools/gen_machine_cards.py --dry-run        # analyse + print; write nothing

Needs OPENAI_API_KEY in .env for blurb generation (and for --generate-images).
Image *import* works offline against the local sibling repos.
"""

import argparse
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

# Make the tools/lib package importable when run directly.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from lib import Output, Paths  # noqa: E402

try:
    from PIL import Image as PILImage
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

# Where index.html tends to live inside a spoke repo, in priority order.
SITE_SUBDIRS = ["docs", "site", "", "app", "public", "web"]
CARD_MAX_WIDTH = 900  # px — card thumbs never render larger than this


def _meta(html: str, prop: str) -> str:
    """Pull a <meta property=… content=…> (or name=…) value out of raw HTML."""
    for attr in ("property", "name"):
        m = re.search(
            rf'<meta\s+{attr}=["\']{re.escape(prop)}["\']\s+content=["\'](.*?)["\']',
            html, re.IGNORECASE | re.DOTALL,
        )
        if not m:
            m = re.search(
                rf'<meta\s+content=["\'](.*?)["\']\s+{attr}=["\']{re.escape(prop)}["\']',
                html, re.IGNORECASE | re.DOTALL,
            )
        if m:
            return m.group(1).strip()
    return ""


def _title(html: str) -> str:
    m = re.search(r"<title>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
    return m.group(1).strip() if m else ""


def _repo_name(machine: dict) -> str:
    repo = machine.get("repo") or ""
    return repo.rstrip("/").split("/")[-1] if repo else machine["slug"]


def find_local_site(machine: dict, gh_root: Path):
    """Return (index_path, site_dir) for a spoke's local checkout, or (None, None)."""
    repo_dir = gh_root / _repo_name(machine)
    if not repo_dir.is_dir():
        return None, None
    for sub in SITE_SUBDIRS:
        candidate = (repo_dir / sub / "index.html") if sub else (repo_dir / "index.html")
        if candidate.exists():
            return candidate, candidate.parent
    return None, None


def load_html(machine: dict, gh_root: Path):
    """Return (html, site_dir_or_None). Local first, then the live URL."""
    index_path, site_dir = find_local_site(machine, gh_root)
    if index_path:
        Output.dim(f"    source: {index_path}")
        return index_path.read_text(encoding="utf-8", errors="ignore"), site_dir
    url = machine.get("url")
    if url:
        try:
            import requests
            Output.dim(f"    source: {url} (fetched)")
            resp = requests.get(url, timeout=20)
            resp.raise_for_status()
            return resp.text, None
        except Exception as e:  # noqa: BLE001
            Output.warning(f"    could not fetch {url}: {e}")
    return None, None


def resolve_og_image(og_image: str, site_dir):
    """Map an og:image URL to a local file under the spoke's site dir, if possible."""
    if not og_image:
        return None
    path = urlparse(og_image).path  # e.g. /assets/hero.webp
    if site_dir and path:
        local = site_dir / path.lstrip("/")
        if local.exists():
            return local
    return None  # caller may still fetch the remote URL


def save_card_image(src_path_or_bytes, slug: str, paths: Paths, ext_hint: str = "webp") -> str:
    """Write the card image under public/assets/machine-<slug>/ and return its web path."""
    out_dir = paths.public_assets / f"machine-{slug}"
    out_dir.mkdir(parents=True, exist_ok=True)

    if PIL_AVAILABLE:
        out = out_dir / f"machine-{slug}.webp"
        if isinstance(src_path_or_bytes, (bytes, bytearray)):
            from io import BytesIO
            img = PILImage.open(BytesIO(src_path_or_bytes))
        else:
            img = PILImage.open(src_path_or_bytes)
        img = img.convert("RGB")
        if img.width > CARD_MAX_WIDTH:
            h = round(img.height * CARD_MAX_WIDTH / img.width)
            img = img.resize((CARD_MAX_WIDTH, h), PILImage.LANCZOS)
        img.save(out, "WEBP", quality=80)
        return f"/assets/machine-{slug}/machine-{slug}.webp"

    # No Pillow: store the raw bytes/file as-is.
    out = out_dir / f"machine-{slug}.{ext_hint}"
    if isinstance(src_path_or_bytes, (bytes, bytearray)):
        out.write_bytes(src_path_or_bytes)
    else:
        out.write_bytes(Path(src_path_or_bytes).read_bytes())
    return f"/assets/machine-{slug}/{out.name}"


def gen_blurb(machine: dict, facts: dict, persona: str, client) -> str:
    user = (
        "A product in the Starstuck Lab family needs a one-line card blurb for "
        "the lab's website.\n\n"
        f"Name: {machine['name']}\n"
        f"Kind: {machine.get('kind', '')}\n"
        f"Tagline: {machine.get('tagline', '')}\n"
        f"What it is: {facts.get('description', '')}\n\n"
        "Write a single blurb of about 25-35 words for its card. Return only the "
        "blurb text — no surrounding quotes, no preamble."
    )
    return client.generate_text(
        prompt=user, system_prompt=persona, model="gpt-5.1", temperature=0.7, max_tokens=120
    ).strip().strip('"')


def gen_image(machine: dict, facts: dict, client) -> bytes:
    prompt = (
        f"A single evocative image for '{machine['name']}', {machine.get('tagline','')}. "
        f"{facts.get('description','')} "
        "Restrained, atmospheric, slightly melancholic; muted palette; one clear subject; "
        "no text, no logos, no words."
    )
    result = client.generate_image(prompt=prompt, size="1792x1024", quality="standard")
    import requests
    return requests.get(result["url"], timeout=60).content


def main() -> int:
    ap = argparse.ArgumentParser(description="Generate machine-card blurbs + images from spoke sites.")
    ap.add_argument("--slug", help="Only process this machine slug.")
    ap.add_argument("--no-blurb", action="store_true", help="Skip blurb generation (no API key needed).")
    ap.add_argument("--generate-images", action="store_true", help="AI-generate the image instead of importing.")
    ap.add_argument("--dry-run", action="store_true", help="Analyse and print; write nothing.")
    args = ap.parse_args()

    paths = Paths()
    gh_root = paths.root.parent  # ~/Documents/GitHub (spoke repos are siblings)
    machines_file = paths.data / "machines.json"

    data = json.loads(machines_file.read_text(encoding="utf-8"))
    machines = data.get("machines", [])

    persona = ""
    client = None
    if not args.no_blurb or args.generate_images:
        if paths.persona.exists():
            persona = paths.persona.read_text(encoding="utf-8").strip()
        try:
            from lib import AIClient
            client = AIClient(provider="openai")
        except Exception as e:  # noqa: BLE001
            Output.warning(f"AI client unavailable ({e}); continuing without generation.")
            client = None

    # Target spokes: external sites with a URL (skip internal telescopes + 'soon').
    targets = [
        m for m in machines
        if (args.slug and m["slug"] == args.slug)
        or (not args.slug and m.get("external") and m.get("url") and m.get("access") != "soon")
    ]
    if not targets:
        Output.warning("No matching machines to process.")
        return 1

    Output.section(f"Machine cards — {len(targets)} target(s)")
    changed = False

    for m in targets:
        slug = m["slug"]
        Output.header(f"{m['name']} ({slug})")

        html, site_dir = load_html(m, gh_root)
        if not html:
            Output.warning("  no site source found — skipping")
            continue

        facts = {
            "title": _meta(html, "og:title") or _title(html),
            "description": _meta(html, "og:description"),
            "image": _meta(html, "og:image"),
        }
        Output.info(f"  facts: {facts['title']!r} / image={facts['image'] or '—'}")
        Output.dim(f"    {facts['description'][:140]}")

        # Blurb
        if not args.no_blurb and client:
            try:
                blurb = gen_blurb(m, facts, persona, client)
                Output.success(f"  blurb: {blurb}")
                if not args.dry_run:
                    m["blurb"] = blurb
                    changed = True
            except Exception as e:  # noqa: BLE001
                Output.error(f"  blurb generation failed: {e}")

        # Image
        try:
            web_path = None
            if args.generate_images and client:
                Output.progress("  generating image…")
                if not args.dry_run:
                    web_path = save_card_image(gen_image(m, facts, client), slug, paths)
            else:
                local = resolve_og_image(facts["image"], site_dir)
                if local:
                    Output.info(f"  importing image: {local.name}")
                    if not args.dry_run:
                        web_path = save_card_image(local, slug, paths)
                elif facts["image"]:
                    Output.info(f"  fetching image: {facts['image']}")
                    if not args.dry_run:
                        import requests
                        b = requests.get(facts["image"], timeout=30).content
                        ext = Path(urlparse(facts["image"]).path).suffix.lstrip(".") or "webp"
                        web_path = save_card_image(b, slug, paths, ext_hint=ext)
                else:
                    Output.dim("  no og:image — skipping image")
            if web_path:
                Output.success(f"  image → {web_path}")
                m["image"] = web_path
                changed = True
        except Exception as e:  # noqa: BLE001
            Output.error(f"  image step failed: {e}")

    if changed and not args.dry_run:
        machines_file.write_text(
            json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )
        Output.success(f"\nUpdated {machines_file}")
    else:
        Output.info("\nNo changes written" + (" (dry run)" if args.dry_run else ""))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
