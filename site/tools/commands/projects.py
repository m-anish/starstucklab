"""
Project Management Commands

Refactored from projects_cli.py to use the new lib structure.
"""

import sys
from pathlib import Path
from datetime import datetime
from typing import Optional

# Add parent to path for lib imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from lib import Output, Style, Config, Paths, Prompt


def cmd_list(args):
    """List all projects"""
    paths = Paths()
    projects = paths.list_projects()
    
    if not projects:
        Output.warning("No projects found")
        Output.info(f"Create one with: cli.py projects create")
        return
    
    Output.header(f"📂 Found {len(projects)} project(s)")
    
    # Table header
    Output.table_row("Status", "Title", "Category", "Updated", 
                     widths=[12, 30, 15, 12])
    Output.divider()
    
    for project_path in projects:
        try:
            # Load frontmatter
            content = project_path.read_text(encoding='utf-8')
            fm = parse_frontmatter(content)
            
            slug = project_path.stem
            title = fm.get('title', slug)
            status = fm.get('status', 'unknown')
            category = fm.get('category', '—')
            updated = fm.get('updated', fm.get('date', '—'))
            
            # Status emoji
            status_emoji = {
                'completed': '✅',
                'ongoing': '🔄',
                'experimental': '🧪',
                'abandoned': '💀',
                'dormant': '💤'
            }.get(status, '❓')
            
            status_display = f"{status_emoji} {status}"
            
            Output.table_row(status_display, title, category, updated,
                           widths=[12, 30, 15, 12])
        
        except Exception as e:
            Output.warning(f"Error reading {project_path.name}: {e}")
            continue
    
    print()  # Empty line at end


def cmd_create(args):
    """Create new project (direct mode with args)"""
    if not args.title:
        Output.error("Title required")
        Output.info("Try: cli.py projects create 'My Project'")
        return
    
    config = Config.load()
    paths = Paths()
    
    title = args.title
    category = args.category or config.get('projects.allowed_categories', [])[0]
    status = args.status or config.get('projects.allowed_status', [])[0]
    tags = args.tags.split(',') if args.tags else []
    use_ai = args.ai
    
    # Create project
    _create_project(title, category, status, tags, use_ai, paths, config)


def cmd_create_interactive():
    """Create new project (interactive mode)"""
    config = Config.load()
    paths = Paths()
    
    Output.header("Create New Project")
    
    # Get project details interactively
    title = Prompt.text(
        "Project title",
        example="Weather Station v2",
        validator=lambda x: len(x) > 0
    )
    
    category = Prompt.choice(
        "Category",
        options=config.get('projects.allowed_categories', ['Hardware']),
        default='Hardware'
    )
    
    status = Prompt.choice(
        "Status",
        options=config.get('projects.allowed_status', ['ongoing']),
        default='ongoing'
    )
    
    # Tags
    available_tags = ['arduino', 'python', '3d-printed', 'sensor', 'iot', 'web', 'ml']
    tags = Prompt.multiselect(
        "Tags",
        options=available_tags,
        defaults=config.get('projects.default_tags', [])
    )
    
    # Excerpt
    excerpt = Prompt.text(
        "One-line excerpt",
        default=f"A project about {title.lower()}",
        required=False
    )
    
    # AI generation
    ai_enabled = config.get('ai.enabled', False)
    if ai_enabled:
        use_ai = Prompt.confirm(
            "Generate content with AI?",
            default=True
        )
    else:
        use_ai = False
        Output.info("AI generation not enabled in config")
    
    # Create the project
    slug = _create_project(title, category, status, tags, use_ai, paths, config, excerpt)
    
    # Post-creation workflow
    if config.get('cli.suggest_next_steps', True):
        _suggest_next_steps(slug, title, paths, config)


