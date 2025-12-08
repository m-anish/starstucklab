import type { APIRoute } from 'astro';
import { executeCLIAdvanced, formatCLIError } from '../../../../lib/cli-executor';

export const POST: APIRoute = async () => {
  try {
    const result = await executeCLIAdvanced('assets', ['logos']);

    if (result.success) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Logo variants generated successfully',
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
