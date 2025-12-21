// tina/fields/AIFeaturesField.tsx
import React, { useState } from 'react';
import { wrapFieldsWithMeta } from 'tinacms';
import { useCMS } from 'tinacms';

interface AIFeaturesFieldProps {
  input: any;
  meta: any;
  field: any;
}

const AIFeaturesField = wrapFieldsWithMeta<AIFeaturesFieldProps>(({ input, meta, field }) => {
  const [generating, setGenerating] = useState(false);
  const cms = useCMS();

  const generateFeatures = async () => {
    setGenerating(true);

    try {
      // Get form values from TinaCMS
      const form = cms.forms.all()[0];
      const formValues = form?.values || {};
      
      const title = formValues.title || 'Untitled';
      const category = formValues.category || '';
      const description = formValues.excerpt || formValues.body || '';

      console.log('AIFeaturesField - Form values:', { title, category, description });

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

      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_text',
          prompt,
          options: {
            systemPrompt: 'You are a creative technical writer for Starstuck Lab, a maker space that builds scientific instruments. Your writing balances poetry with precision, melancholy with wonder.',
            maxTokens: 500,
            temperature: 0.8
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

  const currentFeatures = input.value || [];

  const handleFeatureChange = (index: number, fieldName: string, value: string) => {
    const updated = [...currentFeatures];
    updated[index] = { ...updated[index], [fieldName]: value };
    input.onChange(updated);
  };

  const handleAddFeature = () => {
    const newFeature = { icon: 'star', title: '', description: '' };
    input.onChange([...currentFeatures, newFeature]);
  };

  const handleRemoveFeature = (index: number) => {
    const updated = currentFeatures.filter((_: any, i: number) => i !== index);
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
              <span>Generating Features...</span>
            </>
          ) : (
            <>
              <span>✨</span>
              <span>Generate Features with AI</span>
            </>
          )}
        </button>
      </div>

      {/* Features List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {currentFeatures.map((feature: any, index: number) => (
          <div
            key={index}
            style={{
              border: '1px solid #ddd',
              borderRadius: '6px',
              padding: '1rem',
              backgroundColor: '#fafafa'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <strong style={{ fontSize: '13px', color: '#333' }}>Feature {index + 1}</strong>
              <button
                type="button"
                onClick={() => handleRemoveFeature(index)}
                style={{
                  padding: '0.25rem 0.5rem',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              >
                Remove
              </button>
            </div>

            {/* Icon Field */}
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '0.25rem' }}>
                Icon
              </label>
              <select
                value={feature.icon || 'star'}
                onChange={(e) => handleFeatureChange(index, 'icon', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px'
                }}
              >
                <option value="telescope">🔭 telescope</option>
                <option value="palette">🎨 palette</option>
                <option value="alert-triangle">⚠️ alert-triangle</option>
                <option value="cog">⚙️ cog</option>
                <option value="zap">⚡ zap</option>
                <option value="box">📦 box</option>
                <option value="cpu">💻 cpu</option>
                <option value="settings">🔧 settings</option>
                <option value="shield">🛡️ shield</option>
                <option value="star">⭐ star</option>
                <option value="circle-dot">🎯 circle-dot</option>
                <option value="gauge">📊 gauge</option>
              </select>
            </div>

            {/* Title Field */}
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '0.25rem' }}>
                Title
              </label>
              <input
                type="text"
                value={feature.title || ''}
                onChange={(e) => handleFeatureChange(index, 'title', e.target.value)}
                placeholder="Feature title"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px'
                }}
              />
            </div>

            {/* Description Field */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '0.25rem' }}>
                Description
              </label>
              <textarea
                value={feature.description || ''}
                onChange={(e) => handleFeatureChange(index, 'description', e.target.value)}
                placeholder="Feature description"
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Add Feature Button */}
      <button
        type="button"
        onClick={handleAddFeature}
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
        + Add Feature Manually
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

export default AIFeaturesField;