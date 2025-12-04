#!/usr/bin/env python3
"""
site_cli.py - Unified CLI tool for managing Starstuck Lab site
Usage:
  python site_cli.py pages list
  python site_cli.py pages create "about" --layout standard --add-to-nav --priority 4
  python site_cli.py nav list
  python site_cli.py nav add "Blog" /blog --priority 4
  python site_cli.py nav remove "Contact"
  python site_cli.py footer list
  python site_cli.py footer add "workbench" "Blog" /blog --order 5
  python site_cli.py footer remove "workbench" "Blog"
  python site_cli.py footer sections
  python site_cli.py layouts list
"""

import json
import os
import sys
from pathlib import Path
from typing import Optional

# Paths
SCRIPT_DIR = Path(__file__).parent
SITE_DIR = SCRIPT_DIR.parent
SRC_DIR = SITE_DIR / "src"
PAGES_DIR = SRC_DIR / "pages"
DATA_DIR = SRC_DIR / "data"
LAYOUTS_DIR = SRC_DIR / "layouts"
TEMPLATES_DIR = SCRIPT_DIR / "templates"
NAV_FILE = DATA_DIR / "navigation.json"
FOOTER_FILE = DATA_DIR / "footer.json"

# Ensure data directory exists
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_success(msg):
    print(f"{Colors.GREEN}✓{Colors.END} {msg}")

def print_error(msg):
    print(f"{Colors.RED}✗{Colors.END} {msg}", file=sys.stderr)

def print_info(msg):
    print(f"{Colors.BLUE}ℹ{Colors.END} {msg}")

def print_warning(msg):
    print(f"{Colors.YELLOW}⚠{Colors.END} {msg}")

# ===== Navigation Management =====

def load_navigation():
    """Load navigation.json"""
    if not NAV_FILE.exists():
        return {
            "primary": [],
            "settings": {
                "showCart": False,
                "logoText": "STARSTUCK LAB"
            }
        }
    with open(NAV_FILE, 'r') as f:
        return json.load(f)

def save_navigation(nav_data):
    """Save navigation.json"""
    with open(NAV_FILE, 'w') as f:
        json.dump(nav_data, f, indent=2)

def nav_list():
    """List all navigation items"""
    nav = load_navigation()
    if not nav['primary']:
        print_info("No navigation items found")
        return
    
    print(f"\n{Colors.BOLD}Navigation Items:{Colors.END}")
    print(f"{'Priority':<10} {'Label':<20} {'URL':<30}")
    print("-" * 60)
    
    sorted_items = sorted(nav['primary'], key=lambda x: x['priority'])
    for item in sorted_items:
        print(f"{item['priority']:<10} {item['label']:<20} {item['href']:<30}")
    
    print(f"\n{Colors.BOLD}Settings:{Colors.END}")
    print(f"  Logo Text: {nav['settings']['logoText']}")
    print(f"  Show Cart: {nav['settings']['showCart']}")
    print()

def nav_add(label: str, href: str, priority: Optional[int] = None):
    """Add a navigation item"""
    nav = load_navigation()
    
    # Auto-assign priority if not provided
    if priority is None:
        if nav['primary']:
            priority = max(item['priority'] for item in nav['primary']) + 1
        else:
            priority = 1
    
    # Check if label already exists
    if any(item['label'] == label for item in nav['primary']):
        print_error(f"Navigation item '{label}' already exists")
        return False
    
    nav['primary'].append({
        "label": label,
        "href": href,
        "priority": priority
    })
    
    save_navigation(nav)
    print_success(f"Added '{label}' to navigation (priority: {priority})")
    return True

def nav_remove(label: str):
    """Remove a navigation item"""
    nav = load_navigation()
    original_count = len(nav['primary'])
    nav['primary'] = [item for item in nav['primary'] if item['label'] != label]
    
    if len(nav['primary']) == original_count:
        print_error(f"Navigation item '{label}' not found")
        return False
    
    save_navigation(nav)
    print_success(f"Removed '{label}' from navigation")
    return True

def nav_reorder():
    """Interactive reordering of navigation items"""
    nav = load_navigation()
    if not nav['primary']:
        print_info("No navigation items to reorder")
        return
    
    print(f"\n{Colors.BOLD}Current Navigation Order:{Colors.END}")
    sorted_items = sorted(nav['primary'], key=lambda x: x['priority'])
    for i, item in enumerate(sorted_items, 1):
        print(f"  {i}. {item['label']} (priority: {item['priority']})")
    
    print(f"\n{Colors.YELLOW}Enter new priorities for each item (or press Enter to keep current):{Colors.END}")
    
    for item in sorted_items:
        while True:
            new_priority = input(f"  {item['label']} (current: {item['priority']}): ").strip()
            if not new_priority:
                break
            try:
                item['priority'] = int(new_priority)
                break
            except ValueError:
                print_error("    Please enter a valid number")
    
    save_navigation(nav)
    print_success("Navigation order updated")

