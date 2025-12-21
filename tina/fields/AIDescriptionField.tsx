// tina/fields/AIDescriptionField.tsx
import React, { useState, useEffect } from 'react';
import { wrapFieldsWithMeta } from 'tinacms';
import { useCMS } from 'tinacms';
import { getFormValues, logFormDebugInfo } from '../utils/formHelper';

interface AIDescriptionFieldProps {
  input: any;
  meta: any;
  field: any;
}

const AIDescriptionField = wrapFieldsWithMeta<AIDescriptionFieldProps>(({ input, meta, field }) => {
  const [generating, setGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const cms = useCMS();

  // Debug on mount - only run once
  useEffect(() => {
    console.log('=== AIDescriptionField Mounted ===');
    logFormDebugInfo(cms, field, input, 'AIDescriptionField');
  }, []);

  const generateDescription = async () => {
    setGenerating(true);

    try {
      // Get form values using helper - pass input as well
      const formValues = getFormValues(cms, field, input);
      
      // Log what we got
      console.log('Raw formValues:', formValues);
      console.log('formValues keys:', Object.keys(formValues));
      
      const title = formValues.title || 'Untitled';
      const category = formValues.category || 'product';
      const excerpt = formValues.excerpt || '';
      const features = formValues.features || [];
      const specifications = formValues.specifications || [];

      const wordCount = {
        short: '150-250',
        medium: '300-500',
        long: '600-800'
      }[length];

      console.log('AIDescriptionField - Extracted values:', { 
        title, 
        category, 
        excerpt, 
        featuresCount: features.length,
        specsCount: specifications.length
      });

      let prompt = `Write a ${wordCount} word product description for "${title}"${category ? `, a ${category}` : ''}.

${excerpt ? `Excerpt: ${excerpt}\n` : ''}${features.length ? `Key features: ${features.map((f: any) => f.title).join(', ')}\n` : ''}${specifications.length ? `Specifications include: ${specifications.slice(0, 3).map((s: any) => s.label).join(', ')}\n` : ''}`;

      if (customPrompt.trim()) {
        prompt = customPrompt;
      } else {
        prompt += `
Write in a style that is:
- Poetic and evocative with dry humor
- Technically accurate but accessible
- Slightly melancholic with cosmic existential undertones
- Include technical specifications where relevant
- Focus on the product's unique value and user experience

Return ONLY the description in markdown format.`;
      }

      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_text',
          prompt,
          options: {
            systemPrompt: 'You are a creative technical writer for Starstuck Lab, a maker space that builds scientific instruments. Your writing balances poetry with precision, melancholy with wonder.',
            maxTokens: length === 'long' ? 1000 : length === 'medium' ? 700 : 400,
            temperature: 0.7
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Generation failed');
      }

      const data = await response.json();
      const result = data.result;

      // Update field value
      input.onChange(result);

      // Clear custom prompt after successful generation
      if (customPrompt.trim()) {
        setCustomPrompt('');
      }

    } catch (error: any) {
      console.error('AI generation failed:', error);
      alert(`Failed to generate description: ${error.message}`);
    } finally {
      setGenerating(false);
    }
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

      {/* AI Controls */}
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <button
            type="button"
            onClick={generateDescription}
            disabled={generating}
            style={{
              padding: '0.5rem 1rem',
              background: generating ? '#6c757d' : '#198754',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: generating ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {generating ? (
              <>
                <span>⏳</span>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>Generate Description</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowPrompt(!showPrompt)}
            style={{
              padding: '0.5rem 1rem',
              background: 'transparent',
              color: '#0969da',
              border: '1px solid #0969da',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {showPrompt ? '🔽 Hide Custom Prompt' : '🔼 Custom Prompt'}
          </button>
        </div>

        {/* Length Selector */}
        <div style={{ marginBottom: '0.5rem' }}>
          <label style={{ fontSize: '12px', color: '#666', marginRight: '0.5rem' }}>
            Length:
          </label>
          <select
            value={length}
            onChange={(e) => setLength(e.target.value as 'short' | 'medium' | 'long')}
            style={{
              padding: '0.25rem 0.5rem',
              border: '1px solid #ddd',
              borderRadius: '3px',
              fontSize: '12px'
            }}
          >
            <option value="short">Short (150-250 words)</option>
            <option value="medium">Medium (300-500 words)</option>
            <option value="long">Long (600-800 words)</option>
          </select>
        </div>

        {/* Custom Prompt Input */}
        {showPrompt && (
          <div style={{ marginTop: '0.5rem' }}>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Optional: Enter custom AI prompt for description generation..."
              rows={4}
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
            <small style={{ color: '#666', fontSize: '12px' }}>
              Leave empty to use smart generation based on title, features, and specifications
            </small>
          </div>
        )}
      </div>

      {/* Description Display/Input Field */}
      <div style={{ marginTop: '1rem' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '0.25rem',
            fontWeight: 500,
            fontSize: '12px',
            color: '#666'
          }}
        >
          Generated Description:
        </label>
        <textarea
          {...input}
          rows={8}
          placeholder="Description will appear here after generation..."
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'vertical',
            backgroundColor: '#fafafa'
          }}
        />
      </div>

      {/* Error Message */}
      {meta.error && (
        <div
          style={{
            color: '#dc3545',
            fontSize: '12px',
            marginTop: '0.25rem'
          }}
        >
          {meta.error}
        </div>
      )}

      {/* Helper Text */}
      {!meta.error && field.description && (
        <div
          style={{
            color: '#666',
            fontSize: '12px',
            marginTop: '0.25rem'
          }}
        >
          {field.description}
        </div>
      )}
    </div>
  );
});

export default AIDescriptionField;