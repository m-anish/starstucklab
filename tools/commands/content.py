"""
Content Generation Commands

Migrated from regenerate_content.py to use the new lib structure.
Generates AI content for About page, Hero section, and other dynamic content.
Also handles emblem generation for About page variants.
"""

import sys
import json
import uuid
import datetime
import os
import base64
from pathlib import Path
from typing import Optional, Dict, List
from io import BytesIO
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add parent to path for lib imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from lib import Output, Config, Paths

# Try to import PIL and pytesseract for emblem generation
try:
    from PIL import Image as PILImage
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

try:
    import pytesseract
    PYTESSERACT_AVAILABLE = True
except ImportError:
    PYTESSERACT_AVAILABLE = False


def cmd_regenerate(args):
    """Regenerate AI content for pages"""
    
    # Get configuration
    config = Config.load()
    paths = Paths()
    
    page = args.page.lower()
    num_variants = args.num_variants
    model = args.model if hasattr(args, 'model') and args.model else 'gpt-5.1'
    max_variants = config.get('content.max_variants', 20)
    generate_emblems = args.generate_emblems if hasattr(args, 'generate_emblems') else True
    
    # Validate page argument
    valid_pages = ['about', 'hero', 'all']
    if page not in valid_pages:
        Output.error(f"Invalid page: {page}")
        Output.info(f"Valid pages: {', '.join(valid_pages)}")
        return False
    
    # Load persona
    persona_file = paths.persona
    if not persona_file.exists():
        Output.error(f"Persona file not found: {persona_file}")
        return False
    
    persona = persona_file.read_text(encoding='utf-8').strip()
    Output.info(f"Loaded persona: {len(persona.split())} words")
    
    # Setup OpenAI client
    try:
        from openai import OpenAI
        import os
        
        provider = args.provider if hasattr(args, 'provider') and args.provider else config.get('ai.provider', 'openai')
        
        if provider == 'together':
            api_key = os.getenv('TOGETHER_API_KEY')
            base_url = os.getenv('TOGETHER_BASE_URL')
            if not api_key or not base_url:
                Output.error("Together.ai configured but TOGETHER_API_KEY or TOGETHER_BASE_URL not set")
                return False
            client = OpenAI(api_key=api_key, base_url=base_url)
            Output.info(f"Using Together.ai endpoint")
        else:
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key:
                Output.error("OPENAI_API_KEY not set")
                return False
            client = OpenAI(api_key=api_key)
            Output.info(f"Using OpenAI endpoint")
    
    except ImportError:
        Output.error("openai package not installed")
        Output.info("Install with: pip install openai")
        return False
    
    # Determine which pages to process
    if page == 'all':
        target_pages = ['about', 'hero']
    else:
        target_pages = [page]
    
    Output.section(f"Content Regeneration")
    Output.info(f"Pages: {', '.join(target_pages)}")
    Output.info(f"Variants per page: {num_variants}")
    Output.info(f"Max variants: {max_variants}")
    Output.info(f"Model: {model}")
    
    # Process each page
    for page_name in target_pages:
        success = _regenerate_page(
            page_name=page_name,
            num_variants=num_variants,
            max_variants=max_variants,
            persona=persona,
            client=client,
            model=model,
            paths=paths,
            config=config
        )
        
        if not success:
            Output.error(f"Failed to regenerate {page_name}")
            return False
        
        # Generate emblems for about page if requested
        if page_name == 'about' and generate_emblems:
            Output.header("Generating emblems for about page")
            emblem_success = _generate_emblems_for_about(
                client=client,
                paths=paths,
                force=False
            )
            if not emblem_success:
                Output.warning("Emblem generation had errors but continuing...")
    
    Output.success(f"Content regeneration complete")
    return True


