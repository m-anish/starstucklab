#!/usr/bin/env python3
"""
Starstuck Lab Projects CLI
--------------------------
Manage project markdown files with ease.

Usage:
    python3 site/tools/projects_cli.py list
    python3 site/tools/projects_cli.py add "New Project Title"
    python3 site/tools/projects_cli.py add "New Project" --ai
    python3 site/tools/projects_cli.py edit telescope-loneliness
    python3 site/tools/projects_cli.py delete old-project
    python3 site/tools/projects_cli.py info telescope-loneliness
    python3 site/tools/projects_cli.py rebuild-index
    python3 site/tools/projects_cli.py config
"""

import os
import sys
import json
import yaml
import argparse
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ---- PATHS ----
ROOT = Path(__file__).resolve().parent.parent
PROJECTS_DIR = ROOT / "src" / "content" / "projects"
TEMPLATE_FILE = ROOT / "src" / "data" / "project-template.json"
PUBLIC_INDEX = ROOT / "public" / "data" / "projects" / "_index.json"
CONFIG_YAML = ROOT / "src" / "data" / "projects" / "config.yaml"
PERSONA_FILE = ROOT / "src" / "data" / "persona_preamble.txt"

PROJECTS_DIR.mkdir(parents=True, exist_ok=True)
PUBLIC_INDEX.parent.mkdir(parents=True, exist_ok=True)

# ---- COLORS ----
class Color:
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    CYAN = '\033[96m'
    MAGENTA = '\033[95m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def colorize(text: str, color: str) -> str:
    return f"{color}{text}{Color.RESET}"

# ---- CONFIG LOADING ----
def load_site_config() -> Dict:
    """Load config.yaml from site/src/content/config.yaml."""
    if not CONFIG_YAML.exists():
        print(colorize(f"⚠️  Config file not found: {CONFIG_YAML}", Color.YELLOW))
        print(colorize(f"   Using fallback defaults", Color.YELLOW))
        return {
            "allowed_categories": ["Other"],
            "allowed_status": ["ongoing", "completed"],
            "default_tags": [],
            "ai_config": {"enabled": False, "provider": "openai", "default_model": "gpt-4"}
        }

    try:
        raw = CONFIG_YAML.read_text(encoding="utf-8")
        cfg = yaml.safe_load(raw)
        
        if not isinstance(cfg, dict):
            raise ValueError("config.yaml root is not a dict")
        
        cfg.setdefault("allowed_categories", ["Other"])
        cfg.setdefault("allowed_status", ["ongoing", "completed"])
        cfg.setdefault("default_tags", [])
        cfg.setdefault("ai_config", {"enabled": False, "provider": "openai", "default_model": "gpt-4"})
        
        return cfg
    except Exception as e:
        print(colorize(f"⚠️  Failed to load config.yaml: {e}", Color.YELLOW))
        return {
            "allowed_categories": ["Other"],
            "allowed_status": ["ongoing", "completed"],
            "default_tags": [],
            "ai_config": {"enabled": False, "provider": "openai", "default_model": "gpt-4"}
        }

# Load config at module level
SITE_CONFIG = load_site_config()
ALLOWED_CATEGORIES = SITE_CONFIG.get("allowed_categories", ["Other"])
ALLOWED_STATUS = SITE_CONFIG.get("allowed_status", ["ongoing", "completed"])
DEFAULT_TAGS = SITE_CONFIG.get("default_tags", [])
AI_CONFIG = SITE_CONFIG.get("ai_config", {})

# ---- AI SETUP ----
def setup_ai_client():
    """
    Setup AI client based on config and environment.
    Returns (client, provider) or (None, None) if not configured.
    """
    if not AI_CONFIG.get("enabled", False):
        return None, None
    
    provider = AI_CONFIG.get("provider", "openai")
    
    try:
        from openai import OpenAI
        
        if provider == "together":
            api_key = os.getenv("TOGETHER_API_KEY")
            base_url = os.getenv("TOGETHER_BASE_URL")
            if not api_key or not base_url:
                print(colorize("⚠️  Together.ai configured but TOGETHER_API_KEY or TOGETHER_BASE_URL not set", Color.YELLOW))
                return None, None
            client = OpenAI(api_key=api_key, base_url=base_url)
            return client, "together"
        
        elif provider == "openai":
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                print(colorize("⚠️  OpenAI configured but OPENAI_API_KEY not set", Color.YELLOW))
                return None, None
            client = OpenAI(api_key=api_key)
            return client, "openai"
        
        else:
            print(colorize(f"⚠️  Unknown AI provider: {provider}", Color.YELLOW))
            return None, None
    
    except ImportError:
        print(colorize("⚠️  openai package not installed (pip install openai)", Color.YELLOW))
        return None, None

