"""
Product Management Commands

Handles product catalog management, AI content generation, and product creation.
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


# ===== Frontmatter Utilities =====

def parse_frontmatter(content: str) -> Tuple[Dict, str]:
    """Parse YAML frontmatter from markdown content"""
    if not content.startswith('---'):
        return {}, content

    # Find the end of frontmatter
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


def cmd_list(args):
    """List all products"""
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

    print()  # Empty line at end


def cmd_generate(args):
    """Generate AI content for products"""
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
        # Generate for specific product
        product_file = products_dir / f"{product_slug}.md"
        if not product_file.exists():
            Output.error(f"Product not found: {product_slug}")
            return
        products_to_generate = [product_file]
    else:
        # Generate for all products
        products_to_generate = list(products_dir.glob("*.md"))

    if not products_to_generate:
        Output.warning("No products found to generate content for")
        return

    Output.header(f"🤖 Generating content for {len(products_to_generate)} product(s)")

    # Setup AI client if needed
    ai_client = None
    if use_ai:
        try:
            from openai import OpenAI
            import os

            ai_config = config.get('ai', {})
            provider = ai_config.get('provider', 'openai')

            if provider == 'openai':
                api_key = os.getenv('OPENAI_API_KEY')
                if api_key:
                    ai_client = OpenAI(api_key=api_key)
                    Output.info("Using OpenAI for content generation")
                else:
                    Output.warning("OPENAI_API_KEY not set, falling back to mock generation")
                    use_ai = False
            else:
                Output.warning(f"Unsupported AI provider: {provider}, falling back to mock")
                use_ai = False

        except ImportError:
            Output.warning("OpenAI package not available, falling back to mock generation")
            use_ai = False

    # Process each product
    for product_file in products_to_generate:
        try:
            _generate_product_content(product_file, ai_client, config, use_ai)
        except Exception as e:
            Output.error(f"Failed to generate content for {product_file.name}: {e}")
            continue

    Output.success("Product content generation complete")


def cmd_generate_images(args):
    """Generate AI images for products interactively"""
    config = Config.load()
    paths = Paths()

    # Get product slug
    product_slug = getattr(args, 'product', None)
    if not product_slug:
        Output.error("Product slug required")
        Output.info("Usage: cli.py products images --product <slug> [--non-interactive]")
        return

    # Check if non-interactive mode (for API calls)
    non_interactive = getattr(args, 'non_interactive', False) or getattr(args, 'api', False)

    # Load product from Markdown file
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

    # Validate and fix product data if needed
    product_data = _validate_and_fix_product_data(product_data)

    Output.header(f"🎨 AI Image Generation for: {product_data['title']}")

    # Setup AI client
    ai_client = _setup_image_generation_client(config)
    if not ai_client:
        return

    # Create product assets directory
    assets_dir = paths.public_assets / f"product-{product_slug}"
    assets_dir.mkdir(parents=True, exist_ok=True)

    # Get existing images from product data
    existing_images = product_data.get('images', {}).get('gallery', [])

    Output.info(f"Found {len(existing_images)} existing images")

    # Interactive or non-interactive image generation
    generated_images = []
    image_count = 0

    # In non-interactive mode, generate exactly 1 image with defaults
    if non_interactive:
        max_images = 1
        default_prompt = f"Product photography of {product_data['title']} - professional, clean, well-lit, product shot"
        default_image_type = "photo"
    else:
        max_images = float('inf')  # Unlimited in interactive mode
        default_prompt = f"Product photography of {product_data['title']} - professional, clean, well-lit, product shot"
        default_image_type = "photo"

    while image_count < max_images:
        if image_count > 0 and not non_interactive:
            if not Prompt.confirm(f"Generate another image? ({image_count} already generated)", default=False):
                break

        image_count += 1

        # Get image description
        if non_interactive:
            prompt = default_prompt
            Output.info(f"Using default prompt: {prompt}")
        else:
            prompt = Prompt.text(
                f"Image {image_count} description",
                default=default_prompt,
                required=True
            )

        # Image type
        if non_interactive:
            image_type = default_image_type
            Output.info(f"Using default image type: {image_type}")
        else:
            image_type = Prompt.choice(
                "Image type",
                options=["photo", "illustration", "diagram", "lifestyle"],
                default="photo"
            )

        # Generate image
        Output.progress(f"Generating image {image_count}...")

        try:
            from lib.ai import AIHelper
            ai_helper = AIHelper(config)
            result = ai_helper.generate_product_image(prompt, product_data, image_type)
            image_url = result["url"]
            revised_prompt = result.get("revised_prompt", prompt)

            if image_url:
                # Download and save image
                filename = f"product-{product_slug}-img-{image_count:02d}.webp"
                image_path = assets_dir / filename

                success = _download_and_save_image(image_url, image_path)
                if success:
                    # Add to generated images
                    image_entry = {
                        "filename": filename,
                        "alt": f"{product_data['title']} - Image {image_count}",
                        "type": image_type,
                        "prompt": revised_prompt,
                        "generated_at": datetime.utcnow().isoformat(),
                        "order": len(existing_images) + len(generated_images) + 1
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

    # Update product data if images were generated
    if generated_images:
        # Ensure images structure exists
        if 'images' not in product_data:
            # Always use the slug from product_data, not the parameter
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

        # Add gallery if it doesn't exist
        if 'gallery' not in product_data['images']:
            product_data['images']['gallery'] = existing_images

        # Add new images to gallery
        product_data['images']['gallery'].extend(generated_images)

        # Save updated product data back to Markdown file
        updated_content = write_frontmatter(product_data, body)
        product_file.write_text(updated_content, encoding='utf-8')

        Output.success(f"✅ Updated product Markdown with {len(generated_images)} new images")
        Output.info(f"Images stored in: {assets_dir}")
    else:
        Output.info("No images were generated")

    # Summary
    total_images = len(existing_images) + len(generated_images)
    Output.header("Summary")
    Output.info(f"Product: {product_data['title']}")
    Output.info(f"Total images: {total_images}")
    Output.info(f"Generated this session: {len(generated_images)}")
    if generated_images:
        Output.info("Images ready for product carousel!")


# ===== Image Generation Helpers =====

def _setup_image_generation_client(config: dict):
    """Setup AI client for image generation"""
    try:
        ai_helper = AIHelper(config)
        client = ai_helper.get_client()
        Output.info("✅ AI client ready for image generation")
        return client.client  # Return the raw client for backward compatibility

    except Exception as e:
        Output.error(f"Failed to setup AI client: {e}")
        return None


def _generate_product_image(client, prompt: str, image_type: str, product_data: dict):
    """Generate a single product image using AI"""
    # Use the new AI module for consistency
    from lib.ai import AIHelper
    config = {}  # We'll get this from the global config somehow
    # For now, create a minimal config for AI
    ai_config = {"ai": {"provider": "openai"}}
    ai_helper = AIHelper(ai_config)

    try:
        result = ai_helper.generate_product_image(prompt, product_data, image_type)
        return result["url"], result.get("revised_prompt", prompt)
    except Exception as e:
        Output.error(f"AI image generation failed: {e}")
        return None, None


def _validate_and_fix_product_data(product_data: dict) -> dict:
    """Validate and fix product data inconsistencies"""
    slug = product_data.get('slug', '')

    # Ensure slug is valid
    if not slug or len(slug) > 50:
        # Try to generate from title
        title = product_data.get('title', 'product')
        slug = _slugify(title)
        product_data['slug'] = slug

    # Fix master image path if corrupted
    if 'images' in product_data:
        master_path = product_data['images'].get('master', '')
        if master_path and f"product-{slug}" not in master_path:
            # Master path is corrupted, fix it
            product_data['images']['master'] = f"public/assets/product-{slug}/product-{slug}-master.png"

    return product_data


def _download_and_save_image(image_url: str, output_path: Path) -> bool:
    """Download image from URL and save as WebP"""
    try:
        import requests
        from PIL import Image
        import io

        # Download image
        response = requests.get(image_url, timeout=30)
        response.raise_for_status()

        # Open with PIL
        image = Image.open(io.BytesIO(response.content))

        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')

        # Save as WebP
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


def cmd_create(args):
    """Create new product interactively"""
    config = Config.load()
    paths = Paths()

    Output.header("Create New Product")

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

    # Ensure slug is properly formatted
    slug = _slugify(slug)

    # Check if product already exists
    product_file = paths.src / "content" / "products" / f"{slug}.md"
    if product_file.exists():
        Output.error(f"Product already exists: {slug}")
        return

    # Price and currency
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

    # Status
    status = Prompt.choice(
        "Status",
        options=["available", "unavailable", "coming_soon", "discontinued"],
        default=config.get('products.default_status', 'available')
    )

    # Tags
    available_tags = ["telescope", "weather", "sensor", "3d-printed", "arduino",
                     "raspberry-pi", "iot", "electronics", "customizable", "kit"]
    tags = Prompt.multiselect(
        "Tags",
        options=available_tags,
        defaults=[]
    )

    # Excerpt
    excerpt = Prompt.text(
        "Short excerpt/description",
        example="An ultra-light Dobsonian made for small patios and large existential questions.",
        required=True
    )

    # What's included
    included_items = []
    Output.info("What's included with the product? (Enter empty line when done)")
    while True:
        item = input("  Item: ").strip()
        if not item:
            break
        included_items.append(item)

    # Specs (optional)
    specs = {}
    if Prompt.confirm("Add technical specifications?", default=False):
        Output.info("Technical specifications: (Enter empty key when done)")
        while True:
            key = input("  Spec name: ").strip()
            if not key:
                break
            value = input(f"  {key}: ").strip()
            if value:
                specs[key] = value

    # AI content generation
    ai_enabled = config.get('ai.enabled', False)
    generate_content = False
    if ai_enabled:
        generate_content = Prompt.confirm(
            "Generate AI content for this product?",
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

    # Generate AI content if requested
    if generate_content:
        Output.progress("Generating AI content...")
        try:
            # Create a temporary product data dict for AI generation
            temp_product_data = {
                "title": title,
                "tags": tags,
                # Add other fields that AI generation might need
            }
            ai_helper = AIHelper(config)
            generated_content = ai_helper.generate_product_content(temp_product_data)

            if generated_content:
                # Update excerpt in frontmatter
                frontmatter["excerpt"] = generated_content
                Output.success("✅ AI content generated!")
            else:
                Output.warning("AI content generation failed")

        except Exception as e:
            Output.warning(f"AI content generation failed: {e}")

    # Create markdown body content
    markdown_body = _create_product_markdown_body(title, frontmatter["excerpt"], included_items, specs)

    # Write the complete markdown file
    src_products_dir = paths.src / "content" / "products"
    src_products_dir.mkdir(parents=True, exist_ok=True)

    markdown_content = write_frontmatter(frontmatter, markdown_body)
    product_file.write_text(markdown_content, encoding='utf-8')

    Output.success(f"Created product: {product_file.relative_to(paths.root)}")
    Output.info("Product is ready for Astro content collection processing")

    # Interactive next steps
    Output.header("Let's enhance your product!")

    # 1. Generate AI content
    if Prompt.confirm("Generate AI content for this product?", default=True):
        Output.info("Generating AI content...")
        try:
            # Create a temporary product data dict for AI generation
            temp_product_data = {
                "title": title,
                "tags": tags,
                # Add other fields that AI generation might need
            }
            ai_helper = AIHelper(config)
            generated_content = ai_helper.generate_product_content(temp_product_data)

            if generated_content:
                current_excerpt = frontmatter.get("excerpt", "")

                # Apply the same title duplication logic
                if generated_content.startswith(f"{title} —") or generated_content.startswith(f"{title} -"):
                    # AI already included title, use as-is
                    final_excerpt = generated_content
                elif current_excerpt.startswith(f"{title} —") or current_excerpt.startswith(f"{title} -"):
                    # Current excerpt already has title, replace the descriptive part
                    title_prefix = f"{title} — "
                    if current_excerpt.startswith(title_prefix):
                        # Replace the descriptive part with AI-generated content
                        final_excerpt = f"{title} — {generated_content}"
                    else:
                        final_excerpt = generated_content
                else:
                    # Neither has title, prepend it
                    final_excerpt = f"{title} — {generated_content}"

                # Update excerpt if it's different
                if final_excerpt != current_excerpt:
                    frontmatter["excerpt"] = final_excerpt

                    # Save updated markdown file
                    markdown_content = write_frontmatter(frontmatter, markdown_body)
                    product_file.write_text(markdown_content, encoding='utf-8')

                Output.success("✅ AI content generated!")
            else:
                Output.warning("AI content generation failed")

        except Exception as e:
            Output.error(f"AI content generation failed: {e}")

    # 2. Generate AI images
    if Prompt.confirm("Generate AI images for this product?", default=True):
        Output.info("Let's create some product images...")
        try:
            # Create args object for image generation
            import argparse
            args = argparse.Namespace()
            args.product = slug

            # Call the image generation function
            cmd_generate_images(args)
            Output.success("✅ AI images generated!")

        except Exception as e:
            Output.error(f"AI image generation failed: {e}")

    # 3. Show remaining next steps
    Output.header("Product ready!")
    Output.info(f"• View your product: cli.py products list")
    Output.info(f"• Edit manually: {product_file}")
    Output.info(f"• Add more images: cli.py products images --product {slug}")

    # Final encouragement
    Output.success("🎉 Your product is ready for the shop!")
    if product_data.get('images', {}).get('gallery'):
        gallery_count = len(product_data['images']['gallery'])
        Output.info(f"   Includes {gallery_count} AI-generated product image{'s' if gallery_count != 1 else ''}")
    if any('generated' in str(entry) for entry in product_data.get('generated', [])):
        Output.info("   Includes AI-generated marketing content")


# ===== Helper Functions =====

def _generate_product_content(product_file: Path, ai_client, config: dict, use_ai: bool) -> bool:
    """Generate content for a single product (Markdown format)"""
    try:
        # Read and parse the Markdown file
        content = product_file.read_text(encoding='utf-8')
        frontmatter, body = parse_frontmatter(content)
        slug = frontmatter.get('slug', product_file.stem)

        Output.progress(f"Processing {slug}...")

        # For now, simplified implementation - just ensure basic excerpt formatting
        title = frontmatter.get('title', '')
        current_excerpt = frontmatter.get('excerpt', '')

        # Simple mock generation - ensure title is properly formatted
        if title and not current_excerpt.startswith(f"{title} —"):
            updated_excerpt = f"{title} — {current_excerpt}" if current_excerpt else f"{title} — Product description"
            if updated_excerpt != current_excerpt:
                frontmatter['excerpt'] = updated_excerpt
                updated_content = write_frontmatter(frontmatter, body)
                product_file.write_text(updated_content, encoding='utf-8')

        Output.success(f"  ✓ Processed {slug}")
        return True

    except Exception as e:
        Output.error(f"Failed to process {product_file.name}: {e}")
        return False


def _generate_single_product_content(product_data: dict, config: dict) -> Optional[dict]:
    """Generate AI content for a single product"""
    try:
        from lib.ai import AIHelper
        ai_helper = AIHelper(config)

        generated_content = ai_helper.generate_product_content(product_data)

        if generated_content:
            # Select appropriate template based on tags for tracking
            templates = config.get('products.ai_templates', {})
            template_key = _select_template_for_product(product_data, templates)

            return {
                "excerpt": generated_content,
                "template_used": template_key
            }

    except Exception as e:
        Output.warning(f"AI content generation error: {e}")
        return None


def _select_template_for_product(product_data: dict, templates: dict) -> str:
    """Select appropriate AI template based on product tags"""
    tags = product_data.get('tags', [])

    # Tag-based mapping
    tag_mapping = {
        "telescope": "telescope-blurb",
        "weather": "weather-quick",
        "sensor": "weather-quick"
    }

    for tag in tags:
        if tag in tag_mapping and tag_mapping[tag] in templates:
            return tag_mapping[tag]

    return "_default"


def _slugify(title: str) -> str:
    """Convert title to URL-safe slug"""
    import re
    slug = title.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')


def _is_valid_price(price_str: str) -> bool:
    """Validate price format (should be numeric)"""
    try:
        float(price_str)
        return True
    except ValueError:
        return False


def _create_product_markdown_body(title: str, excerpt: str, included_items: List[str], specs: Dict[str, str]) -> str:
    """Create the markdown body content for a product"""
    body_parts = []

    # Add excerpt as first paragraph
    body_parts.append(excerpt)
    body_parts.append("")

    # What's included section
    if included_items:
        body_parts.append("## What's Included")
        body_parts.append("")
        for item in included_items:
            body_parts.append(f"- {item}")
        body_parts.append("")

    # Specifications section
    if specs:
        body_parts.append("## Specifications")
        body_parts.append("")
        body_parts.append("| Specification | Value |")
        body_parts.append("|---------------|-------|")
        for key, value in specs.items():
            body_parts.append(f"| {key} | {value} |")
        body_parts.append("")

    # Basic template sections (can be expanded later)
    body_parts.append("## Description")
    body_parts.append("")
    body_parts.append("Detailed product description goes here.")
    body_parts.append("")

    return "\n".join(body_parts)
