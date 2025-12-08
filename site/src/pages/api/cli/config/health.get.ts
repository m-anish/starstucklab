import type { APIRoute } from 'astro';
import { executeCLIAdvanced, formatCLIError } from '../../../../lib/cli-executor';

export const GET: APIRoute = async ({ url }) => {
  try {
    const fix = url.searchParams.get('fix') === 'true';
    const args = ['health'];

    if (fix) {
      args.push('--fix');
    }

    const result = await executeCLIAdvanced('config', args);

    if (result.success) {
      return new Response(JSON.stringify({
        success: true,
        healthy: true,
        message: 'Configuration is healthy',
        output: result.output
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Parse issues from output
      const issues = parseHealthIssues(result.output);

      return new Response(JSON.stringify({
        success: false,
        healthy: false,
        issues,
        error: formatCLIError(result.error || 'Configuration issues found', result.exitCode),
        output: result.output
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

function parseHealthIssues(output: string): string[] {
  const lines = output.split('\n');
  const issues: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('❌') || trimmed.startsWith('⚠️') || trimmed.includes('error') || trimmed.includes('missing')) {
      issues.push(trimmed.replace(/^[❌⚠️]\s*/, ''));
    }
  }

  return issues;
}