def load_persona() -> str:
    """Load persona preamble for AI generation."""
    if not PERSONA_FILE.exists():
        return "You are a maker documenting projects with a melancholic, dry, slightly nihilistic tone."
    return PERSONA_FILE.read_text(encoding="utf-8").strip()

def generate_project_content_ai(title: str, category: str, status: str, tags: List[str]) -> Dict[str, str]:
    """
    Generate project content using AI.
    Returns dict with 'overview', 'components', 'how_it_works', 'build_notes', 'reflections'
    """
    client, provider = setup_ai_client()
    
    if not client:
        print(colorize("❌ AI generation not available", Color.RED))
        return {}
    
    persona = load_persona()
    model = AI_CONFIG.get("default_model", "gpt-4")
    
    print(colorize(f"🤖 Generating project content with AI ({provider}/{model})...", Color.CYAN))
    
    # Build comprehensive prompt
    prompt = f"""
{persona}

---

I need you to write content for a new project documentation page.

Project Title: {title}
Category: {category}
Status: {status}
Tags: {', '.join(tags)}

Generate the following sections for this project. Use the Starstuck Lab tone: melancholic, dry, slightly nihilistic, witty, technical but not overly complex. Write as if documenting something you built in your workshop.

Please provide:

1. OVERVIEW (2-3 sentences): Brief description of what this project is and why it exists.

2. COMPONENTS (3-5 items): List of main parts/materials used. Be specific but not exhaustive.

3. HOW IT WORKS (3-4 numbered steps): Technical explanation of the core mechanism/process.

4. BUILD NOTES (1 paragraph): Challenges faced, iterations, lessons learned. Be honest about what went wrong.

5. REFLECTIONS (1-2 sentences): Final thoughts. Would you build it again?

Format your response as valid JSON with these exact keys:
{{
  "overview": "...",
  "components": ["item 1", "item 2", ...],
  "how_it_works": ["step 1", "step 2", ...],
  "build_notes": "...",
  "reflections": "..."
}}

Output ONLY the JSON, no markdown formatting, no backticks, no preamble.
"""
    
    try:
        response = client.chat.completions.create(
            model=model,
            temperature=0.7,
            messages=[
                {"role": "system", "content": persona},
                {"role": "user", "content": prompt}
            ]
        )
        
        content = response.choices[0].message.content.strip()
        
        # Strip markdown code fences if present
        if content.startswith("```"):
            lines = content.split('\n')
            content = '\n'.join(lines[1:-1]) if len(lines) > 2 else content
        content = content.replace("```json", "").replace("```", "").strip()
        
        # Parse JSON
        generated = json.loads(content)
        
        print(colorize("✅ AI generation complete", Color.GREEN))
        return generated
    
    except json.JSONDecodeError as e:
        print(colorize(f"❌ Failed to parse AI response as JSON: {e}", Color.RED))
        print(colorize(f"   Raw response: {content[:200]}...", Color.YELLOW))
        return {}
    except Exception as e:
        print(colorize(f"❌ AI generation error: {e}", Color.RED))
        return {}

# ---- HELPERS ----
def slugify(title: str) -> str:
    """Convert title to slug."""
    import re
    slug = title.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')

def load_template() -> Dict:
    """Load project template JSON."""
    if not TEMPLATE_FILE.exists():
        print(colorize(f"⚠️  Template not found: {TEMPLATE_FILE}", Color.YELLOW))
        return {}

    try:
        return json.loads(TEMPLATE_FILE.read_text(encoding='utf-8'))
    except Exception as e:
        print(colorize(f"❌ Failed to load template: {e}", Color.RED))
        return {}

