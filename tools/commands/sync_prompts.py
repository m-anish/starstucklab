"""
Prompt Synchronization Command

Syncs prompts between Python tools and Tina CMS to maintain consistency.
"""

import sys
import json
from pathlib import Path
from typing import Dict, Any, List

# Add parent to path for lib imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from lib import Output, Config, Paths


def cmd_sync_prompts(args):
    """Sync prompts between Python and Tina systems"""
    
    paths = Paths()
    
    Output.header("🔄 Prompt Synchronization")
    
    # Paths
    tina_prompts = paths.root / "tina" / "prompts" / "product-prompts.json"
    python_prompts_dir = paths.data
    
    if not tina_prompts.exists():
        Output.error(f"Tina prompts not found: {tina_prompts}")
        return False
    
    # Load Tina prompts
    try:
        with open(tina_prompts, 'r', encoding='utf-8') as f:
            tina_data = json.load(f)
        Output.success(f"Loaded Tina prompts: {len(tina_data['templates'])} templates")
    except Exception as e:
        Output.error(f"Failed to load Tina prompts: {e}")
        return False
    
    # Sync to Python format
    Output.info("Converting to Python format...")
    
    python_format = _convert_to_python_format(tina_data)
    
    # Save Python prompts
    output_file = python_prompts_dir / "product_prompts.json"
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(python_format, f, indent=2, ensure_ascii=False)
        Output.success(f"Saved Python prompts: {output_file}")
    except Exception as e:
        Output.error(f"Failed to save Python prompts: {e}")
        return False
    
    # Validate consistency
    Output.info("Validating consistency...")
    issues = _validate_consistency(tina_data, python_format)
    
    if issues:
        Output.warning("Consistency issues found:")
        for issue in issues:
            Output.warning(f"  • {issue}")
    else:
        Output.success("✓ All prompts are consistent")
    
    # Summary
    Output.header("Summary")
    Output.info(f"Tina templates: {len(tina_data['templates'])}")
    Output.info(f"Python prompts: {len(python_format.get('prompts', []))}")
    Output.info(f"Synced to: {output_file}")
    
    return True


def _convert_to_python_format(tina_data: Dict[str, Any]) -> Dict[str, Any]:
    """Convert Tina prompt format to Python format"""
    
    python_format = {
        "meta": tina_data["meta"],
        "persona": tina_data["persona"],
        "prompts": []
    }
    
    # Convert each template to Python prompt format
    for template_id, template in tina_data["templates"].items():
        python_prompt = {
            "id": template_id,
            "block": template_id.replace("product_", ""),
            "public_json_key": template_id.replace("product_", ""),
            "description": template["description"],
            "prompt": template["prompt"],
            "temperature": template["options"].get("temperature", 0.7),
            "max_tokens": template["options"].get("maxTokens", 500),
            "variables": template["variables"]
        }
        
        python_format["prompts"].append(python_prompt)
    
    return python_format


def _validate_consistency(tina_data: Dict[str, Any], python_data: Dict[str, Any]) -> List[str]:
    """Validate that prompts are consistent between systems"""
    
    issues = []
    
    # Check template count
    tina_count = len(tina_data["templates"])
    python_count = len(python_data.get("prompts", []))
    
    if tina_count != python_count:
        issues.append(f"Template count mismatch: Tina={tina_count}, Python={python_count}")
    
    # Check each template
    for template_id, template in tina_data["templates"].items():
        # Find corresponding Python prompt
        python_prompt = next(
            (p for p in python_data.get("prompts", []) if p["id"] == template_id),
            None
        )
        
        if not python_prompt:
            issues.append(f"Template '{template_id}' exists in Tina but not in Python")
            continue
        
        # Check prompt text consistency
        if template["prompt"] != python_prompt["prompt"]:
            issues.append(f"Template '{template_id}' has different prompt text")
        
        # Check options consistency
        if template["options"].get("temperature") != python_prompt.get("temperature"):
            issues.append(f"Template '{template_id}' has different temperature")
        
        if template["options"].get("maxTokens") != python_prompt.get("max_tokens"):
            issues.append(f"Template '{template_id}' has different max_tokens")
    
    return issues


