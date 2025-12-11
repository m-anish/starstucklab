// src/lib/api-keys.ts
/**
 * API Key Management Utility
 * Handles API keys from environment variables with fallbacks
 */

/**
 * Get OpenAI API key
 * Priority: Environment variable → localStorage (future)
 */
export function getOpenAIKey(): string | undefined {
  // In Astro, use import.meta.env for environment variables
  const key = import.meta.env.PUBLIC_OPENAI_API_KEY;
  
  if (!key) {
    console.warn('OpenAI API key not found in environment');
    return undefined;
  }
  
  return key;
}

/**
 * Get GitHub Personal Access Token
 */
export function getGitHubToken(): string | undefined {
  const token = import.meta.env.PUBLIC_GITHUB_TOKEN;
  
  if (!token) {
    console.warn('GitHub token not found in environment');
    return undefined;
  }
  
  return token;
}

/**
 * Get GitHub repository info
 */
export function getGitHubRepo(): string | undefined {
  return import.meta.env.PUBLIC_GITHUB_REPO;
}

/**
 * Check if all required API keys are configured
 */
export function checkAPIKeys(): {
  openai: boolean;
  github: boolean;
  allConfigured: boolean;
} {
  const openai = !!getOpenAIKey();
  const github = !!getGitHubToken();
  
  return {
    openai,
    github,
    allConfigured: openai && github
  };
}

/**
 * Get API key status for UI display
 */
export function getAPIKeyStatus(): {
  openai: 'configured' | 'missing';
  github: 'configured' | 'missing';
} {
  return {
    openai: getOpenAIKey() ? 'configured' : 'missing',
    github: getGitHubToken() ? 'configured' : 'missing'
  };
}