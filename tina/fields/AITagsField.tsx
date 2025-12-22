// tina/fields/AITagsField.tsx (REFACTORED)
import React, { useState } from 'react';
import { wrapFieldsWithMeta } from 'tinacms';
import { useCMS } from 'tinacms';
import { getFormValues } from '../utils/formHelper';
import { callOpenAIWithTemplate } from '../utils/promptManager';

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
  const cms = useCMS();

  const generateTags = async () => {
    setGenerating(true);

    try {
      // Get form values
      const formValues = getFormValues(cms, field, input);
      
      const title = formValues.title || 'Untitled';
      const category = formValues.category || 'product';
      const description = formValues.excerpt || formValues.body || '';

      console.log('AITagsField - Form values:', { title, category, description });

      // Build context for template
      const context = {
        max_tags: maxTags,
        title,
        category,
        description_clause: description ? `\nDescription: ${description}\n` : ''
      };

      // Generate using template
      const result = await callOpenAIWithTemplate(
        'product_tags',
        context,
        customPrompt.trim() || undefined
      );

      // Parse comma-separated tags
      const tags = result.result
        .split(',')
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag.length > 0)
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

  const currentTags = input.value || [];

  const handleTagChange = (index: number, value: string) => {
    const updated = [...currentTags];
    updated[index] = value;
    input.onChange(updated);
  };

  const handleAddTag = () => {
    input.onChange([...currentTags, '']);
  };

  const handleRemoveTag = (index: number) => {
    const updated = currentTags.filter((_: any, i: number) => i !== index);
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
            {showPrompt ? '🔽 Hide Options' : '🔼 Options'}
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
              placeholder="Optional: Override template with custom prompt..."
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
              Leave empty to use template: product_tags
            </small>
          </div>
        )}
      </div>

      {/* Tags Display */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {currentTags.map((tag: string, index: number) => (
          <div
            key={index}
            style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center'
            }}
          >
            <input
              type="text"
              value={tag}
              onChange={(e) => handleTagChange(index, e.target.value)}
              placeholder={`Tag ${index + 1}`}
              style={{
                flex: 1,
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '13px'
              }}
            />
            <button
              type="button"
              onClick={() => handleRemoveTag(index)}
              style={{
                padding: '0.5rem',
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
        ))}
      </div>

      {/* Add Tag Button */}
      <button
        type="button"
        onClick={handleAddTag}
        style={{
          marginTop: '0.75rem',
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
        + Add Tag Manually
      </button>

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

export default AITagsField;