def cmd_export_prompts(args):
    """Export prompts to various formats"""
    
    paths = Paths()
    tina_prompts = paths.root / "tina" / "prompts" / "product-prompts.json"
    
    if not tina_prompts.exists():
        Output.error(f"Tina prompts not found: {tina_prompts}")
        return False
    
    Output.header("📤 Export Prompts")
    
    # Load prompts
    with open(tina_prompts, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Export formats
    format_choice = args.format if hasattr(args, 'format') else 'markdown'
    
    if format_choice == 'markdown':
        _export_markdown(data, paths)
    elif format_choice == 'csv':
        _export_csv(data, paths)
    elif format_choice == 'yaml':
        _export_yaml(data, paths)
    else:
        Output.error(f"Unknown format: {format_choice}")
        return False
    
    return True


def _export_markdown(data: Dict[str, Any], paths: Paths):
    """Export prompts to markdown documentation"""
    
    output_file = paths.root / "docs" / "prompts.md"
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    lines = [
        "# Product Prompt Templates",
        "",
        f"**Version:** {data['meta']['version']}",
        f"**Last Updated:** {data['meta']['last_updated']}",
        "",
        "## Persona",
        "",
        f"**Name:** {data['persona']['name']}",
        f"**Description:** {data['persona']['description']}",
        "",
        "## Templates",
        ""
    ]
    
    for template_id, template in data["templates"].items():
        lines.extend([
            f"### {template_id}",
            "",
            f"**Description:** {template['description']}",
            "",
            "**Variables:**",
            ""
        ])
        
        for var in template["variables"]:
            lines.append(f"- `{var}`")
        
        lines.extend([
            "",
            "**Options:**",
            "",
            f"- Temperature: {template['options']['temperature']}",
            f"- Max Tokens: {template['options']['maxTokens']}",
            "",
            "**Prompt:**",
            "",
            "```",
            template["prompt"],
            "```",
            "",
            "---",
            ""
        ])
    
    output_file.write_text('\n'.join(lines), encoding='utf-8')
    Output.success(f"Exported markdown: {output_file}")


def _export_csv(data: Dict[str, Any], paths: Paths):
    """Export prompts to CSV for spreadsheet analysis"""
    
    import csv
    
    output_file = paths.root / "docs" / "prompts.csv"
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            'Template ID',
            'Description',
            'Variables',
            'Temperature',
            'Max Tokens',
            'Prompt'
        ])
        
        for template_id, template in data["templates"].items():
            writer.writerow([
                template_id,
                template['description'],
                ', '.join(template['variables']),
                template['options']['temperature'],
                template['options']['maxTokens'],
                template['prompt']
            ])
    
    Output.success(f"Exported CSV: {output_file}")


def _export_yaml(data: Dict[str, Any], paths: Paths):
    """Export prompts to YAML format"""
    
    try:
        import yaml
    except ImportError:
        Output.error("PyYAML not installed")
        Output.info("Install with: pip install pyyaml")
        return
    
    output_file = paths.root / "tina" / "prompts" / "product-prompts.yaml"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        yaml.dump(data, f, default_flow_style=False, allow_unicode=True, sort_keys=False)
    
    Output.success(f"Exported YAML: {output_file}")


def cmd_import_prompts(args):
    """Import prompts from external source"""
    
    paths = Paths()
    source_file = Path(args.source) if hasattr(args, 'source') else None
    
    if not source_file or not source_file.exists():
        Output.error(f"Source file not found: {source_file}")
        return False
    
    Output.header("📥 Import Prompts")
    Output.info(f"Source: {source_file}")
    
    # Load source
    try:
        with open(source_file, 'r', encoding='utf-8') as f:
            if source_file.suffix == '.json':
                source_data = json.load(f)
            elif source_file.suffix in ['.yaml', '.yml']:
                import yaml
                source_data = yaml.safe_load(f)
            else:
                Output.error(f"Unsupported format: {source_file.suffix}")
                return False
    except Exception as e:
        Output.error(f"Failed to load source: {e}")
        return False
    
    # Validate structure
    if not _validate_prompt_structure(source_data):
        Output.error("Invalid prompt structure")
        return False
    
    # Merge with existing
    tina_prompts = paths.root / "tina" / "prompts" / "product-prompts.json"
    
    if tina_prompts.exists():
        Output.warning("Existing prompts will be backed up")
        backup_file = tina_prompts.with_suffix('.json.bak')
        backup_file.write_text(tina_prompts.read_text(encoding='utf-8'), encoding='utf-8')
        Output.info(f"Backup: {backup_file}")
    
    # Write new prompts
    with open(tina_prompts, 'w', encoding='utf-8') as f:
        json.dump(source_data, f, indent=2, ensure_ascii=False)
    
    Output.success(f"Imported prompts: {tina_prompts}")
    
    return True


def _validate_prompt_structure(data: Dict[str, Any]) -> bool:
    """Validate prompt file structure"""
    
    required_keys = ['meta', 'persona', 'templates']
    
    for key in required_keys:
        if key not in data:
            Output.error(f"Missing required key: {key}")
            return False
    
    # Validate templates
    for template_id, template in data["templates"].items():
        required_template_keys = ['id', 'description', 'prompt', 'variables', 'options']
        for key in required_template_keys:
            if key not in template:
                Output.error(f"Template '{template_id}' missing key: {key}")
                return False
    
    return True