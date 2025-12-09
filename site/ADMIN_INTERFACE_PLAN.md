# 🌟 Starstuck Lab Web Admin Interface Plan

## Overview

This document outlines the phased implementation plan for a web-based admin interface that integrates with the existing CLI utilities. The admin interface will run locally on the Astro development server and provide a user-friendly web interface for content management.

## 🎯 Project Goals

- **Web-based Content Management**: Replace command-line operations with intuitive web forms
- **Local Development Only**: Admin functionality only available in development mode
- **CLI Integration**: Leverage existing CLI utilities through API wrappers
- **GitHub Pages Compatible**: Public site remains deployable to GitHub Pages without admin code

## 🏗️ Architecture Overview

### Dual-Mode Setup
- **Public Site**: Clean, production-ready website deployed to GitHub Pages
- **Admin Interface**: Local development server with full administrative capabilities
- **API Layer**: RESTful endpoints that execute CLI commands server-side

### Integration Strategy
- **API Routes**: `/api/cli/*` endpoints wrapping CLI utilities
- **Web Interface**: `/admin/*` pages calling the APIs via fetch
- **CLI Wrapper**: Python subprocess execution of existing tools

---

## 📋 Phase 1: API Foundation (2-3 days)

### 1.1 API Route Structure
```
site/src/
├── pages/
│   └── api/
│       └── cli/
│           ├── products/
│           │   ├── list.json.ts       # GET /api/cli/products/list
│           │   ├── create.post.ts     # POST /api/cli/products/create
│           │   └── images.post.ts     # POST /api/cli/products/images
│           ├── assets/
│           │   ├── logos.post.ts      # POST /api/cli/assets/logos
│           │   └── optimize.post.ts   # POST /api/cli/assets/optimize
│           ├── site/
│           │   ├── nav/
│           │   │   ├── list.json.ts   # GET /api/cli/site/nav/list
│           │   │   └── add.post.ts    # POST /api/cli/site/nav/add
│           │   └── footer/
│           │       ├── list.json.ts   # GET /api/cli/site/footer/list
│           │       └── add.post.ts    # POST /api/cli/site/footer/add
│           └── config/
│               └── health.get.ts      # GET /api/cli/config/health
```

### 1.2 CLI Execution Wrapper (`lib/cli-executor.ts`)
```typescript
export async function executeCLI(command: string, args: string[] = []): Promise<string> {
  const { spawn } = await import('child_process');
  const { promisify } = await import('util');

  return new Promise((resolve, reject) => {
    const cli = spawn('python', ['tools/cli.py', command, ...args], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '', stderr = '';
    cli.stdout.on('data', d => stdout += d);
    cli.stderr.on('data', d => stderr += d);

    cli.on('close', code =>
      code === 0 ? resolve(stdout) : reject(new Error(stderr))
    );
  });
}
```

### 1.3 Standard API Response Format
```typescript
interface CLIResponse {
  success: boolean;
  output: string;
  error?: string;
  data?: any;  // Parsed JSON when applicable
}
```

### 1.4 Example API Route Implementation
```typescript
// src/pages/api/cli/products/create.post.ts
import { executeCLI } from '../../../../lib/cli-executor';

export async function POST({ request }) {
  try {
    const formData = await request.json();

    // Build CLI command from form data
    const args = [
      'products', 'create',
      `--title=${formData.title}`,
      `--price=${formData.price}`,
      `--currency=${formData.currency || 'INR'}`,
      `--status=${formData.status || 'available'}`,
      ...(formData.tags ? [`--tags=${formData.tags.join(',')}`] : [])
    ];

    if (!formData.interactive) {
      args.push('--no-interactive');
    }

    const result = await executeCLI('products', ['create', formData.title]);

    return new Response(JSON.stringify({
      success: true,
      output: result,
      productSlug: formData.slug
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500 });
  }
}
```

---

## 📋 Phase 2: Admin UI Components (3-4 days)

### 2.1 Admin Layout Structure
```
site/src/
├── layouts/
│   └── AdminLayout.astro     # Admin-specific layout with sidebar
├── components/
│   └── admin/
│       ├── Sidebar.astro     # Admin navigation menu
│       ├── Header.astro      # Admin header with breadcrumbs
│       ├── StatusBar.astro   # CLI execution status indicator
│       ├── ProductForm.astro # Product creation/editing form
│       ├── AssetManager.astro # File upload and asset management
│       ├── CLITerminal.astro # Live CLI output display
│       └── ConfirmDialog.astro # Confirmation dialogs
```

