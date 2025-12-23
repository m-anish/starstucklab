// src/pages/api/save-prompts.ts
// API endpoint to save edited prompts - ASTRO VERSION ONLY

import type { APIRoute } from 'astro';
import fs from 'fs';
import path from 'path';

export const POST: APIRoute = async ({ request }) => {
  
  // Block in production
  if (import.meta.env.PROD) {
    return new Response(JSON.stringify({ 
      error: 'This endpoint is only available in development mode'
    }), { status: 403 });
  }

  try {
    const updatedPrompts = await request.json();
    
    // Validate the structure
    if (!updatedPrompts.meta || !updatedPrompts.templates || !updatedPrompts.persona) {
      return new Response(
        JSON.stringify({ error: 'Invalid prompts structure' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Path to the prompts file
    const promptsPath = path.join(process.cwd(), 'tina', 'prompts', 'product-prompts.json');
    
    // Create backup before saving
    const backupPath = path.join(
      process.cwd(), 
      'tina', 
      'prompts', 
      `product-prompts.backup.${Date.now()}.json`
    );
    
    // Backup existing file
    if (fs.existsSync(promptsPath)) {
      fs.copyFileSync(promptsPath, backupPath);
    }
    
    // Save updated prompts
    fs.writeFileSync(
      promptsPath,
      JSON.stringify(updatedPrompts, null, 2),
      'utf-8'
    );
    
    // Also sync to Python side automatically
    const pythonPromptsPath = path.join(process.cwd(), 'src', 'data', 'product_prompts.json');
    
    // Convert to Python format
    const pythonFormat = {
      meta: updatedPrompts.meta,
      persona: updatedPrompts.persona,
      prompts: Object.entries(updatedPrompts.templates).map(([id, template]: [string, any]) => ({
        id,
        block: id.replace('product_', ''),
        public_json_key: id.replace('product_', ''),
        description: template.description,
        prompt: template.prompt,
        temperature: template.options.temperature,
        max_tokens: template.options.maxTokens,
        variables: template.variables
      })),
      variable_builders: updatedPrompts.variable_builders
    };
    
    // Save Python version
    fs.writeFileSync(
      pythonPromptsPath,
      JSON.stringify(pythonFormat, null, 2),
      'utf-8'
    );

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Prompts saved successfully',
        backup: backupPath,
        synced: true
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error saving prompts:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to save prompts',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};