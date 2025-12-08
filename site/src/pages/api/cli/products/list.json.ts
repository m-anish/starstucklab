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

  // Skip header lines and find the table data
  let inTable = false;
  let headers: string[] = [];

  for (const line of lines) {
    if (line.includes('Status') && line.includes('Slug') && line.includes('Title')) {
      // Found header row
      headers = line.split(/\s{2,}/).map(h => h.trim());
      inTable = true;
      continue;
    }

    if (inTable && line.includes('---')) {
      // Found separator, skip it
      continue;
    }

    if (inTable && line.trim() && !line.includes('Found') && !line.includes('product')) {
      // This is a data row
      const values = line.split(/\s{2,}/).map(v => v.trim());
      if (values.length >= headers.length) {
        const product: any = {};
        headers.forEach((header, index) => {
          if (values[index]) {
            product[header.toLowerCase()] = values[index];
          }
        });
        products.push(product);
      }
    }
  }

  return products;
}
