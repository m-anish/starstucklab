// tina/utils/prompts.ts
/**
 * Prompt templates for Starstuck Lab content generation
 */

export const SYSTEM_PROMPTS = {
  default: `You are a creative writer for Starstuck Lab, a maker space that builds scientific instruments, telescopes, and weather stations. Your writing style is poetic, melancholic, witty with dry humor, and tinged with cosmic existentialism.`,
  
  technical: `You are a technical writer for Starstuck Lab. Write with precision and clarity while maintaining a poetic undertone. Balance specifications with wonder.`,
  
  marketing: `You are a marketing writer for Starstuck Lab. Write compelling copy that is both evocative and informative, with a touch of melancholy and cosmic perspective.`
};

export const PROMPT_TEMPLATES = {
  productExcerpt: (title: string, category?: string) => 
    `Generate a compelling one-sentence excerpt (max 20 words) for "${title}"${category ? `, a ${category}` : ''}. Make it poetic, intriguing, and slightly melancholic.`,
  
  productDescription: (title: string, features?: string[]) =>
    `Write a 200-300 word product description for "${title}". ${features?.length ? `Key features: ${features.join(', ')}. ` : ''}Include technical specifications but write poetically. Evoke a sense of wonder tinged with existential melancholy.`,
  
  projectExcerpt: (title: string) =>
    `Generate a one-sentence project summary (max 20 words) for "${title}". Make it technical yet poetic, with dry humor.`,
  
  projectDescription: (title: string, status?: string) =>
    `Write a 200-300 word description for the project "${title}"${status ? ` (status: ${status})` : ''}. Describe the technical approach, challenges, and progress with poetic flair and existential undertones.`,
  
  imagePrompt: (title: string, type: 'telescope' | 'weather' | 'electronics' | 'general') => {
    const styles = {
      telescope: 'astronomical instrument, technical elegance, dark background with stars',
      weather: 'meteorological device, clean design, atmospheric elements',
      electronics: 'electronic circuit, technical precision, close-up detail',
      general: 'scientific instrument, professional product photography'
    };
    
    return `Professional product photography of ${title}, ${styles[type]}, studio lighting, high quality, commercial product shot, clean white background, technically accurate`;
  }
};

export function getSystemPrompt(type: keyof typeof SYSTEM_PROMPTS = 'default'): string {
  return SYSTEM_PROMPTS[type];
}

export function getPromptTemplate(
  type: keyof typeof PROMPT_TEMPLATES,
  ...args: any[]
): string {
  const template = PROMPT_TEMPLATES[type];
  // @ts-ignore
  return template(...args);
}

export function getImagePromptTemplate(
  title: string,
  type: 'telescope' | 'weather' | 'electronics' | 'general'
): string {
  const styles = {
    telescope: 'astronomical instrument, technical elegance, dark background with stars, professional scientific photography',
    weather: 'meteorological device, clean design, atmospheric elements, studio lighting',
    electronics: 'electronic circuit board, technical precision, close-up detail, professional product photography',
    general: 'scientific instrument, professional studio lighting, high quality commercial product shot'
  };

  return `warm studio-ghibli themed ${styles[type]}, clean white background, technically accurate, high resolution, professional product photography, Studio Ghibli art style, warm lighting, magical realism, detailed craftsmanship`;
}
