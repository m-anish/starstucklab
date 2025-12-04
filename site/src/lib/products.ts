// site/src/lib/products.ts
// Shared utilities for loading product data from public/data/products
import fs from 'fs';
import path from 'path';

export interface Product {
  slug: string;
  title: string;
  price?: number;
  currency?: string;
  status?: string;
  tags?: string[];
  specs?: Record<string, any>;
  included?: string[];
  html?: string;
  raw?: string;
  excerpt?: string;
  date?: string;
  [key: string]: any; // Allow additional fields
}

let cachedProducts: Product[] | null = null;

function getProductsDir(): string {
  // Resolve relative to project root (where public/ lives)
  const root = path.resolve('./public/data/products');
  return root;
}

export function getAllProducts(): Product[] {
  if (cachedProducts) return cachedProducts;
  
  const productsDir = getProductsDir();
  const products: Product[] = [];
  
  if (!fs.existsSync(productsDir)) {
    cachedProducts = [];
    return [];
  }
  
  try {
    const files = fs.readdirSync(productsDir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try {
          const raw = fs.readFileSync(path.join(productsDir, f), 'utf8');
          return JSON.parse(raw) as Product;
        } catch (e) {
          console.warn(`Skipping bad product JSON: ${f}`, e);
          return null;
        }
      })
      .filter((p): p is Product => p !== null);
    
    products.push(...files);
  } catch (e) {
    console.warn('Could not load products:', e);
  }
  
  // Sort by date descending (newest first)
  products.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  
  cachedProducts = products;
  return products;
}

export function getFeaturedProducts(limit: number = 3): Product[] {
  return getAllProducts().slice(0, limit);
}

