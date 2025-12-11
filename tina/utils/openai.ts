// tina/utils/openai.ts
/**
 * OpenAI API Utilities for Tina CMS
 */

/**
 * Get OpenAI API key from environment
 * Note: In Tina custom fields, we access env vars differently
 */
function getOpenAIKey(): string {
  // Try to get from window (client-side)
  if (typeof window !== 'undefined') {
    // @ts-ignore - Vite injects these
    const key = import.meta.env.PUBLIC_OPENAI_API_KEY;
    if (!key) {
      throw new Error('OpenAI API key not found. Please configure PUBLIC_OPENAI_API_KEY in your .env file.');
    }
    return key;
  }
  throw new Error('OpenAI key can only be accessed client-side');
}

/**
 * Generate text using OpenAI GPT-4
 */
export async function generateText(
  prompt: string,
  options: {
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<string> {
  const {
    systemPrompt = 'You are a helpful assistant.',
    maxTokens = 500,
    temperature = 0.7
  } = options;

  const apiKey = getOpenAIKey();

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: temperature
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Generate an excerpt for a product/project
 */
export async function generateExcerpt(
  title: string,
  category?: string,
  context?: string
): Promise<string> {
  const prompt = `Generate a compelling one-sentence excerpt (max 20 words) for a product/project called "${title}"${category ? ` in the ${category} category` : ''}${context ? `. Context: ${context}` : ''}.

The excerpt should be:
- Poetic and intriguing
- Slightly melancholic with dry humor
- Evocative of cosmic existentialism
- Technical yet elegant

Return ONLY the excerpt, nothing else.`;

  const systemPrompt = `You are a creative writer for Starstuck Lab, a maker space that builds scientific instruments, telescopes, and weather stations. Your writing style is poetic, melancholic, witty with dry humor, and tinged with cosmic existentialism.`;

  return generateText(prompt, { systemPrompt, maxTokens: 100, temperature: 0.8 });
}

/**
 * Generate a full description for a product/project
 */
export async function generateDescription(
  title: string,
  options: {
    category?: string;
    context?: string;
    features?: string[];
    length?: 'short' | 'medium' | 'long';
  } = {}
): Promise<string> {
  const { category, context, features, length = 'medium' } = options;
  
  const wordCount = {
    short: '100-150',
    medium: '200-300',
    long: '400-500'
  }[length];

  let prompt = `Generate a product description for "${title}"${category ? `, a ${category}` : ''}.

${context ? `Context: ${context}\n` : ''}${features?.length ? `Key features: ${features.join(', ')}\n` : ''}
Write ${wordCount} words in a style that is:
- Poetic and evocative
- Slightly melancholic with dry humor
- Technical yet accessible
- Tinged with cosmic existentialism
- Include specifications where relevant

Return ONLY the description in markdown format.`;

  const systemPrompt = `You are a creative technical writer for Starstuck Lab, a maker space that builds scientific instruments. Your writing balances poetry with precision, melancholy with wonder.`;

  return generateText(prompt, { 
    systemPrompt, 
    maxTokens: length === 'long' ? 800 : 500,
    temperature: 0.7 
  });
}

/**
 * Generate relevant tags for a product/project
 */
export async function generateTags(
  title: string,
  description: string,
  maxTags: number = 5
): Promise<string[]> {
  const prompt = `Generate ${maxTags} relevant tags for this product:

Title: ${title}
Description: ${description}

Return ONLY a comma-separated list of tags, nothing else.`;

  const systemPrompt = `You generate concise, relevant tags for products and projects.`;

  const result = await generateText(prompt, { systemPrompt, maxTokens: 100, temperature: 0.5 });
  
  // Parse comma-separated tags
  return result
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)
    .slice(0, maxTags);
}

/**
 * Generate an image using DALL-E 3
 */
export async function generateImage(
  prompt: string,
  options: {
    size?: '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
  } = {}
): Promise<string> {
  const { size = '1024x1024', quality = 'standard' } = options;
  
  const apiKey = getOpenAIKey();

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: size,
      quality: quality
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`DALL-E API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.data[0].url;
}