"""
Asset Management Commands

Handles logo generation, asset optimization, and asset processing.
Focuses on creating responsive logo variants and optimizing site assets.
"""

import sys
from pathlib import Path
from typing import Optional, Dict, List

# Add parent to path for lib imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from lib import Output, Style, Config, Paths, Prompt

# Try to import PIL for image processing
try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


def cmd_logos(args):
    """Generate responsive logo variants from master logo"""
    if not PIL_AVAILABLE:
        Output.error("Pillow (PIL) not installed")
        Output.info("Install with: pip install pillow")
        return

    config = Config.load()
    paths = Paths()

    Output.header("🎨 Logo Variant Generation")

    # Find master logo - check in site root assets first
    logo_dir = paths.root / "assets" / "logo"
    master_logo = logo_dir / "starstucklab_logo_black_white.svg"

    if not master_logo.exists():
        # Try PNG version
        master_logo = logo_dir / "starstucklab_logo_black_white.png"
        if not master_logo.exists():
            Output.error(f"Master logo not found at: {master_logo}")
            Output.info("Expected: assets/logo/starstucklab_logo_black_white.svg or .png")
            return

    Output.info(f"Found master logo: {master_logo}")

    # Check if it's SVG or raster
    if master_logo.suffix.lower() == '.svg':
        _generate_svg_logo_variants(master_logo, config)
    else:
        _generate_raster_logo_variants(master_logo, config)

    Output.success("Logo variants generated successfully")


def _generate_svg_logo_variants(master_svg: Path, config: dict):
    """Generate SVG logo variants (different sizes, optimized versions)"""
    Output.info("Processing SVG logo...")

    # Read SVG content
    svg_content = master_svg.read_text(encoding='utf-8')

    # Create variants directory
    variants_dir = master_svg.parent / "variants"
    variants_dir.mkdir(exist_ok=True)

    # Logo size variants for different contexts
    logo_sizes = [
        {"name": "favicon", "size": 32, "desc": "Favicon (32x32)"},
        {"name": "icon", "size": 64, "desc": "Icon (64x64)"},
        {"name": "logo-small", "size": 128, "desc": "Small logo (128x128)"},
        {"name": "logo-medium", "size": 256, "desc": "Medium logo (256x256)"},
        {"name": "logo-large", "size": 512, "desc": "Large logo (512x512)"},
    ]

    for variant in logo_sizes:
        variant_name = variant["name"]
        size = variant["size"]
        desc = variant["desc"]

        Output.progress(f"Creating {desc}...")

        # For SVG, we can create different sized versions by modifying the SVG
        # This is a simplified approach - in a real implementation you'd want
        # to convert to PNG at specific sizes

        # Create PNG version at this size (requires converting SVG to raster)
        _convert_svg_to_png(master_svg, variants_dir / f"{variant_name}.png", size)

    Output.success(f"Generated {len(logo_sizes)} SVG logo variants")


def _generate_raster_logo_variants(master_png: Path, config: dict):
    """Generate raster logo variants from PNG master"""
    Output.info("Processing raster logo...")

    try:
        img = Image.open(master_png).convert('RGBA')
        Output.info(f"Master logo: {img.width}x{img.height}px")
    except Exception as e:
        Output.error(f"Failed to load logo: {e}")
        return

    # Create variants directory
    variants_dir = master_png.parent / "variants"
    variants_dir.mkdir(exist_ok=True)

    # Logo size variants for different contexts
    logo_sizes = [
        {"name": "favicon", "size": 32, "desc": "Favicon (32x32)"},
        {"name": "icon", "size": 64, "desc": "Icon (64x64)"},
        {"name": "logo-small", "size": 128, "desc": "Small logo (128x128)"},
        {"name": "logo-medium", "size": 256, "desc": "Medium logo (256x256)"},
        {"name": "logo-large", "size": 512, "desc": "Large logo (512x512)"},
    ]

    for variant in logo_sizes:
        variant_name = variant["name"]
        size = variant["size"]
        desc = variant["desc"]

        Output.progress(f"Creating {desc}...")

        # Resize logo maintaining aspect ratio
        resized_img = _resize_logo(img, size)

        # Save as PNG with transparency
        output_path = variants_dir / f"{variant_name}.png"
        resized_img.save(output_path, 'PNG')

        Output.info(f"  ✓ Saved: {output_path.name} ({resized_img.width}x{resized_img.height})")

    Output.success(f"Generated {len(logo_sizes)} logo variants")


def _convert_svg_to_png(svg_path: Path, png_path: Path, size: int):
    """Convert SVG to PNG at specified size"""
    # This is a placeholder - in a real implementation you'd use
    # a library like cairosvg or inkscape to convert SVG to PNG
    # For now, create a placeholder image
    try:
        from PIL import Image, ImageDraw
        img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
        draw = ImageDraw.Draw(img)

        # Draw a simple placeholder (you'd replace this with actual SVG conversion)
        # This is just for demonstration
        center = size // 2
        radius = size // 4
        draw.ellipse([center-radius, center-radius, center+radius, center+radius],
                    fill=(0, 0, 0, 255))

        img.save(png_path, 'PNG')
        Output.info(f"  ✓ Created placeholder: {png_path.name} ({size}x{size})")
    except Exception as e:
        Output.warning(f"Failed to create PNG variant: {e}")


