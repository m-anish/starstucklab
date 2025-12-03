// site/src/content/config.ts
// Astro Content Collections configuration
// Reads allowed values from config.yaml to stay in sync with CLI tool

import { defineCollection, z } from 'astro:content';
import { readFileSync, existsSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Read config.yaml from same directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const configPath = join(__dirname, '../data/projects/config.yaml');

// Load and parse config.yaml with better error handling
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
  if (!existsSync(configPath)) {
    throw new Error('config.yaml not found');
  }
  const configYaml = readFileSync(configPath, 'utf-8');
  const parsed = parseYaml(configYaml);
  
  // Validate parsed config
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid config.yaml format');
  }
  
  siteConfig = {
    allowed_categories: parsed.allowed_categories || ['Other'],
    allowed_status: parsed.allowed_status || ['ongoing', 'completed'],
    default_tags: parsed.default_tags || [],
    ai_config: parsed.ai_config || {
      enabled: false,
      provider: 'openai',
      default_model: 'gpt-4'
    }
  };
} catch (error) {
  console.warn('⚠️  Failed to load config.yaml, using fallback defaults');
  siteConfig = {
    allowed_categories: ['Other'],
    allowed_status: ['ongoing', 'completed'],
    default_tags: [],
    ai_config: {
      enabled: false,
      provider: 'openai',
      default_model: 'gpt-4'
    }
  };
}

// Extract values for schema validation
const categories = siteConfig.allowed_categories || ['Other'];
const statuses = siteConfig.allowed_status || ['ongoing', 'completed'];

// Type-safe tuples for zod enum (requires at least 1 value)
const categoryEnum = categories.length > 0 
  ? [categories[0], ...categories.slice(1)] as [string, ...string[]]
  : ['Other'] as [string, ...string[]];

const statusEnum = statuses.length > 0
  ? [statuses[0], ...statuses.slice(1)] as [string, ...string[]]
  : ['ongoing'] as [string, ...string[]];

// Define projects collection with dynamic enums from config.yaml
const projectsCollection = defineCollection({
  type: 'content', // markdown/mdx files
  schema: z.object({
    // Required fields
    title: z.string(),
    category: z.enum(categoryEnum),
    status: z.enum(statusEnum),
    date: z.coerce.date(), // Use coerce to handle string dates
    excerpt: z.string(),
    
    // Optional fields
    tags: z.array(z.string()).optional().default([]),
    updated: z.coerce.date().optional(),
    featured: z.boolean().optional().default(false),
    image: z.string().optional(),
    image_alt: z.string().optional(),
  }),
});

export const collections = {
  'projects': projectsCollection,
};

// Export site config for use in other Astro components if needed
export { siteConfig };