def parse_frontmatter(content: str) -> tuple:
    """
    Parse YAML frontmatter from markdown.
    Returns (frontmatter_dict, body_string)
    Robust error handling for malformed files.
    """
    if not content or not isinstance(content, str):
        return {}, content if content else ""
    
    if not content.startswith('---'):
        return {}, content

    try:
        # Split on '---' delimiter
        parts = content.split('---', 2)
        
        # Need at least 3 parts: ['', frontmatter, body]
        if len(parts) < 3:
            print(colorize(f"⚠️  Invalid frontmatter format (expected 3 parts, got {len(parts)})", Color.YELLOW))
            return {}, content
        
        # Parse YAML from middle section
        yaml_text = parts[1].strip()
        if not yaml_text:
            print(colorize("⚠️  Empty frontmatter section", Color.YELLOW))
            return {}, parts[2].strip() if len(parts) > 2 else ""
        
        frontmatter = yaml.safe_load(yaml_text)
        body = parts[2].strip()
        
        # Ensure frontmatter is a dict
        if not isinstance(frontmatter, dict):
            print(colorize(f"⚠️  Frontmatter is not a dict (got {type(frontmatter)})", Color.YELLOW))
            return {}, body
        
        return frontmatter, body
        
    except yaml.YAMLError as e:
        print(colorize(f"⚠️  YAML parse error: {e}", Color.YELLOW))
        return {}, content
    except IndexError as e:
        print(colorize(f"⚠️  Frontmatter split error: {e}", Color.YELLOW))
        return {}, content
    except Exception as e:
        print(colorize(f"⚠️  Unexpected frontmatter error: {e}", Color.YELLOW))
        return {}, content

def get_all_projects() -> List[Path]:
    """Get all project markdown files."""
    return sorted(PROJECTS_DIR.glob("*.md"))

def load_project(slug: str) -> Optional[tuple]:
    """
    Load project frontmatter and content.
    Returns (frontmatter, body, path) or None if not found.
    """
    path = PROJECTS_DIR / f"{slug}.md"
    if not path.exists():
        return None

    try:
        content = path.read_text(encoding='utf-8')
        frontmatter, body = parse_frontmatter(content)
        return frontmatter, body, path
    except UnicodeDecodeError as e:
        print(colorize(f"❌ File encoding error in {slug}: {e}", Color.RED))
        print(colorize(f"   Try saving the file as UTF-8", Color.YELLOW))
        return None
    except Exception as e:
        print(colorize(f"❌ Failed to load {slug}: {e}", Color.RED))
        return None

def get_editor() -> str:
    """Get preferred text editor from environment."""
    return os.environ.get('EDITOR', os.environ.get('VISUAL', 'nano'))

def choose_from_list(prompt: str, options: list, default: Optional[str] = None) -> str:
    """Present a numbered list; accept numeric choice or typed exact match."""
    if not options:
        return default or ""

    print(prompt)
    for i, opt in enumerate(options, start=1):
        print(f"  {i}) {opt}")
    
    default_display = default or options[0]
    raw = input(f"Choose [1-{len(options)}] or type exact value [{default_display}]: ").strip()
    
    if not raw:
        return default or options[0]
    
    if raw.isdigit():
        idx = int(raw)
        if 1 <= idx <= len(options):
            return options[idx - 1]
    
    if raw in options:
        return raw
    
    print(colorize(f"⚠️  Invalid choice '{raw}', using default '{default_display}'", Color.YELLOW))
    return default or options[0]

# --- IMAGE PROMPT HELPERS ---------------------------------------------------

