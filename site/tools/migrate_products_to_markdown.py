#!/usr/bin/env python3
"""
Product Migration Script
========================

Migrates existing JSON product files to Markdown format with frontmatter.

Usage:
    python migrate_products_to_markdown.py [--source-dir DIR] [--target-dir DIR]

This script is for reference and future migrations. The current system already
uses Markdown format, but this shows how to convert legacy JSON products if needed.
"""

import json
import yaml
from pathlib import Path
from datetime import datetime
import argparse
import sys

def json_to_markdown_frontmatter(product_data: dict) -> str:
    """Convert product JSON data to Markdown frontmatter format"""

    # Extract basic fields
    frontmatter = {
        'slug': product_data.get('slug', ''),
        'title': product_data.get('title', ''),
        'price': product_data.get('price'),
        'currency': product_data.get('currency', 'INR'),
        'status': product_data.get('status', 'available'),
        'tags': product_data.get('tags', []),
        'date': product_data.get('date', datetime.utcnow().strftime('%Y-%m-%d')),
        'excerpt': product_data.get('excerpt', ''),
        'images': product_data.get('images', {})
    }

    # Convert to YAML
    fm_yaml = yaml.dump(frontmatter, default_flow_style=False, allow_unicode=True, sort_keys=False)

    # Build markdown body
    body_parts = []

    # Add excerpt as first paragraph if not already in body
    if frontmatter['excerpt'] and not product_data.get('html', '').strip():
        body_parts.append(frontmatter['excerpt'])
        body_parts.append("")

    # Add what's included section
    if product_data.get('included'):
        body_parts.append("## What's Included")
        body_parts.append("")
        for item in product_data['included']:
            body_parts.append(f"- {item}")
        body_parts.append("")

    # Add specs section
    if product_data.get('specs'):
        body_parts.append("## Specifications")
        body_parts.append("")
        body_parts.append("| Specification | Value |")
        body_parts.append("|---------------|-------|")
        for key, value in product_data['specs'].items():
            body_parts.append(f"| {key} | {value} |")
        body_parts.append("")

    # Add description section
    if product_data.get('html'):
        body_parts.append("## Description")
        body_parts.append("")
        # Simple HTML to markdown conversion (basic)
        html_content = product_data['html'].replace('<p>', '').replace('</p>', '\n\n')
        body_parts.append(html_content.strip())

    # Combine everything
    markdown_content = f"---\n{fm_yaml.strip()}\n---\n\n" + "\n".join(body_parts)

    return markdown_content

def migrate_products(source_dir: Path, target_dir: Path):
    """Migrate JSON products to Markdown format"""

    if not source_dir.exists():
        print(f"Source directory {source_dir} does not exist")
        return

    target_dir.mkdir(parents=True, exist_ok=True)

    json_files = list(source_dir.glob("*.json"))
    if not json_files:
        print(f"No JSON files found in {source_dir}")
        return

    print(f"Found {len(json_files)} product files to migrate")

    for json_file in json_files:
        try:
            # Load JSON
            product_data = json.loads(json_file.read_text(encoding='utf-8'))

            # Convert to markdown
            markdown_content = json_to_markdown_frontmatter(product_data)

            # Write markdown file
            markdown_file = target_dir / f"{json_file.stem}.md"
            markdown_file.write_text(markdown_content, encoding='utf-8')

            print(f"✓ Migrated {json_file.name} → {markdown_file.name}")

        except Exception as e:
            print(f"✗ Failed to migrate {json_file.name}: {e}")

def main():
    parser = argparse.ArgumentParser(description="Migrate JSON products to Markdown format")
    parser.add_argument('--source-dir', type=Path, default=Path('src/data/products'),
                       help='Source directory containing JSON product files')
    parser.add_argument('--target-dir', type=Path, default=Path('src/content/products'),
                       help='Target directory for Markdown product files')

    args = parser.parse_args()

    # Make paths relative to script location
    script_dir = Path(__file__).parent.parent
    source_dir = script_dir / args.source_dir
    target_dir = script_dir / args.target_dir

    print("Product Migration Script")
    print("=" * 40)
    print(f"Source: {source_dir}")
    print(f"Target: {target_dir}")
    print()

    migrate_products(source_dir, target_dir)

    print("\nMigration complete!")
    print(f"Check the generated Markdown files in {target_dir}")

if __name__ == '__main__':
    main()
