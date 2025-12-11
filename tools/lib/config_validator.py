"""
Configuration Validation Module

Provides validation and migration tools for config.yaml
"""

import sys
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import yaml

# Add parent to path for lib imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from lib import Output


class ConfigValidator:
    """Validates and migrates Starstuck Lab configuration"""

    def __init__(self, config_path: Optional[Path] = None):
        if config_path:
            self.config_path = config_path
        else:
            # Look for config.yaml in the site root (parent of tools directory)
            tools_dir = Path(__file__).resolve().parent.parent
            site_root = tools_dir.parent
            self.config_path = site_root / "config.yaml"

    def validate_config(self, config: dict) -> Tuple[bool, List[str]]:
        """Validate configuration structure and values"""
        errors = []
        warnings = []

        # Required top-level sections
        required_sections = ['site', 'ai', 'content', 'projects', 'products', 'images', 'cli']
        for section in required_sections:
            if section not in config:
                errors.append(f"Missing required section: {section}")

        # Validate AI section
        if 'ai' in config:
            ai_config = config['ai']
            if 'provider' in ai_config:
                provider = ai_config['provider']
                if provider not in ['openai', 'together']:
                    errors.append(f"Invalid AI provider: {provider}. Must be 'openai' or 'together'")

        # Validate content section
        if 'content' in config:
            content_config = config['content']
            if 'max_variants' in content_config:
                max_variants = content_config['max_variants']
                if not isinstance(max_variants, int) or max_variants < 1:
                    errors.append("content.max_variants must be a positive integer")

        # Validate image processing settings
        if 'images' in config:
            images_config = config['images']
            if 'processing' in images_config:
                processing = images_config['processing']
                if 'quality' in processing:
                    quality = processing['quality']
                    if not isinstance(quality, int) or not (1 <= quality <= 100):
                        errors.append("images.processing.quality must be an integer between 1-100")

        # Validate CLI settings
        if 'cli' in config:
            cli_config = config['cli']
            if 'emoji' in cli_config and not isinstance(cli_config['emoji'], bool):
                warnings.append("cli.emoji should be a boolean value")

        return len(errors) == 0, errors + warnings

    def migrate_config(self, config: dict, target_version: str = "1.0") -> dict:
        """Migrate configuration to newer format"""
        migrated_config = config.copy()

        # Version-specific migrations
        if target_version == "1.0":
            # Ensure all required sections exist with defaults
            defaults = self._get_default_config()
            for section, default_values in defaults.items():
                if section not in migrated_config:
                    migrated_config[section] = default_values
                elif isinstance(default_values, dict):
                    # Merge nested defaults
                    for key, value in default_values.items():
                        if key not in migrated_config[section]:
                            migrated_config[section][key] = value

        return migrated_config

    def _get_default_config(self) -> dict:
        """Get default configuration structure"""
        return {
            'site': {
                'root': '.',
                'src': 'src',
                'public': 'public',
                'data': 'src/data'
            },
            'ai': {
                'enabled': True,
                'provider': 'openai',
                'default_model': 'gpt-5.1',
                'temperature': 0.7
            },
            'content': {
                'max_variants': 20,
                'persona_file': 'src/data/persona_preamble.txt'
            },
            'projects': {
                'default_status': 'ongoing'
            },
            'products': {
                'default_currency': 'INR',
                'default_status': 'available'
            },
            'images': {
                'default_quality': 75,
                'processing': {
                    'auto_optimize': True
                }
            },
            'cli': {
                'interactive': True,
                'confirm_destructive': True,
                'emoji': True
            }
        }

    def check_config_health(self) -> Tuple[bool, List[str]]:
        """Check overall configuration health"""
        issues = []

        try:
            if not self.config_path.exists():
                issues.append(f"Configuration file not found: {self.config_path}")
                return False, issues

            # Load and validate
            with open(self.config_path, 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)

            if not config:
                issues.append("Configuration file is empty or invalid")
                return False, issues

            # Validate structure
            valid, validation_issues = self.validate_config(config)
            issues.extend(validation_issues)

            # Check for deprecated settings
            deprecated_settings = self._find_deprecated_settings(config)
            if deprecated_settings:
                issues.extend([f"Deprecated setting: {setting}" for setting in deprecated_settings])

            return len(issues) == 0, issues

        except Exception as e:
            issues.append(f"Error reading configuration: {e}")
            return False, issues

    def _find_deprecated_settings(self, config: dict) -> List[str]:
        """Find deprecated configuration settings"""
        deprecated = []

        # Check for old AI provider settings
        if 'ai' in config and 'providers' in config['ai']:
            deprecated.append("ai.providers (use ai.provider instead)")

        # Check for old image processing structure
        if 'images' in config and 'variants' in config['images']:
            deprecated.append("images.variants (use images.shared_variants instead)")

        return deprecated

    def suggest_fixes(self, issues: List[str]) -> List[str]:
        """Suggest fixes for configuration issues"""
        suggestions = []

        for issue in issues:
            if "Missing required section" in issue:
                section = issue.split(": ")[-1]
                suggestions.append(f"Add '{section}' section to config.yaml")
            elif "Invalid AI provider" in issue:
                suggestions.append("Set ai.provider to 'openai' or 'together'")
            elif "max_variants must be" in issue:
                suggestions.append("Set content.max_variants to a positive integer")
            elif "quality must be" in issue:
                suggestions.append("Set images.processing.quality to an integer between 1-100")

        return suggestions


