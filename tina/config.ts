import { defineConfig } from "tinacms";
import AITextField from "./fields/AITextField";
import AIFeaturesField from "./fields/AIFeaturesField";
import AISpecificationsField from "./fields/AISpecificationsField";
import AITagsField from "./fields/AITagsField";
import AIDescriptionGenerator from "./fields/AIDescriptionGenerator";
import AIImageField from "./fields/AIImageField";

// Your hosting provider likely exposes this as an environment variable
const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";

export default defineConfig({
  branch,

  // Get this from tina.io
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
  // Get this from tina.io
  token: process.env.TINA_TOKEN,

  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  media: {
    tina: {
      publicFolder: "public",
      mediaRoot: "assets",
    },
  },
  schema: {
    collections: [
      // Products Collection
      {
        name: "product",
        label: "Products",
        path: "src/content/products",
        format: "md",
        fields: [
          {
            type: "string",
            name: "slug",
            label: "Slug",
            required: true,
            description: "URL-friendly identifier (e.g., 'telescope-m42')"
          },
          {
            type: "string",
            name: "title",
            label: "Title",
            required: true,
          },
          {
            type: "string",
            name: "category",
            label: "Category",
            options: ["Telescope", "Weather Station", "Electronics", "Hardware", "Software", "Other"],
            required: false,
            description: "Product category for AI content generation"
          },
          // 🎯 AI-POWERED TAGLINE FIELD
          {
            type: "string",
            name: "tagline",
            label: "Tagline",
            required: false,
            description: "Short, catchy product tagline (AI-powered)",
            ui: {
              component: AITextField,
            },
          },
          {
            type: "number",
            name: "price",
            label: "Price",
            required: false,
          },
          {
            type: "string",
            name: "currency",
            label: "Currency",
            options: ["INR", "USD", "EUR"],
            required: false,
          },
          {
            type: "string",
            name: "status",
            label: "Status",
            options: ["available", "coming_soon", "unavailable", "discontinued"],
            required: true,
          },
          {
            type: "string",
            name: "stock_status",
            label: "Stock Status",
            options: ["in_stock", "low_stock", "out_of_stock", "pre_order"],
            required: false,
          },
          // 🎯 AI-POWERED TAGS FIELD
          {
            type: "string",
            name: "tags",
            label: "Tags",
            list: true,
            description: "Relevant tags for search and categorization (AI-powered)",
            ui: {
              component: AITagsField,
            },
          },
          {
            type: "datetime",
            name: "date",
            label: "Date",
            required: true,
          },
          // 🎯 AI-POWERED EXCERPT FIELD
          {
            type: "string",
            name: "excerpt",
            label: "Excerpt",
            required: true,
            description: "A compelling one-sentence description (AI-powered)",
            ui: {
              component: AITextField,
            },
          },
          // 🎯 AI-POWERED FEATURES FIELD
          {
            type: "object",
            name: "features",
            label: "Product Features",
            list: true,
            ui: {
              itemProps: (item) => {
                return { label: item?.title || "Feature" };
              },
              component: AIFeaturesField,
            },
            fields: [
              {
                type: "string",
                name: "icon",
                label: "Icon",
                description: "Icon name (e.g., 'telescope', 'palette', 'alert-triangle', 'cog')",
                options: [
                  "telescope",
                  "palette",
                  "alert-triangle",
                  "cog",
                  "zap",
                  "box",
                  "cpu",
                  "settings",
                  "shield",
                  "star",
                  "circle-dot",
                  "gauge"
                ],
              },
              {
                type: "string",
                name: "title",
                label: "Title",
                required: true,
              },
              {
                type: "string",
                name: "description",
                label: "Description",
                required: true,
                ui: {
                  component: "textarea",
                },
              },
            ],
          },
          // Customization options
          {
            type: "object",
            name: "customization",
            label: "Customization Options",
            fields: [
              {
                type: "boolean",
                name: "enabled",
                label: "Enable Customization",
              },
              {
                type: "object",
                name: "options",
                label: "Options",
                list: true,
                fields: [
                  {
                    type: "string",
                    name: "label",
                    label: "Label",
                  },
                  {
                    type: "string",
                    name: "values",
                    label: "Values",
                    list: true,
                  },
                ],
              },
            ],
          },
          // 🎯 AI-POWERED SPECIFICATIONS FIELD
          {
            type: "object",
            name: "specifications",
            label: "Specifications",
            list: true,
            description: "Technical specifications (AI-powered generation available)",
            ui: {
              itemProps: (item) => {
                return { label: item?.label || "Specification" };
              },
              component: AISpecificationsField,
            },
            fields: [
              {
                type: "string",
                name: "label",
                label: "Label",
                required: true,
              },
              {
                type: "string",
                name: "value",
                label: "Value",
                required: true,
              },
            ],
          },
          // 🎯 AI-POWERED IMAGES FIELD
          {
            type: "string",
            name: "image",
            label: "Product Image",
            description: "Product image URL or path (AI generation available)",
            ui: {
              component: AIImageField,
            },
          },
          // 🎯 AI DESCRIPTION GENERATOR (Custom field that doesn't store data)
          {
            type: "string",
            name: "_ai_generator",
            label: "AI Description Generator",
            description: "Generate product description using AI",
            ui: {
              component: AIDescriptionGenerator,
            },
          },
          // 🎯 BODY FIELD (Native rich-text editor, no custom component)
          {
            type: "rich-text",
            name: "body",
            label: "Product Description",
            description: "Full product description (use AI generator above to auto-generate)",
            isBody: true,
            // NO custom component - use TinaCMS default rich-text editor
          },
        ],
      },
      
      // Projects Collection (unchanged)
      {
        name: "project",
        label: "Projects",
        path: "src/content/projects",
        format: "md",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            required: true,
          },
          {
            type: "string",
            name: "category",
            label: "Category",
            options: [
              "Hardware",
              "Software",
              "Electronics",
              "Telescope",
              "Weather",
              "Mechanical",
              "Science",
              "Art",
              "Other"
            ],
            required: true,
          },
          {
            type: "string",
            name: "status",
            label: "Status",
            options: [
              "ongoing",
              "completed",
              "experimental",
              "abandoned",
              "dormant"
            ],
            required: true,
          },
          {
            type: "string",
            name: "tags",
            label: "Tags",
            list: true,
          },
          {
            type: "datetime",
            name: "date",
            label: "Date",
            required: true,
          },
          {
            type: "datetime",
            name: "updated",
            label: "Last Updated",
          },
          {
            type: "boolean",
            name: "featured",
            label: "Featured",
          },
          {
            type: "string",
            name: "excerpt",
            label: "Excerpt",
            required: true,
            description: "A brief project summary (AI-powered)",
            ui: {
              component: AITextField,
            },
          },
          {
            type: "string",
            name: "image",
            label: "Image Path",
          },
          {
            type: "string",
            name: "image_alt",
            label: "Image Alt Text",
          },
          {
            type: "rich-text",
            name: "body",
            label: "Body",
            isBody: true,
          },
        ],
      },
    ],
  },
});