import type { APIRoute } from 'astro';
import { executeCLIAdvanced, formatCLIError } from '../../../../lib/cli-executor';

export const GET: APIRoute = async () => {
  try {
    const result = await executeCLIAdvanced('products', ['list']);

    if (result.success) {
      // Parse the CLI output into structured data
      const products = parseProductList(result.output);

      return new Response(JSON.stringify({
        success: true,
        data: products,
        output: result.output
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: formatCLIError(result.error || 'Unknown error', result.exitCode),
        output: result.output
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

function parseProductList(output: string): any[] {
  const lines = output.split('\n').filter(line => line.trim());
  const products: any[] = [];

  // Find the table data (skip headers and separator)
  let foundTable = false;

  for (const line of lines) {
    // Skip until we find the separator line
    if (line.includes('---') || line.includes('═══')) {
      foundTable = true;
      continue;
    }

    // Skip header lines
    if (!foundTable || line.includes('Status') || line.includes('Slug') || line.includes('Found') || line.includes('product')) {
      continue;
    }

    // Parse data rows
    if (foundTable && line.trim()) {
      // Split by multiple spaces, but handle the status emoji specially
      const parts = line.split(/\s{2,}/);

      if (parts.length >= 5) {
        // Extract status (remove emoji and clean up)
        const statusWithEmoji = parts[0];
        const status = statusWithEmoji.replace(/^[🟡🟢🔴]\s*/, '').replace(/\s+/g, '_').toLowerCase();

        // Extract other fields
        const slug = parts[1];
        const title = parts[2];
        const price = parts[3];
        const tags = parts[4];

        products.push({
          status: status || 'unknown',
          slug: slug || '',
          title: title || '',
          price: price || '',
          tags: tags ? tags.split(', ') : []
        });
      }
    }
  }

  return products;
}