# ===== Footer Management =====

def load_footer():
    """Load footer.json"""
    if not FOOTER_FILE.exists():
        # Default structure
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
    with open(FOOTER_FILE, 'r') as f:
        return json.load(f)

def save_footer(footer_data):
    """Save footer.json"""
    with open(FOOTER_FILE, 'w') as f:
        json.dump(footer_data, f, indent=2)

def footer_sections():
    """List all footer sections"""
    footer = load_footer()
    
    print(f"\n{Colors.BOLD}Footer Sections:{Colors.END}")
    for section in footer['sections']:
        print(f"\n  {Colors.BLUE}[{section['id']}]{Colors.END} {section['title']}")
        if 'description' in section:
            print(f"    Description: {section['description']}")
        if section.get('links'):
            print(f"    Links: {len(section['links'])}")
    print()

def footer_list(section_id: Optional[str] = None):
    """List footer links (all or filtered by section)"""
    footer = load_footer()
    
    sections = footer['sections']
    if section_id:
        sections = [s for s in sections if s['id'] == section_id]
        if not sections:
            print_error(f"Section '{section_id}' not found")
            return
    
    print(f"\n{Colors.BOLD}Footer Links:{Colors.END}")
    
    for section in sections:
        if not section.get('links'):
            continue
        
        print(f"\n  {Colors.BLUE}[{section['id']}]{Colors.END} {section['title']}")
        print(f"  {'Order':<10} {'Label':<25} {'URL':<30}")
        print("  " + "-" * 65)
        
        sorted_links = sorted(section['links'], key=lambda x: x.get('order', 999))
        for link in sorted_links:
            order = link.get('order', '-')
            print(f"  {str(order):<10} {link['label']:<25} {link['href']:<30}")
    print()

def footer_add(section_id: str, label: str, href: str, order: Optional[int] = None):
    """Add a footer link to a section"""
    footer = load_footer()
    
    # Find section
    section = next((s for s in footer['sections'] if s['id'] == section_id), None)
    if not section:
        print_error(f"Section '{section_id}' not found")
        print_info("Available sections: " + ", ".join(s['id'] for s in footer['sections']))
        return False
    
    # Initialize links if needed
    if 'links' not in section:
        section['links'] = []
    
    # Auto-assign order if not provided
    if order is None:
        if section['links']:
            order = max(link.get('order', 0) for link in section['links']) + 1
        else:
            order = 1
    
    # Check if label already exists in section
    if any(link['label'] == label for link in section['links']):
        print_error(f"Link '{label}' already exists in section '{section_id}'")
        return False
    
    section['links'].append({
        "label": label,
        "href": href,
        "order": order
    })
    
    save_footer(footer)
    print_success(f"Added '{label}' to footer section '{section_id}' (order: {order})")
    return True

def footer_remove(section_id: str, label: str):
    """Remove a footer link from a section"""
    footer = load_footer()
    
    # Find section
    section = next((s for s in footer['sections'] if s['id'] == section_id), None)
    if not section:
        print_error(f"Section '{section_id}' not found")
        return False
    
    if 'links' not in section:
        print_error(f"Section '{section_id}' has no links")
        return False
    
    original_count = len(section['links'])
    section['links'] = [link for link in section['links'] if link['label'] != label]
    
    if len(section['links']) == original_count:
        print_error(f"Link '{label}' not found in section '{section_id}'")
        return False
    
    save_footer(footer)
    print_success(f"Removed '{label}' from footer section '{section_id}'")
    return True

def footer_update(section_id: str, label: str, new_label: Optional[str] = None, 
                  new_href: Optional[str] = None, new_order: Optional[int] = None):
    """Update a footer link"""
    footer = load_footer()
    
    # Find section
    section = next((s for s in footer['sections'] if s['id'] == section_id), None)
    if not section:
        print_error(f"Section '{section_id}' not found")
        return False
    
    if 'links' not in section:
        print_error(f"Section '{section_id}' has no links")
        return False
    
    # Find link
    link = next((l for l in section['links'] if l['label'] == label), None)
    if not link:
        print_error(f"Link '{label}' not found in section '{section_id}'")
        return False
    
    # Update fields
    if new_label:
        link['label'] = new_label
    if new_href:
        link['href'] = new_href
    if new_order is not None:
        link['order'] = new_order
    
    save_footer(footer)
    print_success(f"Updated link '{label}' in section '{section_id}'")
    return True

