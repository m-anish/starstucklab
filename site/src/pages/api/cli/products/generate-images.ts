import type { APIRoute } from 'astro';
import { executeCLIAdvanced, formatCLIError } from '../../../../lib/cli-executor';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.text();
    console.log('Request body:', body);

    const { productSlug, prompt } = JSON.parse(body);

    if (!productSlug) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Product slug is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Call CLI to generate AI images for the product
    const result = await executeCLIAdvanced('products', ['images', `--product=${productSlug}`]);

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
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
