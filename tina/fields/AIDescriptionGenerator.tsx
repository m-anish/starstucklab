// tina/fields/AIDescriptionGenerator.tsx (REFACTORED)
import React, { useState } from 'react';
import { wrapFieldsWithMeta } from 'tinacms';
import { useCMS } from 'tinacms';
import { getFormValues } from '../utils/formHelper';
import { callOpenAIWithTemplate } from '../utils/promptManager';

interface AIDescriptionGeneratorProps {
  input: any;
  meta: any;
  field: any;
}

// Simple markdown to HTML converter for preview
function markdownToHtml(markdown: string): string {
  let html = markdown;
  
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/^\* (.+)$/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  html = html.split('\n\n').map(para => {
    if (para.startsWith('<h') || para.startsWith('<ul') || para.startsWith('<li>')) {
      return para;
    }
    return `<p>${para}</p>`;
  }).join('\n');
  
  return html;
}

const AIDescriptionGenerator = wrapFieldsWithMeta<AIDescriptionGeneratorProps>(({ input, meta, field }) => {
  const [generating, setGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [generatedMarkdown, setGeneratedMarkdown] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);
  const cms = useCMS();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedMarkdown);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      alert('Failed to copy to clipboard');
    }
  };

  const generateDescription = async () => {
    setGenerating(true);

    try {
      // Get form values
      const formValues = getFormValues(cms, field, input);
      
      const title = formValues.title || 'Untitled';
      const category = formValues.category || 'product';
      const excerpt = formValues.excerpt || '';
      const features = formValues.features || [];
      const specifications = formValues.specifications || [];

      // Word count mapping
      const wordCountMap = {
        short: '150-250',
        medium: '300-500',
        long: '600-800'
      };

      console.log('AIDescriptionGenerator - Form values:', { 
        title, 
        category, 
        excerpt, 
        featuresCount: features.length,
        specsCount: specifications.length
      });

      // Build context for template
      const context = {
        word_count: wordCountMap[length],
        title,
        category,
        category_clause: category ? `, a ${category}` : '',
        excerpt_clause: excerpt ? `Product Tagline/Excerpt: ${excerpt}\n` : '',
        features_clause: features.length 
          ? `\nKey Features:\n${features.map((f: any) => `- ${f.title}: ${f.description}`).join('\n')}\n`
          : '',
        specs_clause: specifications.length
          ? `\nTechnical Specifications:\n${specifications.map((s: any) => `- ${s.label}: ${s.value}`).join('\n')}\n`
          : ''
      };

      // Generate using template
      const result = await callOpenAIWithTemplate(
        'product_description',
        context,
        customPrompt.trim() || undefined
      );

      console.log('Generated description:', result.result);
      setGeneratedMarkdown(result.result);

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
    <div style={{ marginBottom: '1.5rem' }}>
      {/* Control Panel */}
      <div style={{ 
        padding: '1.25rem',
        backgroundColor: '#f8f9fa',
        border: '2px solid #e9ecef',
        borderRadius: '8px',
        marginBottom: generatedMarkdown ? '1rem' : '0'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#198754' }}>
              ✨ AI Description Generator
            </span>
          </div>
          
          <button
            type="button"
            onClick={() => setShowPrompt(!showPrompt)}
            style={{
              padding: '0.375rem 0.75rem',
              background: 'transparent',
              color: '#0969da',
              border: '1px solid #0969da',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500
            }}
          >
            {showPrompt ? '▼ Hide Options' : '▲ Show Options'}
          </button>
        </div>

        {/* Main Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={generateDescription}
            disabled={generating}
            style={{
              padding: '0.625rem 1.25rem',
              background: generating ? '#6c757d' : '#198754',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: generating ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: generating ? 'none' : '0 2px 4px rgba(0,0,0,0.1)'
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
                <span>{generatedMarkdown ? 'Regenerate' : 'Generate Description'}</span>
              </>
            )}
          </button>

          {/* Length Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '13px', color: '#495057', fontWeight: 500 }}>
              Length:
            </label>
            <select
              value={length}
              onChange={(e) => setLength(e.target.value as 'short' | 'medium' | 'long')}
              disabled={generating}
              style={{
                padding: '0.5rem 0.75rem',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '13px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="short">Short (150-250 words)</option>
              <option value="medium">Medium (300-500 words)</option>
              <option value="long">Long (600-800 words)</option>
            </select>
          </div>
        </div>

        {/* Custom Prompt Section */}
        {showPrompt && (
          <div style={{ 
            marginTop: '1rem', 
            paddingTop: '1rem', 
            borderTop: '1px solid #dee2e6' 
          }}>
            <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              fontWeight: 600, 
              marginBottom: '0.5rem', 
              color: '#495057' 
            }}>
              Custom Prompt (Optional):
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Override template: product_description with custom instructions..."
              rows={3}
              disabled={generating}
              style={{
                width: '100%',
                padding: '0.625rem',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '13px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
            <small style={{ color: '#6c757d', fontSize: '12px' }}>
              💡 Leave empty to use template with title, category, features, and specs
            </small>
          </div>
        )}
      </div>

      {/* Side-by-Side Preview */}
      {generatedMarkdown && (
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '60% 40%',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          {/* Left: Formatted Preview */}
          <div style={{
            border: '2px solid #198754',
            borderRadius: '8px',
            backgroundColor: '#fff',
            overflow: 'hidden',
            width: '100%',
            maxWidth: '100%'
          }}>
            <div style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#198754',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: 600, fontSize: '14px' }}>
                📝 Generated Preview
              </span>
              <button
                type="button"
                onClick={copyToClipboard}
                style={{
                  padding: '0.375rem 0.75rem',
                  background: copySuccess ? '#0f5132' : 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
              >
                {copySuccess ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
            <div 
              style={{
                padding: '1.5rem',
                maxHeight: '500px',
                overflowY: 'auto',
                overflowX: 'hidden',
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#212529',
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
                whiteSpace: 'normal',
                width: '0',
                minWidth: '100%',
                boxSizing: 'border-box'
              }}
            >
              <div dangerouslySetInnerHTML={{ __html: markdownToHtml(generatedMarkdown) }} />
            </div>
          </div>

          {/* Right: Instructions */}
          <div style={{
            border: '2px solid #0969da',
            borderRadius: '8px',
            backgroundColor: '#e7f3ff',
            padding: '1.5rem',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            width: '0',
            minWidth: '100%',
            boxSizing: 'border-box'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '16px', color: '#0969da', fontWeight: 600 }}>
              📋 How to Use
            </h3>
            <ol style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '13px', lineHeight: '1.8', color: '#084298' }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Review the preview</strong> on the left - shows formatted content
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Click "Copy"</strong> to copy markdown to clipboard
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Scroll down</strong> to "Product Description" editor
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Paste content</strong> (Ctrl+V or Cmd+V)
              </li>
              <li>
                <strong>Edit as needed</strong> in the rich-text editor
              </li>
            </ol>
            
            <div style={{
              marginTop: '1.5rem',
              padding: '0.75rem',
              backgroundColor: 'rgba(255,255,255,0.8)',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#084298'
            }}>
              <strong>💡 Tip:</strong> Uses template: product_description with automatic content synthesis
            </div>
          </div>
        </div>
      )}

      {/* Info Banner */}
      {!generatedMarkdown && (
        <div style={{ 
          marginTop: '1rem',
          padding: '0.75rem 1rem',
          backgroundColor: '#e7f3ff',
          border: '1px solid #b6d4fe',
          borderLeft: '3px solid #0969da',
          borderRadius: '4px'
        }}>
          <p style={{ 
            margin: 0,
            fontSize: '13px',
            color: '#084298',
            fontWeight: 500
          }}>
            ℹ️ Click "Generate Description" to create rich, formatted content using the product_description template
          </p>
        </div>
      )}
    </div>
  );
});

export default AIDescriptionGenerator;