# ===== Page Management =====

def pages_list():
    """List all pages"""
    if not PAGES_DIR.exists():
        print_error(f"Pages directory not found: {PAGES_DIR}")
        return
    
    pages = sorted(PAGES_DIR.glob("*.astro"))
    if not pages:
        print_info("No pages found")
        return
    
    print(f"\n{Colors.BOLD}Pages:{Colors.END}")
    for page in pages:
        print(f"  • {page.stem}")
    print()

def pages_create(name: str, layout: str = "standard", add_to_nav: bool = False, 
                 priority: Optional[int] = None, add_to_footer: Optional[str] = None,
                 footer_order: Optional[int] = None):
    """Create a new page"""
    # Sanitize name
    slug = name.lower().replace(" ", "-").replace("_", "-")
    page_file = PAGES_DIR / f"{slug}.astro"
    
    if page_file.exists():
        print_error(f"Page '{slug}.astro' already exists")
        return False
    
    # Get template
    template_file = TEMPLATES_DIR / f"{layout}.astro"
    if not template_file.exists():
        print_warning(f"Template '{layout}.astro' not found, using basic template")
        template_content = f"""---
// {slug}.astro
import StandardPageLayout from '../layouts/StandardPageLayout.astro';
---

<StandardPageLayout title="{name}">
  <div class="standard-page">
    <div class="standard-page-inner">
      <h1>{name}</h1>
      <p>Content goes here.</p>
    </div>
  </div>
</StandardPageLayout>
"""
    else:
        with open(template_file, 'r') as f:
            template_content = f.read()
        # Replace placeholders
        template_content = template_content.replace("{{PAGE_TITLE}}", name)
        template_content = template_content.replace("{{PAGE_SLUG}}", slug)
    
    # Write page file
    with open(page_file, 'w') as f:
        f.write(template_content)
    
    print_success(f"Created page: {page_file.relative_to(SITE_DIR)}")
    
    # Add to navigation if requested
    if add_to_nav:
        href = f"/{slug}"
        if nav_add(name, href, priority):
            print_success(f"Added to navigation: {name} → {href}")
    
    # Add to footer if requested
    if add_to_footer:
        href = f"/{slug}"
        if footer_add(add_to_footer, name, href, footer_order):
            print_success(f"Added to footer section '{add_to_footer}': {name} → {href}")
    
    return True

# ===== Layout Management =====

def layouts_list():
    """List available layouts"""
    if not LAYOUTS_DIR.exists():
        print_error(f"Layouts directory not found: {LAYOUTS_DIR}")
        return
    
    layouts = sorted(LAYOUTS_DIR.glob("*.astro"))
    if not layouts:
        print_info("No layouts found")
        return
    
    print(f"\n{Colors.BOLD}Available Layouts:{Colors.END}")
    for layout in layouts:
        print(f"  • {layout.stem}")
    print()
    
    # Also show available templates
    if TEMPLATES_DIR.exists():
        templates = sorted(TEMPLATES_DIR.glob("*.astro"))
        if templates:
            print(f"{Colors.BOLD}Available Templates:{Colors.END}")
            for template in templates:
                print(f"  • {template.stem}")
            print()

# ===== CLI Interface =====

def print_usage():
    """Print usage information"""
    print(f"""
{Colors.BOLD}Starstuck Lab Site CLI{Colors.END}

{Colors.BOLD}Usage:{Colors.END}
  python site_cli.py <command> <subcommand> [options]

{Colors.BOLD}Commands:{Colors.END}

  {Colors.BLUE}pages{Colors.END}
    list                           List all pages
    create <name>                  Create a new page
      --layout <layout>            Layout to use (default: standard)
      --add-to-nav                 Add to navigation
      --priority <num>             Navigation priority
      --add-to-footer <section>    Add to footer section (e.g., workbench, legal)
      --footer-order <num>         Footer link order

  {Colors.BLUE}nav{Colors.END}
    list                           List navigation items
    add <label> <href>             Add navigation item
      --priority <num>             Set priority (auto if not provided)
    remove <label>                 Remove navigation item
    reorder                        Interactively reorder navigation

  {Colors.BLUE}footer{Colors.END}
    sections                       List all footer sections
    list [section]                 List footer links (all or by section)
    add <section> <label> <href>   Add link to footer section
      --order <num>                Set order (auto if not provided)
    remove <section> <label>       Remove link from footer section
    update <section> <label>       Update a footer link
      --new-label <label>          New label
      --new-href <href>            New href
      --new-order <num>            New order

  {Colors.BLUE}layouts{Colors.END}
    list                           List available layouts and templates

{Colors.BOLD}Examples:{Colors.END}
  python site_cli.py pages create "About Us" --layout standard --add-to-nav --add-to-footer workbench
  python site_cli.py footer sections
  python site_cli.py footer list workbench
  python site_cli.py footer add workbench "Blog" /blog --order 5
  python site_cli.py footer remove workbench "Blog"
  python site_cli.py footer update workbench "Contact" --new-href /contact-us
  python site_cli.py nav add "Blog" /blog --priority 5
""")