def cmd_edit(args):
    """Edit a project in text editor"""
    import subprocess
    import os
    
    paths = Paths()
    project_path = paths.get_project_path(args.slug)
    
    if not project_path.exists():
        Output.error(f"Project not found: {args.slug}")
        return
    
    editor = os.environ.get('EDITOR', os.environ.get('VISUAL', 'nano'))
    
    Output.info(f"Opening {args.slug} in {editor}...")
    subprocess.run([editor, str(project_path)])


def cmd_delete(args):
    """Delete a project"""
    paths = Paths()
    project_path = paths.get_project_path(args.slug)
    
    if not project_path.exists():
        Output.error(f"Project not found: {args.slug}")
        return
    
    # Load title for display
    content = project_path.read_text(encoding='utf-8')
    fm = parse_frontmatter(content)
    title = fm.get('title', args.slug)
    
    # Confirm unless --force
    if not args.force:
        Output.warning(f"Delete project: {title}?")
        Output.dim(f"  Path: {project_path}")
        
        if not Prompt.confirm("Confirm deletion", default=False):
            Output.info("Cancelled")
            return
    
    # Delete
    project_path.unlink()
    Output.success(f"Deleted: {args.slug}")
    
    # Note about assets
    asset_dir = paths.get_project_asset_dir(args.slug)
    if asset_dir.exists():
        Output.info(f"Assets remain at: {asset_dir}")
        Output.dim("  (delete manually if needed)")


def cmd_info(args):
    """Show detailed project information"""
    paths = Paths()
    project_path = paths.get_project_path(args.slug)
    
    if not project_path.exists():
        Output.error(f"Project not found: {args.slug}")
        return
    
    content = project_path.read_text(encoding='utf-8')
    fm = parse_frontmatter(content)
    body = content.split('---', 2)[-1].strip() if '---' in content else content
    
    Output.header(f"📋 {fm.get('title', args.slug)}")
    
    print(f"Slug:      {args.slug}")
    print(f"Category:  {fm.get('category', '—')}")
    print(f"Status:    {fm.get('status', '—')}")
    print(f"Tags:      {', '.join(fm.get('tags', []))}")
    print(f"Date:      {fm.get('date', '—')}")
    print(f"Updated:   {fm.get('updated', '—')}")
    print(f"Featured:  {fm.get('featured', False)}")
    print(f"Image:     {fm.get('image', '—')}")
    print(f"\nExcerpt:   {fm.get('excerpt', '—')}")
    print(f"\nPath:      {project_path}")
    print(f"Size:      {project_path.stat().st_size} bytes")
    print(f"Lines:     {len(body.splitlines())}")
    print()


def cmd_rebuild_index(args):
    """Rebuild public project index"""
    import json
    
    paths = Paths()
    projects = paths.list_projects()
    
    if not projects:
        Output.warning("No projects found")
        return
    
    Output.progress(f"Rebuilding index for {len(projects)} projects...")
    
    index_data = []
    
    for project_path in projects:
        try:
            content = project_path.read_text(encoding='utf-8')
            fm = parse_frontmatter(content)
            body = content.split('---', 2)[-1].strip() if '---' in content else content
            
            # Get excerpt
            excerpt = fm.get('excerpt', '')
            if not excerpt and body:
                excerpt = ' '.join(body.split()[:30]) + '...'
            
            slug = project_path.stem
            
            index_data.append({
                'slug': slug,
                'title': fm.get('title', slug),
                'category': fm.get('category', 'Uncategorized'),
                'status': fm.get('status', 'unknown'),
                'tags': fm.get('tags', []),
                'date': fm.get('date', ''),
                'updated': fm.get('updated', fm.get('date', '')),
                'featured': fm.get('featured', False),
                'excerpt': excerpt,
                'image': fm.get('image', f'/assets/projects/{slug}/hero.webp'),
                'url': f'/projects/{slug}'
            })
        
        except Exception as e:
            Output.warning(f"Skipping {project_path.name}: {e}")
            continue
    
    # Sort by date (newest first)
    index_data.sort(key=lambda x: x.get('date', ''), reverse=True)
    
    # Write index
    index_path = paths.projects_index
    index_path.parent.mkdir(parents=True, exist_ok=True)
    index_path.write_text(
        json.dumps(index_data, indent=2, ensure_ascii=False),
        encoding='utf-8'
    )
    
    Output.success(f"Rebuilt index: {index_path}")
    Output.info(f"  {len(index_data)} projects indexed")


