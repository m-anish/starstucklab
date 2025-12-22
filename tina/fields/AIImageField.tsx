// tina/fields/AIImageField.tsx (REFACTORED)
import React, { useState, useEffect } from 'react';
import { wrapFieldsWithMeta } from 'tinacms';
import { useCMS } from 'tinacms';
import { getFormValues, logFormDebugInfo } from '../utils/formHelper';
import { callOpenAIWithTemplate } from '../utils/promptManager';

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
  const cms = useCMS();

  // Debug on mount
  useEffect(() => {
    logFormDebugInfo(cms, field, input, 'AIImageField');
  }, []);

  const generateProductImage = async () => {
    setGenerating(true);

    try {
      // Get form values
      const formValues = getFormValues(cms, field, input);
      
      const title = formValues.title || 'Untitled Product';
      const category = formValues.category || 'scientific instrument';
      const excerpt = formValues.excerpt || '';

      console.log('AIImageField - Form values:', { 
        title, 
        category, 
        excerpt,
        allKeys: Object.keys(formValues)
      });

      // Determine category type for style enhancement
      let categoryType: 'telescope' | 'weather' | 'electronics' | 'general' = 'general';
      const catLower = category.toLowerCase();
      if (catLower.includes('telescope')) categoryType = 'telescope';
      else if (catLower.includes('weather')) categoryType = 'weather';
      else if (catLower.includes('electronic')) categoryType = 'electronics';

      // Build context for template
      const context = {
        title,
        category,
        style_enhancement: '' // Will be filled by variable builder
      };

      // Note: style_enhancement is handled by the variable builder in promptManager
      // based on the categoryType mapping in product-prompts.json

      console.log('Generating image with template: product_image');

      // Generate using template
      const result = await callOpenAIWithTemplate(
        'product_image',
        context,
        customPrompt.trim() || undefined
      );

      // The result contains the image URL from DALL-E
      const imageUrl = result.result;

      console.log('Generated image URL received');

      // Download and convert to data URL
      const dataUrl = await _downloadImageAsDataUrl(imageUrl);

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

  // Helper to download image and convert to data URL
  const _downloadImageAsDataUrl = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
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
            {showPrompt ? '🔽 Hide Options' : '🔼 Options'}
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
              placeholder="Optional: Override template: product_image with custom DALL-E prompt..."
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
              Leave empty to use template with Studio Ghibli-themed product photography
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