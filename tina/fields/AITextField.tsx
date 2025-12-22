// tina/fields/AITextField.tsx (REFACTORED)
import React, { useState } from 'react';
import { wrapFieldsWithMeta } from 'tinacms';
import { useCMS } from 'tinacms';
import { getFormValues } from '../utils/formHelper';
import { callOpenAIWithTemplate } from '../utils/promptManager';

interface AITextFieldProps {
  input: any;
  meta: any;
  field: any;
}

const AITextField = wrapFieldsWithMeta<AITextFieldProps>(({ input, meta, field }) => {
  const [generating, setGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);
  const cms = useCMS();

  const generateContent = async () => {
    setGenerating(true);

    try {
      // Get form values
      const formValues = getFormValues(cms, field, input);
      
      const title = formValues.title || 'Untitled';
      const category = formValues.category || '';
      
      console.log('AITextField - Form values:', { title, category, fieldName: field.name });

      // Determine template based on field name
      let templateId = 'product_excerpt';
      if (field.name === 'tagline') {
        templateId = 'product_tagline';
      } else if (field.name === 'excerpt') {
        templateId = 'product_excerpt';
      }

      // Build context for template
      const context = {
        title,
        category,
        category_clause: category ? `, a ${category}` : ''
      };

      // Generate using template
      const result = await callOpenAIWithTemplate(
        templateId,
        context,
        customPrompt.trim() || undefined
      );

      // Update field value
      input.onChange(result.result);

      // Clear custom prompt after successful generation
      if (customPrompt.trim()) {
        setCustomPrompt('');
      }

    } catch (error: any) {
      console.error('AI generation failed:', error);
      alert(`Failed to generate content: ${error.message}`);
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
            onClick={generateContent}
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
                <span>Generate with AI</span>
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

        {/* Custom Prompt Input */}
        {showPrompt && (
          <div style={{ marginTop: '0.5rem' }}>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Optional: Override default template with custom prompt..."
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
              Leave empty to use smart template-based generation
            </small>
          </div>
        )}
      </div>

      {/* Main Text Field */}
      {field.component === 'textarea' || field.name === 'excerpt' ? (
        <textarea
          {...input}
          rows={field.name === 'excerpt' ? 3 : 6}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'vertical'
          }}
        />
      ) : (
        <input
          type="text"
          {...input}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
      )}

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

export default AITextField;