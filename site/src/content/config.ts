// site/src/content/config.ts
// Astro Content Collections configuration
// Now reads from central config.yaml at site root

import { defineCollection, z } from 'astro:content';
import { readFileSync, existsSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Read config.yaml from site root (two levels up from this file)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const configPath = join(__dirname, '../../config.yaml');

// Load and parse central config.yaml
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
    throw new Error(`Central config.yaml not found at ${configPath}`);
  }
  
  const configYaml = readFileSync(configPath, 'utf-8');
  const parsed = parseYaml(configYaml);
  
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid config.yaml format - not an object');
  }
  
  // Extract projects section
  const projectsConfig = parsed.projects || {};
  
  if (!projectsConfig.allowed_categories || projectsConfig.allowed_categories.length === 0) {
    throw new Error('projects.allowed_categories is missing or empty in config.yaml');
  }
  
  siteConfig = {
    allowed_categories: projectsConfig.allowed_categories,
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
  console.error('   Path attempted:', configPath);
  console.error('   Using fallback defaults');
  
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

// Define projects collection with dynamic enums from central config.yaml
const projectsCollection = defineCollection({
  type: 'content', // markdown/mdx files
  schema: z.object({
    // Required fields
    title: z.string(),
    category: z.enum(categoryEnum),
    status: z.enum(statusEnum),
    date: z.coerce.date(),
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