def build_image_prompt(title: str, slug: str, excerpt: str, ai_content: Optional[Dict] = None) -> str:
    """
    Build a strict, high-quality hero-image prompt.
    This version enforces:
        - no text
        - studio ghibli inspired painting style
        - warm color palette
        - minimal, web-friendly composition
    """

    base = [
        f"Hero image for a project titled \"{title}\" (slug: {slug}).",
        f"Concept summary: {excerpt}",
        "Create a cinematic 16:9 landscape illustration in a Studio Ghibli-inspired painterly style.",
        "Use a warm color palette: soft golds, oranges, warm greens, warm blues, gentle warm light.",
        "Absolutely no text, no letters, no signage, no typography, no logos, no symbols.",
        "Minimal composition suitable for a website hero banner — a single clear focal subject, soft depth of field, atmospheric background.",
        "Soft, whimsical lighting; hand-painted texture; gentle gradients; organic shapes; subtle rim-light where appropriate.",
        "Avoid clutter. Avoid overly complex scenes. Avoid dark or cold palettes.",
        "High detail but calm; expressive, warm atmosphere."
    ]

    # Optional content-based cues
    if ai_content:
        mood = ai_content.get("reflections") or ai_content.get("overview") or ""
        mood = " ".join(mood.split()[:25]).strip()
        if mood:
            base.append(f"Mood inspiration from project text: {mood}")

        comps = ai_content.get("components", [])
        if isinstance(comps, list) and comps:
            base.append(f"Potential symbolic elements (use only if they make the composition cleaner): {', '.join(comps[:4])}")

    # Technical output specs
    base.append("Output resolution: 3840×2160 (4k) or 1920×1080 if unsupported.")
    base.append("File should contain no added text or watermarks. Pure illustrated scene only.")

    return " ".join(base)



def maybe_copy_to_clipboard(text: str, filename: str) -> None:
    """
    Try to copy `text` to clipboard if pyperclip installed.
    If not available, write to filename and inform the user.
    """
    try:
        import pyperclip
        pyperclip.copy(text)
        print(colorize(f"✅ Prompt copied to clipboard.", Color.GREEN))
        # still save a copy
        Path(filename).write_text(text, encoding='utf-8')
        print(colorize(f"   Saved a copy at: {filename}", Color.CYAN))
    except Exception:
        Path(filename).write_text(text, encoding='utf-8')
        print(colorize(f"ℹ️  pyperclip not available — prompt saved to {filename}", Color.YELLOW))

def build_markdown_content(
    title: str,
    slug: str,
    excerpt: str,
    tags: List[str],
    status: str,
    today: str,
    ai_content: Optional[Dict] = None
) -> str:
    """Build markdown content with optional AI-generated sections."""
    
    if ai_content:
        # Format components as bullet list
        components_list = ai_content.get('components', ['Component 1', 'Component 2'])
        if isinstance(components_list, list):
            components = '\n'.join([f"- {c}" for c in components_list])
        else:
            components = "- Component 1\n- Component 2"
        
        # Format how_it_works as numbered list
        how_works_list = ai_content.get('how_it_works', ['Step one'])
        if isinstance(how_works_list, list):
            how_it_works = '\n'.join([f"{i}. {step}" for i, step in enumerate(how_works_list, start=1)])
        else:
            how_it_works = "1. Step one"
        
        overview = ai_content.get('overview', '[Describe the project: why you built it, what it does, context]')
        build_notes = ai_content.get('build_notes', '[Challenges, decisions, iterations, things you learned]')
        reflections = ai_content.get('reflections', "[What worked, what didn't, would you do it again?]")
        
        content = f"""# {title}

{excerpt}

## Overview

{overview}

## Components

{components}

## How It Works

{how_it_works}

## Build Notes

{build_notes}

## Code

```python
# Code snippets if relevant
```

## Reflections

{reflections}

## Images

![Alt text](./image-name.jpg)
*Caption*
"""
    else:
        # Default template without AI
        content = f"""# {title}

{excerpt}

## Overview

[Describe the project: why you built it, what it does, context]

## Components

- Component 1
- Component 2
- Component 3

## How It Works

1. Step one
2. Step two
3. Step three

## Build Notes

[Challenges, decisions, iterations, things you learned]

## Code

```python
# Code snippets if relevant
```

## Reflections

[What worked, what didn't, would you do it again?]

## Images

![Alt text](./image-name.jpg)
*Caption*
"""
    
    # Add footer
    tags_formatted = ', '.join([f'#{t}' for t in tags])
    content += f"""
---

**Tags:** {tags_formatted}  
**Status:** {status}  
**Last Updated:** {today}
"""
    
    return content

