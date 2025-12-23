"""
Product Management Commands - REFACTORED WITH TEMPLATES

Now uses unified prompt templates from product_prompts.json
for consistency with Tina CMS.
"""

import sys
import json
import re
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, List, Tuple

# Add parent to path for lib imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from lib import Output, Style, Config, Paths, Prompt, AIHelper

# Try to import YAML for frontmatter parsing
try:
    import yaml
    YAML_AVAILABLE = True
except ImportError:
    yaml = None
    YAML_AVAILABLE = False


# ===== Frontmatter Utilities (unchanged) =====

def parse_frontmatter(content: str) -> Tuple[Dict, str]:
    """Parse YAML frontmatter from markdown content"""
    if not content.startswith('---'):
        return {}, content

    parts = content.split('---', 2)
    if len(parts) < 3:
        return {}, content

    frontmatter_text = parts[1].strip()
    body = parts[2].strip()

    if not YAML_AVAILABLE:
        Output.warning("PyYAML not available, frontmatter parsing disabled")
        return {}, content

    try:
        frontmatter = yaml.safe_load(frontmatter_text) or {}
        return frontmatter, body
    except yaml.YAMLError as e:
        Output.warning(f"Failed to parse frontmatter: {e}")
        return {}, content


def write_frontmatter(frontmatter: Dict, body: str = "") -> str:
    """Write YAML frontmatter to markdown content"""
    if not YAML_AVAILABLE:
        Output.error("PyYAML not available, cannot write frontmatter")
        return body

    try:
        fm_yaml = yaml.dump(frontmatter, default_flow_style=False, allow_unicode=True, sort_keys=False)
        return f"---\n{fm_yaml.strip()}\n---\n\n{body}".strip()
    except Exception as e:
        Output.error(f"Failed to write frontmatter: {e}")
        return body


# ===== Command Functions =====

def cmd_list(args):
    """List all products (unchanged)"""
    paths = Paths()
    products_dir = paths.src / "content" / "products"

    if not products_dir.exists():
        Output.warning("Products directory not found")
        Output.info("Create one with: mkdir -p src/content/products")
        return

    product_files = list(products_dir.glob("*.md"))
    if not product_files:
        Output.warning("No products found")
        Output.info("Create one with: cli.py products create")
        return

    Output.header(f"📦 Found {len(product_files)} product(s)")

    # Table header
    Output.table_row("Status", "Slug", "Title", "Price", "Tags", widths=[10, 12, 20, 12, 15])
    Output.divider()

    for product_file in product_files:
        try:
            content = product_file.read_text(encoding='utf-8')
            frontmatter, _ = parse_frontmatter(content)

            slug = frontmatter.get('slug', product_file.stem)
            title = frontmatter.get('title', slug)
            status = frontmatter.get('status', 'unknown')
            price = frontmatter.get('price', '—')
            currency = frontmatter.get('currency', '')
            tags = frontmatter.get('tags', [])

            # Status emoji
            status_emoji = {
                'available': '🟢',
                'unavailable': '🔴',
                'discontinued': '⚫',
                'coming_soon': '🟡'
            }.get(status, '❓')

            # Format price
            if price != '—' and price is not None:
                price_display = f"{currency}{price}"
            else:
                price_display = '—'

            # Format tags
            tags_display = ', '.join(tags) if tags else '—'

            Output.table_row(
                f"{status_emoji} {status}",
                slug,
                title,
                price_display,
                tags_display,
                widths=[10, 12, 20, 12, 15]
            )

        except Exception as e:
            Output.warning(f"Error reading {product_file.name}: {e}")
            continue

    print()


def cmd_generate(args):
    """Generate AI content for products - NOW USES TEMPLATES"""
    config = Config.load()
    paths = Paths()

    # Get product slug or process all
    product_slug = getattr(args, 'product', None)
    use_ai = getattr(args, 'use_ai', True)

    products_dir = paths.src / "content" / "products"
    if not products_dir.exists():
        Output.error("Products directory not found")
        return

    if product_slug:
        product_file = products_dir / f"{product_slug}.md"
        if not product_file.exists():
            Output.error(f"Product not found: {product_slug}")
            return
        products_to_generate = [product_file]
    else:
        products_to_generate = list(products_dir.glob("*.md"))

    if not products_to_generate:
        Output.warning("No products found to generate content for")
        return

    Output.header(f"🤖 Generating content for {len(products_to_generate)} product(s)")
    Output.info("Using unified prompt templates from product_prompts.json")

    # Setup AI helper
    if not use_ai:
        Output.warning("AI generation disabled")
        return

    try:
        ai_helper = AIHelper(config)
        Output.success("AI helper initialized with prompt templates")
    except Exception as e:
        Output.error(f"Failed to initialize AI helper: {e}")
        return

    # Process each product
    for product_file in products_to_generate:
        try:
            _generate_product_content_with_templates(product_file, ai_helper, config)
        except Exception as e:
            Output.error(f"Failed to generate content for {product_file.name}: {e}")
            continue

    Output.success("Product content generation complete")


