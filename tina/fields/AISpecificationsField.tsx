// tina/fields/AISpecificationsField.tsx
import React, { useState } from 'react';
import { wrapFieldsWithMeta } from 'tinacms';
import { generateText } from '../utils/openai';
import { getSystemPrompt } from '../utils/prompts';

interface AISpecificationsFieldProps {
  input: any;
  meta: any;
  field: any;
}

const AISpecificationsField = wrapFieldsWithMeta<AISpecificationsFieldProps>(({ input, meta, field }) => {
  const [generating, setGenerating] = useState(false);

  const generateSpecifications = async () => {
    setGenerating(true);

    try {
      // Get context from form if available
      const formValues = field?.form?.values || {};
      const title = formValues.title || 'Untitled';
      const category = formValues.category || 'product';
      const description = formValues.excerpt || formValues.body || '';

      const prompt = `Generate 6-8 technical specifications for "${title}", a ${category}.
${description ? `\nDescription: ${description}\n` : ''}
Each specification should include realistic, appropriate technical details for this type of product.

Format as JSON array of label-value pairs:
[
  { "label": "Dimensions", "value": "100 × 50 × 25 mm" },
  { "label": "Weight", "value": "250g" }
]

Include specifications like dimensions, weight, materials, power requirements, operating conditions, etc.
Return ONLY the JSON array, no markdown formatting, no other text.`;

      const result = await generateText(prompt, {
        systemPrompt: getSystemPrompt('technical'),
        maxTokens: 600,
        temperature: 0.6
      });

      // Parse JSON response
      const cleanResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const specifications = JSON.parse(cleanResult);

      // Update field value
      input.onChange(specifications);

    } catch (error: any) {
      console.error('AI generation failed:', error);
      alert(`Failed to generate specifications: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      {/* Field Label */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.75rem'
      }}>
        <label style={{ fontWeight: 500, fontSize: '14px' }}>
          {meta.label || field.label}
        </label>

        <button
          type="button"
          onClick={generateSpecifications}
          disabled={generating}
          style={{
            padding: '0.5rem 1rem',
            background: generating ? '#6c757d' : '#198754',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: generating ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {generating ? (
            <>
              <span>⏳</span>
              <span>Generating Specs...</span>
            </>
          ) : (
            <>
              <span>✨</span>
              <span>Generate All Specs</span>
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {meta.error && (
        <div style={{ color: '#dc3545', fontSize: '12px', marginBottom: '0.5rem' }}>
          {meta.error}
        </div>
      )}

      {/* Helper Text */}
      {field.description && (
        <div style={{ color: '#666', fontSize: '12px', marginBottom: '0.75rem' }}>
          {field.description}
        </div>
      )}
    </div>
  );
});

export default AISpecificationsField;
