import { defineConfig } from "tinacms";
import AITextField from "./fields/AITextField";

// Your hosting provider likely exposes this as an environment variable
const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";

export default defineConfig({
  branch,

  // Get this from tina.io
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,  // ← Kept as NEXT_PUBLIC
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
  // See docs on content modeling for more info on how to setup new content models: https://tina.io/docs/r/content-modelling-collections/
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
          // 🎯 AI-POWERED EXCERPT FIELD
          {
            type: "string",
            name: "excerpt",
            label: "Excerpt",
            required: true,
            description: "A compelling one-sentence description (AI-powered)",
            ui: {
              component: AITextField,  // ← AI component
            },
          },
          {
            type: "object",
            name: "images",
            label: "Images",
            fields: [
              {
                type: "string",
                name: "master",
                label: "Master Image Path",
              }
            ]
          },
          {
            type: "rich-text",
            name: "body",
            label: "Body",
            isBody: true,
          },
        ],
      },
      
      // Projects Collection
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
          // 🎯 AI-POWERED EXCERPT FIELD
          {
            type: "string",
            name: "excerpt",
            label: "Excerpt",
            required: true,
            description: "A brief project summary (AI-powered)",
            ui: {
              component: AITextField,  // ← AI component
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