def _generate_product_content_with_templates(product_file: Path, ai_helper: AIHelper, config: dict) -> bool:
    """Generate content for a single product using templates"""
    try:
        # Read product
        content = product_file.read_text(encoding='utf-8')
        frontmatter, body = parse_frontmatter(content)
        slug = frontmatter.get('slug', product_file.stem)

        Output.progress(f"Processing {slug}...")

        title = frontmatter.get('title', '')
        category = frontmatter.get('category', '')
        current_excerpt = frontmatter.get('excerpt', '')

        # Skip if already has content
        if current_excerpt and not current_excerpt.startswith(f"{title} —"):
            Output.dim(f"  ✓ {slug} already has excerpt")
            return True

        # Build product data for context
        product_data = {
            'title': title,
            'category': category,
            'excerpt': current_excerpt,
            'tags': frontmatter.get('tags', [])
        }

        # Generate excerpt using template: product_excerpt
        Output.dim(f"  Generating excerpt using template: product_excerpt")
        generated_excerpt = ai_helper.generate_product_content(
            product_data,
            template_id='product_excerpt'
        )

        if generated_excerpt:
            # Format with title prefix
            if not generated_excerpt.startswith(f"{title} —"):
                generated_excerpt = f"{title} — {generated_excerpt}"
            
            frontmatter['excerpt'] = generated_excerpt

            # Save updated product
            updated_content = write_frontmatter(frontmatter, body)
            product_file.write_text(updated_content, encoding='utf-8')

            Output.success(f"  ✓ Generated excerpt for {slug}")
        else:
            Output.warning(f"  Failed to generate excerpt for {slug}")

        return True

    except Exception as e:
        Output.error(f"Failed to process {product_file.name}: {e}")
        return False


def cmd_generate_images(args):
    """Generate AI images for products interactively (unchanged from previous)"""
    # This function remains the same as it already works well
    # Just adding a note about template usage
    
    config = Config.load()
    paths = Paths()

    product_slug = getattr(args, 'product', None)
    if not product_slug:
        Output.error("Product slug required")
        Output.info("Usage: cli.py products images --product <slug>")
        return

    non_interactive = getattr(args, 'non_interactive', False) or getattr(args, 'api', False)

    # Load product
    product_file = paths.src / "content" / "products" / f"{product_slug}.md"
    if not product_file.exists():
        Output.error(f"Product not found: {product_slug}")
        return

    try:
        content = product_file.read_text(encoding='utf-8')
        frontmatter, body = parse_frontmatter(content)
        product_data = frontmatter
    except Exception as e:
        Output.error(f"Failed to load product data: {e}")
        return

    product_data = _validate_and_fix_product_data(product_data)

    Output.header(f"🎨 AI Image Generation for: {product_data['title']}")
    Output.info("Using template: product_image (Studio Ghibli aesthetic)")

    # Setup AI helper
    try:
        ai_helper = AIHelper(config)
    except Exception as e:
        Output.error(f"Failed to initialize AI helper: {e}")
        return

    # Create assets directory
    assets_dir = paths.public_assets / f"product-{product_slug}"
    assets_dir.mkdir(parents=True, exist_ok=True)

    existing_images = product_data.get('images', {}).get('gallery', [])
    Output.info(f"Found {len(existing_images)} existing images")

    # Generate images
    generated_images = []
    image_count = 0

    if non_interactive:
        max_images = 1
        default_prompt = f"Product photography of {product_data['title']} - professional, clean, well-lit"
    else:
        max_images = float('inf')
        default_prompt = f"Product photography of {product_data['title']}"

    while image_count < max_images:
        if image_count > 0 and not non_interactive:
            if not Prompt.confirm(f"Generate another image? ({image_count} already generated)", default=False):
                break

        image_count += 1

        if non_interactive:
            prompt = default_prompt
            Output.info(f"Using default prompt")
        else:
            prompt = Prompt.text(
                f"Image {image_count} description",
                default=default_prompt,
                required=True
            )

        Output.progress(f"Generating image {image_count} using product_image template...")

        try:
            # Generate using template-enhanced prompt
            result = ai_helper.generate_product_image(prompt, product_data, 'photo')
            image_url = result["url"]
            revised_prompt = result.get("revised_prompt", prompt)

            if image_url:
                filename = f"product-{product_slug}-img-{image_count:02d}.webp"
                image_path = assets_dir / filename

                success = _download_and_save_image(image_url, image_path)
                if success:
                    image_entry = {
                        "filename": filename,
                        "alt": f"{product_data['title']} - Image {image_count}",
                        "type": 'photo',
                        "prompt": revised_prompt,
                        "generated_at": datetime.utcnow().isoformat(),
                        "order": len(existing_images) + len(generated_images) + 1,
                        "template_used": "product_image"
                    }
                    generated_images.append(image_entry)
                    Output.success(f"✅ Generated and saved: {filename}")
                else:
                    Output.error(f"❌ Failed to save image {image_count}")
            else:
                Output.error(f"❌ Failed to generate image {image_count}")

        except Exception as e:
            Output.error(f"❌ Image generation error: {e}")
            continue

    # Update product with new images
    if generated_images:
        if 'images' not in product_data:
            correct_slug = product_data.get('slug', product_slug)
            product_data['images'] = {
                "master": f"/assets/product-{correct_slug}/product-{correct_slug}-master.png",
                "variants": "shared_variants",
                "processing": {
                    "priority": "medium",
                    "hero_image": True,
                    "gallery_sizes": ["thumb", "mobile", "tablet", "desktop"]
                }
            }

        if 'gallery' not in product_data['images']:
            product_data['images']['gallery'] = existing_images

        product_data['images']['gallery'].extend(generated_images)

        updated_content = write_frontmatter(product_data, body)
        product_file.write_text(updated_content, encoding='utf-8')

        Output.success(f"✅ Updated product with {len(generated_images)} new images")
        Output.info(f"Images stored in: {assets_dir}")
    else:
        Output.info("No images were generated")

    # Summary
    total_images = len(existing_images) + len(generated_images)
    Output.header("Summary")
    Output.info(f"Product: {product_data['title']}")
    Output.info(f"Total images: {total_images}")
    Output.info(f"Generated this session: {len(generated_images)}")
    Output.info("All images generated using product_image template")