def _regenerate_page(
    page_name: str,
    num_variants: int,
    max_variants: int,
    persona: str,
    client,
    model: str,
    paths: Paths,
    config: dict
) -> bool:
    """Regenerate content for a single page"""
    
    Output.header(f"Generating {page_name.upper()} content")
    
    # Load prompts file
    prompts_file = paths.data / f"{page_name}.json"
    if not prompts_file.exists():
        Output.error(f"Prompts file not found: {prompts_file}")
        return False
    
    try:
        prompts = json.loads(prompts_file.read_text(encoding='utf-8'))
    except Exception as e:
        Output.error(f"Failed to load prompts: {e}")
        return False
    
    if not isinstance(prompts, list):
        Output.error(f"Prompts file must contain a list, got {type(prompts)}")
        return False
    
    Output.info(f"Loaded {len(prompts)} prompts")
    
    # Load existing content
    output_file = paths.public_data / f"{page_name}.json"
    if output_file.exists():
        try:
            existing = json.loads(output_file.read_text(encoding='utf-8'))
        except Exception:
            existing = {}
    else:
        existing = {}
    
    current_count = len(existing)
    
    # Calculate next variant indices (round-robin)
    indices = _next_variant_indexes(current_count, max_variants, num_variants)
    
    Output.info(f"Current variants: {current_count}")
    Output.info(f"Generating variants: {indices}")
    
    # Generate each variant
    for idx in indices:
        key = str(idx)
        page_data = {}
        has_error = False
        
        Output.progress(f"Generating variant {key}...")
        
        for prompt_def in prompts:
            prompt_id = prompt_def.get('id', 'unknown-id')
            block = prompt_def.get('block', 'unknown-block')
            public_key = prompt_def.get('public_json_key', block)
            
            Output.dim(f"  → {prompt_id} ({block})")
            
            # Use model from command line (ignore JSON model field)
            temperature = prompt_def.get('temperature', 0.7)
            seed = uuid.uuid4().hex[:8]
            
            # Build the user prompt. The persona/voice is supplied once, as the
            # system message below — it used to be injected twice per call (here
            # and as the system role) and the tone was re-stated inline.
            prompt_text = f"""Page: {page_name}
Prompt ID: {prompt_id}
Block: {block}
Variant: {key}
Seed: {seed}

{prompt_def['prompt']}

Respond only with the content for this block. Avoid repetition.
"""
            
            # Call AI
            try:
                res = client.chat.completions.create(
                    model=model,
                    temperature=temperature,
                    messages=[
                        {"role": "system", "content": persona},
                        {"role": "user", "content": prompt_text},
                    ],
                )
                text = res.choices[0].message.content.strip()
                page_data[public_key] = text
            except Exception as e:
                Output.error(f"    Generation error: {e}")
                has_error = True
                break  # Stop processing this variant
        
        # Only save variant if no errors occurred
        if not has_error:
            existing[key] = page_data
            Output.success(f"  Variant {key} complete")
        else:
            Output.error(f"  Variant {key} failed - not saving to file")
    
    # Write output file
    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_text(
        json.dumps(existing, indent=2, ensure_ascii=False),
        encoding='utf-8'
    )
    
    Output.success(f"Updated {output_file.name} with {len(existing)} total variants")
    return True


def _next_variant_indexes(existing_len: int, max_variants: int, num_new: int) -> List[int]:
    """Calculate next variant indices with round-robin rollover"""
    if existing_len < max_variants:
        # Still have room, just add to the end
        start = existing_len + 1
        return [start + i for i in range(num_new)]
    else:
        # Roll over from the beginning
        return [((i) % max_variants) + 1 for i in range(1, num_new + 1)]


def cmd_generate_emblems(args):
    """Generate emblems for about page variants"""
    
    if not PIL_AVAILABLE:
        Output.error("PIL (Pillow) not installed")
        Output.info("Install with: pip install pillow")
        return False
    
    # Get configuration
    paths = Paths()
    force = args.force if hasattr(args, 'force') else False
    
    # Setup OpenAI client
    try:
        from openai import OpenAI
        
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            Output.error("OPENAI_API_KEY not set")
            return False
        
        client = OpenAI(api_key=api_key)
        Output.info("Using OpenAI for emblem generation")
    
    except ImportError:
        Output.error("openai package not installed")
        Output.info("Install with: pip install openai")
        return False
    
    Output.section("Emblem Generation")
    
    success = _generate_emblems_for_about(
        client=client,
        paths=paths,
        force=force
    )
    
    if success:
        Output.success("Emblem generation complete")
    else:
        Output.error("Emblem generation failed")
    
    return success


