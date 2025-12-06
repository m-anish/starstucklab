"""
Unified configuration loading (JSON/YAML) for Starstuck Lab CLI
"""

import json
import os
from pathlib import Path
from typing import Dict, Any, Optional

# Try to import yaml, but make it optional
try:
    import yaml
    YAML_AVAILABLE = True
except ImportError:
    YAML_AVAILABLE = False


class Config:
    """Configuration manager with validation and defaults"""
    
    _instance = None
    _config = None
    _config_path = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    @classmethod
    def load(cls, config_path: Optional[Path] = None, force_reload: bool = False) -> Dict[str, Any]:
        """
        Load configuration from file.
        
        Args:
            config_path: Optional path to config file
            force_reload: Force reload even if already cached
        
        Returns:
            Configuration dictionary
        """
        if cls._config is not None and not force_reload:
            return cls._config
        
        if config_path is None:
            config_path = cls._find_config()
        
        if config_path is None or not config_path.exists():
            # Return sensible defaults
            cls._config = cls._get_defaults()
            return cls._config
        
        # Load from file
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                if config_path.suffix in ['.yaml', '.yml']:
                    if not YAML_AVAILABLE:
                        raise ImportError("PyYAML not installed. Install with: pip install pyyaml")
                    cls._config = yaml.safe_load(f)
                else:
                    cls._config = json.load(f)
            
            cls._config_path = config_path
        
        except Exception as e:
            print(f"Warning: Failed to load config from {config_path}: {e}")
            cls._config = cls._get_defaults()
        
        # Merge with defaults to ensure all keys exist
        cls._config = cls._deep_merge(cls._get_defaults(), cls._config)
        
        return cls._config
    
    @classmethod
    def _find_config(cls) -> Optional[Path]:
        """Try to find config file in standard locations"""
        root = Path(__file__).resolve().parent.parent.parent
        
        candidates = [
            root / "config.yaml",
            root / "config.yml",
            root / "config.json",
            root / "site" / "config.yaml",
            root / "site" / "config.yml",
            root / "src" / "data" / "config.yaml",
        ]
        
        for candidate in candidates:
            if candidate.exists():
                return candidate
        
        return None
    
    @staticmethod
    def _get_defaults() -> Dict[str, Any]:
        """Default configuration values"""
        return {
            "site": {
                "root": ".",
                "src": "src",
                "public": "public",
                "data": "src/data"
            },
            "ai": {
                "enabled": True,
                "provider": "openai",
                "default_model": "gpt-4o-mini",
                "temperature": 0.7
            },
            "content": {
                "max_variants": 20,
                "persona_file": "src/data/persona_preamble.txt"
            },
            "projects": {
                "allowed_categories": ["Hardware", "Software", "Art", "Science"],
                "allowed_status": ["ongoing", "completed", "experimental", "abandoned"],
                "default_tags": []
            },
            "images": {
                "default_quality": 75,
                "default_format": "webp",
                "generation": {
                    "size": "1024x1024",
                    "model": "gpt-image-1"
                }
            },
            "cli": {
                "interactive": True,
                "confirm_destructive": True,
                "suggest_next_steps": True,
                "emoji": True
            }
        }
    
    @classmethod
    def get(cls, key_path: str, default: Any = None) -> Any:
        """
        Get nested config value using dot notation.
        
        Example:
            Config.get('ai.provider')  # Returns 'openai'
            Config.get('site.src')     # Returns 'src'
        """
        config = cls.load()
        keys = key_path.split('.')
        value = config
        
        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return default
        
        return value
    
    @classmethod
    def set(cls, key_path: str, value: Any):
        """
        Set nested config value using dot notation.
        
        Example:
            Config.set('cli.emoji', False)
        """
        config = cls.load()
        keys = key_path.split('.')
        
        current = config
        for key in keys[:-1]:
            if key not in current:
                current[key] = {}
            current = current[key]
        
        current[keys[-1]] = value
        cls._config = config
    
    @classmethod
    def save(cls, path: Optional[Path] = None):
        """Save current configuration to file"""
        if path is None:
            path = cls._config_path
        
        if path is None:
            raise ValueError("No config path specified")
        
        config = cls.load()
        
        with open(path, 'w', encoding='utf-8') as f:
            if path.suffix in ['.yaml', '.yml']:
                if not YAML_AVAILABLE:
                    raise ImportError("PyYAML not installed")
                yaml.dump(config, f, default_flow_style=False, sort_keys=False)
            else:
                json.dump(config, f, indent=2)
    
    @staticmethod
    def _deep_merge(base: Dict, override: Dict) -> Dict:
        """Deep merge two dictionaries"""
        result = base.copy()
        
        for key, value in override.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = Config._deep_merge(result[key], value)
            else:
                result[key] = value
        
        return result
    
    @classmethod
    def reset(cls):
        """Reset to defaults (useful for testing)"""
        cls._config = None
        cls._config_path = None
    
    @classmethod
    def get_path(cls) -> Optional[Path]:
        """Get the path to the loaded config file"""
        return cls._config_path
    
    @classmethod
    def is_loaded(cls) -> bool:
        """Check if config has been loaded"""
        return cls._config is not None


# Convenience functions
def get(key_path: str, default: Any = None) -> Any:
    """Shortcut for Config.get()"""
    return Config.get(key_path, default)


def set(key_path: str, value: Any):
    """Shortcut for Config.set()"""
    Config.set(key_path, value)


def load(path: Optional[Path] = None) -> Dict[str, Any]:
    """Shortcut for Config.load()"""
    return Config.load(path)