# ---- COMMANDS ----

def cmd_list(args):
    """List all projects."""
    projects = get_all_projects()

    if not projects:
        print(colorize("📂 No projects found.", Color.YELLOW))
        print(f"   Create one with: {sys.argv[0]} add \"Project Title\"")
        return

    print(colorize(f"\n📂 Found {len(projects)} project(s):\n", Color.BOLD))

    for p in projects:
        try:
            content = p.read_text(encoding='utf-8')
            fm, _ = parse_frontmatter(content)

            slug = p.stem
            title = fm.get('title', slug)
            status = fm.get('status', 'unknown')
            category = fm.get('category', '—')
            date = fm.get('date', '—')
            featured = '⭐' if fm.get('featured', False) else '  '

            status_color = {
                'completed': Color.GREEN,
                'ongoing': Color.BLUE,
                'experimental': Color.YELLOW,
                'abandoned': Color.RED,
                'dormant': Color.YELLOW
            }.get(status, Color.RESET)

            print(f"{featured} {colorize(slug, Color.BOLD)}")
            print(f"   {title}")
            print(f"   {colorize(status, status_color)} · {category} · {date}\n")
        except Exception as e:
            print(colorize(f"⚠️  Error reading {p.name}: {e}", Color.YELLOW))
            continue

def cmd_add(args):
    """Create a new project from template."""
    title = args.title or input("Project title: ").strip()

    if not title:
        print(colorize("❌ Title required.", Color.RED))
        return

    slug = slugify(title)
    path = PROJECTS_DIR / f"{slug}.md"

    if path.exists():
        print(colorize(f"❌ Project already exists: {slug}", Color.RED))
        return

    template = load_template()

    print(colorize(f"\n📝 Creating new project: {slug}\n", Color.BLUE))

    # Category selection
    category_default = template.get('category') or (ALLOWED_CATEGORIES[0] if ALLOWED_CATEGORIES else 'Other')
    category = choose_from_list("Category:", ALLOWED_CATEGORIES, default=category_default)

    # Status selection
    status_default = template.get('status') or (ALLOWED_STATUS[0] if ALLOWED_STATUS else 'ongoing')
    status = choose_from_list("Status:", ALLOWED_STATUS, default=status_default)
    
    # Tags
    tags_default = ','.join(template.get('tags', DEFAULT_TAGS))
    tags_input = input(f"Tags (comma-separated) [{tags_default}]: ").strip()
    tags = [t.strip() for t in tags_input.split(',')] if tags_input else template.get('tags', DEFAULT_TAGS)
    
    # Excerpt
    excerpt = input("One-line excerpt: ").strip() or f"A project about {title.lower()}."

    # AI generation option
    use_ai = args.ai if hasattr(args, 'ai') else False
    ai_content = None
    
    if not use_ai:
        # Ask interactively if --ai flag not provided
        ai_available = AI_CONFIG.get("enabled", False) and (os.getenv("OPENAI_API_KEY") or os.getenv("TOGETHER_API_KEY"))
        
        if ai_available:
            print(colorize("\n🤖 AI content generation available", Color.CYAN))
            use_ai_input = input("Generate project content with AI? [y/N]: ").strip().lower()
            use_ai = use_ai_input in ['y', 'yes']
    
    if use_ai:
        ai_content = generate_project_content_ai(title, category, status, tags)
        if not ai_content:
            print(colorize("⚠️  AI generation failed, using manual template", Color.YELLOW))

    # Build frontmatter (NO 'slug' field - Astro uses filename)
    today = datetime.now().strftime('%Y-%m-%d')
    frontmatter = {
        'title': title,
        'category': category,
        'status': status,
        'tags': tags,
        'date': today,
        'updated': today,
        'featured': False,
        'image': f'/assets/projects/{slug}/hero.webp',
        'image_alt': f'{title} hero image',
        'excerpt': excerpt
    }

    # Build complete markdown
    fm_yaml = yaml.dump(frontmatter, default_flow_style=False, allow_unicode=True, sort_keys=False)
    content = f"---\n{fm_yaml.strip()}\n---\n\n{build_markdown_content(title, slug, excerpt, tags, status, today, ai_content)}"

    # Write file
    try:
        path.write_text(content, encoding='utf-8')
        print(colorize(f"\n✅ Created: {path}", Color.GREEN))
        
        if ai_content:
            print(colorize("   ✨ AI-generated content included", Color.CYAN))

        # --- Image generation / prompt option ---
        want_image = input("\nCreate a hero image for this project now? [y/N]: ").strip().lower() in ['y', 'yes']
        if want_image:
            # Build a prompt
            image_prompt = build_image_prompt(title, slug, excerpt, ai_content)

            # Ask whether to generate automatically or print prompt
            print("\nHow would you like to proceed with the image?")
            print("  1) Attempt automatic generation (external tool/api)")
            print("  2) Print prompt to console for manual use / copy")
            print("  3) Save prompt to file (no clipboard)")
            choice = input("Choose [1/2/3] (default 2): ").strip() or "2"

            if choice == "1":
                print(colorize("🔌 Attempting automatic generation (this will call an external tool)...", Color.CYAN))

                # Ensure assets dir exists under public so the site can serve it
                assets_dir = ROOT / "public" / "assets" / "projects" / slug
                assets_dir.mkdir(parents=True, exist_ok=True)

                # Output filename and web path (frontmatter should use the web path)
                out_name = "hero.webp"
                out_path = assets_dir / out_name
                out_web_path = f"/assets/projects/{slug}/{out_name}"

                # Build a prompt file (temp) that can be consumed by generator
                tmp_prompt = PROJECTS_DIR / f"{slug}-image-prompt.txt"
                tmp_prompt.write_text(image_prompt, encoding='utf-8')

                # Default command — user can override PROJECT_IMAGE_CMD in env.
                # The default expects a CLI that accepts a prompt file and an output path.
                default_cmd = f"python3 site/tools/image_gen_cli.py --prompt-file {tmp_prompt} --out {out_path}"
                external_cmd = os.environ.get("PROJECT_IMAGE_CMD", default_cmd)

                # Replace placeholders if user used them
                external_cmd = external_cmd.replace("{prompt_file}", str(tmp_prompt)).replace("{out_file}", str(out_path)).replace("{out_path}", str(out_path))

                # Tokenize safely (so users can set quoted args)
                try:
                    cmd_list = shlex.split(external_cmd)
                except Exception:
                    cmd_list = external_cmd.split()

                try:
                    # Run generator
                    subprocess.run(cmd_list, check=True)

                    # Verify output exists
                    if not out_path.exists() or out_path.stat().st_size == 0:
                        raise FileNotFoundError(f"Expected output not found: {out_path}")

                    print(colorize(f"✅ Image generated: {out_path}", Color.GREEN))

                    # Update frontmatter in the markdown file to point to the generated image
                    # Load current file content
                    raw = path.read_text(encoding='utf-8')
                    fm, body = parse_frontmatter(raw)

                    if not isinstance(fm, dict):
                        fm = {}

                    fm['image'] = out_web_path
                    fm['image_alt'] = fm.get('image_alt', f"{title} hero image")
                    fm['updated'] = datetime.now().strftime('%Y-%m-%d')

                    # Dump YAML frontmatter back and rewrite file
                    new_fm_yaml = yaml.dump(fm, default_flow_style=False, allow_unicode=True, sort_keys=False)
                    new_content = f"---\n{new_fm_yaml.strip()}\n---\n\n{body}"
                    path.write_text(new_content, encoding='utf-8')

                    print(colorize(f"✅ Frontmatter updated to use {out_web_path}", Color.GREEN))

                except subprocess.CalledProcessError as e:
                    print(colorize(f"❌ Automatic generation command failed: {e}", Color.RED))
                    print(colorize("   Falling back to printing the prompt below.\n", Color.YELLOW))
                    print(image_prompt)
                except FileNotFoundError as e:
                    print(colorize(f"❌ Image not created: {e}", Color.RED))
                    print(colorize("   Falling back to printing the prompt below.\n", Color.YELLOW))
                    print(image_prompt)
                except Exception as e:
                    print(colorize(f"❌ Unexpected error while generating image: {e}", Color.RED))
                    print(colorize("   Falling back to printing the prompt below.\n", Color.YELLOW))
                    print(image_prompt)
            elif choice == "3":
                out_file = PROJECTS_DIR / f"{slug}-image-prompt.txt"
                out_file.write_text(image_prompt, encoding='utf-8')
                print(colorize(f"✅ Prompt saved to {out_file}", Color.GREEN))
                print(colorize("Tip: install 'pyperclip' to enable automatic clipboard copying.", Color.CYAN))
            else:
                # Default: print to console and try clipboard
                print(colorize("\n--- IMAGE PROMPT (copy & paste) ---\n", Color.BOLD))
                print(image_prompt)
                print(colorize("\n--- end prompt ---\n", Color.BOLD))
                prompt_file = PROJECTS_DIR / f"{slug}-image-prompt.txt"
                maybe_copy_to_clipboard(image_prompt, str(prompt_file))

        # Ask if they want to edit now
        edit_now = input("\nOpen in editor now? [Y/n]: ").strip().lower()
        if edit_now != 'n':
            editor = get_editor()
            subprocess.run([editor, str(path)])
    except Exception as e:
        print(colorize(f"❌ Failed to write file: {e}", Color.RED))