def cmd_create(args):
    """Create new product interactively - NOW WITH TEMPLATE GENERATION"""
    config = Config.load()
    paths = Paths()

    Output.header("Create New Product")
    Output.info("AI content will use unified prompt templates")

    # Get product details interactively
    title = Prompt.text(
        "Product title",
        example="M42 Dobsonian Telescope",
        validator=lambda x: len(x.strip()) > 0
    )

    slug = Prompt.text(
        "Product slug",
        default=_slugify(title),
        validator=lambda x: len(x.strip()) > 0 and len(x.strip()) <= 50
    )

    slug = _slugify(slug)

    product_file = paths.src / "content" / "products" / f"{slug}.md"
    if product_file.exists():
        Output.error(f"Product already exists: {slug}")
        return

    # Get other fields...
    price = Prompt.text(
        "Price (without currency)",
        example="28000.00",
        validator=lambda x: not x or _is_valid_price(x)
    )

    currency = Prompt.choice(
        "Currency",
        options=["INR", "USD", "EUR", "GBP"],
        default=config.get('products.default_currency', 'INR')
    )

    status = Prompt.choice(
        "Status",
        options=["available", "unavailable", "coming_soon", "discontinued"],
        default=config.get('products.default_status', 'available')
    )

    available_tags = ["telescope", "weather", "sensor", "3d-printed", "arduino",
                     "raspberry-pi", "iot", "electronics", "customizable", "kit"]
    tags = Prompt.multiselect(
        "Tags",
        options=available_tags,
        defaults=[]
    )

    excerpt = Prompt.text(
        "Short excerpt/description",
        example="An ultra-light Dobsonian made for small patios and large existential questions.",
        required=True
    )

    # AI content generation with templates
    ai_enabled = config.get('ai.enabled', False)
    generate_content = False
    if ai_enabled:
        generate_content = Prompt.confirm(
            "Generate AI content using templates?",
            default=True
        )

    # Create frontmatter
    frontmatter = {
        "slug": slug,
        "title": title,
        "price": float(price) if price else None,
        "currency": currency if price else None,
        "status": status,
        "tags": tags,
        "date": datetime.utcnow().strftime('%Y-%m-%d'),
        "excerpt": excerpt,
        "images": {
            "master": f"/assets/product-{slug}/product-{slug}-master.png",
            "variants": "shared_variants",
            "processing": {
                "priority": "medium",
                "hero_image": True,
                "gallery_sizes": ["thumb", "mobile", "tablet", "desktop"]
            },
            "gallery": []
        }
    }

    # Generate AI content with templates
    if generate_content:
        Output.progress("Generating AI content with templates...")
        try:
            ai_helper = AIHelper(config)
            
            product_data = {
                "title": title,
                "category": tags[0] if tags else "product",
                "tags": tags
            }
            
            # Generate excerpt using product_excerpt template
            generated_excerpt = ai_helper.generate_product_content(
                product_data,
                template_id='product_excerpt'
            )

            if generated_excerpt:
                # Format with title
                if not generated_excerpt.startswith(f"{title} —"):
                    frontmatter["excerpt"] = f"{title} — {generated_excerpt}"
                else:
                    frontmatter["excerpt"] = generated_excerpt
                Output.success("✅ Generated excerpt using product_excerpt template")
            else:
                Output.warning("Excerpt generation failed, using manual input")

        except Exception as e:
            Output.warning(f"AI generation failed: {e}")

    # Create markdown body
    markdown_body = f"""# {title}

{frontmatter["excerpt"]}

## What's Included

- [List items here]

## Specifications

[Add specifications here]

## Description

Detailed product description goes here.
"""

    # Save product
    src_products_dir = paths.src / "content" / "products"
    src_products_dir.mkdir(parents=True, exist_ok=True)

    markdown_content = write_frontmatter(frontmatter, markdown_body)
    product_file.write_text(markdown_content, encoding='utf-8')

    Output.success(f"Created product: {product_file.relative_to(paths.root)}")

    # Next steps
    Output.header("Let's enhance your product!")
    
    if Prompt.confirm("Generate more AI content (features, tags, specs)?", default=True):
        try:
            ai_helper = AIHelper(config)
            product_data = {
                "title": title,
                "category": tags[0] if tags else "product",
                "excerpt": frontmatter["excerpt"],
                "tags": tags
            }
            
            # Generate features
            Output.progress("Generating features with product_features template...")
            features = ai_helper.generate_product_features(product_data)
            if features:
                Output.success(f"✅ Generated {len(features)} features")
            
            # Generate tags if empty
            if not tags:
                Output.progress("Generating tags with product_tags template...")
                generated_tags = ai_helper.generate_product_tags(product_data, max_tags=5)
                if generated_tags:
                    Output.success(f"✅ Generated {len(generated_tags)} tags")
            
            # Generate specs
            Output.progress("Generating specs with product_specifications template...")
            specs = ai_helper.generate_product_specifications(product_data)
            if specs:
                Output.success(f"✅ Generated {len(specs)} specifications")
            
        except Exception as e:
            Output.error(f"AI generation failed: {e}")

    if Prompt.confirm("Generate AI images?", default=True):
        import argparse
        img_args = argparse.Namespace()
        img_args.product = slug
        img_args.non_interactive = False
        img_args.api = False
        cmd_generate_images(img_args)

    Output.success("🎉 Product created with template-based AI content!")