### 2.2 Admin Pages Structure
```
site/src/pages/admin/
├── index.astro              # Admin dashboard with overview
├── products/
│   ├── index.astro         # Product list with search/filter
│   ├── new.astro           # Create product form
│   └── [slug]/
│       ├── index.astro     # Edit product overview
│       ├── content.astro   # Edit product content
│       └── images.astro    # Manage product images
├── assets/
│   ├── index.astro         # Asset overview and statistics
│   ├── logos.astro         # Logo variant generation
│   └── optimize.astro      # Bulk optimization tools
├── site/
│   ├── navigation.astro    # Navigation management
│   ├── footer.astro        # Footer link management
│   └── config.astro        # Configuration validation
└── api/
    └── test.astro          # API testing interface
```

### 2.3 Admin Dashboard Features
- **Quick Stats**: Product count, asset sizes, recent changes
- **Recent Activity**: Last CLI operations with status
- **Health Indicators**: Config validation, file system status
- **Quick Actions**: Create product, optimize assets, validate config

### 2.4 Interactive Components

#### ProductForm Component
```astro
---
// components/admin/ProductForm.astro
export interface Props {
  mode: 'create' | 'edit';
  initialData?: any;
}

const { mode, initialData } = Astro.props;
---

<form id="product-form" class="admin-form">
  <div class="form-group">
    <label for="title">Product Title</label>
    <input type="text" id="title" name="title"
           value={initialData?.title || ''} required>
  </div>

  <div class="form-row">
    <div class="form-group">
      <label for="price">Price</label>
      <input type="number" id="price" name="price"
             value={initialData?.price || ''} step="0.01">
    </div>
    <div class="form-group">
      <label for="currency">Currency</label>
      <select id="currency" name="currency">
        <option value="INR" selected={initialData?.currency === 'INR'}>INR</option>
        <option value="USD" selected={initialData?.currency === 'USD'}>USD</option>
        <option value="EUR" selected={initialData?.currency === 'EUR'}>EUR</option>
      </select>
    </div>
  </div>

  <div class="form-group">
    <label for="status">Status</label>
    <select id="status" name="status">
      <option value="available" selected={initialData?.status === 'available'}>Available</option>
      <option value="unavailable" selected={initialData?.status === 'unavailable'}>Unavailable</option>
      <option value="coming_soon" selected={initialData?.status === 'coming_soon'}>Coming Soon</option>
      <option value="discontinued" selected={initialData?.status === 'discontinued'}>Discontinued</option>
    </select>
  </div>

  <div class="form-group">
    <label for="tags">Tags (comma-separated)</label>
    <input type="text" id="tags" name="tags"
           value={initialData?.tags?.join(', ') || ''}>
  </div>

  <div class="form-group">
    <label for="excerpt">Excerpt</label>
    <textarea id="excerpt" name="excerpt" rows="3">{initialData?.excerpt || ''}</textarea>
  </div>

  <div class="form-actions">
    <button type="submit" class="btn-primary">
      {mode === 'create' ? 'Create Product' : 'Update Product'}
    </button>
    <button type="button" class="btn-secondary" onclick="generateAI()">
      🤖 Generate with AI
    </button>
  </div>
</form>

<script>
  // Form submission handling
  document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    // Convert comma-separated tags to array
    if (data.tags) {
      data.tags = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }

    try {
      const response = await fetch('/api/cli/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        showNotification('Product created successfully!', 'success');
        // Redirect to product edit page or refresh
      } else {
        showNotification(result.error, 'error');
      }
    } catch (error) {
      showNotification('Failed to create product', 'error');
    }
  });

  async function generateAI() {
    // AI content generation logic
  }
</script>
```

