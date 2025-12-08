/**
 * CLI Executor Utility
 *
 * Provides utilities for executing CLI commands from the web interface.
 * Handles both synchronous and asynchronous command execution with proper
 * error handling and output streaming.
 */

export interface CLIResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode?: number;
  data?: any; // Parsed JSON data when applicable
}

export interface CLIProgressCallback {
  (chunk: string): void;
}

/**
 * Execute a CLI command synchronously
 * Suitable for quick operations like list, validate, etc.
 */
export async function executeCLI(
  command: string,
  args: string[] = []
): Promise<string> {
  const result = await executeCLIAdvanced(command, args);
  if (!result.success) {
    throw new Error(result.error || 'CLI command failed');
  }
  return result.output;
}

/**
 * Execute a CLI command with full result information
 */
export async function executeCLIAdvanced(
  command: string,
  args: string[] = []
): Promise<CLIResult> {
  return new Promise((resolve) => {
    // Import spawn dynamically to avoid issues in environments without Node.js
    import('child_process').then(({ spawn }) => {
      const cli = spawn('python', ['tools/cli.py', command, ...args], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, PYTHONUNBUFFERED: '1' } // Ensure unbuffered output
      });

      let stdout = '';
      let stderr = '';

      cli.stdout.on('data', (data: Buffer) => {
        const chunk = data.toString();
        stdout += chunk;
      });

      cli.stderr.on('data', (data: Buffer) => {
        const chunk = data.toString();
        stderr += chunk;
      });

      cli.on('close', (code: number | null) => {
        const exitCode = code ?? -1;
        const success = exitCode === 0;

        // Try to parse JSON output if it looks like JSON
        let data: any = undefined;
        if (success && stdout.trim().startsWith('{')) {
          try {
            data = JSON.parse(stdout.trim());
          } catch (e) {
            // Not JSON, leave as string
          }
        }

        resolve({
          success,
          output: stdout,
          error: stderr || (success ? undefined : `Command failed with exit code ${exitCode}`),
          exitCode,
          data
        });
      });

      cli.on('error', (error: Error) => {
        resolve({
          success: false,
          output: '',
          error: `Failed to execute command: ${error.message}`,
          exitCode: -1
        });
      });
    }).catch((error) => {
      resolve({
        success: false,
        output: '',
        error: `Failed to import child_process: ${error.message}`,
        exitCode: -1
      });
    });
  });
}

/**
 * Execute a CLI command asynchronously with progress callbacks
 * Suitable for long-running operations like AI generation, optimization
 */
export async function executeCLIAsync(
  command: string,
  args: string[] = [],
  onProgress?: CLIProgressCallback
): Promise<CLIResult> {
  return new Promise((resolve) => {
    import('child_process').then(({ spawn }) => {
      const cli = spawn('python', ['tools/cli.py', command, ...args], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
      });

      let stdout = '';
      let stderr = '';

      cli.stdout.on('data', (data: Buffer) => {
        const chunk = data.toString();
        stdout += chunk;
        onProgress?.(chunk);
      });

      cli.stderr.on('data', (data: Buffer) => {
        const chunk = data.toString();
        stderr += chunk;
        onProgress?.(chunk);
      });

      cli.on('close', (code: number | null) => {
        const exitCode = code ?? -1;
        const success = exitCode === 0;

        resolve({
          success,
          output: stdout,
          error: stderr || (success ? undefined : `Command failed with exit code ${exitCode}`),
          exitCode
        });
      });

      cli.on('error', (error: Error) => {
        resolve({
          success: false,
          output: '',
          error: `Failed to execute command: ${error.message}`,
          exitCode: -1
        });
      });
    }).catch((error) => {
      resolve({
        success: false,
        output: '',
        error: `Failed to import child_process: ${error.message}`,
        exitCode: -1
      });
    });
  });
}

/**
 * Check if CLI tools are available
 */
export async function checkCLIAvailability(): Promise<{
  available: boolean;
  error?: string;
  version?: string;
}> {
  try {
    const result = await executeCLIAdvanced('--help');
    return {
      available: result.success,
      version: result.success ? 'Available' : undefined,
      error: result.error
    };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Parse CLI output for common patterns
 */
export function parseCLIOutput(output: string): {
  lines: string[];
  hasTable: boolean;
  hasJson: boolean;
  jsonData?: any;
} {
  const lines = output.split('\n').filter(line => line.trim());

  // Check for JSON
  if (output.trim().startsWith('{') || output.trim().startsWith('[')) {
    try {
      const jsonData = JSON.parse(output.trim());
      return {
        lines,
        hasTable: false,
        hasJson: true,
        jsonData
      };
    } catch (e) {
      // Not valid JSON
    }
  }

  // Check for table format (looking for separator lines with dashes)
  const hasTable = lines.some(line =>
    line.includes('---') || line.includes('===') ||
    (line.includes('-') && line.split('-').length > 3)
  );

  return {
    lines,
    hasTable,
    hasJson: false
  };
}

/**
 * Format CLI error for user display
 */
export function formatCLIError(error: string, exitCode?: number): string {
  if (exitCode === 130) {
    return 'Operation cancelled by user';
  } else if (exitCode === 1) {
    return 'Command failed - check input parameters';
  } else if (error.includes('ImportError') || error.includes('ModuleNotFoundError')) {
    return 'CLI dependency missing - try running from project root';
  } else if (error.includes('FileNotFoundError') || error.includes('No such file')) {
    return 'Required file not found - ensure all assets exist';
  } else {
    return error;
  }
}
