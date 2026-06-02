"""
AI Module for Starstuck Lab CLI - REFACTORED WITH PROMPT TEMPLATES

Centralized AI functionality using unified prompt templates.
Now loads prompts from product_prompts.json for consistency with Tina CMS.
"""

import os
import sys
import json
from pathlib import Path
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

# Load environment variables from site/.env
site_root = Path(__file__).resolve().parent.parent.parent
env_file = site_root / ".env"
load_dotenv(env_file)

# Try to import OpenAI
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    OpenAI = None


class PromptTemplateManager:
    """Manages prompt templates loaded from product_prompts.json"""
    
    def __init__(self, prompts_file: Path):
        self.prompts_file = prompts_file
        self.prompts_data = None
        self._load_prompts()
    
    def _load_prompts(self):
        """Load prompts from JSON file"""
        if not self.prompts_file.exists():
            raise FileNotFoundError(f"Prompts file not found: {self.prompts_file}")
        
        with open(self.prompts_file, 'r', encoding='utf-8') as f:
            self.prompts_data = json.load(f)
    
    def get_template(self, template_id: str) -> Optional[Dict[str, Any]]:
        """Get a prompt template by ID"""
        if not self.prompts_data:
            return None
        
        # Search in prompts list
        for prompt in self.prompts_data.get('prompts', []):
            if prompt.get('id') == template_id:
                return prompt
        
        return None
    
    def build_prompt(self, template_id: str, context: Dict[str, Any]) -> Optional[str]:
        """Build a prompt from template with variable substitution"""
        template = self.get_template(template_id)
        if not template:
            return None
        
        prompt = template['prompt']
        
        # Replace variables in prompt
        for variable in template.get('variables', []):
            value = context.get(variable, '')
            
            # If variable not in context, try variable builders
            if not value and variable in self.prompts_data.get('variable_builders', {}):
                value = self._build_variable(variable, context)
            
            # Replace {variable} placeholders
            prompt = prompt.replace(f'{{{variable}}}', str(value))
        
        return prompt
    
    def _build_variable(self, variable_name: str, context: Dict[str, Any]) -> str:
        """Build a variable using variable builder logic"""
        builders = self.prompts_data.get('variable_builders', {})
        builder = builders.get(variable_name)
        
        if not builder:
            return ''
        
        # Handle direct value
        if 'value' in builder:
            return builder['value']
        
        # Handle mapping
        if 'mapping' in builder:
            # Get the key from context (remove _clause suffix)
            key = context.get(variable_name.replace('_clause', ''), 'default')
            return builder['mapping'].get(key, builder['mapping'].get('default', ''))
        
        # Handle logic-based builders (simplified Python evaluation)
        if 'logic' in builder:
            return self._evaluate_logic(builder['logic'], context)
        
        return ''
    
    def _evaluate_logic(self, logic: str, context: Dict[str, Any]) -> str:
        """Evaluate simple logic expressions for variable builders"""
        # Pattern: if X: return f"text {X}" else: return ""
        import re
        
        # Simple if-else pattern
        if_match = re.match(r'if\s+(\w+):\s+return\s+f?"(.+?)"\s+else:\s+return\s+f?"(.*)"', logic)
        if if_match:
            var_name, truthy_value, falsy_value = if_match.groups()
            value = context.get(var_name)
            if value:
                # Replace {var} placeholders
                return truthy_value.format(**context)
            return falsy_value
        
        # Pattern: if X: return "text" + "\n".join(...)
        if 'join' in logic and 'if' in logic:
            # Extract variable name
            var_match = re.search(r'if\s+(\w+):', logic)
            if var_match:
                var_name = var_match.group(1)
                value = context.get(var_name)
                
                if value and isinstance(value, list):
                    # Determine what to join based on logic
                    if 'f.title' in logic:
                        return '\n'.join([f"- {item.get('title', '')}: {item.get('description', '')}" 
                                        for item in value])
                    elif 's.label' in logic:
                        return '\n'.join([f"- {item.get('label', '')}: {item.get('value', '')}" 
                                        for item in value])
        
        return ''
    
    def get_persona(self) -> str:
        """Get the canonical brand voice.

        Loads the full persona preamble (src/data/persona_preamble.txt), which
        lives next to the prompts file — this is the single source of truth for
        the voice. Falls back to the short description in product_prompts.json
        only if the preamble file is missing.
        """
        persona_file = self.prompts_file.parent / "persona_preamble.txt"
        if persona_file.exists():
            try:
                return persona_file.read_text(encoding="utf-8").strip()
            except OSError:
                pass
        if self.prompts_data:
            return self.prompts_data.get('persona', {}).get('description', '')
        return ''
    
    def get_options(self, template_id: str) -> Dict[str, Any]:
        """Get generation options for a template"""
        template = self.get_template(template_id)
        if not template:
            return {}
        
        return {
            'temperature': template.get('temperature', 0.7),
            'max_tokens': template.get('max_tokens', 500)
        }


