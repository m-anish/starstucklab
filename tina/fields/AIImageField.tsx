// tina/fields/AIImageField.tsx
import React, { useState } from 'react';
import { wrapFieldsWithMeta } from 'tinacms';
import { generateImage } from '../utils/openai';
import { getImagePromptTemplate } from '../utils/prompts';

interface AIImageFieldProps {
  input: any;
  meta: any;
  field: any;
}

const AIImageField = wrapFieldsWithMeta<AIImageFieldProps>(({ input, meta, field }) => {
  const [generating, setGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [size, setSize] = useState<'1024x1024' | '1792x1024' | '1024x1792'>('1024x1024');
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard');

  const generateProductImage = async () => {
    setGenerating(true);

    try {
      // Get context from form if available
      const formValues = field?.form?.values || {};
      const title = formValues.title || 'Untitled Product';
      const category = formValues.category || 'scientific instrument';
      const excerpt = formValues.excerpt || '';

      let prompt = `Professional product photography of "${title}", a ${category}. `;

      if (customPrompt.trim()) {
        prompt = customPrompt;
      } else {
        // Determine category type for appropriate image style
        let categoryType: 'telescope' | 'weather' | 'electronics' | 'general' = 'general';
        if (category.toLowerCase().includes('telescope')) categoryType = 'telescope';
        else if (category.toLowerCase().includes('weather')) categoryType = 'weather';
        else if (category.toLowerCase().includes('electronic')) categoryType = 'electronics';

        prompt += getImagePromptTemplate(title, categoryType);

        if (excerpt) {
          prompt += ` Product description: ${excerpt}`;
        }
      }

      const imageUrl = await generateImage(prompt, { size, quality });

      // Update field value with the generated image path
      // In a real implementation, you'd upload this to your media storage
      // For now, we'll store the URL directly
      const imagePath = `/generated/${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
      input.onChange(imagePath);

      setGeneratedImageUrl(imageUrl);

      // Clear custom prompt after successful generation
      if (customPrompt.trim()) {
        setCustomPrompt('');
      }

    } catch (error: any) {
      console.error('AI image generation failed:', error);
      alert(`Failed to generate image: ${error.message}`);
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
            onClick={generateProductImage}
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
                <span>🎨</span>
                <span>Generate Image</span>
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

        {/* Image Settings */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#666', marginRight: '0.5rem' }}>
              Size:
            </label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value as '1024x1024' | '1792x1024' | '1024x1792')}
              style={{
                padding: '0.25rem 0.5rem',
                border: '1px solid #ddd',
                borderRadius: '3px',
                fontSize: '12px'
              }}
            >
              <option value="1024x1024">Square (1024×1024)</option>
              <option value="1792x1024">Landscape (1792×1024)</option>
              <option value="1024x1792">Portrait (1024×1792)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#666', marginRight: '0.5rem' }}>
              Quality:
            </label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value as 'standard' | 'hd')}
              style={{
                padding: '0.25rem 0.5rem',
                border: '1px solid #ddd',
                borderRadius: '3px',
                fontSize: '12px'
              }}
            >
              <option value="standard">Standard</option>
              <option value="hd">HD</option>
            </select>
          </div>
        </div>

        {/* Custom Prompt Input */}
        {showPrompt && (
          <div style={{ marginTop: '0.5rem' }}>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Optional: Enter custom GPT-Image-1.5 prompt for Studio Ghibli-themed image generation..."
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
              Leave empty to generate warm Studio Ghibli-themed product photography
            </small>
          </div>
        )}
      </div>

      {/* Generated Image Preview */}
      {generatedImageUrl && (
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '0.5rem' }}>
            Generated Image Preview:
          </p>
          <img
            src={generatedImageUrl}
            alt="Generated product image"
            style={{
              maxWidth: '300px',
              maxHeight: '300px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              objectFit: 'contain'
            }}
          />
          <p style={{ fontSize: '11px', color: '#888', marginTop: '0.25rem' }}>
            Note: In production, this image would be uploaded to your media storage
          </p>
        </div>
      )}

      {/* Main Input Field */}
      <input
        type="text"
        {...input}
        placeholder="Image path (will be auto-filled by AI generation)"
        style={{
          width: '100%',
          padding: '0.75rem',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '14px'
        }}
      />

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

export default AIImageField;
