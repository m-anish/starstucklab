"""
Standard path constants for Starstuck Lab site
"""

from pathlib import Path
from typing import Optional


class Paths:
    """Centralized path management for the site"""
    
    _instance = None
    
    def __new__(cls, config: Optional[dict] = None):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self, config: Optional[dict] = None):
        # Only initialize once
        if self._initialized:
            return
        
        if config is None:
            from .config import Config
            config = Config.load()
        
        # Root is two levels up from this file (lib/paths.py -> tools/ -> site/)
        self.root = Path(__file__).resolve().parent.parent.parent
        
        # Site structure from config
        site_config = config.get('site', {})
        self.src = self.root / site_config.get('src', 'src')
        self.public = self.root / site_config.get('public', 'public')
        self.data = self.root / site_config.get('data', 'src/data')
        self.tools = self.root / 'tools'
        
        # Content directories
        self.content = self.src / 'content'
        self.projects = self.content / 'projects'
        self.pages = self.src / 'pages'
        self.layouts = self.src / 'layouts'
        self.components = self.src / 'components'
        
        # Public directories
        self.public_data = self.public / 'data'
        self.public_assets = self.public / 'assets'
        self.public_images = self.public_assets / 'images'
        self.public_projects = self.public_assets / 'projects'
        
        # Data files
        self.navigation = self.data / 'navigation.json'
        self.footer = self.data / 'footer.json'
        
        # Persona file from config
        persona_path = config.get('content', {}).get('persona_file', 'src/data/persona_preamble.txt')
        self.persona = self.root / persona_path
        
        # Templates
        self.templates = self.tools / 'templates'
        
        # Project-related paths
        self.project_template = self.data / 'project-template.json'
        self.projects_config = self.data / 'projects' / 'config.yaml'
        self.projects_index = self.public_data / 'projects' / '_index.json'
        
        # About/Content paths
        self.about_json = self.public_data / 'about.json'
        self.hero_json = self.public_data / 'hero.json'
        
        # Product paths
        self.products_src = self.data / 'products'
        self.products_public = self.public_data / 'products'
        
        # Image paths
        self.images_config = self.data / 'images.json'
        
        self._initialized = True
    
    def ensure_dirs(self):
        """Create necessary directories if they don't exist"""
        dirs_to_create = [
            self.data,
            self.projects,
            self.public_data,
            self.public_assets,
            self.public_images,
            self.public_projects,
            self.templates,
            self.products_src,
            self.products_public,
            (self.public_data / 'projects'),
        ]
        
        for directory in dirs_to_create:
            directory.mkdir(parents=True, exist_ok=True)
    
    def get_project_path(self, slug: str) -> Path:
        """Get path to a project markdown file"""
        return self.projects / f"{slug}.md"
    
    def get_project_asset_dir(self, slug: str) -> Path:
        """Get directory for project assets"""
        return self.public_projects / slug
    
    def get_project_hero_image(self, slug: str, extension: str = 'webp') -> Path:
        """Get path to project hero image"""
        return self.get_project_asset_dir(slug) / f"hero.{extension}"
    
    def get_product_path(self, slug: str) -> Path:
        """Get path to a product JSON file (source)"""
        return self.products_src / f"{slug}.json"
    
    def get_product_public_path(self, slug: str) -> Path:
        """Get path to a product JSON file (public)"""
        return self.products_public / f"{slug}.json"
    
    def list_projects(self) -> list:
        """List all project markdown files"""
        if not self.projects.exists():
            return []
        return sorted(self.projects.glob("*.md"))
    
    def list_products(self) -> list:
        """List all product JSON files (source)"""
        if not self.products_src.exists():
            return []
        return sorted(self.products_src.glob("*.json"))
    
    def relative_to_root(self, path: Path) -> Path:
        """Get path relative to site root"""
        try:
            return path.relative_to(self.root)
        except ValueError:
            return path
    
    def __repr__(self) -> str:
        """String representation for debugging"""
        return f"Paths(root={self.root})"


# Singleton instance
_paths_instance = None

def get_paths(config: Optional[dict] = None) -> Paths:
    """Get or create the Paths singleton instance"""
    global _paths_instance
    if _paths_instance is None:
        _paths_instance = Paths(config)
    return _paths_instance