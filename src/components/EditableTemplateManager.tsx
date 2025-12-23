// tina/admin/EditableTemplateManager.tsx
// Full-featured template manager with EDIT and SAVE capabilities

import React, { useState, useEffect } from 'react';
import productPrompts from '../../tina/prompts/product-prompts.json';
import { promptManager } from '../../tina/utils/promptManager';

interface PromptManifest {
  meta: any;
  persona: any;
  templates: {
    [key: string]: {
      id: string;
      description: string;
      prompt: string;
      variables: string[];
      options: {
        maxTokens: number;
        temperature: number;
        size?: string;
        quality?: string;
      };
    };
  };
  variable_builders: any;
}

const EditableTemplateManager: React.FC = () => {
  const [prompts, setPrompts] = useState<PromptManifest>(productPrompts as PromptManifest);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('product_excerpt');
  const [editMode, setEditMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  
  // Test context
  const [context, setContext] = useState<any>({
    title: 'M42 Dobsonian Telescope',
    category: 'Telescope',
    excerpt: 'A telescope for stargazing',
    max_tags: 5
  });
  const [builtPrompt, setBuiltPrompt] = useState<string>('');
  const [generatedResult, setGeneratedResult] = useState<string>('');
  const [generating, setGenerating] = useState(false);

  const templates = Object.keys(prompts.templates);
  const currentTemplate = prompts.templates[selectedTemplate];

  // Build prompt when template or context changes
  useEffect(() => {
    try {
      const prompt = promptManager.buildPrompt(selectedTemplate, context);
      setBuiltPrompt(prompt || '');
    } catch (error) {
      setBuiltPrompt('Error building prompt');
    }
  }, [selectedTemplate, context, prompts]);

  const handleTemplateEdit = (field: string, value: any) => {
    setPrompts(prev => ({
      ...prev,
      templates: {
        ...prev.templates,
        [selectedTemplate]: {
          ...prev.templates[selectedTemplate],
          [field]: value
        }
      }
    }));
    setHasChanges(true);
  };

  const handleOptionsEdit = (field: string, value: any) => {
    setPrompts(prev => ({
      ...prev,
      templates: {
        ...prev.templates,
        [selectedTemplate]: {
          ...prev.templates[selectedTemplate],
          options: {
            ...prev.templates[selectedTemplate].options,
            [field]: value
          }
        }
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    
    try {
      // Save to server
      const response = await fetch('/api/save-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prompts)
      });

      if (!response.ok) {
        throw new Error('Failed to save prompts');
      }

      setSaveStatus('success');
      setHasChanges(false);
      
      // Update last_updated
      setPrompts(prev => ({
        ...prev,
        meta: {
          ...prev.meta,
          last_updated: new Date().toISOString().split('T')[0]
        }
      }));

      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(prompts, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'product-prompts.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: selectedTemplate.includes('image') ? 'generate_image' : 'generate_text',
          prompt: builtPrompt,
          options: {
            systemPrompt: prompts.persona.description,
            ...currentTemplate.options
          }
        })
      });

      if (!response.ok) throw new Error('Generation failed');

      const data = await response.json();
      setGeneratedResult(data.result);
    } catch (error: any) {
      setGeneratedResult(`Error: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '1600px', 
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header with Actions */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'start',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            🎨 Prompt Template Manager
          </h1>
          <p style={{ color: '#666', fontSize: '0.95rem' }}>
            View, edit, test, and save AI prompt templates
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {hasChanges && (
            <span style={{ 
              color: '#dc3545', 
              fontSize: '0.9rem',
              fontWeight: 600 
            }}>
              ● Unsaved changes
            </span>
          )}
          
          <button
            onClick={() => setEditMode(!editMode)}
            style={{
              padding: '0.625rem 1.25rem',
              backgroundColor: editMode ? '#6c757d' : '#0969da',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600
            }}
          >
            {editMode ? '👁️ View Mode' : '✏️ Edit Mode'}
          </button>

          <button
            onClick={handleExport}
            style={{
              padding: '0.625rem 1.25rem',
              backgroundColor: 'white',
              color: '#333',
              border: '2px solid #ddd',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600
            }}
          >
            📥 Export JSON
          </button>

          <button
            onClick={handleSave}
            disabled={!hasChanges || saveStatus === 'saving'}
            style={{
              padding: '0.625rem 1.25rem',
              backgroundColor: hasChanges ? '#198754' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: hasChanges ? 'pointer' : 'not-allowed',
              fontSize: '0.9rem',
              fontWeight: 600
            }}
          >
            {saveStatus === 'saving' ? '💾 Saving...' : 
             saveStatus === 'success' ? '✅ Saved!' :
             saveStatus === 'error' ? '❌ Error' :
             '💾 Save Changes'}
          </button>
        </div>
      </div>

      {/* Status Banner */}
      <div style={{ 
        marginBottom: '1.5rem',
        padding: '0.75rem 1rem',
        backgroundColor: editMode ? '#fff3cd' : '#e7f3ff',
        borderLeft: `3px solid ${editMode ? '#ffc107' : '#0969da'}`,
        borderRadius: '4px',
        fontSize: '0.9rem'
      }}>
        {editMode ? (
          <>
            <strong>⚠️ Edit Mode Active:</strong> You can modify prompts, descriptions, and options. 
            Don't forget to save your changes!
          </>
        ) : (
          <>
            <strong>Version:</strong> {prompts.meta.version} | 
            <strong> Last Updated:</strong> {prompts.meta.last_updated} | 
            <strong> Templates:</strong> {templates.length}
          </>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
        {/* Left Sidebar: Template List */}
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
            Templates
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {templates.map(templateId => (
              <button
                key={templateId}
                onClick={() => setSelectedTemplate(templateId)}
                style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  background: selectedTemplate === templateId ? '#0969da' : 'white',
                  color: selectedTemplate === templateId ? 'white' : '#333',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: selectedTemplate === templateId ? 600 : 400,
                  transition: 'all 0.2s'
                }}
              >
                {templateId.replace('product_', '')}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Template Editor */}
        <div>
          {/* Template Info/Editor */}
          <div style={{ 
            padding: '1.5rem',
            backgroundColor: editMode ? '#fff3cd' : '#f8f9fa',
            border: editMode ? '2px solid #ffc107' : '1px solid #ddd',
            borderRadius: '8px',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem' }}>
              {selectedTemplate}
            </h2>
            
            {/* Description */}
            {editMode ? (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.85rem', 
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                  color: '#333'
                }}>
                  Description:
                </label>
                <input
                  type="text"
                  value={currentTemplate?.description || ''}
                  onChange={(e) => handleTemplateEdit('description', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            ) : (
              <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
                {currentTemplate?.description}
              </p>
            )}

            {/* Options */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <strong style={{ fontSize: '0.85rem', color: '#666' }}>Temperature:</strong>
                {editMode ? (
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={currentTemplate?.options.temperature || 0.7}
                    onChange={(e) => handleOptionsEdit('temperature', parseFloat(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      marginTop: '0.25rem'
                    }}
                  />
                ) : (
                  <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                    {currentTemplate?.options.temperature}
                  </div>
                )}
              </div>
              <div>
                <strong style={{ fontSize: '0.85rem', color: '#666' }}>Max Tokens:</strong>
                {editMode ? (
                  <input
                    type="number"
                    step="50"
                    min="50"
                    max="4000"
                    value={currentTemplate?.options.maxTokens || 500}
                    onChange={(e) => handleOptionsEdit('maxTokens', parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      marginTop: '0.25rem'
                    }}
                  />
                ) : (
                  <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                    {currentTemplate?.options.maxTokens}
                  </div>
                )}
              </div>
            </div>

            {/* Variables */}
            <div>
              <strong style={{ fontSize: '0.85rem', color: '#666' }}>Variables:</strong>
              <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {currentTemplate?.variables.map((v: string) => (
                  <span
                    key={v}
                    style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#0969da',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontFamily: 'monospace'
                    }}
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Prompt Editor */}
          <div style={{ 
            padding: '1.5rem',
            border: editMode ? '2px solid #ffc107' : '2px solid #ddd',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            backgroundColor: 'white'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
              {editMode ? '✏️ Edit Prompt Template' : '📄 Prompt Template'}
            </h3>
            {editMode ? (
              <textarea
                value={currentTemplate?.prompt || ''}
                onChange={(e) => handleTemplateEdit('prompt', e.target.value)}
                rows={12}
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  lineHeight: '1.6',
                  fontFamily: 'monospace',
                  resize: 'vertical'
                }}
              />
            ) : (
              <pre style={{
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.85rem',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                maxHeight: '300px',
                overflow: 'auto'
              }}>
                {currentTemplate?.prompt}
              </pre>
            )}
          </div>

          {/* Test Section (unchanged) */}
          {!editMode && (
            <>
              <div style={{ 
                padding: '1.5rem',
                border: '2px solid #ddd',
                borderRadius: '8px',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                  🧪 Test Context
                </h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {currentTemplate?.variables.map((variable: string) => (
                    <div key={variable}>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '0.85rem', 
                        fontWeight: 500,
                        marginBottom: '0.5rem'
                      }}>
                        {variable}
                      </label>
                      <input
                        type="text"
                        value={context[variable] || ''}
                        onChange={(e) => setContext({ ...context, [variable]: e.target.value })}
                        placeholder={`Enter ${variable}...`}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ 
                padding: '1.5rem',
                border: '2px solid #198754',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                backgroundColor: '#f8fff9'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
                    📝 Generated Prompt
                  </h3>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: generating ? '#6c757d' : '#198754',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: generating ? 'not-allowed' : 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 500
                    }}
                  >
                    {generating ? '⏳ Generating...' : '✨ Test Generate'}
                  </button>
                </div>
                <pre style={{
                  padding: '1rem',
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  maxHeight: '300px',
                  overflow: 'auto'
                }}>
                  {builtPrompt}
                </pre>
              </div>

              {generatedResult && (
                <div style={{ 
                  padding: '1.5rem',
                  border: '2px solid #0969da',
                  borderRadius: '8px',
                  backgroundColor: '#e7f3ff'
                }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                    🤖 AI Result
                  </h3>
                  <div style={{
                    padding: '1rem',
                    backgroundColor: 'white',
                    border: '1px solid #0969da',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '400px',
                    overflow: 'auto'
                  }}>
                    {generatedResult}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditableTemplateManager;
