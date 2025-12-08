import type { APIRoute } from 'astro';
import { executeCLIAdvanced, formatCLIError } from '../../../../../lib/cli-executor';

export const GET: APIRoute = async () => {
  try {
    const result = await executeCLIAdvanced('site', ['nav', 'list']);

    if (result.success) {
      // Parse navigation items from output
      const navItems = parseNavigationList(result.output);

      return new Response(JSON.stringify({
        success: true,
        data: navItems,
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

function parseNavigationList(output: string): any[] {
  const lines = output.split('\n').filter(line => line.trim());
  const navItems: any[] = [];

  // Skip header and find table data
  let inTable = false;
  let headers: string[] = [];

  for (const line of lines) {
    if (line.includes('Priority') && line.includes('Label') && line.includes('URL')) {
      headers = line.split(/\s{2,}/).map(h => h.trim());
      inTable = true;
      continue;
    }

    if (inTable && line.includes('---')) {
      continue; // Skip separator
    }

    if (inTable && line.trim() && !line.includes('Navigation Items') && !line.includes('found')) {
      const values = line.split(/\s{2,}/).map(v => v.trim());
      if (values.length >= headers.length) {
        const item: any = {};
        headers.forEach((header, index) => {
          if (values[index]) {
            item[header.toLowerCase()] = values[index];
          }
        });
        navItems.push(item);
      }
    }
  }

  return navItems;
}