def cmd_edit(args):
    """Edit a project in preferred text editor."""
    slug = args.slug

    if not slug:
        print(colorize("❌ Slug required.", Color.RED))
        print(f"Usage: {sys.argv[0]} edit <slug>")
        return

    result = load_project(slug)
    if not result:
        print(colorize(f"❌ Project not found: {slug}", Color.RED))
        return

    _, _, path = result
    editor = get_editor()

    print(colorize(f"📝 Opening {slug} in {editor}...", Color.BLUE))
    subprocess.run([editor, str(path)])

def cmd_delete(args):
    """Delete a project (with confirmation)."""
    slug = args.slug

    if not slug:
        print(colorize("❌ Slug required.", Color.RED))
        return

    result = load_project(slug)
    if not result:
        print(colorize(f"❌ Project not found: {slug}", Color.RED))
        return

    fm, _, path = result
    title = fm.get('title', slug)

    print(colorize(f"\n⚠️  Delete project: {title}?", Color.YELLOW))
    print(f"   Path: {path}")
    confirm = input("\nType 'yes' to confirm: ").strip().lower()

    if confirm != 'yes':
        print(colorize("❌ Cancelled.", Color.YELLOW))
        return

    path.unlink()
    print(colorize(f"✅ Deleted: {slug}", Color.GREEN))