#### Asset Manager Component
```astro
---
// components/admin/AssetManager.astro
export interface Props {
  productSlug?: string;
  assetType: 'product' | 'logo' | 'general';
}

const { productSlug, assetType } = Astro.props;
---

<div class="asset-manager">
  <div class="upload-zone" id="upload-zone">
    <div class="upload-content">
      <div class="upload-icon">📁</div>
      <p>Drag & drop images here or click to browse</p>
      <button class="btn-secondary" onclick="document.getElementById('file-input').click()">
        Choose Files
      </button>
      <input type="file" id="file-input" multiple accept="image/*" style="display: none;">
    </div>
  </div>

  <div class="asset-list" id="asset-list">
    <!-- Dynamically populated asset list -->
  </div>
</div>

<script>
  // File upload handling
  const uploadZone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('file-input');

  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('drag-over');
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  });

  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  });

  async function handleFiles(files) {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('productSlug', '{productSlug}');
      formData.append('assetType', '{assetType}');

      try {
        const response = await fetch('/api/cli/assets/upload', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (result.success) {
          addAssetToList(result.asset);
          showNotification('Asset uploaded successfully!', 'success');
        } else {
          showNotification(result.error, 'error');
        }
      } catch (error) {
        showNotification('Upload failed', 'error');
      }
    }
  }

  function addAssetToList(asset) {
    const assetList = document.getElementById('asset-list');
    // Add asset to list with preview, etc.
  }
</script>
```

---

## 📋 Phase 3: Authentication & Deployment (2-3 days)

### 3.1 Development-Only Authentication
```typescript
// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async ({ request }, next) => {
  // Only apply auth to admin routes in development
  if (import.meta.env.DEV && new URL(request.url).pathname.startsWith('/admin')) {
    const authHeader = request.headers.get('authorization');

    // Simple token-based auth for local development
    const expectedToken = process.env.ADMIN_TOKEN || 'dev-admin-token';

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Bearer' }
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    if (token !== expectedToken) {
      return new Response('Forbidden', { status: 403 });
    }
  }

  return next();
});
```

### 3.2 Astro Configuration Updates
```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://starstucklab.com',
  base: '/',

  integrations: [],

  vite: {
    server: { fs: { allow: ['..'] } },
    define: {
      // Make admin availability known to frontend
      __ADMIN_ENABLED__: process.env.NODE_ENV === 'development'
    }
  },

  // Exclude admin routes from production builds
  build: {
    exclude: process.env.NODE_ENV === 'production' ? ['src/pages/admin/**'] : []
  }
});
```

### 3.3 Environment Setup
```bash
# .env (local development only)
ADMIN_TOKEN=your-secure-admin-token-here
NODE_ENV=development
```

### 3.4 GitHub Actions Deployment Update
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm ci

    - name: Build for production
      run: |
        # Set production environment to exclude admin routes
        export NODE_ENV=production
        npm run build
      env:
        NODE_ENV: production

    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

---

## 📋 Phase 4: Advanced Features (4-5 days)

### 4.1 Enhanced File Upload
- **Progress indicators** for large file uploads
- **Batch upload** with queue management
- **Image optimization** on upload
- **Drag-and-drop reordering** for galleries

### 4.2 Live Preview System
- **Real-time content preview** as you type
- **Responsive design preview** for different screen sizes
- **Image gallery preview** before publishing
- **SEO preview** with meta tags

### 4.3 Batch Operations
- **CSV import/export** for bulk product management
- **Bulk image optimization** across all assets
- **Batch AI content generation** for multiple products
- **Bulk status updates** (available/unavailable)

### 4.4 Advanced CLI Integration
- **Streaming CLI output** for long-running operations
- **Command queuing** with progress tracking
- **Operation history** with rollback capabilities
- **Background job processing** for intensive tasks

### 4.5 Admin Analytics
- **Content statistics** (word counts, image counts)
- **Performance metrics** (build times, optimization savings)
- **Activity logs** with searchable history
- **Health monitoring** dashboard

---

## 🔧 Technical Implementation Details

### CLI Execution Patterns

#### Synchronous Operations
```typescript
// For quick operations (list, validate, etc.)
export async function executeCLI(command: string, args: string[] = []): Promise<string> {
  // Implementation as shown in Phase 1
}
```

#### Asynchronous Operations
```typescript
// For long-running operations (AI generation, optimization)
export async function executeCLIAsync(command: string, args: string[], onProgress?: (output: string) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const cli = spawn('python', ['tools/cli.py', command, ...args], {
      cwd: process.cwd()
    });

    let fullOutput = '';

    cli.stdout.on('data', (data) => {
      const chunk = data.toString();
      fullOutput += chunk;
      onProgress?.(chunk);
    });

    cli.stderr.on('data', (data) => {
      const chunk = data.toString();
      fullOutput += chunk;
      onProgress?.(chunk);
    });

    cli.on('close', (code) => {
      if (code === 0) {
        resolve(fullOutput);
      } else {
        reject(new Error(fullOutput));
      }
    });
  });
}
```

