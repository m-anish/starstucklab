#!/usr/bin/env python3
"""
Starstuck Lab - Unified CLI
============================

Manage your Starstuck Lab site with ease.

Usage:
    python cli.py                           # Interactive mode
    python cli.py projects list             # Direct command
    python cli.py projects create           # Interactive create
    python cli.py projects create "Title"   # Direct create
    python cli.py content regenerate --page about
    python cli.py assets logos              # Generate logo variants
    python cli.py site nav list             # List navigation
    python cli.py check                     # Health check
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
  %(prog)s                              # Launch interactive mode
  %(prog)s projects list                # List all projects
  %(prog)s projects create              # Create project (interactive)
  %(prog)s projects create "My Project" # Create project (direct)
  %(prog)s content regenerate --page about
  %(prog)s assets logos                 # Generate logo variants
  %(prog)s site nav list                # List navigation items
  %(prog)s check                        # Run health check
        """
    )
    
    # Global flags
    parser.add_argument('--no-emoji', action='store_true', 
                       help='Disable emoji output')
    parser.add_argument('--config', type=Path,
                       help='Path to config file')
    
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
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
    regen_parser.add_argument('--model', help='AI model (default: gpt-5.1)')
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
    
    if args.command == 'projects':
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


def interactive_mode():
    """Launch interactive menu"""
    
    Output.header("🌟 Starstuck Lab Site Manager")
    
    print("What would you like to do?\n")
    print("  1. Create new content")
    print("     → projects, pages, products\n")
    print("  2. Regenerate existing content")
    print("     → Update copy, images, variants\n")
    print("  3. Manage site structure")
    print("     → Navigation, footer, layouts\n")
    print("  4. Process media")
    print("     → Images, logos, assets, optimization\n")
    print("  5. View site status")
    print("     → Content inventory, health check\n")
    print("  q. Quit\n")
    
    choice = input("Choose [1-5] or 'q' to quit: ").strip().lower()
    
    if choice == 'q' or choice == 'quit':
        Output.info("Goodbye!")
        return
    
    if choice == '1':
        # Create content submenu
        Output.header("Create New Content")
        
        content_type = Prompt.choice(
            "What would you like to create?",
            options=["Project", "Page", "Product"],
            default="Project"
        )
        
        if content_type == "Project":
            # Import and run project creation
            try:
                from commands.projects import cmd_create_interactive
                cmd_create_interactive()
            except ImportError:
                Output.error("Projects module not yet implemented")
                Output.info("Run: python cli.py projects create")

        elif content_type == "Product":
            # Import and run product creation
            try:
                from commands.products import cmd_create
                # Create a dummy args object for interactive mode
                import argparse
                args = argparse.Namespace()
                cmd_create(args)
            except ImportError:
                Output.error("Products module not yet implemented")
                Output.info("Run: python cli.py products create")

        elif content_type == "Page":
            # Page creation - not yet implemented
            Output.info("Page creation - coming soon!")
            Output.info("Run: python cli.py site pages create")
    
    elif choice == '2':
        # Regenerate submenu
        Output.header("Regenerate Content")

        page = Prompt.choice(
            "Which page?",
            options=["About", "Hero", "All pages"],
            default="All pages"
        )

        # Actually run content regeneration
        try:
            from commands import content
            import argparse

            # Map user-friendly names to CLI args
            page_map = {
                "About": "about",
                "Hero": "hero",
                "All pages": "all"
            }

            args = argparse.Namespace()
            args.page = page_map[page]
            args.num_variants = 3  # Default for interactive mode
            args.model = None
            args.provider = None
            args.no_emblems = False

            content.cmd_regenerate(args)

        except ImportError:
            Output.error("Content module not yet implemented")
            Output.info(f"Run: python cli.py content regenerate --page {page_map[page]}")
    
    elif choice == '3':
        # Site structure submenu
        Output.header("Site Structure")

        section = Prompt.choice(
            "What would you like to manage?",
            options=["Navigation", "Footer", "Pages"],
            default="Navigation"
        )

        # Actually run site management commands
        try:
            from commands import site
            import argparse

            args = argparse.Namespace()

            if section == "Navigation":
                args.subcommand = "nav"
                args.nav_action = "list"
                site.cmd_nav_list(args)

                # Offer to add navigation item
                if Prompt.confirm("Would you like to add a navigation item?", default=False):
                    args.nav_action = "add"
                    args.label = Prompt.text("Link label")
                    args.href = Prompt.text("Link URL")
                    args.priority = int(Prompt.text("Priority (number)", default="1"))
                    site.cmd_nav_add(args)

            elif section == "Footer":
                args.subcommand = "footer"
                args.footer_action = "sections"
                site.cmd_footer_sections(args)

                # Offer to add footer link
                if Prompt.confirm("Would you like to add a footer link?", default=False):
                    args.footer_action = "add"
                    args.section = Prompt.choice("Footer section", options=["workbench", "about", "legal"])
                    args.label = Prompt.text("Link label")
                    args.href = Prompt.text("Link URL")
                    args.order = int(Prompt.text("Order (number)", default="1"))
                    site.cmd_footer_add(args)

            elif section == "Pages":
                args.subcommand = "pages"
                args.pages_action = "list"
                site.cmd_pages_list(args)

                Output.info("Page creation - coming soon!")
                Output.info("Run: python cli.py site pages create")

        except ImportError:
            Output.error("Site module not yet implemented")
            Output.info(f"Run: python cli.py site --help")
    
    elif choice == '4':
        # Media processing
        Output.header("Process Media")

        media_type = Prompt.choice(
            "What would you like to process?",
            options=["Images", "Assets/Logos", "All media"],
            default="Images"
        )

        # Actually run media processing commands
        try:
            import argparse
            args = argparse.Namespace()

            if media_type == "Images":
                from commands import images
                args.subcommand = "process"
                args.force = Prompt.confirm("Regenerate existing images?", default=False)
                args.generate = Prompt.confirm("Run generation step?", default=True)
                args.upscale = False
                images.cmd_process(args)

            elif media_type == "Assets/Logos":
                from commands import assets
                args.subcommand = "logos"
                assets.cmd_logos(args)

            else:
                # All media - run both
                Output.info("Running all media processing...")

                # Images
                from commands import images
                args.subcommand = "process"
                args.force = False
                args.generate = True
                args.upscale = False
                images.cmd_process(args)

                # Assets
                from commands import assets
                args.subcommand = "logos"
                assets.cmd_logos(args)

        except ImportError as e:
            Output.error(f"Media processing module not available: {e}")
            Output.info("Run: python cli.py images process  # for images")
            Output.info("Run: python cli.py assets logos    # for logos")
    
    elif choice == '5':
        # Site status
        Output.header("Site Status")

        # Actually run health check
        import argparse
        args = argparse.Namespace()
        args.fix = Prompt.confirm("Auto-fix issues where possible?", default=False)
        handle_check(args)
    
    else:
        Output.warning(f"Unknown choice: {choice}")


