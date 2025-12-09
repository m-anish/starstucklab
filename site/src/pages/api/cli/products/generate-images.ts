// site/src/pages/api/cli/products/generate-images.ts
import type { APIRoute } from 'astro';
import { executeCLIAdvanced, formatCLIError } from '../../../../lib/cli-executor';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body',
        details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { productSlug, prompt } = body;

    // Validate required field
    if (!productSlug) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Product slug is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Call CLI to generate AI images for the product (non-interactive mode for API)
    const result = await executeCLIAdvanced('products', ['images', `--product=${productSlug}`, '--api']);

    if (result.success) {
      return new Response(JSON.stringify({
        success: true,
        message: 'AI images generated successfully',
        productSlug: productSlug,
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
    // Enhanced error handling with more details
    console.error('API Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