### Error Handling Strategy

#### API Error Responses
```typescript
interface APIError {
  success: false;
  error: string;
  code?: string;  // CLI exit code
  details?: any;  // Additional error context
}

// Frontend error handling
async function handleAPIError(error: APIError) {
  switch (error.code) {
    case '1':  // General CLI error
      showNotification('Operation failed: ' + error.error, 'error');
      break;
    case '130':  // User interrupt
      showNotification('Operation cancelled', 'warning');
      break;
    default:
      showNotification('Unexpected error occurred', 'error');
  }
}
```

### State Management

#### Admin Context Provider
```typescript
// contexts/AdminContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface AdminContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  clearNotifications: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [...prev, { ...notification, id: Date.now() }]);
  };

  const clearNotifications = () => setNotifications([]);

  return (
    <AdminContext.Provider value={{
      isLoading,
      setLoading,
      notifications,
      addNotification,
      clearNotifications
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
}
```

---

## 🚀 Development Workflow

### Local Development Setup
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your ADMIN_TOKEN

# Start development server with admin interface
npm run dev

# Access admin interface
open http://localhost:4321/admin
```

### Production Deployment
```bash
# Build excludes admin routes automatically
npm run build

# Deploy to GitHub Pages (admin routes not included)
npm run deploy
```

### Testing Admin Interface
```bash
# Run admin interface tests
npm run test:admin

# Test API endpoints
curl http://localhost:4321/api/cli/products/list
```

---

## 📋 Implementation Checklist

### Phase 1 ✅
- [ ] Create CLI executor utility
- [ ] Implement basic API routes for all CLI commands
- [ ] Add error handling and response formatting
- [ ] Test API endpoints functionality

### Phase 2 ✅
- [x] Create AdminLayout and navigation components
- [x] Build admin dashboard with overview stats
- [x] Implement ProductForm with full CRUD operations
- [x] Create AssetManager with upload capabilities
- [x] Add CLITerminal for live command output

### Phase 2.5: Missing Admin Pages & Features ✅ COMPLETED (4 days)
- [x] Create `/admin/products/new` - New product creation form ✅
- [x] Create `/admin/products/[slug]` - Individual product edit pages ✅
- [x] Fix product preview links to use correct URLs (`/shop/${slug}`) ✅
- [x] Implement image upload functionality in product edit pages ✅
- [x] Implement AI image generation for products ✅
- [x] **FIXED CLI ISSUE**: Updated CLI to work with Markdown files instead of JSON ✅
- [x] **FIXED INTERACTIVE ISSUE**: Added `--api` flag for non-interactive mode ✅
- [ ] Create `/admin/assets` - Asset management page (Optional)
- [ ] Create `/admin/site` - Site management (navigation/footer) page (Optional)
- [ ] Create `/admin/config` - Configuration management page (Optional)
- [ ] Update admin navigation links to work properly (Optional)

### Phase 3 ✅
- [ ] Add development-only authentication
- [ ] Update Astro config for admin/production separation
- [ ] Modify build process to exclude admin routes
- [ ] Set up environment variables and security

### Phase 4 ✅
- [ ] Implement file upload with progress indicators
- [ ] Add live preview functionality
- [ ] Create batch operation interfaces
- [ ] Build admin analytics dashboard
- [ ] Add advanced CLI integration features

---

## 🎯 Success Criteria

- [ ] Admin interface loads only in development mode
- [ ] All CLI operations accessible via web interface
- [ ] File upload and asset management fully functional
- [ ] Real-time feedback for all operations
- [ ] Production builds exclude admin functionality
- [ ] Secure local-only authentication
- [ ] Responsive design works on all devices
- [ ] Error handling prevents data loss
- [ ] Performance optimized for local development

---

## 📚 Additional Resources

- [Astro API Routes Documentation](https://docs.astro.build/en/core-concepts/api-routes/)
- [Astro Middleware Guide](https://docs.astro.build/en/guides/middleware/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [GitHub Actions Deployment](https://docs.github.com/en/actions/deployment)

---

*This plan provides a comprehensive roadmap for building a professional web admin interface that seamlessly integrates with the existing CLI infrastructure.*