def main():
    if len(sys.argv) < 2:
        print_usage()
        sys.exit(1)
    
    command = sys.argv[1]
    
    # Parse arguments
    args = sys.argv[2:]
    flags = {}
    positional = []
    
    i = 0
    while i < len(args):
        arg = args[i]
        if arg.startswith('--'):
            flag_name = arg[2:]
            if i + 1 < len(args) and not args[i + 1].startswith('--'):
                flags[flag_name] = args[i + 1]
                i += 2
            else:
                flags[flag_name] = True
                i += 1
        else:
            positional.append(arg)
            i += 1
    
    # Route commands
    try:
        if command == "pages":
            if not positional:
                print_error("Missing subcommand for 'pages'")
                print_usage()
                sys.exit(1)
            
            subcommand = positional[0]
            if subcommand == "list":
                pages_list()
            elif subcommand == "create":
                if len(positional) < 2:
                    print_error("Missing page name")
                    sys.exit(1)
                name = positional[1]
                layout = flags.get('layout', 'standard')
                add_to_nav = 'add-to-nav' in flags
                priority = int(flags['priority']) if 'priority' in flags else None
                add_to_footer = flags.get('add-to-footer')
                footer_order = int(flags['footer-order']) if 'footer-order' in flags else None
                pages_create(name, layout, add_to_nav, priority, add_to_footer, footer_order)
            else:
                print_error(f"Unknown subcommand: {subcommand}")
                sys.exit(1)
        
        elif command == "nav":
            if not positional:
                print_error("Missing subcommand for 'nav'")
                print_usage()
                sys.exit(1)
            
            subcommand = positional[0]
            if subcommand == "list":
                nav_list()
            elif subcommand == "add":
                if len(positional) < 3:
                    print_error("Usage: nav add <label> <href> [--priority <num>]")
                    sys.exit(1)
                label = positional[1]
                href = positional[2]
                priority = int(flags['priority']) if 'priority' in flags else None
                nav_add(label, href, priority)
            elif subcommand == "remove":
                if len(positional) < 2:
                    print_error("Usage: nav remove <label>")
                    sys.exit(1)
                label = positional[1]
                nav_remove(label)
            elif subcommand == "reorder":
                nav_reorder()
            else:
                print_error(f"Unknown subcommand: {subcommand}")
                sys.exit(1)
        
        elif command == "footer":
            if not positional:
                print_error("Missing subcommand for 'footer'")
                print_usage()
                sys.exit(1)
            
            subcommand = positional[0]
            if subcommand == "sections":
                footer_sections()
            elif subcommand == "list":
                section = positional[1] if len(positional) > 1 else None
                footer_list(section)
            elif subcommand == "add":
                if len(positional) < 4:
                    print_error("Usage: footer add <section> <label> <href> [--order <num>]")
                    sys.exit(1)
                section = positional[1]
                label = positional[2]
                href = positional[3]
                order = int(flags['order']) if 'order' in flags else None
                footer_add(section, label, href, order)
            elif subcommand == "remove":
                if len(positional) < 3:
                    print_error("Usage: footer remove <section> <label>")
                    sys.exit(1)
                section = positional[1]
                label = positional[2]
                footer_remove(section, label)
            elif subcommand == "update":
                if len(positional) < 3:
                    print_error("Usage: footer update <section> <label> [--new-label <label>] [--new-href <href>] [--new-order <num>]")
                    sys.exit(1)
                section = positional[1]
                label = positional[2]
                new_label = flags.get('new-label')
                new_href = flags.get('new-href')
                new_order = int(flags['new-order']) if 'new-order' in flags else None
                footer_update(section, label, new_label, new_href, new_order)
            else:
                print_error(f"Unknown subcommand: {subcommand}")
                sys.exit(1)
        
        elif command == "layouts":
            if not positional:
                print_error("Missing subcommand for 'layouts'")
                print_usage()
                sys.exit(1)
            
            subcommand = positional[0]
            if subcommand == "list":
                layouts_list()
            else:
                print_error(f"Unknown subcommand: {subcommand}")
                sys.exit(1)
        
        else:
            print_error(f"Unknown command: {command}")
            print_usage()
            sys.exit(1)
    
    except Exception as e:
        print_error(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()