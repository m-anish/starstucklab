#!/usr/bin/env python3
"""
Starstuck Lab - Unified CLI
============================

UPDATED: Added prompts command for template management
"""

import sys
import argparse
from pathlib import Path

# Add lib to path
sys.path.insert(0, str(Path(__file__).parent))

from lib import Output, Style, Config, Paths, Prompt


def main():
    """Main CLI entry point"""
    
    parser = argparse.ArgumentParser(
        description="🌟 Starstuck Lab Site Manager",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s prompts sync                 # Sync prompts from Tina to Python
  %(prog)s prompts export --format md   # Export to markdown
  %(prog)s projects list                # List all projects
  %(prog)s products create              # Create product (interactive)
        """
    )
    
    # Global flags
    parser.add_argument('--no-emoji', action='store_true', 
                       help='Disable emoji output')
    parser.add_argument('--config', type=Path,
                       help='Path to config file')
    
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # ===== PROMPTS ===== (NEW SECTION)
    prompts_parser = subparsers.add_parser('prompts', 
                                           help='Manage AI prompt templates')
    prompts_sub = prompts_parser.add_subparsers(dest='subcommand')

    prompts_sub.add_parser('sync', 
                          help='Sync prompts from Tina to Python')

    export_parser = prompts_sub.add_parser('export', 
                                          help='Export prompts to documentation')
    export_parser.add_argument('--format', 
                              choices=['markdown', 'csv', 'yaml'],
                              default='markdown',
                              help='Export format')

    import_parser = prompts_sub.add_parser('import', 
                                          help='Import prompts from external file')
    import_parser.add_argument('--source', 
                              type=Path,
                              required=True,
                              help='Source file path')

    prompts_sub.add_parser('validate', 
                          help='Validate prompt consistency')
    
    # ===== PROJECTS =====
    projects_parser = subparsers.add_parser('projects', help='Manage projects')
    projects_sub = projects_parser.add_subparsers(dest='subcommand')
    
    projects_sub.add_parser('list', help='List all projects')
    
    create_parser = projects_sub.add_parser('create', help='Create new project')
    create_parser.add_argument('title', nargs='?', help='Project title')
    create_parser.add_argument('--category', help='Project category')
    create_parser.add_argument('--status', help='Project status')
    create_parser.add_argument('--tags', help='Comma-separated tags')
    create_parser.add_argument('--ai', action='store_true', 
                              help='Generate content with AI')
    create_parser.add_argument('--no-interactive', action='store_true',
                              help='Disable interactive mode')
    
    edit_parser = projects_sub.add_parser('edit', help='Edit a project')
    edit_parser.add_argument('slug', help='Project slug')
    
    delete_parser = projects_sub.add_parser('delete', help='Delete a project')
    delete_parser.add_argument('slug', help='Project slug')
    delete_parser.add_argument('--force', action='store_true',
                              help='Skip confirmation')
    
    info_parser = projects_sub.add_parser('info', help='Show project info')
    info_parser.add_argument('slug', help='Project slug')
    
    projects_sub.add_parser('rebuild-index', help='Rebuild project index')
    
    # ===== CONTENT =====
    content_parser = subparsers.add_parser('content', help='Manage content')
    content_sub = content_parser.add_subparsers(dest='subcommand')

    regen_parser = content_sub.add_parser('regenerate', 
                                        help='Regenerate AI content')
    regen_parser.add_argument('--page', default='all', 
                            help='Page to regenerate (about, hero, all)')
    regen_parser.add_argument('--num-variants', type=int, default=5,
                            help='Number of variants to generate')
    regen_parser.add_argument('--model', help='AI model (default: gpt-4o-mini)')
    regen_parser.add_argument('--provider', choices=['openai', 'together'],
                            help='AI provider')
    regen_parser.add_argument('--no-emblems', action='store_true',
                            help='Skip emblem generation for about page')

    emblem_parser = content_sub.add_parser('generate-emblems',
                                        help='Generate emblems for about page')
    emblem_parser.add_argument('--force', action='store_true',
                            help='Regenerate existing emblems')
    
    # ===== PRODUCTS =====
    products_parser = subparsers.add_parser('products', help='Manage products')
    products_sub = products_parser.add_subparsers(dest='subcommand')
    
    products_sub.add_parser('list', help='List all products')

    products_sub.add_parser('create', help='Create new product interactively')

    gen_products = products_sub.add_parser('generate',
                                           help='Generate product content')
    gen_products.add_argument('--product', help='Single product slug')
    gen_products.add_argument('--use-ai', action='store_true',
                             help='Use AI for generation')

    gen_images = products_sub.add_parser('images',
                                        help='Generate AI images for products')
    gen_images.add_argument('--product', required=True, help='Product slug')
    gen_images.add_argument('--non-interactive', action='store_true',
                           help='Run in non-interactive mode for API calls')
    gen_images.add_argument('--api', action='store_true',
                           help='API mode (same as --non-interactive)')
    
    # ===== IMAGES =====
    images_parser = subparsers.add_parser('images', help='Process images')
    images_sub = images_parser.add_subparsers(dest='subcommand')

    process_images = images_sub.add_parser('process', help='Process all images')
    process_images.add_argument('--force', action='store_true',
                               help='Regenerate existing images')
    process_images.add_argument('--generate', action='store_true',
                               help='Run generation step')
    process_images.add_argument('--upscale', action='store_true',
                               help='Run upscale step')

    # ===== ASSETS =====
    assets_parser = subparsers.add_parser('assets', help='Manage site assets')
    assets_sub = assets_parser.add_subparsers(dest='subcommand')

    assets_sub.add_parser('logos', help='Generate logo variants')
    assets_sub.add_parser('optimize', help='Optimize images and assets')
    assets_sub.add_parser('info', help='Show asset information')

    # ===== SITE =====
    site_parser = subparsers.add_parser('site', help='Site configuration')
    site_sub = site_parser.add_subparsers(dest='subcommand')
    
    # Navigation
    nav_parser = site_sub.add_parser('nav', help='Navigation management')
    nav_sub = nav_parser.add_subparsers(dest='nav_action')
    nav_sub.add_parser('list', help='List navigation items')

    nav_add = nav_sub.add_parser('add', help='Add navigation item')
    nav_add.add_argument('label', help='Link label')
    nav_add.add_argument('href', help='Link URL')
    nav_add.add_argument('--priority', type=int, help='Sort priority')

    nav_remove = nav_sub.add_parser('remove', help='Remove navigation item')
    nav_remove.add_argument('label', help='Link label')

    nav_sub.add_parser('reorder', help='Interactively reorder navigation')
    
    # Footer
    footer_parser = site_sub.add_parser('footer', help='Footer management')
    footer_sub = footer_parser.add_subparsers(dest='footer_action')
    footer_sub.add_parser('sections', help='List footer sections')

    footer_list = footer_sub.add_parser('list', help='List footer links')
    footer_list.add_argument('section', nargs='?', help='Section to list (optional)')

    footer_add = footer_sub.add_parser('add', help='Add footer link')
    footer_add.add_argument('section', help='Footer section')
    footer_add.add_argument('label', help='Link label')
    footer_add.add_argument('href', help='Link URL')
    footer_add.add_argument('--order', type=int, help='Link order')

    footer_remove = footer_sub.add_parser('remove', help='Remove footer link')
    footer_remove.add_argument('section', help='Footer section')
    footer_remove.add_argument('label', help='Link label')
    
    # Pages
    pages_parser = site_sub.add_parser('pages', help='Page management')
    pages_sub = pages_parser.add_subparsers(dest='pages_action')
    pages_sub.add_parser('list', help='List all pages')
    
    pages_create = pages_sub.add_parser('create', help='Create new page')
    pages_create.add_argument('name', help='Page name')
    pages_create.add_argument('--layout', default='standard', help='Layout template')
    
    # ===== CONFIG =====
    config_parser = subparsers.add_parser('config', help='Configuration management')
    config_sub = config_parser.add_subparsers(dest='config_action')

    config_sub.add_parser('validate', help='Validate configuration file')
    config_sub.add_parser('migrate', help='Migrate configuration to latest format')

    health_parser = config_sub.add_parser('health', help='Check configuration health')
    health_parser.add_argument('--fix', action='store_true',
                              help='Auto-fix issues where possible')

    # ===== CHECK =====
    check_parser = subparsers.add_parser('check', help='Run site health check')
    check_parser.add_argument('--fix', action='store_true',
                             help='Auto-fix issues where possible')
    
    # Parse arguments
    args = parser.parse_args()
    
    # Configure output
    if args.no_emoji:
        Output.set_emoji(False)
    
    # Load config
    if args.config:
        Config.load(args.config)
    else:
        Config.load()
    
    # Route to appropriate handler
    if not args.command:
        interactive_mode()
        return
    
    if args.command == 'prompts':
        handle_prompts(args)
    elif args.command == 'projects':
        handle_projects(args)
    elif args.command == 'content':
        handle_content(args)
    elif args.command == 'products':
        handle_products(args)
    elif args.command == 'images':
        handle_images(args)
    elif args.command == 'assets':
        handle_assets(args)
    elif args.command == 'site':
        handle_site(args)
    elif args.command == 'config':
        handle_config(args)
    elif args.command == 'check':
        handle_check(args)


def handle_prompts(args):
    """Handle prompts subcommand"""
    if not args.subcommand:
        Output.error("Missing subcommand for 'prompts'")
        Output.info("Try: cli.py prompts --help")
        return
    
    try:
        from commands import sync_prompts
        
        if args.subcommand == 'sync':
            sync_prompts.cmd_sync_prompts(args)
        elif args.subcommand == 'export':
            sync_prompts.cmd_export_prompts(args)
        elif args.subcommand == 'import':
            sync_prompts.cmd_import_prompts(args)
        elif args.subcommand == 'validate':
            # Quick validation without syncing
            sync_prompts.cmd_sync_prompts(args)
        else:
            Output.error(f"Unknown prompts subcommand: {args.subcommand}")
    except ImportError as e:
        Output.error(f"Prompts module import failed: {e}")
        Output.info("Make sure commands/sync_prompts.py exists")
    except Exception as e:
        Output.error(f"Prompts command failed: {e}")
        import traceback
        traceback.print_exc()


# ... rest of the handlers (handle_projects, handle_content, etc.) ...
# Keep all your existing handler functions unchanged

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n")
        Output.warning("Interrupted by user")
        sys.exit(130)
    except Exception as e:
        Output.error(f"Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)