# Starstuck Lab Design System Architecture

## 📁 File Structure

```
site/src/styles/
├── tokens.css              # Design tokens (IMPORT FIRST)
├── components/
│   ├── parchment.css      # Reusable parchment components
│   ├── navbar.css         # Unified navigation
│   ├── aboutpanel.css     # About panel specific
│   ├── shop.css           # Shop page layout
│   ├── product-detail.css # Product detail layout
│   └── index.css          # Homepage hero/workshop
└── global.css             # DEPRECATED - remove after migration
```

## 🎨 Design System Principles

### 1. **Single Source of Truth**
- **All colors** defined in `tokens.css`
- **All spacing** uses design tokens
- **All typography** uses fluid scales

### 2. **Parchment-First Aesthetic**
- Primary theme: Workshop/manuscript aesthetic
- Fonts: Playfair Display (headers) + Merriweather (body)
- Colors: Warm earth tones (cream, brown, ink)
- UI font (Space Grotesk) ONLY for navbar and modern UI elements

### 3. **Component Hierarchy**
```
tokens.css (foundation)
  ↓
parchment.css (reusable components)
  ↓
page-specific.css (shop.css, product-detail.css, etc.)
```

## 🔧 Migration Plan

### Step 1: Remove Inline Styles
**Before:**
```astro
<style is:global>
.shop-hero {
  background: rgba(255, 255, 255, 0.92);
  /* ... */
}
</style>
```

**After:**
```astro
---
import "../styles/components/shop.css";
---
<div class="parchment parchment--large parchment--centered">
  <!-- content -->
</div>
```

### Step 2: Use Design Tokens
**Before:**
```css
padding: 32px 28px;
font-size: 2rem;
color: #28160b;
```

**After:**
```css
padding: var(--space-8) var(--space-6);
font-size: var(--text-4xl);
color: var(--ink-dark);
```

### Step 3: Unify Typography
**Rule:** Use parchment fonts for all content areas

```css
/* Headers */
h1, h2, h3 { font-family: var(--font-display); }

/* Body text */
p, li { font-family: var(--font-body); }

/* UI elements only */
.nav-links, button { font-family: var(--font-ui); }
```

## 📄 Updated Component Usage

### Shop Page
```astro
---
import "../styles/tokens.css";
import "../styles/components/parchment.css";
import "../styles/components/navbar.css";
import "../styles/components/shop.css";
---

<nav class="site-nav nav-static">
  <Navbar />
</nav>

<div class="parchment parchment--large parchment--centered">
  <h1>Shop — Artifacts from the Bench</h1>
  <p class="lead">Handmade, printed, lightly cursed.</p>
</div>
```

### Product Detail Page
```astro
<div class="parchment">
  <h1>{product.title}</h1>
  
  <div class="parchment parchment--nested">
    <h3>Specifications</h3>
    <!-- specs -->
  </div>
  
  <form class="parchment parchment--nested">
    <!-- form fields -->
  </form>
</div>
```

### Product Card
```astro
<div class="product-card">
  <div class="parchment parchment--compact">
    <img src={thumb} />
    <h3>{title}</h3>
    <div class="tag">#{tag}</div>
    <div class="badge-generated">✦ generated</div>
  </div>
</div>
```

## 🎯 Key Fixes Required

### 1. **Remove Duplicate CSS**
- `shop.astro` has inline `<style>` blocks → Move to `shop.css`
- ProductCard has redundant styles → Use `.parchment--compact`

### 2. **Fix Font Inconsistencies**
```diff
# ProductCard.astro
- font-family: 'Space Grotesk', system-ui;
+ font-family: var(--font-body);

# .title class
- font-weight: 700;
+ font-weight: var(--weight-bold);
```

### 3. **Unify Color System**
```diff
# All green accents
- color: #4ec57a;
+ color: var(--accent-green);

- color: var(--accent, #4ec57a);
+ color: var(--accent-green);
```

### 4. **Standardize Spacing**
```diff
# Consistent gaps
- gap: 32px;
+ gap: var(--space-8);

- padding: 24px 20px;
+ padding: var(--space-6) var(--space-5);
```

## 🚀 Benefits

1. **Consistency**: All pages share visual language
2. **Maintainability**: Change tokens once, affect everywhere
3. **Performance**: Shared CSS cached by browser
4. **Accessibility**: Consistent focus states, readable text
5. **Responsive**: Fluid typography scales beautifully

## 📝 Next Steps

1. Create `tokens.css`, `parchment.css`, `navbar.css`
2. Update `shop.astro` to remove inline styles
3. Update `ProductCard.astro` to use parchment classes
4. Update `[slug].astro` to use parchment components
5. Test responsive behavior
6. Remove deprecated `global.css` tech theme

## 🎨 Color Palette Reference

### Parchment (Primary)
- `--paper-cream`: #fbf0db
- `--paper-mid`: #f0d9bd
- `--ink-dark`: #28160b

### Accent
- `--accent-green`: #2a7a4f

### Night/Workshop
- `--sky-dark`: #05060a
- `--starry-white`: #f8f4e8

### Navigation
- `--nav-bg`: rgba(6,10,12,0.85)

Use these consistently across ALL pages!