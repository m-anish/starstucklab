import { defineCollection, z } from 'astro:content';

const productStatuses = ['available', 'unavailable', 'coming_soon', 'discontinued'] as const;
const stockStatuses = ['in_stock', 'low_stock', 'out_of_stock', 'build_to_order', 'pre_order'] as const;

const productsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    slug: z.string().optional(),
    title: z.string(),
    tagline: z.string().optional(),
    status: z.enum(productStatuses),
    stock_status: z.enum(stockStatuses).optional(),
    lead_time: z.string().optional(),
    date: z.coerce.date(),
    excerpt: z.string(),
    price: z.number().optional(),
    currency: z.string().optional().default('INR'),
    tags: z.array(z.string()).optional().default([]),

    features: z.array(z.object({
      icon: z.string(),
      title: z.string(),
      description: z.string(),
    })).optional(),

    customization: z.object({
      enabled: z.boolean().optional().default(false),
      options: z.array(z.object({
        label: z.string(),
        values: z.array(z.string()),
      })).optional().default([]),
    }).optional(),

    specifications: z.array(z.object({
      label: z.string(),
      value: z.string(),
    })).optional(),

    images: z.object({
      master: z.string().optional(),
    }).optional(),
  }),
});

const labNotesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    excerpt: z.string(),
    tags: z.array(z.string()).optional().default([]),
    featured: z.boolean().optional().default(false),
    image: z.string().optional(),
  }),
});

export const collections = {
  products: productsCollection,
  'lab-notes': labNotesCollection,
};
