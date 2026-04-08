import { config, collection, fields } from '@keystatic/core';

export default config({
  storage: {
    kind: 'local',
  },

  collections: {
    products: collection({
      label: 'Products',
      slugField: 'title',
      path: 'src/content/products/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        tagline: fields.text({ label: 'Tagline', description: 'Short punchy one-liner' }),
        price: fields.integer({ label: 'Price (INR)', validation: { isRequired: true, min: 0 } }),
        currency: fields.text({ label: 'Currency', defaultValue: 'INR' }),
        status: fields.select({
          label: 'Status',
          options: [
            { label: 'Available', value: 'available' },
            { label: 'Unavailable', value: 'unavailable' },
            { label: 'Coming Soon', value: 'coming_soon' },
            { label: 'Discontinued', value: 'discontinued' },
          ],
          defaultValue: 'available',
        }),
        stock_status: fields.select({
          label: 'Stock Status',
          options: [
            { label: 'In Stock', value: 'in_stock' },
            { label: 'Low Stock', value: 'low_stock' },
            { label: 'Out of Stock', value: 'out_of_stock' },
            { label: 'Build to Order', value: 'build_to_order' },
            { label: 'Pre-Order', value: 'pre_order' },
          ],
          defaultValue: 'in_stock',
        }),
        lead_time: fields.text({
          label: 'Lead Time',
          description: 'e.g. "2–3 weeks". Only shown for build_to_order.',
        }),
        excerpt: fields.text({ label: 'Excerpt', multiline: true }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.fields.value || 'Tag',
        }),
        date: fields.date({ label: 'Date Added' }),
        features: fields.array(
          fields.object({
            icon: fields.text({ label: 'Icon name' }),
            title: fields.text({ label: 'Feature title' }),
            description: fields.text({ label: 'Description', multiline: true }),
          }),
          { label: 'Features', itemLabel: (props) => props.fields.title || 'Feature' }
        ),
        specifications: fields.array(
          fields.object({
            label: fields.text({ label: 'Label' }),
            value: fields.text({ label: 'Value' }),
          }),
          { label: 'Specifications', itemLabel: (props) => props.fields.label || 'Spec' }
        ),
        masterImage: fields.text({ label: 'Master Image Path', description: 'e.g. /assets/product-m42/master.png' }),
        youtube_url: fields.text({
          label: 'YouTube Demo URL',
          description: 'Paste a full YouTube URL or video ID to embed a demo video on the product page.',
        }),
        content: fields.document({
          label: 'Product Description',
          formatting: true,
          links: true,
        }),
      },
    }),

    'lab-notes': collection({
      label: 'Lab Notes',
      slugField: 'title',
      path: 'src/content/lab-notes/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        date: fields.date({ label: 'Date', validation: { isRequired: true } }),
        excerpt: fields.text({ label: 'Excerpt', multiline: true }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.fields.value || 'Tag',
        }),
        featured: fields.checkbox({ label: 'Featured', defaultValue: false }),
        image: fields.text({ label: 'Cover Image Path (optional)' }),
        content: fields.document({
          label: 'Content',
          formatting: true,
          links: true,
          images: { directory: 'public/assets/lab-notes', publicPath: '/assets/lab-notes' },
        }),
      },
    }),
  },
});
