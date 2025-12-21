// tina/fields/AISpecificationsField.tsx
import React, { useState } from 'react';
import { wrapFieldsWithMeta } from 'tinacms';
import { useCMS } from 'tinacms';

interface AISpecificationsFieldProps {
  input: any;
  meta: any;
  field: any;
}

const AISpecificationsField = wrapFieldsWithMeta<AISpecificationsFieldProps>(({ input, meta, field }) => {
  const [generating, setGenerating] = useState(false);
  const cms = useCMS();

  const generateSpecifications = async () => {
    setGenerating(true);

    try {
      // Get form values from TinaCMS
      const form = cms.forms.all()[0];
      const formValues = form?.values || {};
      
      const title = formValues.title || 'Untitled';
      const category = formValues.category || 'product';
      const description = formValues.excerpt || formValues.body || '';

      console.log('AISpecificationsField - Form values:', { title, category, description });

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

      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_text',
          prompt,
          options: {
            systemPrompt: 'You generate accurate technical specifications for scientific instruments and maker products.',
            maxTokens: 600,
            temperature: 0.6
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Generation failed');
      }

      const data = await response.json();
      const result = data.result;

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

  const currentSpecs = input.value || [];

  const handleSpecChange = (index: number, fieldName: string, value: string) => {
    const updated = [...currentSpecs];
    updated[index] = { ...updated[index], [fieldName]: value };
    input.onChange(updated);
  };

  const handleAddSpec = () => {
    const newSpec = { label: '', value: '' };
    input.onChange([...currentSpecs, newSpec]);
  };

  const handleRemoveSpec = (index: number) => {
    const updated = currentSpecs.filter((_: any, i: number) => i !== index);
    input.onChange(updated);
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      {/* Field Label */}
      <label
        style={{
          display: 'block',
          marginBottom: '0.5rem',
          fontWeight: 500,
          fontSize: '14px'
        }}
      >
        {meta.label || field.label}
      </label>

      {/* Generate Button */}
      <div style={{ marginBottom: '1rem' }}>
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
              <span>Generating Specs...</span>
            </>
          ) : (
            <>
              <span>✨</span>
              <span>Generate Specifications with AI</span>
            </>
          )}
        </button>
      </div>

      {/* Specifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {currentSpecs.map((spec: any, index: number) => (
          <div
            key={index}
            style={{
              border: '1px solid #ddd',
              borderRadius: '6px',
              padding: '0.75rem',
              backgroundColor: '#fafafa',
              display: 'grid',
              gridTemplateColumns: '1fr 2fr auto',
              gap: '0.5rem',
              alignItems: 'center'
            }}
          >
            {/* Label Field */}
            <div>
              <input
                type="text"
                value={spec.label || ''}
                onChange={(e) => handleSpecChange(index, 'label', e.target.value)}
                placeholder="Label (e.g., Weight)"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: 500
                }}
              />
            </div>

            {/* Value Field */}
            <div>
              <input
                type="text"
                value={spec.value || ''}
                onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                placeholder="Value (e.g., 250g)"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px'
                }}
              />
            </div>

            {/* Remove Button */}
            <button
              type="button"
              onClick={() => handleRemoveSpec(index)}
              style={{
                padding: '0.5rem',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '11px',
                whiteSpace: 'nowrap'
              }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Add Spec Button */}
      <button
        type="button"
        onClick={handleAddSpec}
        style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          background: '#0969da',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 500
        }}
      >
        + Add Specification Manually
      </button>

      {/* Helper Text */}
      {field.description && (
        <div
          style={{
            color: '#666',
            fontSize: '12px',
            marginTop: '0.5rem'
          }}
        >
          {field.description}
        </div>
      )}
    </div>
  );
});

export default AISpecificationsField;