class AIClient:
    """Centralized AI client for all OpenAI operations"""

    def __init__(self, provider: str = "openai", prompts_file: Optional[Path] = None):
        self.provider = provider
        self.client = None
        self._setup_client()
        
        # Load prompt templates if file provided
        self.prompt_manager = None
        if prompts_file:
            self.prompt_manager = PromptTemplateManager(prompts_file)

    def _setup_client(self):
        """Setup the AI client based on provider and environment"""
        if not OPENAI_AVAILABLE:
            raise ImportError("OpenAI package not available. Install with: pip install openai")

        if self.provider == "openai":
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key:
                raise ValueError("OPENAI_API_KEY not set in .env file")

            self.client = OpenAI(api_key=api_key)

        elif self.provider == "together":
            api_key = os.getenv('TOGETHER_API_KEY')
            base_url = os.getenv('TOGETHER_BASE_URL')
            if not api_key or not base_url:
                raise ValueError("TOGETHER_API_KEY and TOGETHER_BASE_URL required for Together.ai")

            self.client = OpenAI(api_key=api_key, base_url=base_url)
        else:
            raise ValueError(f"Unsupported AI provider: {self.provider}")

    def generate_text(self,
                     prompt: str,
                     system_prompt: Optional[str] = None,
                     model: str = "gpt-5.1",
                     temperature: float = None,
                     max_tokens: int = 500) -> str:
        """Generate text via OpenAI chat completions.

        Uses `max_completion_tokens` (gpt-5.x rejects the legacy `max_tokens`).
        `temperature` is kept for backwards compatibility but is NOT sent —
        gpt-5.x only accepts the default temperature.
        """
        messages = []

        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        messages.append({"role": "user", "content": prompt})

        response = self.client.chat.completions.create(
            model=model,
            messages=messages,
            max_completion_tokens=max_tokens,
        )

        return response.choices[0].message.content.strip()
    
    def generate_with_template(self,
                              template_id: str,
                              context: Dict[str, Any],
                              model: str = "gpt-5.1") -> str:
        """Generate text using a prompt template"""
        if not self.prompt_manager:
            raise ValueError("No prompt manager configured. Provide prompts_file to AIClient.")
        
        # Build prompt from template
        prompt = self.prompt_manager.build_prompt(template_id, context)
        if not prompt:
            raise ValueError(f"Template not found: {template_id}")
        
        # Get options from template
        options = self.prompt_manager.get_options(template_id)
        
        # Get persona as system prompt
        system_prompt = self.prompt_manager.get_persona()
        
        # Generate
        return self.generate_text(
            prompt=prompt,
            system_prompt=system_prompt,
            model=model,
            temperature=options.get('temperature', 0.7),
            max_tokens=options.get('max_tokens', 500)
        )

    def generate_image(self,
                      prompt: str,
                      size: str = "1024x1024",
                      quality: str = "low") -> Dict[str, Any]:
        """Generate an image with OpenAI gpt-image-1.

        gpt-image-1 returns base64 (no URL). size ∈ 1024x1024 | 1536x1024 |
        1024x1536 | auto; quality ∈ low | medium | high | auto.
        Returns {"b64": <base64 png>, "url": None, "revised_prompt": prompt}.
        """
        if self.provider != "openai":
            raise ValueError("Image generation only supported with OpenAI provider")

        response = self.client.images.generate(
            model="gpt-image-1",
            prompt=prompt,
            size=size,
            quality=quality,
            n=1,
        )

        return {
            "b64": response.data[0].b64_json,
            "url": None,
            "revised_prompt": getattr(response.data[0], "revised_prompt", prompt),
        }