def cmd_info(args):
    """Show detailed info about a project."""
    slug = args.slug

    if not slug:
        print(colorize("❌ Slug required.", Color.RED))
        return

    result = load_project(slug)
    if not result:
        print(colorize(f"❌ Project not found: {slug}", Color.RED))
        return

    fm, body, path = result
    file_slug = path.stem

    print(colorize(f"\n📋 Project: {fm.get('title', file_slug)}\n", Color.BOLD))
    print(f"Slug:      {file_slug}")
    print(f"Category:  {fm.get('category', '—')}")
    print(f"Status:    {fm.get('status', '—')}")
    print(f"Tags:      {', '.join(fm.get('tags', []))}")
    print(f"Date:      {fm.get('date', '—')}")
    print(f"Updated:   {fm.get('updated', '—')}")
    print(f"Featured:  {fm.get('featured', False)}")
    print(f"Image:     {fm.get('image', '—')}")
    print(f"\nExcerpt:   {fm.get('excerpt', '—')}")
    print(f"\nPath:      {path}")
    print(f"Size:      {path.stat().st_size} bytes")
    print(f"Lines:     {len(body.splitlines()) if body else 0}")

def cmd_rebuild_index(args):
    """Rebuild public/_index.json from all markdown files."""
    projects = get_all_projects()

    if not projects:
        print(colorize("📂 No projects found.", Color.YELLOW))
        return

    index_data = []

    for p in projects:
        try:
            content = p.read_text(encoding='utf-8')
            fm, body = parse_frontmatter(content)

            excerpt = fm.get('excerpt', '')
            if not excerpt and body:
                excerpt = ' '.join(body.split()[:30]) + '...'

            file_slug = p.stem
            index_data.append({
                'slug': file_slug,
                'title': fm.get('title', p.stem),
                'category': fm.get('category', 'Uncategorized'),
                'status': fm.get('status', 'unknown'),
                'tags': fm.get('tags', []),
                'date': fm.get('date', ''),
                'updated': fm.get('updated', fm.get('date', '')),
                'featured': fm.get('featured', False),
                'excerpt': excerpt,
                'image': fm.get('image', f'/assets/projects/{p.stem}/hero.webp'),
                'url': f'/projects/{file_slug}'
            })
        except Exception as e:
            print(colorize(f"⚠️  Skipping {p.name}: {e}", Color.YELLOW))
            continue

    index_data.sort(key=lambda x: x.get('date', ''), reverse=True)

    PUBLIC_INDEX.write_text(json.dumps(index_data, indent=2, ensure_ascii=False), encoding='utf-8')
    print(colorize(f"✅ Rebuilt index: {PUBLIC_INDEX}", Color.GREEN))
    print(f"   {len(index_data)} projects indexed")

