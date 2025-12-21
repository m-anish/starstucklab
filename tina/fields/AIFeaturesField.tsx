// tina/fields/AIFeaturesField.tsx
import React, { useState } from 'react';
import { wrapFieldsWithMeta } from 'tinacms';
import { generateText } from '../utils/openai';
import { getSystemPrompt } from '../utils/prompts';

interface AIFeaturesFieldProps {
  input: any;
  meta: any;
  field: any;
}

const AIFeaturesField = wrapFieldsWithMeta<AIFeaturesFieldProps>(({ input, meta, field }) => {
  const [generating, setGenerating] = useState(false);

  const generateFeatures = async () => {
    setGenerating(true);

    try {
      // Get context from form if available
      const formValues = field?.form?.values || {};
      const title = formValues.title || 'Untitled';
      const category = formValues.category;
      const description = formValues.excerpt || formValues.body || '';

      const prompt = `Generate 4 product features for "${title}"${category ? `, a ${category}` : ''}.
${description ? `\nProduct description: ${description}\n` : ''}
Each feature should have:
- A title (2-5 words, descriptive and slightly humorous)
- A description (10-15 words, technical yet poetic)
- Suggested icon from this list: telescope, palette, alert-triangle, cog, zap, box, cpu, settings, shield, star, circle-dot, gauge

Format as JSON array:
[
  {
    "icon": "telescope",
    "title": "Feature Title",
    "description": "Brief description with dry humor and technical detail"
  }
]

Return ONLY the JSON array, no other text.`;

      const result = await generateText(prompt, {
        systemPrompt: getSystemPrompt('default'),
        maxTokens: 500,
        temperature: 0.8
      });

      // Parse JSON response
      const cleanResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const features = JSON.parse(cleanResult);

      // Update field value
      input.onChange(features);

    } catch (error: any) {
      console.error('AI generation failed:', error);
      alert(`Failed to generate features: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <button
        type="button"
        onClick={generateFeatures}
        disabled={generating}
        style={{
          padding: '0.5rem 1rem',
          background: generating ? '#6c757d' : '#198754',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: generating ? 'not-allowed' : 'pointer',
          fontSize: '12px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        {generating ? (
          <>
            <span>⏳</span>
            <span>Generate Features</span>
          </>
        ) : (
          <>
            <span>✨</span>
            <span>Generate Features</span>
          </>
        )}
      </button>
    </div>
  );
});

export default AIFeaturesField;
