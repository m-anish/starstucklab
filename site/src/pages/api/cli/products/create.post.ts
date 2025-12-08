import type { APIRoute } from 'astro';
import { executeCLIAdvanced, formatCLIError } from '../../../../lib/cli-executor';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.json();

    // Validate required fields
    if (!formData.title) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Product title is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build CLI arguments from form data
    const args = ['create'];

    // Add title (required)
    args.push(formData.title);

    // Add optional parameters
    if (formData.category) {
      args.push(`--category=${formData.category}`);
    }
    if (formData.status) {
      args.push(`--status=${formData.status}`);
    }
    if (formData.tags && Array.isArray(formData.tags)) {
      args.push(`--tags=${formData.tags.join(',')}`);
    }
    if (formData.ai !== undefined) {
      args.push('--ai');
    }
    if (formData.interactive === false) {
      args.push('--no-interactive');
    }

    const result = await executeCLIAdvanced('products', args);

    if (result.success) {
      // Try to extract product slug from output
      const slugMatch = result.output.match(/Created product: ([^\s]+)/);
      const productSlug = slugMatch ? slugMatch[1] : formData.title.toLowerCase().replace(/[^a-z0-9]/g, '-');

      return new Response(JSON.stringify({
        success: true,
        productSlug,
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