def cmd_validate_config(args):
    """Validate configuration file"""
    validator = ConfigValidator()

    Output.header("🔍 Configuration Validation")

    healthy, issues = validator.check_config_health()

    if healthy:
        Output.success("Configuration is valid and healthy!")
        return True
    else:
        Output.error("Configuration issues found:")
        for issue in issues:
            if "Error" in issue or "invalid" in issue.lower():
                Output.error(f"  • {issue}")
            else:
                Output.warning(f"  • {issue}")

        # Suggest fixes
        suggestions = validator.suggest_fixes(issues)
        if suggestions:
            Output.info("\nSuggested fixes:")
            for suggestion in suggestions:
                Output.info(f"  • {suggestion}")

        return False


def cmd_migrate_config(args):
    """Migrate configuration to latest format"""
    validator = ConfigValidator()

    Output.header("🔄 Configuration Migration")

    try:
        # Load current config
        with open(validator.config_path, 'r', encoding='utf-8') as f:
            config = yaml.safe_load(f) or {}

        # Migrate
        migrated = validator.migrate_config(config)

        # Save migrated config
        with open(validator.config_path, 'w', encoding='utf-8') as f:
            yaml.dump(migrated, f, default_flow_style=False, allow_unicode=True, sort_keys=False)

        Output.success("Configuration migrated successfully")
        return True

    except Exception as e:
        Output.error(f"Migration failed: {e}")
        return False


def cmd_config_health(args):
    """Check configuration health with detailed report"""
    validator = ConfigValidator()

    Output.header("🏥 Configuration Health Check")

    healthy, issues = validator.check_config_health()

    if healthy:
        Output.success("✅ All checks passed!")
        Output.info("Configuration is ready for production use.")
    else:
        Output.error("❌ Issues found that need attention:")

        errors = [i for i in issues if any(word in i.lower() for word in ['error', 'invalid', 'missing', 'failed'])]
        warnings = [i for i in issues if i not in errors]

        if errors:
            Output.error("Critical issues:")
            for error in errors:
                Output.error(f"  • {error}")

        if warnings:
            Output.warning("Warnings:")
            for warning in warnings:
                Output.warning(f"  • {warning}")

        # Auto-fix suggestions
        if getattr(args, 'fix', False):
            Output.info("\nAttempting auto-fixes...")
            # For now, just suggest migration
            Output.info("Run: cli.py config migrate")

    return healthy
