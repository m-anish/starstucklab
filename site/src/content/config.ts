// site/src/content/config.ts
// Astro Content Collections configuration for projects

import { defineCollection, z } from 'astro:content';

const projectsCollection = defineCollection({
  type: 'content', // markdown/mdx files
  schema: z.object({
    // Required fields
    slug: z.string(),
    title: z.string(),
    category: z.string(),
    status: z.enum(['completed', 'ongoing', 'experimental', 'abandoned', 'dormant', 'planned']),
    date: z.string().or(z.date()),
    excerpt: z.string(),
    
    // Optional fields
    tags: z.array(z.string()).optional().default([]),
    updated: z.string().or(z.date()).optional(),
    featured: z.boolean().optional().default(false),
    image: z.string().optional(),
    image_alt: z.string().optional(),
  }),
});

export const collections = {
  'projects': projectsCollection,
};