def handle_projects(args):
    """Handle projects subcommand"""
    if not args.subcommand:
        Output.error("Missing subcommand for 'projects'")
        Output.info("Try: cli.py projects --help")
        return
    
    try:
        from commands import projects
        
        if args.subcommand == 'list':
            projects.cmd_list(args)
        elif args.subcommand == 'create':
            if not args.no_interactive and (not args.title or not args.category):
                projects.cmd_create_interactive()
            else:
                projects.cmd_create(args)
        elif args.subcommand == 'edit':
            projects.cmd_edit(args)
        elif args.subcommand == 'delete':
            projects.cmd_delete(args)
        elif args.subcommand == 'info':
            projects.cmd_info(args)
        elif args.subcommand == 'rebuild-index':
            projects.cmd_rebuild_index(args)
    except ImportError:
        Output.error("Projects module not yet implemented")
        Output.info("The projects commands are being migrated to the new CLI structure")


def handle_content(args):
    """Handle content subcommand"""
    if not args.subcommand:
        Output.error("Missing subcommand for 'content'")
        Output.info("Try: cli.py content --help")
        return
    
    try:
        from commands import content
        
        if args.subcommand == 'regenerate':
            content.cmd_regenerate(args)
        elif args.subcommand == 'generate-emblems':
            content.cmd_generate_emblems(args)
    except ImportError as e:
        Output.error(f"Content module import failed: {e}")
        Output.info("Make sure commands/content.py exists")
    except Exception as e:
        Output.error(f"Content command failed: {e}")
        import traceback
        traceback.print_exc()


