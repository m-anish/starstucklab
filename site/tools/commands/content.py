"""
Content Generation Commands

Migrated from regenerate_content.py to use the new lib structure.
Generates AI content for About page, Hero section, and other dynamic content.
"""

import sys
import json
import uuid
import datetime
import os
from pathlib import Path
from typing import Optional, Dict, List
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add parent to path for lib imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from lib import Output, Config, Paths


def cmd_regenerate(args):
    """Regenerate AI content for pages"""
    
    # Get configuration
    config = Config.load()
    paths = Paths()
    
    page = args.page.lower()
    num_variants = args.num_variants
    model_override = args.model
    max_variants = config.get('content.max_variants', 20)
    
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
    
    # Process each page
    for page_name in target_pages:
        success = _regenerate_page(
            page_name=page_name,
            num_variants=num_variants,
            max_variants=max_variants,
            persona=persona,
            client=client,
            model_override=model_override,
            paths=paths,
            config=config
        )
        
        if not success:
            Output.error(f"Failed to regenerate {page_name}")
            return False
    
    Output.success(f"Content regeneration complete")
    return True


def _regenerate_page(
    page_name: str,
    num_variants: int,
    max_variants: int,
    persona: str,
    client,
    model_override: Optional[str],
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
        
        Output.progress(f"Generating variant {key}...")
        
        for prompt_def in prompts:
            prompt_id = prompt_def.get('id', 'unknown-id')
            block = prompt_def.get('block', 'unknown-block')
            public_key = prompt_def.get('public_json_key', block)
            
            Output.dim(f"  → {prompt_id} ({block})")
            
            model = model_override or prompt_def.get('model', config.get('ai.default_model', 'gpt-4o-mini'))
            temperature = prompt_def.get('temperature', 0.7)
            seed = uuid.uuid4().hex[:8]
            
            # Build full prompt
            prompt_text = f"""
{persona}

---

Page: {page_name}
Prompt ID: {prompt_id}
Block: {block}
Variant: {key}
Seed: {seed}

{prompt_def['prompt']}

Tone: melancholic, introspective, poetic, single-human narrator.
Respond only with the content for this block.
Avoid repetition.

---
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
                page_data[public_key] = f"(generation error for {prompt_id})"
        
        # Save variant
        existing[key] = page_data
        Output.success(f"  Variant {key} complete")
    
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