# ===== Helper Functions =====

def _validate_and_fix_product_data(product_data: dict) -> dict:
    """Validate and fix product data (unchanged)"""
    slug = product_data.get('slug', '')
    if not slug or len(slug) > 50:
        title = product_data.get('title', 'product')
        slug = _slugify(title)
        product_data['slug'] = slug

    if 'images' in product_data:
        master_path = product_data['images'].get('master', '')
        if master_path and f"product-{slug}" not in master_path:
            product_data['images']['master'] = f"public/assets/product-{slug}/product-{slug}-master.png"

    return product_data


def _download_and_save_image(image_url: str, output_path: Path) -> bool:
    """Download image and save as WebP (unchanged)"""
    try:
        import requests
        from PIL import Image
        import io

        response = requests.get(image_url, timeout=30)
        response.raise_for_status()

        image = Image.open(io.BytesIO(response.content))

        if image.mode != 'RGB':
            image = image.convert('RGB')

        image.save(output_path, 'WEBP', quality=85)

        Output.info(f"   Saved as: {output_path.name} ({image.size[0]}x{image.size[1]})")
        return True

    except ImportError:
        Output.error("PIL or requests not available")
        Output.info("Install with: pip install pillow requests")
        return False
    except Exception as e:
        Output.error(f"Failed to download/save image: {e}")
        return False


def _slugify(title: str) -> str:
    """Convert title to URL-safe slug"""
    slug = title.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')


def _is_valid_price(price_str: str) -> bool:
    """Validate price format"""
    try:
        float(price_str)
        return True
    except ValueError:
        return False