// tina/fields/AITextField.tsx
import React, { useState } from 'react';
import { wrapFieldsWithMeta } from 'tinacms';
import { useCMS } from 'tinacms';

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
      // Get form values from TinaCMS
      const form = cms.forms.all()[0];
      const formValues = form?.values || {};
      
      const title = formValues.title || 'Untitled';
      const category = formValues.category || '';
      const excerpt = formValues.excerpt || '';
      const body = formValues.body || '';

      console.log('AITextField - Form values:', { title, category, excerpt });

      let generatedText = '';
      let prompt = '';

      // Determine what type of content to generate based on field name
      if (field.name === 'excerpt' || field.name === 'tagline') {
        const maxWords = field.name === 'tagline' ? 12 : 20;
        
        if (customPrompt.trim()) {
          prompt = customPrompt;
        } else {
          prompt = `Generate a compelling ${field.name === 'tagline' ? 'tagline' : 'one-sentence excerpt'} (max ${maxWords} words) for "${title}"${category ? `, a ${category}` : ''}.

The ${field.name} should be:
- Poetic and intriguing
- Slightly melancholic with dry humor
- Evocative of cosmic existentialism
- Technical yet elegant

Return ONLY the ${field.name}, nothing else.`;
        }

        const response = await fetch('/api/openai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate_text',
            prompt,
            options: {
              systemPrompt: 'You are a creative writer for Starstuck Lab, a maker space that builds scientific instruments, telescopes, and weather stations. Your writing style is poetic, melancholic, witty with dry humor, and tinged with cosmic existentialism.',
              maxTokens: 100,
              temperature: 0.8
            }
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Generation failed');
        }

        const data = await response.json();
        generatedText = data.result;

      } else {
        // Full description
        if (customPrompt.trim()) {
          prompt = customPrompt;
        } else {
          prompt = `Generate a product description for "${title}"${category ? `, a ${category}` : ''}.

${excerpt ? `Excerpt: ${excerpt}\n` : ''}
Write 200-300 words in a style that is:
- Poetic and evocative
- Slightly melancholic with dry humor
- Technical yet accessible
- Tinged with cosmic existentialism
- Include specifications where relevant

Return ONLY the description.`;
        }

        const response = await fetch('/api/openai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate_text',
            prompt,
            options: {
              systemPrompt: 'You are a creative technical writer for Starstuck Lab. Your writing balances poetry with precision, melancholy with wonder.',
              maxTokens: 500,
              temperature: 0.7
            }
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Generation failed');
        }

        const data = await response.json();
        generatedText = data.result;
      }

      // Update field value
      input.onChange(generatedText);

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
              placeholder="Optional: Enter custom AI prompt... (e.g., 'Write this in a more technical tone' or 'Add more humor')"
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
              Leave empty to use default smart generation based on title and category
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