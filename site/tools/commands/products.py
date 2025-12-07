"""
Product Management Commands

Handles product catalog management, AI content generation, and product creation.
"""

import sys
import json
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, List

# Add parent to path for lib imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from lib import Output, Style, Config, Paths, Prompt


def cmd_list(args):
    """List all products"""
    paths = Paths()
    products_dir = paths.src / "data" / "products"

    if not products_dir.exists():
        Output.warning("Products directory not found")
        Output.info("Create one with: mkdir -p src/data/products")
        return

    product_files = list(products_dir.glob("*.json"))
    if not product_files:
        Output.warning("No products found")
        Output.info("Create one with: cli.py products create")
        return

    Output.header(f"📦 Found {len(product_files)} product(s)")

    # Table header
    Output.table_row("Status", "Title", "Price", "Tags", widths=[10, 25, 12, 20])
    Output.divider()

    for product_file in product_files:
        try:
            product_data = json.loads(product_file.read_text(encoding='utf-8'))

            slug = product_data.get('slug', product_file.stem)
            title = product_data.get('title', slug)
            status = product_data.get('status', 'unknown')
            price = product_data.get('price', '—')
            currency = product_data.get('currency', '')
            tags = product_data.get('tags', [])

            # Status emoji
            status_emoji = {
                'available': '🟢',
                'unavailable': '🔴',
                'discontinued': '⚫',
                'coming_soon': '🟡'
            }.get(status, '❓')

            # Format price
            if price != '—':
                price_display = f"{currency}{price}"
            else:
                price_display = '—'

            # Format tags
            tags_display = ', '.join(tags) if tags else '—'

            Output.table_row(
                f"{status_emoji} {status}",
                title,
                price_display,
                tags_display,
                widths=[10, 25, 12, 20]
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

    products_dir = paths.src / "data" / "products"
    if not products_dir.exists():
        Output.error("Products directory not found")
        return

    if product_slug:
        # Generate for specific product
        product_file = products_dir / f"{product_slug}.json"
        if not product_file.exists():
            Output.error(f"Product not found: {product_slug}")
            return
        products_to_generate = [product_file]
    else:
        # Generate for all products
        products_to_generate = list(products_dir.glob("*.json"))

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
        Output.info("Usage: cli.py products images --product <slug>")
        return

    # Load product
    product_file = paths.src / "data" / "products" / f"{product_slug}.json"
    if not product_file.exists():
        Output.error(f"Product not found: {product_slug}")
        return

    try:
        product_data = json.loads(product_file.read_text(encoding='utf-8'))
    except Exception as e:
        Output.error(f"Failed to load product data: {e}")
        return

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

    # Interactive image generation
    generated_images = []
    image_count = 0

    while True:
        if image_count > 0:
            if not Prompt.confirm(f"Generate another image? ({image_count} already generated)", default=False):
                break

        image_count += 1

        # Get image description
        default_prompt = f"Product photography of {product_data['title']} - professional, clean, well-lit, product shot"
        prompt = Prompt.text(
            f"Image {image_count} description",
            default=default_prompt,
            required=True
        )

        # Image type
        image_type = Prompt.choice(
            "Image type",
            options=["photo", "illustration", "diagram", "lifestyle"],
            default="photo"
        )

        # Generate image
        Output.progress(f"Generating image {image_count}...")

        try:
            image_url, revised_prompt = _generate_product_image(
                ai_client, prompt, image_type, product_data
            )

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
            product_data['images'] = {
                "master": f"public/assets/product-{product_slug}/product-{product_slug}-master.png",
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

        # Save updated product data
        product_file.write_text(
            json.dumps(product_data, indent=2, ensure_ascii=False),
            encoding='utf-8'
        )

        Output.success(f"✅ Updated product JSON with {len(generated_images)} new images")
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
        from openai import OpenAI
        import os

        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            Output.error("OPENAI_API_KEY not set")
            Output.info("Set your OpenAI API key to enable image generation")
            return None

        client = OpenAI(api_key=api_key)
        Output.info("✅ OpenAI client ready for image generation")
        return client

    except ImportError:
        Output.error("OpenAI package not available")
        Output.info("Install with: pip install openai")
        return None
    except Exception as e:
        Output.error(f"Failed to setup AI client: {e}")
        return None


def _generate_product_image(client, prompt: str, image_type: str, product_data: dict):
    """Generate a single product image using AI"""
    # Enhance prompt based on image type
    type_enhancements = {
        "photo": "Professional product photography, clean white background, well-lit, commercial product shot, high quality",
        "illustration": "Digital illustration, clean design, product visualization, modern aesthetic",
        "diagram": "Technical diagram, exploded view, clear labeling, educational illustration",
        "lifestyle": "Lifestyle photography, contextual use, natural setting, aspirational imagery"
    }

    enhanced_prompt = f"{prompt}. {type_enhancements.get(image_type, '')}"

    # Add product context
    product_context = f"Product: {product_data['title']}. "
    if product_data.get('tags'):
        product_context += f"Category: {', '.join(product_data['tags'])}. "

    full_prompt = product_context + enhanced_prompt

    try:
        response = client.images.generate(
            model="dall-e-3",
            prompt=full_prompt,
            size="1792x1024",  # Wide format good for product shots
            quality="standard",
            n=1
        )

        image_url = response.data[0].url
        revised_prompt = getattr(response.data[0], 'revised_prompt', full_prompt)

        return image_url, revised_prompt

    except Exception as e:
        Output.error(f"AI image generation failed: {e}")
        return None, None


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
        validator=lambda x: len(x.strip()) > 0
    )

    # Check if product already exists
    product_file = paths.src / "data" / "products" / f"{slug}.json"
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

    # Create product data structure
    product_data = {
        "slug": slug,
        "title": title,
        "price": price or None,
        "currency": currency if price else None,
        "status": status,
        "tags": tags,
        "excerpt": excerpt,
        "included": included_items,
        "specs": specs,
        "mood_default": 50,
        "enable_audit": True,
        "images": {
            "master": f"public/assets/product-{slug}/product-{slug}-master.png",
            "variants": "shared_variants",
            "processing": {
                "priority": "medium",
                "hero_image": True,
                "gallery_sizes": ["thumb", "mobile", "tablet", "desktop"]
            }
        }
    }

    # Generate AI content if requested
    if generate_content:
        Output.progress("Generating AI content...")
        try:
            ai_content = _generate_single_product_content(product_data, config)
            if ai_content:
                product_data["excerpt"] = ai_content.get("excerpt", product_data["excerpt"])
                # Add generation audit
                product_data.setdefault("generated", []).append({
                    "id": f"g-{datetime.utcnow().isoformat().replace(':', '-')}",
                    "date": datetime.utcnow().isoformat(),
                    "mood": product_data["mood_default"],
                    "prompt_selection_reason": "interactive_create",
                    "model": "gpt-5.1",
                    "excerpt": product_data["excerpt"]
                })
        except Exception as e:
            Output.warning(f"AI content generation failed: {e}")

    # Write product file
    products_dir = paths.src / "data" / "products"
    products_dir.mkdir(parents=True, exist_ok=True)

    product_file.write_text(
        json.dumps(product_data, indent=2, ensure_ascii=False),
        encoding='utf-8'
    )

    Output.success(f"Created product: {product_file.relative_to(paths.root)}")

    # Suggest next steps
    Output.header("Next steps:")
    Output.info("• Add product images to: public/assets/product-{slug}/")
    Output.info("• Test with: cli.py products list")
    Output.info("• Generate content with: cli.py products generate --product {slug}")


# ===== Helper Functions =====

def _generate_product_content(product_file: Path, ai_client, config: dict, use_ai: bool) -> bool:
    """Generate content for a single product"""
    try:
        product_data = json.loads(product_file.read_text(encoding='utf-8'))
        slug = product_data.get('slug', product_file.stem)

        Output.progress(f"Processing {slug}...")

        if use_ai and ai_client:
            ai_content = _generate_single_product_content(product_data, config)
            if ai_content:
                # Update excerpt if it's different
                if ai_content.get("excerpt") != product_data.get("excerpt"):
                    product_data["excerpt"] = ai_content["excerpt"]

                    # Add to generated audit
                    audit_entry = {
                        "id": f"g-{datetime.utcnow().isoformat().replace(':', '-')}",
                        "date": datetime.utcnow().isoformat(),
                        "mood": product_data.get("mood_default", 50),
                        "prompt_selection_reason": "batch_generate",
                        "model": "gpt-5.1",
                        "excerpt": product_data["excerpt"]
                    }
                    product_data.setdefault("generated", []).append(audit_entry)

                    # Save updated product
                    product_file.write_text(
                        json.dumps(product_data, indent=2, ensure_ascii=False),
                        encoding='utf-8'
                    )

                Output.success(f"  ✓ Generated content for {slug}")
                return True
            else:
                Output.warning(f"  ⚠ AI generation failed for {slug}")
                return False
        else:
            # Mock generation for development
            included = product_data.get("included", [])
            included_txt = ", ".join(included) if included else "unit and instructions"
            mock_excerpt = f"{product_data['title']} — {product_data.get('excerpt', 'A product.')} What's included: {included_txt}."

            if mock_excerpt != product_data.get("excerpt"):
                product_data["excerpt"] = mock_excerpt
                product_file.write_text(
                    json.dumps(product_data, indent=2, ensure_ascii=False),
                    encoding='utf-8'
                )

            Output.success(f"  ✓ Mock content generated for {slug}")
            return True

    except Exception as e:
        Output.error(f"Failed to process {product_file.name}: {e}")
        return False


def _generate_single_product_content(product_data: dict, config: dict) -> Optional[dict]:
    """Generate AI content for a single product"""
    try:
        from openai import OpenAI

        ai_config = config.get('ai', {})
        templates = config.get('products.ai_templates', {})

        # Select appropriate template based on tags
        template_key = _select_template_for_product(product_data, templates)
        template = templates.get(template_key, templates.get('_default', {}))

        if not template:
            return None

        # Build prompt
        prompt = template['prompt'].format(
            title=product_data['title'],
            excerpt=product_data.get('excerpt', '')
        )

        # Call AI
        response = ai_client.chat.completions.create(
            model=ai_config.get('default_model', 'gpt-4o-mini'),
            messages=[{"role": "user", "content": prompt}],
            temperature=template.get('temperature', 0.7),
            max_tokens=150
        )

        generated_text = response.choices[0].message.content.strip()

        return {
            "excerpt": generated_text,
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