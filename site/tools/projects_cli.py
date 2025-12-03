#!/usr/bin/env python3
"""
Starstuck Lab Projects CLI
--------------------------
Manage project markdown files with ease.

Usage:
    python3 site/tools/projects_cli.py list
    python3 site/tools/projects_cli.py add "New Project Title"
    python3 site/tools/projects_cli.py edit telescope-loneliness
    python3 site/tools/projects_cli.py delete old-project
    python3 site/tools/projects_cli.py info telescope-loneliness
    python3 site/tools/projects_cli.py rebuild-index
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

# ---- PATHS ----
ROOT = Path(__file__).resolve().parent.parent
PROJECTS_DIR = ROOT / "src" / "content" / "projects"
TEMPLATE_FILE = ROOT / "src" / "data" / "project-template.json"
PUBLIC_INDEX = ROOT / "public" / "data" / "projects" / "_index.json"

PROJECTS_DIR.mkdir(parents=True, exist_ok=True)
PUBLIC_INDEX.parent.mkdir(parents=True, exist_ok=True)

# ---- COLORS ----
class Color:
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def colorize(text: str, color: str) -> str:
    return f"{color}{text}{Color.RESET}"

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

def parse_frontmatter(content: str) -> tuple[Dict, str]:
    """Parse YAML frontmatter from markdown."""
    if not content.startswith('---'):
        return {}, content
    
    try:
        parts = content.split('---', 2)
        if len(parts) < 3:
            return {}, content
        
        frontmatter = yaml.safe_load(parts[1])
        body = parts[2].strip()
        return frontmatter or {}, body
    except Exception as e:
        print(colorize(f"⚠️  Frontmatter parse error: {e}", Color.YELLOW))
        return {}, content

def get_all_projects() -> List[Path]:
    """Get all project markdown files."""
    return sorted(PROJECTS_DIR.glob("*.md"))

def load_project(slug: str) -> Optional[tuple[Dict, str, Path]]:
    """Load project frontmatter and content."""
    path = PROJECTS_DIR / f"{slug}.md"
    if not path.exists():
        return None
    
    try:
        content = path.read_text(encoding='utf-8')
        frontmatter, body = parse_frontmatter(content)
        return frontmatter, body, path
    except Exception as e:
        print(colorize(f"❌ Failed to load {slug}: {e}", Color.RED))
        return None

def get_editor() -> str:
    """Get preferred text editor from environment."""
    return os.environ.get('EDITOR', os.environ.get('VISUAL', 'nano'))

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
        fm, _, _ = parse_frontmatter(p.read_text(encoding='utf-8'))
        
        slug = fm.get('slug', p.stem)
        title = fm.get('title', slug)
        status = fm.get('status', 'unknown')
        category = fm.get('category', '—')
        date = fm.get('date', '—')
        featured = '⭐' if fm.get('featured', False) else '  '
        
        # Status color
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
    
    # Load template
    template = load_template()
    
    # Prompt for metadata
    print(colorize(f"\n📝 Creating new project: {slug}\n", Color.BLUE))
    
    category = input(f"Category [{template.get('category', 'Electronics')}]: ").strip() or template.get('category', 'Electronics')
    status = input(f"Status [{template.get('status', 'ongoing')}]: ").strip() or template.get('status', 'ongoing')
    tags_input = input(f"Tags (comma-separated) [{','.join(template.get('tags', []))}]: ").strip()
    tags = [t.strip() for t in tags_input.split(',')] if tags_input else template.get('tags', [])
    excerpt = input("One-line excerpt: ").strip() or f"A project about {title.lower()}."
    
    # Build frontmatter
    today = datetime.now().strftime('%Y-%m-%d')
    frontmatter = {
        'slug': slug,
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
    
    # Build markdown
    fm_yaml = yaml.dump(frontmatter, default_flow_style=False, allow_unicode=True, sort_keys=False)
    
    content = f"""---
{fm_yaml.strip()}
---

# {title}

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

---

**Tags:** {', '.join([f'#{t}' for t in tags])}  
**Status:** {status}  
**Last Updated:** {today}
"""
    
    path.write_text(content, encoding='utf-8')
    print(colorize(f"\n✅ Created: {path}", Color.GREEN))
    
    # Ask if they want to edit now
    edit_now = input("\nOpen in editor now? [Y/n]: ").strip().lower()
    if edit_now != 'n':
        editor = get_editor()
        subprocess.run([editor, str(path)])

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
    
    print(colorize(f"\n📋 Project: {fm.get('title', slug)}\n", Color.BOLD))
    print(f"Slug:      {fm.get('slug', slug)}")
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
    print(f"Lines:     {len(body.splitlines())}")

def cmd_rebuild_index(args):
    """Rebuild public/_index.json from all markdown files."""
    projects = get_all_projects()
    
    if not projects:
        print(colorize("📂 No projects found.", Color.YELLOW))
        return
    
    index_data = []
    
    for p in projects:
        try:
            fm, body, _ = parse_frontmatter(p.read_text(encoding='utf-8'))
            
            # Extract first 200 chars of body as preview if excerpt missing
            excerpt = fm.get('excerpt', '')
            if not excerpt and body:
                excerpt = ' '.join(body.split()[:30]) + '...'
            
            index_data.append({
                'slug': fm.get('slug', p.stem),
                'title': fm.get('title', p.stem),
                'category': fm.get('category', 'Uncategorized'),
                'status': fm.get('status', 'unknown'),
                'tags': fm.get('tags', []),
                'date': fm.get('date', ''),
                'updated': fm.get('updated', fm.get('date', '')),
                'featured': fm.get('featured', False),
                'excerpt': excerpt,
                'image': fm.get('image', f'/assets/projects/{p.stem}/hero.webp'),
                'url': f'/projects/{fm.get("slug", p.stem)}'
            })
        except Exception as e:
            print(colorize(f"⚠️  Skipping {p.name}: {e}", Color.YELLOW))
    
    # Sort by date descending (newest first)
    index_data.sort(key=lambda x: x.get('date', ''), reverse=True)
    
    PUBLIC_INDEX.write_text(json.dumps(index_data, indent=2, ensure_ascii=False), encoding='utf-8')
    print(colorize(f"✅ Rebuilt index: {PUBLIC_INDEX}", Color.GREEN))
    print(f"   {len(index_data)} projects indexed")

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
        'rebuild-index': cmd_rebuild_index
    }
    
    commands[args.command](args)

if __name__ == '__main__':
    main()