def _generate_emblems_for_about(client, paths: Paths, force: bool = False) -> bool:
    """Generate emblems for all about page variants"""
    
    # Load about.json
    about_json = paths.public_data / "about.json"
    if not about_json.exists():
        Output.error(f"About content not found: {about_json}")
        Output.info("Generate content first with: cli.py content regenerate --page about")
        return False
    
    try:
        about_data = json.loads(about_json.read_text(encoding='utf-8'))
    except Exception as e:
        Output.error(f"Failed to load about.json: {e}")
        return False
    
    # Load emblem prompt template
    template_file = paths.data / "about_emblem_prompt_template.txt"
    if not template_file.exists():
        Output.warning(f"Emblem template not found: {template_file}")
        Output.info("Using built-in template")
        template = _get_default_emblem_template()
    else:
        template = template_file.read_text(encoding='utf-8')
    
    # Process each variant
    variant_keys = sorted(about_data.keys(), key=lambda x: int(x) if x.isdigit() else 0)
    
    Output.info(f"Found {len(variant_keys)} about variants")
    
    emblems_dir = paths.public_data
    success_count = 0
    skip_count = 0
    error_count = 0
    
    for key in variant_keys:
        emblem_path = emblems_dir / f"about-emblem-{key}.png"
        
        if emblem_path.exists() and not force:
            Output.dim(f"  Variant {key}: emblem exists → {emblem_path.name}")
            skip_count += 1
            continue
        
        Output.progress(f"Generating emblem for variant {key}...")
        
        variant_data = about_data[key]
        title = variant_data.get('title', '')
        lead = variant_data.get('lead', '')
        motto = variant_data.get('motto', '')
        
        # Build prompt
        prompt = template.format(title=title, lead=lead, motto=motto)
        
        # Generate emblem with retry logic for OCR
        max_retries = 3
        emblem_generated = False
        
        for attempt in range(1, max_retries + 1):
            try:
                Output.dim(f"    Attempt {attempt}/{max_retries}...")
                
                # Generate image
                result = client.images.generate(
                    model="dall-e-3",
                    prompt=prompt,
                    size="1024x1024",
                    quality="standard",
                    n=1
                )
                
                # Get image data
                image_data = _extract_image_from_response(result)
                
                # Check for text with OCR
                if PYTESSERACT_AVAILABLE and _image_has_text(image_data):
                    Output.warning(f"    OCR detected text, retrying...")
                    continue
                
                # Resize to 320x320
                img = PILImage.open(BytesIO(image_data))
                img = img.resize((320, 320), PILImage.LANCZOS)
                
                # Save
                emblems_dir.mkdir(parents=True, exist_ok=True)
                img.save(emblem_path, 'PNG')
                
                Output.success(f"  Variant {key}: emblem saved → {emblem_path.name}")
                emblem_generated = True
                success_count += 1
                break
            
            except Exception as e:
                Output.error(f"    Generation error: {e}")
                if attempt == max_retries:
                    Output.error(f"  Variant {key}: failed after {max_retries} attempts")
                    error_count += 1
        
        if not emblem_generated and attempt >= max_retries:
            error_count += 1
    
    # Summary
    Output.info(f"\nSummary: {success_count} generated, {skip_count} skipped, {error_count} failed")
    
    return error_count == 0


def _extract_image_from_response(result) -> bytes:
    """Extract image bytes from OpenAI response"""
    try:
        entry = result.data[0]
    except Exception:
        raise RuntimeError(f"Unexpected image response format")
    
    # Try b64_json first
    b64 = getattr(entry, 'b64_json', None)
    if b64:
        return base64.b64decode(b64)
    
    # Try URL
    url = getattr(entry, 'url', None)
    if url:
        import requests
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
        return resp.content
    
    raise RuntimeError("No image data in response")


def _image_has_text(image_bytes: bytes) -> bool:
    """Check if image contains text using OCR"""
    if not PYTESSERACT_AVAILABLE:
        return False
    
    try:
        img = PILImage.open(BytesIO(image_bytes))
        text = pytesseract.image_to_string(img)
        return bool(text and text.strip())
    except Exception:
        return False


def _get_default_emblem_template() -> str:
    """Built-in emblem prompt template"""
    return """Using the following About-page content, generate a single emblem concept:

Title: {title}
Lead: {lead}
Motto: {motto}

Create a small watercolor emblem or vignette that visually expresses the themes and emotions above.

STYLE REQUIREMENTS:
- Restrained Studio Ghibli watercolor aesthetic
- Muted palette: ochre, moss green, washed teal, blue-gray, soft umber
- Hand-drawn linework with slight wobble; gentle wash textures
- One simple focal object or vignette only
- Composition centered, with minimal background detail
- Objects may include: simple tools, lamps, saplings, starlight motifs, windows, notebooks, workshop elements
- Mood: quiet, melancholic, contemplative; no optimism, no drama
- CRITICAL: Absolutely no text, letters, words, or typography of any kind
- Avoid characters, animals, faces, complex scenes, machines with sharp angles

The emblem should look like a small illustration tucked into a worn notebook inside the workshop.
"""