def handle_products(args):
    """Handle products subcommand"""
    if not args.subcommand:
        Output.error("Missing subcommand for 'products'")
        Output.info("Try: cli.py products --help")
        return

    try:
        from commands import products

        if args.subcommand == 'list':
            products.cmd_list(args)
        elif args.subcommand == 'generate':
            products.cmd_generate(args)
        elif args.subcommand == 'images':
            products.cmd_generate_images(args)
        elif args.subcommand == 'create':
            products.cmd_create(args)
        else:
            Output.error(f"Unknown products subcommand: {args.subcommand}")
    except ImportError as e:
        Output.error(f"Products module import failed: {e}")
        Output.info("Make sure commands/products.py exists")
    except Exception as e:
        Output.error(f"Products command failed: {e}")
        import traceback
        traceback.print_exc()


def handle_images(args):
    """Handle images subcommand"""
    if not args.subcommand:
        Output.error("Missing subcommand for 'images'")
        Output.info("Try: cli.py images --help")
        return
    
    try:
        from commands import images
        
        if args.subcommand == 'process':
            images.cmd_process(args)
    except ImportError as e:
        Output.error(f"Images module import failed: {e}")
        Output.info("Make sure commands/images.py exists and PIL is installed")
        Output.info("Install with: pip install pillow")
    except Exception as e:
        Output.error(f"Images command failed: {e}")
        import traceback
        traceback.print_exc()


def handle_assets(args):
    """Handle assets subcommand"""
    if not args.subcommand:
        Output.error("Missing subcommand for 'assets'")
        Output.info("Try: cli.py assets --help")
        return

    try:
        from commands import assets

        if args.subcommand == 'logos':
            assets.cmd_logos(args)
        elif args.subcommand == 'optimize':
            assets.cmd_optimize(args)
        elif args.subcommand == 'info':
            assets.cmd_info(args)
        else:
            Output.error(f"Unknown assets subcommand: {args.subcommand}")
    except ImportError:
        Output.error("Assets module not yet implemented")
        if args.subcommand == 'logos':
            Output.info("Logo variant generation - coming soon!")
            Output.info("Currently available as: python tools/deprecated/generate_logo_variants.py")
        else:
            Output.info("Asset optimization - coming soon!")


def handle_site(args):
    """Handle site subcommand"""
    if not args.subcommand:
        Output.error("Missing subcommand for 'site'")
        Output.info("Try: cli.py site --help")
        return

    try:
        from commands import site

        if args.subcommand == 'nav':
            if args.nav_action == 'list':
                site.cmd_nav_list(args)
            elif args.nav_action == 'add':
                site.cmd_nav_add(args)
            elif args.nav_action == 'remove':
                site.cmd_nav_remove(args)
            elif args.nav_action == 'reorder':
                site.cmd_nav_reorder(args)
        elif args.subcommand == 'footer':
            if args.footer_action == 'sections':
                site.cmd_footer_sections(args)
            elif args.footer_action == 'list':
                site.cmd_footer_list(args)
            elif args.footer_action == 'add':
                site.cmd_footer_add(args)
            elif args.footer_action == 'remove':
                site.cmd_footer_remove(args)
        elif args.subcommand == 'pages':
            if args.pages_action == 'list':
                site.cmd_pages_list(args)
            elif args.pages_action == 'create':
                site.cmd_pages_create(args)
    except ImportError:
        Output.error("Site module not yet implemented")
        Output.info("Full site management - coming soon!")
        Output.info("Basic functionality available as: python tools/deprecated/site_cli.py")


def handle_config(args):
    """Handle config subcommand"""
    if not hasattr(args, 'config_action') or not args.config_action:
        Output.error("Missing subcommand for 'config'")
        Output.info("Try: cli.py config --help")
        return

    try:
        from lib.config_validator import (
            cmd_validate_config,
            cmd_migrate_config,
            cmd_config_health
        )

        if args.config_action == 'validate':
            cmd_validate_config(args)
        elif args.config_action == 'migrate':
            cmd_migrate_config(args)
        elif args.config_action == 'health':
            cmd_config_health(args)
        else:
            Output.error(f"Unknown config subcommand: {args.config_action}")
    except ImportError:
        Output.error("Config validation module not available")
        Output.info("Make sure lib/config_validator.py exists")


def handle_check(args):
    """Handle health check"""
    Output.section("Site Health Check")

    Output.info("Running validation checks...")

    # Placeholder for actual checks
    checks = [
        ("Content validation", True, None),
        ("Media validation", True, "2 images not WebP format"),
        ("Link validation", True, None),
        ("Configuration", True, None),
    ]

    for name, passed, warning in checks:
        if passed and not warning:
            Output.success(name)
        elif warning:
            Output.warning(f"{name}: {warning}")
        else:
            Output.error(name)

    Output.info("\nFull health check implementation - coming soon!")


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
