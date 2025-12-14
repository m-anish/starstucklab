// tina/utils/openai.ts
/**
 * OpenAI API Utilities for Tina CMS - Enhanced with Feature Generation
 */

/**
 * Call OpenAI API through secure server endpoint
 */
async function callOpenAIEndpoint(action: 'generate_text' | 'generate_image', prompt: string, options: any = {}): Promise<any> {
  const response = await fetch('/api/openai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action,
      prompt,
      options
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'OpenAI API call failed');
  }

  const data = await response.json();
  return data.result;
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
  return callOpenAIEndpoint('generate_text', prompt, options);
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
 * Generate a tagline for a product
 */
export async function generateTagline(
  title: string,
  category?: string
): Promise<string> {
  const prompt = `Generate a short, catchy tagline (max 12 words) for "${title}"${category ? `, a ${category}` : ''}.

The tagline should be:
- Memorable and punchy
- Poetic with dry humor
- Slightly melancholic
- Technical yet accessible

Return ONLY the tagline, nothing else.`;

  const systemPrompt = `You are a creative copywriter for Starstuck Lab. Your taglines are poetic, witty, and tinged with cosmic existentialism.`;

  return generateText(prompt, { systemPrompt, maxTokens: 50, temperature: 0.85 });
}

/**
 * Generate product features with icons
 */
export async function generateFeatures(
  title: string,
  options: {
    category?: string;
    description?: string;
    numFeatures?: number;
  } = {}
): Promise<Array<{ icon: string; title: string; description: string }>> {
  const { category, description, numFeatures = 4 } = options;

  const availableIcons = [
    'telescope', 'palette', 'alert-triangle', 'cog', 'zap', 
    'box', 'cpu', 'settings', 'shield', 'star', 'circle-dot', 'gauge'
  ];

  const prompt = `Generate ${numFeatures} product features for "${title}"${category ? `, a ${category}` : ''}.
${description ? `\nProduct description: ${description}\n` : ''}
Each feature should have:
- A title (3-7 words, descriptive and slightly humorous in Starstuck Lab style)
- A description (12-18 words, technical yet poetic with dry humor)
- An icon from this list: ${availableIcons.join(', ')}

Style guidelines:
- Poetic and evocative
- Slightly melancholic with dry humor
- Technical accuracy with existential undertones
- Each feature should feel unique and meaningful

Format as JSON array:
[
  {
    "icon": "telescope",
    "title": "Partially mythic photon-devouring optics",
    "description": "Glass that bends light and occasionally your expectations of reality"
  }
]

Return ONLY the JSON array, no markdown formatting, no other text.`;

  const systemPrompt = `You are a creative technical writer for Starstuck Lab, a maker space that builds scientific instruments. Your writing balances poetry with precision, melancholy with wonder. You write product features that are both informative and emotionally resonant.`;

  const result = await generateText(prompt, { 
    systemPrompt, 
    maxTokens: 600,
    temperature: 0.8 
  });

  try {
    // Clean up the result - remove markdown code blocks if present
    const cleanResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const features = JSON.parse(cleanResult);
    
    // Validate structure
    if (!Array.isArray(features)) {
      throw new Error('Response is not an array');
    }
    
    return features.slice(0, numFeatures);
  } catch (error) {
    console.error('Failed to parse features JSON:', error);
    console.error('Raw result:', result);
    throw new Error('Failed to parse AI-generated features. Please try again.');
  }
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
 * Generate specifications for a product
 */
export async function generateSpecifications(
  title: string,
  category: string,
  description?: string
): Promise<Array<{ label: string; value: string }>> {
  const prompt = `Generate 6-8 technical specifications for "${title}", a ${category}.
${description ? `\nDescription: ${description}\n` : ''}
Format as JSON array of label-value pairs:
[
  { "label": "Dimensions", "value": "100 × 50 × 25 mm" },
  { "label": "Weight", "value": "250g" }
]

Include realistic, appropriate specs for this type of product.
Return ONLY the JSON array, no other text.`;

  const systemPrompt = `You generate accurate technical specifications for scientific instruments and maker products.`;

  const result = await generateText(prompt, { 
    systemPrompt, 
    maxTokens: 400,
    temperature: 0.6 
  });

  try {
    const cleanResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanResult);
  } catch (error) {
    console.error('Failed to parse specifications JSON:', error);
    throw new Error('Failed to parse AI-generated specifications. Please try again.');
  }
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
  return callOpenAIEndpoint('generate_image', prompt, options);
}