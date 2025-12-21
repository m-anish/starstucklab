// tina/fields/AIImageField.tsx
import React, { useState, useEffect } from 'react';
import { wrapFieldsWithMeta } from 'tinacms';
import { useCMS } from 'tinacms';
import { getFormValues, logFormDebugInfo } from '../utils/formHelper';

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
  const [quality, setQuality] = useState<'low' | 'medium' | 'high' | 'auto'>('medium');
  const cms = useCMS();

  // Debug on mount
  useEffect(() => {
    logFormDebugInfo(cms, field, 'AIImageField');
  }, []);

  const generateProductImage = async () => {
    setGenerating(true);

    try {
      // Get form values using helper
      const formValues = getFormValues(cms, field);
      
      const title = formValues.title || 'Untitled Product';
      const category = formValues.category || 'scientific instrument';
      const excerpt = formValues.excerpt || '';

      console.log('AIImageField - Form values:', { 
        title, 
        category, 
        excerpt,
        allKeys: Object.keys(formValues)
      });

      let prompt = `Professional product photography of "${title}", a ${category}. `;

      if (customPrompt.trim()) {
        prompt = customPrompt;
      } else {
        // Determine category type for appropriate image style
        let categoryType: 'telescope' | 'weather' | 'electronics' | 'general' = 'general';
        const catLower = category.toLowerCase();
        if (catLower.includes('telescope')) categoryType = 'telescope';
        else if (catLower.includes('weather')) categoryType = 'weather';
        else if (catLower.includes('electronic')) categoryType = 'electronics';

        const styles = {
          telescope: 'warm studio-ghibli themed astronomical instrument, technical elegance, dark background with stars, professional scientific photography, Studio Ghibli art style, warm lighting, magical realism, detailed craftsmanship',
          weather: 'warm studio-ghibli themed meteorological device, clean design, atmospheric elements, studio lighting, Studio Ghibli art style, warm lighting, magical realism',
          electronics: 'warm studio-ghibli themed electronic circuit board, technical precision, close-up detail, professional product photography, Studio Ghibli art style, warm lighting, magical realism',
          general: 'warm studio-ghibli themed scientific instrument, professional studio lighting, high quality commercial product shot, Studio Ghibli art style, warm lighting, magical realism'
        };

        prompt += styles[categoryType];
        prompt += ', clean white background, technically accurate, high resolution, professional product photography';

        if (excerpt) {
          prompt += ` Product description: ${excerpt}`;
        }
      }

      console.log('Generating image with prompt:', prompt.substring(0, 100) + '...');

      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_image',
          prompt,
          options: { size, quality }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Image generation failed');
      }

      const data = await response.json();
      const dataUrl = data.result; // This is now a data URL (data:image/png;base64,...)

      console.log('Generated image data URL received, length:', dataUrl?.length || 0);

      // Store the data URL for preview
      setGeneratedImageUrl(dataUrl);

      // Update the field value with the data URL
      input.onChange(dataUrl);

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

  // Check if current value is a URL or data URL (for preview)
  const currentValue = input.value || '';
  const isDataUrl = currentValue.startsWith('data:image');
  const isHttpUrl = currentValue.startsWith('http://') || currentValue.startsWith('https://');
  const previewUrl = (isDataUrl || isHttpUrl) ? currentValue : (generatedImageUrl || null);

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
              onChange={(e) => setQuality(e.target.value as 'low' | 'medium' | 'high' | 'auto')}
              style={{
                padding: '0.25rem 0.5rem',
                border: '1px solid #ddd',
                borderRadius: '3px',
                fontSize: '12px'
              }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="auto">Auto</option>
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
      {previewUrl && (
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '0.5rem' }}>
            Image Preview:
          </p>
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '4px', 
            padding: '0.5rem',
            backgroundColor: '#fafafa',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '200px'
          }}>
            <img
              src={previewUrl}
              alt="Generated product image"
              style={{
                maxWidth: '100%',
                maxHeight: '400px',
                objectFit: 'contain',
                borderRadius: '4px'
              }}
              onError={(e) => {
                console.error('Image failed to load');
                e.currentTarget.style.display = 'none';
              }}
              onLoad={() => {
                console.log('✓ Image loaded successfully!');
              }}
            />
          </div>
          <p style={{ fontSize: '11px', color: '#888', marginTop: '0.5rem' }}>
            ✅ Image stored as base64 data URL. In production, convert to blob and upload to storage.
          </p>
        </div>
      )}

      {/* Main Input Field */}
      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '0.25rem', color: '#666' }}>
          Image Data (auto-filled):
        </label>
        <textarea
          {...input}
          rows={3}
          placeholder="Image data URL (auto-filled by AI generation)"
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: 'monospace',
            backgroundColor: '#fafafa',
            resize: 'vertical'
          }}
        />
        <small style={{ fontSize: '10px', color: '#888' }}>
          {currentValue.length > 0 ? `${currentValue.length} characters` : 'No image data'}
        </small>
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

export default AIImageField;