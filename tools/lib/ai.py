"""
AI Module for Starstuck Lab CLI

Centralized AI functionality for text generation, image generation, and API management.
Handles OpenAI integration, dotenv loading, and provides consistent interfaces.
"""

import os
import sys
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


class AIClient:
    """Centralized AI client for all OpenAI operations"""

    def __init__(self, provider: str = "openai"):
        self.provider = provider
        self.client = None
        self._setup_client()

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
                     model: str = "gpt-4o-mini",
                     temperature: float = 0.7,
                     max_tokens: int = 500) -> str:
        """Generate text using the configured AI model"""

        response = self.client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            max_tokens=max_tokens
        )

        return response.choices[0].message.content.strip()

    def generate_image(self,
                      prompt: str,
                      size: str = "1792x1024",
                      quality: str = "standard") -> Dict[str, Any]:
        """Generate an image using DALL-E"""

        if self.provider != "openai":
            raise ValueError("Image generation only supported with OpenAI provider")

        response = self.client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size=size,
            quality=quality,
            n=1
        )

        return {
            "url": response.data[0].url,
            "revised_prompt": getattr(response.data[0], 'revised_prompt', prompt)
        }


class AIHelper:
    """Helper functions for common AI operations"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.ai_config = config.get('ai', {})
        self.client = None

    def get_client(self) -> AIClient:
        """Get or create AI client"""
        if self.client is None:
            provider = self.ai_config.get('provider', 'openai')
            self.client = AIClient(provider=provider)
        return self.client

    def generate_content(self,
                        content_type: str,
                        context: Dict[str, Any],
                        page: str = None) -> Optional[str]:
        """Generate content using configured prompts"""

        # Get prompts from config
        prompts_config = self.config.get('content', {}).get('prompts', {})
        page_prompts = prompts_config.get(page or content_type, [])

        if not page_prompts:
            return None

        # Find the right prompt by content type
        prompt_config = None
        for p in page_prompts:
            if p.get('block') == content_type or p.get('id') == content_type:
                prompt_config = p
                break

        if not prompt_config:
            return None

        # Build prompt with context
        prompt = prompt_config['prompt']
        for key, value in context.items():
            prompt = prompt.replace(f"{{{{{key}}}", value)

        # Generate content
        client = self.get_client()
        return client.generate_text(
            prompt=prompt,
            temperature=prompt_config.get('temperature', 0.7),
            max_tokens=500
        )

    def generate_product_content(self,
                               product_data: Dict[str, Any],
                               template_key: str = "_default") -> Optional[str]:
        """Generate product content using templates"""

        templates = self.config.get('products', {}).get('ai_templates', {})
        template = templates.get(template_key, templates.get('_default', {}))

        if not template:
            return None

        # Build prompt
        prompt = template['prompt'].format(
            title=product_data.get('title', ''),
            excerpt=product_data.get('excerpt', '')
        )

        # Generate content
        client = self.get_client()
        return client.generate_text(
            prompt=prompt,
            temperature=template.get('temperature', 0.7),
            max_tokens=200
        )

    def generate_product_image(self,
                              prompt: str,
                              product_data: Dict[str, Any],
                              image_type: str = "photo") -> Optional[Dict[str, Any]]:
        """Generate product image with contextual enhancement"""

        # Enhance prompt based on image type and product data
        type_enhancements = {
            "photo": "Professional product photography, clean white background, well-lit, commercial product shot, high quality",
            "illustration": "Digital illustration, clean design, product visualization, modern aesthetic",
            "diagram": "Technical diagram, exploded view, clear labeling, educational illustration",
            "lifestyle": "Lifestyle photography, contextual use, natural setting, aspirational imagery"
        }

        enhanced_prompt = f"{prompt}. {type_enhancements.get(image_type, '')}"

        # Add product context
        product_context = f"Product: {product_data.get('title', '')}. "
        if product_data.get('tags'):
            product_context += f"Category: {', '.join(product_data['tags'])}. "

        full_prompt = product_context + enhanced_prompt

        # Generate image
        client = self.get_client()
        return client.generate_image(
            prompt=full_prompt,
            size="1792x1024",  # Wide format for products
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