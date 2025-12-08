"""
Site Management Commands

Handles navigation, footer, and page management for the Starstuck Lab site.
"""

import sys
from pathlib import Path
from typing import Optional, Dict, List

# Add parent to path for lib imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from lib import Output, Style, Config, Paths, Prompt


# ===== Navigation Management =====

def cmd_nav_list(args):
    """List all navigation items"""
    paths = Paths()

    try:
        nav_data = _load_navigation(paths)
        if not nav_data.get('primary'):
            Output.info("No navigation items found")
            return

        Output.header("Navigation Items")
        Output.table_row("Priority", "Label", "URL", widths=[10, 20, 40])
        Output.divider()

        sorted_items = sorted(nav_data['primary'], key=lambda x: x.get('priority', 999))
        for item in sorted_items:
            Output.table_row(
                str(item.get('priority', '-')),
                item['label'],
                item['href'],
                widths=[10, 20, 40]
            )

        print()

        # Show settings
        settings = nav_data.get('settings', {})
        if settings:
            Output.header("Navigation Settings")
            Output.info(f"Logo Text: {settings.get('logoText', 'STARSTUCK LAB')}")
            Output.info(f"Show Cart: {settings.get('showCart', False)}")

    except Exception as e:
        Output.error(f"Failed to load navigation: {e}")


def cmd_nav_add(args):
    """Add a navigation item"""
    paths = Paths()

    try:
        nav_data = _load_navigation(paths)

        # Auto-assign priority if not provided
        if not hasattr(args, 'priority') or args.priority is None:
            priorities = [item.get('priority', 0) for item in nav_data.get('primary', [])]
            args.priority = max(priorities) + 1 if priorities else 1

        # Check if label already exists
        existing_labels = [item['label'] for item in nav_data.get('primary', [])]
        if args.label in existing_labels:
            Output.error(f"Navigation item '{args.label}' already exists")
            return False

        # Add new item
        new_item = {
            "label": args.label,
            "href": args.href,
            "priority": args.priority
        }

        nav_data['primary'].append(new_item)
        _save_navigation(paths, nav_data)

        Output.success(f"Added '{args.label}' to navigation (priority: {args.priority})")
        return True

    except Exception as e:
        Output.error(f"Failed to add navigation item: {e}")
        return False


def cmd_nav_remove(args):
    """Remove a navigation item"""
    paths = Paths()

    try:
        nav_data = _load_navigation(paths)
        original_count = len(nav_data.get('primary', []))

        # Remove item by label
        nav_data['primary'] = [
            item for item in nav_data.get('primary', [])
            if item['label'] != args.label
        ]

        if len(nav_data['primary']) == original_count:
            Output.error(f"Navigation item '{args.label}' not found")
            return False

        _save_navigation(paths, nav_data)
        Output.success(f"Removed '{args.label}' from navigation")
        return True

    except Exception as e:
        Output.error(f"Failed to remove navigation item: {e}")
        return False


def cmd_nav_reorder(args):
    """Interactively reorder navigation items"""
    paths = Paths()

    try:
        nav_data = _load_navigation(paths)
        items = nav_data.get('primary', [])

        if not items:
            Output.info("No navigation items to reorder")
            return

        Output.header("Current Navigation Order")
        sorted_items = sorted(items, key=lambda x: x.get('priority', 999))

        for i, item in enumerate(sorted_items, 1):
            Output.info(f"  {i}. {item['label']} (priority: {item.get('priority', '-')})")

        Output.header("Set New Priorities")
        Output.info("Enter new priority numbers for each item (press Enter to keep current):")

        for item in sorted_items:
            current = item.get('priority', 1)
            new_priority = Prompt.text(
                f"  {item['label']} (current: {current})",
                default=str(current)
            )

            try:
                item['priority'] = int(new_priority)
            except ValueError:
                Output.warning(f"Invalid priority '{new_priority}', keeping {current}")

        _save_navigation(paths, nav_data)
        Output.success("Navigation order updated")

    except Exception as e:
        Output.error(f"Failed to reorder navigation: {e}")


# ===== Footer Management =====

