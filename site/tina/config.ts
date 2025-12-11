import { defineConfig } from "tinacms";

// Your branch (main or master)
const branch = process.env.TINA_BRANCH || "main";

export default defineConfig({
  branch,
  
  // Get these from .env
  clientId: process.env.TINA_PUBLIC_CLIENT_ID,
  token: process.env.TINA_TOKEN,

  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  
  media: {
    tina: {
      mediaRoot: "assets",
      publicFolder: "public",
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
          {
            type: "string",
            name: "excerpt",
            label: "Excerpt",
            required: true,
            ui: {
              component: "textarea",
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
          {
            type: "string",
            name: "excerpt",
            label: "Excerpt",
            required: true,
            ui: {
              component: "textarea",
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