// tina/fields/AITagsField.tsx
import React, { useState } from 'react';
import { wrapFieldsWithMeta } from 'tinacms';
import { generateText } from '../utils/openai';
import { getSystemPrompt } from '../utils/prompts';

interface AITagsFieldProps {
  input: any;
  meta: any;
  field: any;
}

const AITagsField = wrapFieldsWithMeta<AITagsFieldProps>(({ input, meta, field }) => {
  const [generating, setGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);
  const [maxTags, setMaxTags] = useState(5);

  const generateTags = async () => {
    setGenerating(true);

    try {
      // Get context from form if available
      const formValues = field?.form?.values || {};
      const title = formValues.title || 'Untitled';
      const category = formValues.category || 'product';
      const description = formValues.excerpt || formValues.body || '';

      let prompt = `Generate ${maxTags} relevant tags for this product:

Title: ${title}
Category: ${category}
${description ? `Description: ${description}\n` : ''}`;

      if (customPrompt.trim()) {
        prompt = customPrompt;
      } else {
        prompt += `
Tags should be:
- Relevant to the product's function and features
- Include both technical and descriptive terms
- Mix of specific and general terms
- Suitable for search and categorization

Return ONLY a comma-separated list of tags, nothing else.`;
      }

      const result = await generateText(prompt, {
        systemPrompt: getSystemPrompt('default'),
        maxTokens: 200,
        temperature: 0.5
      });

      // Parse comma-separated tags
      const tags = result
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
        .slice(0, maxTags);

      // Update field value
      input.onChange(tags);

      // Clear custom prompt after successful generation
      if (customPrompt.trim()) {
        setCustomPrompt('');
      }

    } catch (error: any) {
      console.error('AI generation failed:', error);
      alert(`Failed to generate tags: ${error.message}`);
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
            onClick={generateTags}
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
                <span>Generate Tags</span>
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

        {/* Max Tags Selector */}
        <div style={{ marginBottom: '0.5rem' }}>
          <label style={{ fontSize: '12px', color: '#666', marginRight: '0.5rem' }}>
            Max tags:
          </label>
          <select
            value={maxTags}
            onChange={(e) => setMaxTags(Number(e.target.value))}
            style={{
              padding: '0.25rem 0.5rem',
              border: '1px solid #ddd',
              borderRadius: '3px',
              fontSize: '12px'
            }}
          >
            <option value={3}>3</option>
            <option value={5}>5</option>
            <option value={7}>7</option>
            <option value={10}>10</option>
          </select>
        </div>

        {/* Custom Prompt Input */}
        {showPrompt && (
          <div style={{ marginTop: '0.5rem' }}>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Optional: Enter custom AI prompt for tag generation..."
              rows={3}
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
              Leave empty to use smart tag generation based on title, category, and description
            </small>
          </div>
        )}
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

      {/* Tags Display/Input Field */}
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
          Generated Tags:
        </label>
        <textarea
          {...input}
          rows={3}
          placeholder="Tags will appear here after generation..."
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '13px',
            fontFamily: 'inherit',
            resize: 'vertical',
            backgroundColor: '#fafafa'
          }}
        />
      </div>

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

export default AITagsField;