def cmd_footer_sections(args):
    """List all footer sections"""
    paths = Paths()

    try:
        footer_data = _load_footer(paths)
        sections = footer_data.get('sections', [])

        if not sections:
            Output.info("No footer sections found")
            return

        Output.header("Footer Sections")

        for section in sections:
            section_id = section.get('id', 'unknown')
            title = section.get('title', section_id)
            link_count = len(section.get('links', []))

            Output.info(f"  • {section_id}: {title} ({link_count} links)")

            if section.get('description'):
                Output.dim(f"    {section['description']}")

        print()

    except Exception as e:
        Output.error(f"Failed to load footer sections: {e}")


def cmd_footer_list(args):
    """List footer links (all or by section)"""
    paths = Paths()

    try:
        footer_data = _load_footer(paths)
        sections = footer_data.get('sections', [])

        # Filter by section if specified
        if hasattr(args, 'section') and args.section:
            sections = [s for s in sections if s.get('id') == args.section]
            if not sections:
                Output.error(f"Section '{args.section}' not found")
                return

        Output.header("Footer Links")

        for section in sections:
            section_id = section.get('id', 'unknown')
            title = section.get('title', section_id)
            links = section.get('links', [])

            if not links:
                continue

            Output.info(f"\n{section_id}: {title}")
            Output.table_row("Order", "Label", "URL", widths=[8, 25, 40])
            Output.divider()

            sorted_links = sorted(links, key=lambda x: x.get('order', 999))
            for link in sorted_links:
                Output.table_row(
                    str(link.get('order', '-')),
                    link.get('label', 'Unknown'),
                    link.get('href', 'Unknown'),
                    widths=[8, 25, 40]
                )

        print()

    except Exception as e:
        Output.error(f"Failed to list footer links: {e}")


def cmd_footer_add(args):
    """Add a footer link to a section"""
    paths = Paths()

    try:
        footer_data = _load_footer(paths)
        sections = footer_data.get('sections', [])

        # Find the section
        section = next((s for s in sections if s.get('id') == args.section), None)
        if not section:
            available_sections = [s.get('id', 'unknown') for s in sections]
            Output.error(f"Section '{args.section}' not found")
            Output.info(f"Available sections: {', '.join(available_sections)}")
            return False

        # Initialize links if needed
        if 'links' not in section:
            section['links'] = []

        # Auto-assign order if not provided
        if not hasattr(args, 'order') or args.order is None:
            orders = [link.get('order', 0) for link in section['links']]
            args.order = max(orders) + 1 if orders else 1

        # Check if label already exists in section
        existing_labels = [link.get('label', '') for link in section['links']]
        if args.label in existing_labels:
            Output.error(f"Link '{args.label}' already exists in section '{args.section}'")
            return False

        # Add new link
        new_link = {
            "label": args.label,
            "href": args.href,
            "order": args.order
        }

        section['links'].append(new_link)
        _save_footer(paths, footer_data)

        Output.success(f"Added '{args.label}' to footer section '{args.section}' (order: {args.order})")
        return True

    except Exception as e:
        Output.error(f"Failed to add footer link: {e}")
        return False


def cmd_footer_remove(args):
    """Remove a footer link from a section"""
    paths = Paths()

    try:
        footer_data = _load_footer(paths)
        sections = footer_data.get('sections', [])

        # Find the section
        section = next((s for s in sections if s.get('id') == args.section), None)
        if not section:
            Output.error(f"Section '{args.section}' not found")
            return False

        if 'links' not in section:
            Output.error(f"Section '{args.section}' has no links")
            return False

        original_count = len(section['links'])

        # Remove link by label
        section['links'] = [
            link for link in section['links']
            if link.get('label') != args.label
        ]

        if len(section['links']) == original_count:
            Output.error(f"Link '{args.label}' not found in section '{args.section}'")
            return False

        _save_footer(paths, footer_data)
        Output.success(f"Removed '{args.label}' from footer section '{args.section}'")
        return True

    except Exception as e:
        Output.error(f"Failed to remove footer link: {e}")
        return False


# ===== Page Management =====

