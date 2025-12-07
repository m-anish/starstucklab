# 🌟 Starstuck Lab

*"Building small machines for an indifferent universe"*

This repository contains the complete **Starstuck Lab** ecosystem:

- 🌐 **Website**: Astro-powered web presence with dynamic content
- 🛠️ **CLI Tools**: Comprehensive content management and automation system
- 🤖 **AI Integration**: Automated content generation and image creation

---

## 🚀 Quickstart

### Website Development

```bash
cd site
npm install
npm run dev
```

Open [http://localhost:4321](http://localhost:4321)

### CLI Tools

```bash
cd site/tools

# Interactive mode
python cli.py

# Direct commands
python cli.py projects list
python cli.py products images --product m42
```

---

## 📁 Project Structure

```
site/
├── src/                    # Astro website source
│   ├── components/         # Reusable UI components
│   ├── layouts/           # Page layouts
│   ├── pages/             # Route pages
│   ├── styles/            # CSS and design tokens
│   └── data/              # Content and configuration
├── public/                # Static assets
├── tools/                 # CLI management system
│   ├── cli.py            # Unified CLI entry point
│   ├── commands/         # Command modules
│   ├── lib/              # Shared utilities
│   ├── deprecated/       # Legacy scripts
│   └── test_cli.py       # CLI testing
├── config.yaml           # Application configuration
└── README.md
```

---

## 🛠️ CLI Tools Overview

The **unified CLI** (`cli.py`) provides comprehensive content management with AI-powered automation.

### Core Commands

#### 📝 Projects Management
```bash
# List all projects
cli.py projects list

# Create new project interactively
cli.py projects create

# Create project directly
cli.py projects create "Project Title" --category hardware --status ongoing

# Edit project in text editor
cli.py projects edit my-project

# Generate AI content for projects
cli.py projects generate
```

#### 🛒 Products Management
```bash
# List all products with slugs
cli.py products list

# Create new product with AI content & images (interactive)
cli.py products create

# Generate AI product descriptions
cli.py products generate --product telescope

# Generate AI product images for carousel
cli.py products images --product m42
```

**Interactive Product Creation Flow:**
```bash
cli.py products create
# 1. Enter product details (title, price, tags, description)
# 2. "Generate AI content for this product?" → AI generates marketing copy
# 3. "Generate AI images for this product?" → Creates carousel images
# 4. Product is ready for e-commerce with content & visuals!
```

#### 🎨 Content Generation
```bash
# Regenerate AI content for pages
cli.py content regenerate --page about

# Generate About page emblems
cli.py content generate-emblems
```

#### 🖼️ Image Processing
```bash
# Process images with variants
cli.py images process --force
```

#### 🎯 Site Management
```bash
# List navigation items
cli.py site nav list

# Add navigation item
cli.py site nav add "Blog" /blog --priority 3

# List footer sections
cli.py site footer sections

# Add footer link
cli.py site footer add workbench "Contact" /contact --order 4
```

#### ⚙️ Asset Management
```bash
# Generate logo variants
cli.py assets logos

# Optimize images and assets
cli.py assets optimize
```

### Configuration

All settings are centralized in `config.yaml`:

```yaml
# AI settings
ai:
  enabled: true
  provider: openai
  default_model: gpt-5.1

# Content generation
content:
  max_variants: 20
  prompts:
    about: [...]
    hero: [...]

# Project management
projects:
  allowed_categories: [Hardware, Software, Art]
  allowed_status: [ongoing, completed, experimental]

# Product catalog
products:
  ai_templates:
    telescope-blurb: {...}
    weather-quick: {...}
```

---

## 🤖 AI Integration

### Centralized AI Module
All AI functionality is handled through the unified `lib/ai.py` module:
- **Automatic .env Loading**: API keys loaded from `site/.env`
- **Provider Agnostic**: Supports OpenAI and Together.ai
- **Error Handling**: Graceful fallbacks and clear error messages

### Content Generation
- **About/Hero Pages**: AI-generated dynamic content with variants
- **Product Descriptions**: Contextual product blurbs based on categories
- **Project Documentation**: AI-assisted project write-ups
- **Interactive Creation**: AI content generation built into product creation flow

### Image Generation
- **Product Photos**: Professional product photography for e-commerce carousels
- **Emblems**: Custom illustrations for About page variants
- **Hero Images**: Cinematic landscape illustrations for projects
- **Batch Processing**: Generate multiple images per product

### Supported Providers
- **OpenAI**: GPT models for text, DALL-E 3 for images
- **Together.ai**: Alternative API provider support

---

## 📦 Key Features

### ✨ Products System
- **E-commerce Ready**: Complete product catalog with pricing, specs, images
- **AI Content**: Automated product descriptions and marketing copy
- **Image Carousels**: Multiple AI-generated images per product
- **Category Intelligence**: Smart content generation based on product tags
- **Interactive Creation**: One-command product creation with AI content & images
- **Per-Product Images**: Individual image configurations for each product

### 🎨 Content Management
- **Dynamic Variants**: Multiple versions of content for A/B testing
- **Mood-Based Tone**: Context-aware content generation
- **Template System**: Reusable prompts and content structures

### 🔧 Developer Experience
- **Unified CLI**: Single entry point for all operations
- **Interactive Mode**: Guided workflows for content creation
- **Configuration**: Centralized settings with validation
- **Error Handling**: Graceful fallbacks and clear error messages
- **AI Module**: Centralized AI functionality with automatic environment loading

---

## 🏗️ Architecture Principles

### Configuration Hierarchy
1. **Application Behavior** → `config.yaml` (how the system works)
2. **Content & Data** → JSON files (what content is displayed)
3. **Assets** → Organized directories (media files)

### Separation of Concerns
- **Static Assets**: Hero, workshop, shop scenes (always exist)
- **Dynamic Content**: Products, projects (variable catalog)
- **Processing Logic**: Shared pipelines in config (reusable)
- **AI Services**: Centralized in `lib/ai.py` (consistent across commands)

### Future-Proof Design
- **Extensible Commands**: Easy to add new CLI modules
- **Provider Agnostic**: Support multiple AI services
- **Content Migration**: Smooth upgrades from old to new systems

---

## 🚀 Deployment

### Environment Setup
```bash
# Required API keys
export OPENAI_API_KEY="your-key-here"
export TOGETHER_API_KEY="your-key-here"  # Optional
export TOGETHER_BASE_URL="https://api.together.xyz"  # Optional
```

### Build Process
```bash
# Install dependencies
npm install
pip install -r tools/requirements.txt

# Build site
npm run build

# Test CLI
python tools/test_cli.py
```

---

## 🔄 Migration Guide

### From Legacy Scripts
The CLI consolidates functionality from deprecated scripts:

| Legacy Script | New CLI Command |
|---------------|-----------------|
| `projects_cli.py` | `cli.py projects` |
| `regenerate_content.py` | `cli.py content regenerate` |
| `regenerate_images.py` | `cli.py images process` |
| `generate_products_json.py` | `cli.py products generate` |
| `site_cli.py` | `cli.py site` |

### Configuration Migration
- Move AI prompts from JSON files → `config.yaml`
- Product templates from `templates.json` → `config.yaml`
- Image pipelines from `images.json` → `config.yaml`

---

## 🧪 Testing

```bash
# Run CLI tests
python tools/test_cli.py

# Test specific functionality
python cli.py check  # Health check
```

---

## 🤝 Contributing

### Adding New Commands
1. Create `commands/your_feature.py`
2. Add command to `cli.py` parser
3. Update `handle_your_feature()` function
4. Add configuration to `config.yaml`
5. Update tests

### Code Style
- Python 3.8+ compatible
- Type hints encouraged
- Clear error messages
- Comprehensive docstrings

---

## 📚 API Reference

### CLI Exit Codes
- `0`: Success
- `1`: General error
- `130`: User interrupt (Ctrl+C)

### Configuration Schema
See `config.yaml` for complete configuration options and defaults.

### File Conventions
- Products: `src/data/products/{slug}.json`
- Projects: `src/content/projects/{slug}.md`
- Assets: `public/assets/{type}-{slug}/`
- Images: `{prefix}-{slug}-img-{num:02d}.webp`

---

## 🧠 Philosophy

**Starstuck Lab** believes in:
- **Automation over Manual Labor**: AI handles repetitive content tasks
- **Quality over Quantity**: Thoughtful, contextual content generation
- **Flexibility over Rigidity**: Configurable systems that adapt
- **Exploration over Perfection**: Building tools for an indifferent universe

---

## ⚡ License

**DWYWBDBM 1.0** — Do What You Want But Don't Blame Me

This project is provided as-is with no warranties. Use at your own risk, but have fun building small machines!

---

*Made with ❤️ and a healthy dose of cosmic sarcasm*
