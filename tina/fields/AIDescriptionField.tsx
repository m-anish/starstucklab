// tina/fields/AIDescriptionField.tsx
import React, { useState } from 'react';
import { wrapFieldsWithMeta } from 'tinacms';
import { useCMS } from 'tinacms';
import { getFormValues } from '../utils/formHelper';

interface AIDescriptionFieldProps {
  input: any;
  meta: any;
  field: any;
}

// Helper to extract plain text from rich-text AST
function extractTextFromRichText(value: any): string {
  if (!value) return '';
  
  if (typeof value === 'string') return value;
  
  if (value.type === 'text') return value.text || '';
  
  if (value.children && Array.isArray(value.children)) {
    return value.children.map((child: any) => extractTextFromRichText(child)).join(' ');
  }
  
  return '';
}

const AIDescriptionField = wrapFieldsWithMeta<AIDescriptionFieldProps>(({ input, meta, field }) => {
  const [generating, setGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const cms = useCMS();

  const generateDescription = async () => {
    setGenerating(true);

    try {
      // Get form values using helper
      const formValues = getFormValues(cms, field, input);
      
      const title = formValues.title || 'Untitled';
      const category = formValues.category || 'product';
      const excerpt = formValues.excerpt || '';
      const features = formValues.features || [];
      const specifications = formValues.specifications || [];
      
      // Extract existing body text for context (if any)
      const existingBody = extractTextFromRichText(formValues.body);

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
        specsCount: specifications.length,
        existingBodyLength: existingBody.length
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

      // Update field value - TinaCMS will handle converting markdown to rich-text
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

  // Get current body text for display
  const currentBodyText = extractTextFromRichText(input.value);
  const hasContent = currentBodyText.trim().length > 0;

  return (
    <div style={{ marginBottom: '1rem' }}>
      {/* AI Controls - shown above the rich-text editor */}
      <div style={{ 
        marginBottom: '0.75rem',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '6px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#495057' }}>
              ✨ AI Description Generator
            </span>
            {hasContent && (
              <span style={{ fontSize: '11px', color: '#6c757d' }}>
                (Current: ~{Math.round(currentBodyText.split(/\s+/).length)} words)
              </span>
            )}
          </div>
          
          <button
            type="button"
            onClick={() => setShowPrompt(!showPrompt)}
            style={{
              padding: '0.25rem 0.5rem',
              background: 'transparent',
              color: '#0969da',
              border: '1px solid #0969da',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {showPrompt ? '🔽 Hide Options' : '🔼 Options'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>{hasContent ? 'Regenerate Description' : 'Generate Description'}</span>
              </>
            )}
          </button>

          {/* Length Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '12px', color: '#666' }}>
              Length:
            </label>
            <select
              value={length}
              onChange={(e) => setLength(e.target.value as 'short' | 'medium' | 'long')}
              style={{
                padding: '0.4rem 0.5rem',
                border: '1px solid #ddd',
                borderRadius: '3px',
                fontSize: '12px',
                backgroundColor: 'white'
              }}
            >
              <option value="short">Short (150-250)</option>
              <option value="medium">Medium (300-500)</option>
              <option value="long">Long (600-800)</option>
            </select>
          </div>
        </div>

        {/* Custom Prompt Input */}
        {showPrompt && (
          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #dee2e6' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '0.5rem', color: '#495057' }}>
              Custom Prompt (Optional):
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Override default prompt with custom instructions..."
              rows={3}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
            <small style={{ color: '#6c757d', fontSize: '11px' }}>
              Leave empty to use smart generation based on title, category, features, and specs
            </small>
          </div>
        )}
      </div>

      {/* Helper Text */}
      {field.description && (
        <div
          style={{
            color: '#6c757d',
            fontSize: '12px',
            marginBottom: '0.5rem',
            fontStyle: 'italic'
          }}
        >
          {field.description}
        </div>
      )}

      {/* Note: The actual rich-text editor is rendered by TinaCMS below this component */}
    </div>
  );
});

export default AIDescriptionField;