class AIHelper:
    """Helper functions for common AI operations with template support"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.ai_config = config.get('ai', {})
        self.client = None
        self.prompt_manager = None
        
        # Load prompt templates
        self._load_prompts()
    
    def _load_prompts(self):
        """Load prompt templates from data directory"""
        from .paths import Paths
        paths = Paths()
        
        prompts_file = paths.data / "product_prompts.json"
        if prompts_file.exists():
            try:
                self.prompt_manager = PromptTemplateManager(prompts_file)
            except Exception as e:
                print(f"Warning: Failed to load prompt templates: {e}")

    def get_client(self) -> AIClient:
        """Get or create AI client with prompt manager"""
        if self.client is None:
            provider = self.ai_config.get('provider', 'openai')
            
            # Get prompts file
            from .paths import Paths
            paths = Paths()
            prompts_file = paths.data / "product_prompts.json"
            
            self.client = AIClient(
                provider=provider,
                prompts_file=prompts_file if prompts_file.exists() else None
            )
        return self.client

    def generate_product_content(self,
                                product_data: Dict[str, Any],
                                template_id: str = "product_excerpt") -> Optional[str]:
        """Generate product content using templates"""
        
        client = self.get_client()
        
        # Build context from product data
        context = {
            'title': product_data.get('title', ''),
            'category': product_data.get('category', ''),
            'category_clause': f", a {product_data.get('category')}" if product_data.get('category') else '',
            'excerpt': product_data.get('excerpt', ''),
            'description': product_data.get('excerpt', ''),
            'description_clause': f"\nDescription: {product_data.get('excerpt')}\n" if product_data.get('excerpt') else ''
        }
        
        try:
            return client.generate_with_template(template_id, context)
        except Exception as e:
            print(f"Warning: Template generation failed, falling back to basic generation: {e}")
            # Fallback to basic generation
            return self._generate_basic_content(product_data)
    
    def _generate_basic_content(self, product_data: Dict[str, Any]) -> str:
        """Fallback: Basic content generation without templates"""
        client = self.get_client()
        
        title = product_data.get('title', '')
        category = product_data.get('category', '')
        
        prompt = f"Generate a one-sentence product excerpt for '{title}'"
        if category:
            prompt += f", a {category}"
        prompt += ". Make it poetic and intriguing with dry humor."
        
        return client.generate_text(
            prompt=prompt,
            system_prompt="You are a creative writer for Starstuck Lab.",
            temperature=0.8,
            max_tokens=100
        )

    def generate_product_features(self,
                                  product_data: Dict[str, Any]) -> Optional[List[Dict[str, str]]]:
        """Generate product features using template"""
        
        client = self.get_client()
        
        # Build context
        context = {
            'title': product_data.get('title', ''),
            'category': product_data.get('category', ''),
            'category_clause': f", a {product_data.get('category')}" if product_data.get('category') else '',
            'description_clause': f"\nProduct description: {product_data.get('excerpt', '')}\n" if product_data.get('excerpt') else '',
            'icon_list': 'telescope, palette, alert-triangle, cog, zap, box, cpu, settings, shield, star, circle-dot, gauge'
        }
        
        try:
            result = client.generate_with_template('product_features', context)
            
            # Parse JSON response
            import re
            clean_result = re.sub(r'```json\n?', '', result)
            clean_result = re.sub(r'```\n?', '', clean_result).strip()
            
            features = json.loads(clean_result)
            return features
        except Exception as e:
            print(f"Warning: Feature generation failed: {e}")
            return None

    def generate_product_tags(self,
                            product_data: Dict[str, Any],
                            max_tags: int = 5) -> Optional[List[str]]:
        """Generate product tags using template"""
        
        client = self.get_client()
        
        # Build context
        context = {
            'max_tags': max_tags,
            'title': product_data.get('title', ''),
            'category': product_data.get('category', 'product'),
            'description_clause': f"\nDescription: {product_data.get('excerpt', '')}\n" if product_data.get('excerpt') else ''
        }
        
        try:
            result = client.generate_with_template('product_tags', context)
            
            # Parse comma-separated tags
            tags = [tag.strip() for tag in result.split(',') if tag.strip()]
            return tags[:max_tags]
        except Exception as e:
            print(f"Warning: Tag generation failed: {e}")
            return None

    def generate_product_specifications(self,
                                       product_data: Dict[str, Any]) -> Optional[List[Dict[str, str]]]:
        """Generate product specifications using template"""
        
        client = self.get_client()
        
        # Build context
        context = {
            'title': product_data.get('title', ''),
            'category': product_data.get('category', 'product'),
            'description_clause': f"\nDescription: {product_data.get('excerpt', '')}\n" if product_data.get('excerpt') else ''
        }
        
        try:
            result = client.generate_with_template('product_specifications', context)
            
            # Parse JSON response
            import re
            clean_result = re.sub(r'```json\n?', '', result)
            clean_result = re.sub(r'```\n?', '', clean_result).strip()
            
            specs = json.loads(clean_result)
            return specs
        except Exception as e:
            print(f"Warning: Specification generation failed: {e}")
            return None

    def generate_product_image(self,
                              prompt: str,
                              product_data: Dict[str, Any],
                              image_type: str = "photo") -> Optional[Dict[str, Any]]:
        """Generate product image with template-based enhancement"""
        
        client = self.get_client()
        
        # Build context for template
        context = {
            'title': product_data.get('title', ''),
            'category': product_data.get('category', 'scientific instrument'),
            'style_enhancement': ''  # Will be filled by variable builder
        }
        
        # Try to use template
        if self.prompt_manager:
            try:
                enhanced_prompt = self.prompt_manager.build_prompt('product_image', context)
                if enhanced_prompt:
                    prompt = enhanced_prompt
            except Exception as e:
                print(f"Warning: Could not use image template: {e}")
        
        # Generate image
        return client.generate_image(
            prompt=prompt,
            size="1792x1024",
            quality="standard"
        )


# Convenience functions for backward compatibility
def get_ai_client(provider: str = "openai") -> AIClient:
    """Get an AI client instance"""
    return AIClient(provider=provider)


def generate_text(prompt: str,
                 model: str = "gpt-4o-mini",
                 temperature: float = 0.7,
                 provider: str = "openai") -> str:
    """Quick text generation function"""
    client = AIClient(provider=provider)
    return client.generate_text(prompt=prompt, model=model, temperature=temperature)


def generate_image(prompt: str,
                  size: str = "1792x1024",
                  quality: str = "standard",
                  provider: str = "openai") -> Dict[str, Any]:
    """Quick image generation function"""
    client = AIClient(provider=provider)
    return client.generate_image(prompt=prompt, size=size, quality=quality)