def cmd_config(args):
    """Show current configuration from config.yaml."""
    print(colorize("\n⚙️  Current Configuration\n", Color.BOLD))
    print(colorize(f"Config file: {CONFIG_YAML}", Color.BLUE))
    print(f"Exists: {CONFIG_YAML.exists()}\n")
    
    print(colorize("Allowed Categories:", Color.GREEN))
    for cat in ALLOWED_CATEGORIES:
        print(f"  • {cat}")
    
    print(colorize("\nAllowed Status:", Color.GREEN))
    for status in ALLOWED_STATUS:
        print(f"  • {status}")
    
    print(colorize("\nDefault Tags:", Color.GREEN))
    if DEFAULT_TAGS:
        for tag in DEFAULT_TAGS:
            print(f"  • {tag}")
    else:
        print("  (none)")
    
    print(colorize("\nAI Config:", Color.GREEN))
    print(f"  Enabled: {AI_CONFIG.get('enabled', False)}")
    print(f"  Provider: {AI_CONFIG.get('provider', 'N/A')}")
    print(f"  Model: {AI_CONFIG.get('default_model', 'N/A')}")
    
    # Check API keys
    client, provider = setup_ai_client()
    if client:
        print(colorize(f"  Status: ✅ Ready ({provider})", Color.GREEN))
    else:
        print(colorize("  Status: ❌ Not configured or missing API key", Color.RED))
    
    print()

# ---- MAIN ----

def main():
    parser = argparse.ArgumentParser(
        description="Starstuck Lab Projects CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    subparsers = parser.add_subparsers(dest='command', help='Commands')

    # list
    subparsers.add_parser('list', help='List all projects')

    # add
    add_parser = subparsers.add_parser('add', help='Create a new project')
    add_parser.add_argument('title', nargs='?', help='Project title')
    add_parser.add_argument('--ai', action='store_true', help='Use AI to generate project content')

    # edit
    edit_parser = subparsers.add_parser('edit', help='Edit a project')
    edit_parser.add_argument('slug', help='Project slug')

    # delete
    delete_parser = subparsers.add_parser('delete', help='Delete a project')
    delete_parser.add_argument('slug', help='Project slug')

    # info
    info_parser = subparsers.add_parser('info', help='Show project info')
    info_parser.add_argument('slug', help='Project slug')

    # rebuild-index
    subparsers.add_parser('rebuild-index', help='Rebuild public index from markdown files')
    
    # config
    subparsers.add_parser('config', help='Show current configuration from config.yaml')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    # Route to command
    commands = {
        'list': cmd_list,
        'add': cmd_add,
        'edit': cmd_edit,
        'delete': cmd_delete,
        'info': cmd_info,
        'rebuild-index': cmd_rebuild_index,
        'config': cmd_config,
    }

    commands[args.command](args)

if __name__ == '__main__':
    main()