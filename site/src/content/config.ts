// site/src/content/config.ts
// Fixed version - no filesystem access at runtime
import { defineCollection, z } from 'astro:content';
import configYaml from '../../config.yaml?raw';
import { parse as parseYaml } from 'yaml';

// Parse config at import time (build-time)
let siteConfig: {
  allowed_categories: string[];
  allowed_status: string[];
  default_tags: string[];
  ai_config: {
    enabled: boolean;
    provider: string;
    default_model: string;
  };
};

try {
  const parsed = parseYaml(configYaml);
  
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid config.yaml format');
  }
  
  const projectsConfig = parsed.projects || {};
  
  siteConfig = {
    allowed_categories: projectsConfig.allowed_categories || ['Other'],
    allowed_status: projectsConfig.allowed_status || ['ongoing', 'completed'],
    default_tags: projectsConfig.default_tags || [],
    ai_config: parsed.ai || {
      enabled: false,
      provider: 'openai',
      default_model: 'gpt-4'
    }
  };
} catch (error) {
  console.error('❌ Failed to load config.yaml:', error);
  
  siteConfig = {
    allowed_categories: ['Hardware', 'Software', 'Electronics', 'Other'],
    allowed_status: ['ongoing', 'completed', 'experimental'],
    default_tags: [],
    ai_config: {
      enabled: false,
      provider: 'openai',
      default_model: 'gpt-4'
    }
  };
}

// Extract values for schema validation
const categories = siteConfig.allowed_categories;
const statuses = siteConfig.allowed_status;
const productStatuses = ['available', 'unavailable', 'coming_soon', 'discontinued'];

// Type-safe tuples for zod enum
const categoryEnum = [categories[0], ...categories.slice(1)] as [string, ...string[]];
const statusEnum = [statuses[0], ...statuses.slice(1)] as [string, ...string[]];
const productStatusEnum = [productStatuses[0], ...productStatuses.slice(1)] as [string, ...string[]];

// Define collections
const projectsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    category: z.enum(categoryEnum),
    status: z.enum(statusEnum),
    date: z.coerce.date(),
    excerpt: z.string(),
    tags: z.array(z.string()).optional().default([]),
    updated: z.coerce.date().optional(),
    featured: z.boolean().optional().default(false),
    image: z.string().optional(),
    image_alt: z.string().optional(),
  }),
});

const productsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    status: z.enum(productStatusEnum),
    date: z.coerce.date(),
    excerpt: z.string(),
    price: z.number().optional(),
    currency: z.string().optional(),
    tags: z.array(z.string()).optional().default([]),
    images: z.any().optional()
  }),
});

export const collections = {
  'projects': projectsCollection,
  'products': productsCollection,
};

export { siteConfig };