import type { APIRoute } from 'astro';
import { checkCLIAvailability } from '../../lib/cli-executor';

export const GET: APIRoute = async () => {
  try {
    const cliStatus = await checkCLIAvailability();

    const endpoints = [
      '/api/cli/products/list.json',
      '/api/cli/assets/logos (POST)',
      '/api/cli/config/health',
      '/api/cli/site/nav/list.json'
    ];

    return new Response(JSON.stringify({
      status: 'API Layer Active',
      cli_available: cliStatus.available,
      cli_error: cliStatus.error,
      available_endpoints: endpoints,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
