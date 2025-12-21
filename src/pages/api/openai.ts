// src/pages/api/openai.ts
import type { APIRoute } from 'astro';

// Disable prerendering for this API endpoint
export const prerender = false;

interface OpenAIRequest {
  action: 'generate_text' | 'generate_image';
  prompt: string;
  options?: {
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
    size?: '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
  };
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Log the request for debugging
    console.log('OpenAI API request received');

    const body = await request.text();
    console.log('Request body:', body);

    if (!body) {
      return new Response(
        JSON.stringify({
          error: 'Request body is empty'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { action, prompt, options = {} }: OpenAIRequest = JSON.parse(body);

    // Comprehensive multi-source fallback for max compatibility
    const apiKey = 
      locals.runtime?.env?.OPENAI_API_KEY ||      // Cloudflare via locals.runtime
      import.meta.env.OPENAI_API_KEY ||           // Astro build-time (local dev)
      process.env.OPENAI_API_KEY;   

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'OpenAI API key not configured on server'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (action === 'generate_text') {
      const {
        systemPrompt = 'You are a helpful assistant.',
        maxTokens = 500,
        temperature = 0.7
      } = options;

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
        return new Response(
          JSON.stringify({
            error: `OpenAI API error: ${error.error?.message || 'Unknown error'}`
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      const data = await response.json();
      return new Response(
        JSON.stringify({
          result: data.choices[0].message.content
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (action === 'generate_image') {
      const { size = '1024x1024', quality = 'standard' } = options;

      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-image-1.5',
          prompt: prompt,
          n: 1,
          size: size,
          quality: quality
        })
      });

      if (!response.ok) {
        const error = await response.json();
        return new Response(
          JSON.stringify({
            error: `DALL-E API error: ${error.error?.message || 'Unknown error'}`
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      const data = await response.json();
      return new Response(
        JSON.stringify({
          result: data.data[0].url
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'Invalid action. Must be "generate_text" or "generate_image"'
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('OpenAI API route error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
