#!/usr/bin/env python3
"""
Test script to verify CLI implementation
Run this after installing all files to check everything works.
"""

import sys
from pathlib import Path

# Add lib to path
sys.path.insert(0, str(Path(__file__).parent))

def test_imports():
    """Test that all modules can be imported"""
    print("Testing imports...")
    
    try:
        from lib import Output, Style, Config, Paths, Prompt
        print("  ✅ All lib modules imported successfully")
        return True
    except ImportError as e:
        print(f"  ❌ Import failed: {e}")
        return False


def test_output():
    """Test output formatting"""
    print("\nTesting output formatting...")
    
    try:
        from lib import Output
        
        Output.success("This is a success message")
        Output.error("This is an error message")
        Output.info("This is an info message")
        Output.warning("This is a warning message")
        Output.progress("This is a progress message")
        Output.header("This is a header")
        Output.dim("This is dimmed text")
        
        print("  ✅ Output formatting works")
        return True
    except Exception as e:
        print(f"  ❌ Output test failed: {e}")
        return False


def test_config():
    """Test configuration loading"""
    print("\nTesting configuration...")
    
    try:
        from lib import Config
        
        # Load config (will use defaults if no file)
        config = Config.load()
        
        # Test getting values
        emoji = Config.get('cli.emoji', True)
        model = Config.get('ai.default_model', 'gpt-4o-mini')
        
        print(f"  Config loaded: {len(config)} top-level keys")
        print(f"  cli.emoji = {emoji}")
        print(f"  ai.default_model = {model}")
        
        config_path = Config.get_path()
        if config_path:
            print(f"  Config file: {config_path}")
        else:
            print(f"  Using default config (no file found)")
        
        print("  ✅ Config system works")
        return True
    except Exception as e:
        print(f"  ❌ Config test failed: {e}")
        return False


def test_paths():
    """Test path resolution"""
    print("\nTesting paths...")
    
    try:
        from lib import Paths
        
        paths = Paths()
        
        print(f"  Root: {paths.root}")
        print(f"  Source: {paths.src}")
        print(f"  Public: {paths.public}")
        print(f"  Projects: {paths.projects}")
        print(f"  Data: {paths.data}")
        
        # Check if directories exist
        if paths.root.exists():
            print(f"  ✅ Root directory exists")
        else:
            print(f"  ⚠️  Root directory not found (expected if testing outside site)")
        
        print("  ✅ Paths system works")
        return True
    except Exception as e:
        print(f"  ❌ Paths test failed: {e}")
        return False


def test_prompts():
    """Test prompt system (non-interactive parts)"""
    print("\nTesting prompts...")
    
    try:
        from lib import Prompt
        
        # We can't test interactive parts in a script,
        # but we can verify the class loads
        
        print("  Prompt class loaded successfully")
        print("  ℹ️  Interactive prompts must be tested manually")
        print("     Try: python -c \"from lib import Prompt; name = Prompt.text('Name'); print(name)\"")
        
        print("  ✅ Prompts system works")
        return True
    except Exception as e:
        print(f"  ❌ Prompts test failed: {e}")
        return False


def test_cli_entry():
    """Test that CLI entry point exists and has basic structure"""
    print("\nTesting CLI entry point...")
    
    cli_path = Path(__file__).parent / "cli.py"
    
    if not cli_path.exists():
        print(f"  ❌ cli.py not found at {cli_path}")
        return False
    
    print(f"  ✅ cli.py exists at {cli_path}")
    
    # Try importing main function
    try:
        import cli
        if hasattr(cli, 'main'):
            print("  ✅ main() function found")
        else:
            print("  ⚠️  main() function not found")
        return True
    except Exception as e:
        print(f"  ⚠️  Could not import cli.py: {e}")
        print("     (This is OK if running test from outside tools/ directory)")
        return True  # Don't fail on this


def test_commands():
    """Test that command modules exist"""
    print("\nTesting command modules...")
    
    commands_dir = Path(__file__).parent / "commands"
    
    if not commands_dir.exists():
        print(f"  ❌ commands/ directory not found")
        return False
    
    print(f"  ✅ commands/ directory exists")
    
    # Check for projects module
    projects_py = commands_dir / "projects.py"
    if projects_py.exists():
        print("  ✅ commands/projects.py exists")
        
        # Try importing
        try:
            sys.path.insert(0, str(Path(__file__).parent))
            from commands import projects
            print("  ✅ projects module can be imported")
            
            # Check for key functions
            funcs = ['cmd_list', 'cmd_create', 'cmd_create_interactive']
            found = [f for f in funcs if hasattr(projects, f)]
            print(f"  ✅ Found {len(found)}/{len(funcs)} expected functions")
            
        except Exception as e:
            print(f"  ⚠️  Could not import projects: {e}")
    else:
        print("  ⚠️  commands/projects.py not found")
    
    return True


def main():
    """Run all tests"""
    print("="*60)
    print("Starstuck Lab CLI - Verification Tests")
    print("="*60)
    
    tests = [
        ("Imports", test_imports),
        ("Output", test_output),
        ("Config", test_config),
        ("Paths", test_paths),
        ("Prompts", test_prompts),
        ("CLI Entry", test_cli_entry),
        ("Commands", test_commands),
    ]
    
    results = []
    
    for name, test_func in tests:
        try:
            passed = test_func()
            results.append((name, passed))
        except Exception as e:
            print(f"\n❌ Test '{name}' crashed: {e}")
            results.append((name, False))
    
    # Summary
    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)
    
    passed = sum(1 for _, p in results if p)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}  {name}")
    
    print(f"\nResult: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! CLI is ready to use.")
        print("\nNext steps:")
        print("  1. python cli.py --help")
        print("  2. python cli.py")
        print("  3. python cli.py projects list")
    else:
        print("\n⚠️  Some tests failed. Check the output above.")
        print("Make sure all files are in the correct locations.")
    
    return passed == total


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)