def _resize_logo(img: Image.Image, target_size: int) -> Image.Image:
    """Resize logo to target size while maintaining aspect ratio"""
    # Calculate new dimensions maintaining aspect ratio
    aspect_ratio = img.width / img.height

    if img.width > img.height:
        new_width = target_size
        new_height = int(target_size / aspect_ratio)
    else:
        new_height = target_size
        new_width = int(target_size * aspect_ratio)

    # Resize image
    resized = img.resize((new_width, new_height), Image.LANCZOS)

    # Create square canvas if needed
    if new_width != new_height:
        square_img = Image.new('RGBA', (target_size, target_size), (255, 255, 255, 0))
        # Center the resized image
        x_offset = (target_size - new_width) // 2
        y_offset = (target_size - new_height) // 2
        square_img.paste(resized, (x_offset, y_offset), resized)
        return square_img

    return resized


def cmd_optimize(args):
    """Optimize images and assets for web delivery"""
    if not PIL_AVAILABLE:
        Output.error("Pillow (PIL) not installed")
        Output.info("Install with: pip install pillow")
        return

    config = Config.load()
    paths = Paths()

    Output.header("🔧 Asset Optimization")

    # Get optimization settings from config
    optimize_config = config.get('images', {}).get('processing', {})
    default_quality = optimize_config.get('quality', 75)
    auto_optimize = optimize_config.get('auto_optimize', True)

    if not auto_optimize:
        Output.warning("Auto optimization is disabled in config")
        if not Prompt.confirm("Continue with manual optimization?", default=True):
            return

    # Directories to optimize
    asset_dirs = [
        paths.public_assets / "hero",
        paths.public_assets / "workshop",
        paths.public_assets / "shop",
        paths.public_assets / "product-lokki",
        paths.public_assets / "product-m42",
    ]

    total_optimized = 0
    total_saved = 0

    for asset_dir in asset_dirs:
        if not asset_dir.exists():
            continue

        Output.progress(f"Optimizing {asset_dir.name}...")

        optimized, saved = _optimize_directory(asset_dir, default_quality)
        total_optimized += optimized
        total_saved += saved

        if optimized > 0:
            Output.info(f"  ✓ {asset_dir.name}: {optimized} files, {saved}KB saved")

    Output.success("Asset optimization complete")
    Output.info(f"Total: {total_optimized} files optimized, {total_saved}KB saved")


def _optimize_directory(dir_path: Path, quality: int) -> tuple[int, int]:
    """Optimize all images in a directory"""
    optimized_count = 0
    total_saved_kb = 0

    # Find image files
    image_extensions = ['.jpg', '.jpeg', '.png', '.webp']
    image_files = []

    for ext in image_extensions:
        image_files.extend(dir_path.glob(f"**/*{ext}"))
        image_files.extend(dir_path.glob(f"**/*{ext.upper()}"))

    for img_path in image_files:
        try:
            # Get original file size
            original_size = img_path.stat().st_size

            # Open and optimize image
            img = Image.open(img_path)

            # Convert to RGB if needed (remove alpha for JPEG, keep for PNG/WebP)
            if img_path.suffix.lower() in ['.jpg', '.jpeg']:
                if img.mode in ['RGBA', 'LA', 'P']:
                    # Create white background for transparent images
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1])
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')

            # Save with optimization
            if img_path.suffix.lower() in ['.jpg', '.jpeg']:
                img.save(img_path, 'JPEG', quality=quality, optimize=True)
            elif img_path.suffix.lower() == '.png':
                img.save(img_path, 'PNG', optimize=True)
            elif img_path.suffix.lower() == '.webp':
                img.save(img_path, 'WEBP', quality=quality, method=6)

            # Calculate savings
            new_size = img_path.stat().st_size
            saved_kb = (original_size - new_size) // 1024

            if saved_kb > 0:
                optimized_count += 1
                total_saved_kb += saved_kb

        except Exception as e:
            Output.warning(f"Failed to optimize {img_path.name}: {e}")
            continue

    return optimized_count, total_saved_kb


def cmd_info(args):
    """Show information about current assets"""
    config = Config.load()
    paths = Paths()

    Output.header("📊 Asset Information")

    # Logo information
    logo_dir = paths.root / "assets" / "logo"
    if logo_dir.exists():
        logo_files = list(logo_dir.glob("*"))
        Output.info(f"Logo files: {len(logo_files)}")
        for logo_file in logo_files:
            size = logo_file.stat().st_size
            Output.info(f"  • {logo_file.name} ({size} bytes)")

    # Asset directories
    asset_dirs = [
        ("Hero images", paths.public_assets / "hero"),
        ("Workshop images", paths.public_assets / "workshop"),
        ("Shop images", paths.public_assets / "shop"),
        ("Product images", paths.public_assets / "product-lokki"),
    ]

    total_files = 0
    total_size = 0

    for name, dir_path in asset_dirs:
        if dir_path.exists():
            files = list(dir_path.glob("**/*"))
            image_files = [f for f in files if f.suffix.lower() in ['.jpg', '.jpeg', '.png', '.webp', '.svg']]
            dir_size = sum(f.stat().st_size for f in image_files)
            total_files += len(image_files)
            total_size += dir_size

            Output.info(f"{name}: {len(image_files)} files ({dir_size // 1024}KB)")
        else:
            Output.dim(f"{name}: directory not found")

    Output.info(f"Total assets: {total_files} files ({total_size // 1024}KB)")

    # Configuration info
    optimize_config = config.get('images', {}).get('processing', {})
    quality = optimize_config.get('quality', 75)
    Output.info(f"Default optimization quality: {quality}%")
