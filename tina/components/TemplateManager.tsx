/**
 * Unified Prompt Manager for Tina CMS
 * Loads prompts from JSON, builds variables, and provides consistent API
 */

import productPrompts from '../prompts/product-prompts.json';

interface PromptTemplate {
  id: string;
  description: string;
  prompt: string;
  variables: string[];
  options: {
    maxTokens: number;
    temperature: number;
    size?: string;
    quality?: string;
  };
}

interface PromptContext {
  [key: string]: any;
}

interface PromptManifest {
  meta: {
    version: string;
    description: string;
    last_updated: string;
  };
  persona: {
    name: string;
    file: string;
    description: string;
  };
  templates: {
    [key: string]: PromptTemplate;
  };
  variable_builders: {
    [key: string]: any;
  };
}

class PromptManager {
  private prompts: PromptManifest;
  private persona: string | null = null;

  constructor(prompts: PromptManifest) {
    this.prompts = prompts;
  }

  /**
   * Load persona from file (optional, fallback to inline system prompt)
   */
  async loadPersona(): Promise<string> {
    if (this.persona) return this.persona;

    // In production, you might fetch this from an API endpoint
    // For now, we'll use the inline description
    this.persona = this.prompts.persona.description;
    return this.persona;
  }

  /**
   * Get a prompt template by ID
   */
  getTemplate(templateId: string): PromptTemplate | null {
    return this.prompts.templates[templateId] || null;
  }

  /**
   * Build a variable using the variable builder logic
   */
  private buildVariable(variableName: string, context: PromptContext): string {
    const builder = this.prompts.variable_builders[variableName];
    if (!builder) return '';

    // Handle direct value
    if (builder.value !== undefined) {
      return builder.value;
    }

    // Handle mapping
    if (builder.mapping) {
      const key = context[variableName.replace('_clause', '')] || 'default';
      return builder.mapping[key] || builder.mapping.default || '';
    }

    // Handle logic-based builders (simplified evaluation)
    if (builder.logic) {
      return this.evaluateLogic(builder.logic, context);
    }

    return '';
  }

  /**
   * Simple logic evaluator for variable builders
   */
  private evaluateLogic(logic: string, context: PromptContext): string {
    // This is a simplified version. In production, you'd want a safer evaluator.
    // For now, we'll handle common patterns:

    // Pattern: if X: return f"text {X}" else: return ""
    const ifMatch = logic.match(/if\s+(\w+):\s+return\s+f?["'](.+?)["']\s+else:\s+return\s+["'](.*)["']/);
    if (ifMatch) {
      const [, varName, truthyValue, falsyValue] = ifMatch;
      const value = context[varName];
      if (value) {
        // Replace {var} placeholders
        return truthyValue.replace(/\{(\w+)\}/g, (_, key) => context[key] || '');
      }
      return falsyValue;
    }

    // Pattern: if X: return "text" + join(...)
    const joinMatch = logic.match(/if\s+(\w+):\s+return\s+f?["'](.+?)["']\s*\+\s*['"]\\n['"]\.join\(/);
    if (joinMatch) {
      const [, varName, prefix] = joinMatch;
      const value = context[varName];
      if (value && Array.isArray(value)) {
        // Handle different join patterns
        if (logic.includes('f.title')) {
          return prefix + '\n' + value.map((item: any) => `- ${item.title}: ${item.description}`).join('\n');
        } else if (logic.includes('s.label')) {
          return prefix + '\n' + value.map((item: any) => `- ${item.label}: ${item.value}`).join('\n');
        }
      }
      return '';
    }

    return '';
  }

  /**
   * Build a complete prompt with variables filled in
   */
  buildPrompt(templateId: string, context: PromptContext): string | null {
    const template = this.getTemplate(templateId);
    if (!template) return null;

    let prompt = template.prompt;

    // Replace all variables
    for (const variable of template.variables) {
      const value = context[variable] !== undefined 
        ? context[variable] 
        : this.buildVariable(variable, context);
      
      // Replace {variable} placeholders
      const regex = new RegExp(`\\{${variable}\\}`, 'g');
      prompt = prompt.replace(regex, String(value));
    }

    return prompt;
  }

  /**
   * Get generation options for a template
   */
  getOptions(templateId: string): PromptTemplate['options'] | null {
    const template = this.getTemplate(templateId);
    return template ? template.options : null;
  }

  /**
   * Get system prompt (persona)
   */
  async getSystemPrompt(templateId?: string): Promise<string> {
    // You can customize system prompt per template if needed
    return this.prompts.persona.description;
  }

  /**
   * List all available templates
   */
  listTemplates(): Array<{ id: string; description: string }> {
    return Object.entries(this.prompts.templates).map(([id, template]) => ({
      id,
      description: template.description,
    }));
  }

  /**
   * Get template variables
   */
  getTemplateVariables(templateId: string): string[] {
    const template = this.getTemplate(templateId);
    return template ? template.variables : [];
  }
}

// Export singleton instance
export const promptManager = new PromptManager(productPrompts as PromptManifest);

/**
 * Convenience functions for common use cases
 */

export async function generateWithTemplate(
  templateId: string,
  context: PromptContext,
  customPrompt?: string
): Promise<{ prompt: string; options: any; systemPrompt: string }> {
  const prompt = customPrompt || promptManager.buildPrompt(templateId, context);
  
  if (!prompt) {
    throw new Error(`Template not found: ${templateId}`);
  }

  const options = promptManager.getOptions(templateId);
  const systemPrompt = await promptManager.getSystemPrompt(templateId);

  return {
    prompt,
    options: options || {},
    systemPrompt,
  };
}

/**
 * Helper to call OpenAI API with prompt template
 */
export async function callOpenAIWithTemplate(
  templateId: string,
  context: PromptContext,
  customPrompt?: string
): Promise<any> {
  const { prompt, options, systemPrompt } = await generateWithTemplate(
    templateId,
    context,
    customPrompt
  );

  const response = await fetch('/api/openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: templateId.includes('image') ? 'generate_image' : 'generate_text',
      prompt,
      options: {
        systemPrompt,
        ...options,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Generation failed');
  }

  return response.json();
}

export default promptManager;