// site/src/pages/api/cli/products/generate-images.ts
import type { APIRoute } from 'astro';
import { executeCLIAdvanced, formatCLIError } from '../../../../lib/cli-executor';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Check Content-Type first (be more flexible for development)
    const contentType = request.headers.get('content-type');
    console.log('Content-Type header:', contentType);

    // Allow missing or flexible content-type for development
    const hasValidContentType = !contentType ||
                               contentType.includes('application/json') ||
                               contentType.includes('json');

    if (!hasValidContentType) {
      return new Response(JSON.stringify({
        success: false,
        error: `Content-Type must be application/json. Received: ${contentType || 'none'}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if body exists (prevent empty body JSON parsing error)
    const contentLength = request.headers.get('content-length');
    console.log('Content-Length header:', contentLength);

    // For development, be more lenient with content-length checks
    // Some clients/browsers might not set this header

    // Debug: Check what's actually in the request body
    const rawBody = await request.text();
    console.log('Raw request body:', rawBody);

    // Now safely parse JSON with proper error handling
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body',
        details: parseError instanceof Error ? parseError.message : 'Unknown parsing error',
        rawBody: rawBody // Debug info
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
