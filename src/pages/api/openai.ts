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
    quality?: 'low' | 'medium' | 'high' | 'auto';
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
        console.error('OpenAI API error:', error);
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
      const { 
        size = '1024x1024', 
        quality = 'medium' 
      } = options;

      console.log('Generating image with:', { model: 'gpt-image-1.5', size, quality, prompt: prompt.substring(0, 100) });

      // gpt-image-1.5 returns b64_json by default, no response_format parameter needed
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
          // No response_format parameter - gpt-image-1.5 returns b64_json by default
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('GPT-Image-1.5 API error:', error);
        return new Response(
          JSON.stringify({
            error: `GPT-Image-1.5 API error: ${error.error?.message || 'Unknown error'}`
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      const data = await response.json();
      console.log('Image generation response received');
      
      // Get the base64 image data from b64_json field
      const b64Data = data.data[0].b64_json;
      
      if (!b64Data) {
        console.error('No b64_json in response:', data);
        return new Response(
          JSON.stringify({
            error: 'No image data received from API'
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Convert to data URL for immediate display
      const dataUrl = `data:image/png;base64,${b64Data}`;
      console.log('Data URL created, length:', dataUrl.length);
      
      return new Response(
        JSON.stringify({
          result: dataUrl,
          b64_json: b64Data  // Also return raw b64 in case needed
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
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};