def cmd_pages_list(args):
    """List all pages"""
    paths = Paths()

    try:
        pages = _list_pages(paths)

        if not pages:
            Output.info("No pages found")
            return

        Output.header(f"Found {len(pages)} Pages")

        for page in sorted(pages):
            relative_path = page.relative_to(paths.root)
            Output.info(f"  • {relative_path}")

        print()

    except Exception as e:
        Output.error(f"Failed to list pages: {e}")


def cmd_pages_create(args):
    """Create a new page with template"""
    paths = Paths()

    try:
        # Sanitize page name to create slug
        slug = _slugify(args.name)
        page_file = paths.pages / f"{slug}.astro"

        if page_file.exists():
            Output.error(f"Page '{slug}.astro' already exists")
            return False

        # Get template
        template_content = _get_page_template(args.layout, args.name, slug)

        # Create page
        page_file.parent.mkdir(parents=True, exist_ok=True)
        page_file.write_text(template_content, encoding='utf-8')

        Output.success(f"Created page: {page_file.relative_to(paths.root)}")
        Output.info(f"Page will be available at: /{slug}")

        return True

    except Exception as e:
        Output.error(f"Failed to create page: {e}")
        return False


# ===== Helper Functions =====

def _load_navigation(paths: Paths) -> dict:
    """Load navigation.json"""
    if not paths.navigation.exists():
        # Return default structure
        return {
            "primary": [],
            "settings": {
                "showCart": False,
                "logoText": "STARSTUCK LAB"
            }
        }

    import json
    with open(paths.navigation, 'r', encoding='utf-8') as f:
        return json.load(f)


def _save_navigation(paths: Paths, nav_data: dict):
    """Save navigation.json"""
    import json
    with open(paths.navigation, 'w', encoding='utf-8') as f:
        json.dump(nav_data, f, indent=2, ensure_ascii=False)


def _load_footer(paths: Paths) -> dict:
    """Load footer.json"""
    if not paths.footer.exists():
        # Return default structure
        return {
            "sections": [
                {
                    "id": "about",
                    "title": "Starstuck Lab",
                    "description": "Building small machines for an indifferent universe",
                    "links": []
                },
                {
                    "id": "workbench",
                    "title": "Quick Links",
                    "links": [
                        {"label": "Workbench", "href": "/#workbench", "order": 1},
                        {"label": "Projects", "href": "/#projects", "order": 2},
                        {"label": "Shop", "href": "/#shop", "order": 3},
                        {"label": "Contact", "href": "/contact", "order": 4}
                    ]
                },
                {
                    "id": "legal",
                    "title": "Legal",
                    "links": [
                        {"label": "Privacy Policy", "href": "/privacy", "order": 1},
                        {"label": "Terms of Service", "href": "/terms", "order": 2}
                    ]
                }
            ],
            "settings": {
                "copyrightText": "Starstuck Lab. All rights reserved."
            }
        }

    import json
    with open(paths.footer, 'r', encoding='utf-8') as f:
        return json.load(f)


def _save_footer(paths: Paths, footer_data: dict):
    """Save footer.json"""
    import json
    with open(paths.footer, 'w', encoding='utf-8') as f:
        json.dump(footer_data, f, indent=2, ensure_ascii=False)


def _list_pages(paths: Paths) -> List[Path]:
    """List all .astro page files"""
    if not paths.pages.exists():
        return []

    return list(paths.pages.glob("*.astro"))


def _get_page_template(layout: str, title: str, slug: str) -> str:
    """Get page template content"""
    paths = Paths()

    # Try to load template from templates directory
    template_file = paths.templates / f"{layout}.astro"

    if template_file.exists():
        template_content = template_file.read_text(encoding='utf-8')

        # Replace placeholders
        template_content = template_content.replace("{{PAGE_TITLE}}", title)
        template_content = template_content.replace("{{PAGE_SLUG}}", slug)

        return template_content

    # Default template
    return f"""---
// {slug}.astro
import StandardPageLayout from '../layouts/StandardPageLayout.astro';
---

<StandardPageLayout title="{title}">
  <div class="standard-page">
    <div class="standard-page-inner">
      <h1>{title}</h1>
      <p>Content goes here.</p>
    </div>
  </div>
</StandardPageLayout>
"""


def _slugify(text: str) -> str:
    """Convert text to URL-safe slug"""
    import re
    slug = text.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')