# ===== Helper Functions =====

def parse_frontmatter(content: str) -> dict:
    """Parse YAML frontmatter from markdown"""
    if not content.startswith('---'):
        return {}
    
    try:
        parts = content.split('---', 2)
        if len(parts) < 3:
            return {}
        
        import yaml
        return yaml.safe_load(parts[1]) or {}
    except Exception:
        return {}


def slugify(title: str) -> str:
    """Convert title to URL-safe slug"""
    import re
    slug = title.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')


def _create_project(
    title: str,
    category: str,
    status: str,
    tags: list,
    use_ai: bool,
    paths: Paths,
    config: dict,
    excerpt: Optional[str] = None
) -> str:
    """Internal function to create a project"""
    import yaml
    
    slug = slugify(title)
    project_path = paths.get_project_path(slug)
    
    if project_path.exists():
        Output.error(f"Project already exists: {slug}")
        return None
    
    # Generate excerpt if not provided
    if not excerpt:
        excerpt = f"A project about {title.lower()}"
    
    # AI generation
    ai_content = None
    if use_ai:
        Output.progress("Generating AI content...")
        # TODO: Call AI generation
        Output.info("AI generation not yet implemented")
    
    # Build frontmatter
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
    
    # Build markdown content
    content = _build_markdown_content(frontmatter, title, excerpt, tags, status, today, ai_content)
    
    # Write file
    project_path.write_text(content, encoding='utf-8')
    
    Output.success(f"Created: {project_path.relative_to(paths.root)}")
    if ai_content:
        Output.info("  ✨ AI-generated content included")
    
    return slug


def _build_markdown_content(fm: dict, title: str, excerpt: str, tags: list, status: str, today: str, ai_content: Optional[dict]) -> str:
    """Build markdown file content"""
    import yaml
    
    # Frontmatter
    fm_yaml = yaml.dump(fm, default_flow_style=False, allow_unicode=True, sort_keys=False)
    
    # Body
    if ai_content:
        # TODO: Use AI content structure
        body = f"""# {title}

{excerpt}

## Overview

[AI-generated content will go here]

## Components

- Component 1
- Component 2

## How It Works

1. Step one
2. Step two

## Build Notes

[AI-generated notes]

## Reflections

[AI-generated reflections]
"""
    else:
        body = f"""# {title}

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
    
    # Footer
    tags_formatted = ', '.join([f'#{t}' for t in tags])
    body += f"""
---

**Tags:** {tags_formatted}  
**Status:** {status}  
**Last Updated:** {today}
"""
    
    return f"---\n{fm_yaml.strip()}\n---\n\n{body}"


def _suggest_next_steps(slug: str, title: str, paths: Paths, config: dict):
    """Suggest follow-up actions after creating a project"""
    if not config.get('cli.suggest_next_steps', True):
        return
    
    Output.header("What's next?")
    
    next_action = Prompt.choice(
        "Choose an action",
        options=[
            "Generate hero image",
            "Add to navigation",
            "Open in editor",
            "Nothing, I'm done"
        ],
        default="Nothing, I'm done"
    )
    
    if next_action == "Generate hero image":
        Output.info("Image generation workflow - coming soon!")
        Output.dim(f"  Will create: {paths.get_project_hero_image(slug)}")
    
    elif next_action == "Add to navigation":
        Output.info("Navigation management - coming soon!")
        Output.dim("  Use: cli.py site nav add")
    
    elif next_action == "Open in editor":
        import subprocess
        import os
        
        editor = os.environ.get('EDITOR', 'nano')
        project_path = paths.get_project_path(slug)
        
        Output.info(f"Opening in {editor}...")
        subprocess.run([editor, str(project_path)])