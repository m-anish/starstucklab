import React, { useState, useEffect } from 'react';
import { PASTEL_COLORS } from './telescopeColors';
import { BASE_PRICE, ENGRAVING_COST, GRAPHIC_COST, STEPS } from './telescopeConstants';
import type { CustomizationState, WizardStep } from './telescopeTypes';
import TelescopeViewer from './TelescopeViewer';
import ColorPicker from './ColorPicker';

export default function CustomizationWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [customization, setCustomization] = useState<CustomizationState>({
    tubeAColor: '#b31021',
    tubeBColor: '#ffd100',
    baseColor: '#a1a3a4',
    engraving: '',
    graphic: null,
  });
  const [graphicPreview, setGraphicPreview] = useState<string | null>(null);

  const updateCustomization = (updates: Partial<CustomizationState>) => {
    setCustomization(prev => ({ ...prev, ...updates }));
  };

  const handleColorChange = (part: 'tubeA' | 'tubeB' | 'base', color: string) => {
    const colorKey = part === 'tubeA' ? 'tubeAColor' : part === 'tubeB' ? 'tubeBColor' : 'baseColor';
    updateCustomization({ [colorKey]: color });
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(curr => curr + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(curr => curr - 1);
    }
  };

  const calculatePrice = () => {
    let total = BASE_PRICE;
    if (customization.engraving) total += ENGRAVING_COST;
    if (customization.graphic) total += GRAPHIC_COST;
    return total;
  };

  const handleGraphicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('File too large (max 2MB)');
      return;
    }

    updateCustomization({ graphic: file });

    const reader = new FileReader();
    reader.onload = (ev) => {
      setGraphicPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddToCart = () => {
    const stored = localStorage.getItem('starstucklab_cart');
    const cart = stored ? JSON.parse(stored) : { items: [] };

    const cartItem = {
      slug: 'm42',
      title: 'M42 Dobsonian (Customized)',
      price: calculatePrice().toString(),
      currency: 'INR',
      quantity: 1,
      customization: {
        tubeAColor: customization.tubeAColor,
        tubeBColor: customization.tubeBColor,
        baseColor: customization.baseColor,
        engraving: customization.engraving,
        graphicData: graphicPreview, // Store base64 for localStorage
        graphicName: customization.graphic?.name,
      }
    };
    cart.items.push(cartItem);

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    cart.expiry = expiry.toISOString();

    // Store cart data (File objects will be handled separately during form submission)
    localStorage.setItem('starstucklab_cart', JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: { items: cart.items } }));

    alert('✓ Added to cart!');
    window.location.href = '/shop/m42';
  };

  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '20px',
      background: 'rgba(255,255,255,0.95)',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    }}>
      {/* Back Button */}
      <div style={{ marginBottom: '24px' }}>
        <a 
          href="/shop/m42" 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#666',
            textDecoration: 'none',
            fontSize: '0.95rem',
            transition: 'color 0.2s ease',
          }}
          onMouseOver={(e) => e.currentTarget.style.color = '#2a7a4f'}
          onMouseOut={(e) => e.currentTarget.style.color = '#666'}
        >
          ← Back to Product Details
        </a>
      </div>

      {/* Progress Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '40px',
        padding: '0 20px',
      }}>
        {STEPS.map((step, idx) => (
          <div key={step.id} style={{
            flex: 1,
            textAlign: 'center',
            position: 'relative',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: idx <= currentStep ? '#2a7a4f' : '#ddd',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 8px',
              fontSize: '1.5rem',
              fontWeight: 600,
              transition: 'all 0.3s ease',
            }}>
              {idx < currentStep ? '✓' : step.icon}
            </div>
            <div style={{
              fontSize: '0.85rem',
              fontWeight: idx === currentStep ? 600 : 400,
              color: idx === currentStep ? '#2a7a4f' : '#666',
            }}>
              {step.title}
            </div>
            {idx < STEPS.length - 1 && (
              <div style={{
                position: 'absolute',
                top: '24px',
                left: 'calc(50% + 24px)',
                width: 'calc(100% - 48px)',
                height: '2px',
                background: idx < currentStep ? '#2a7a4f' : '#ddd',
                transition: 'all 0.3s ease',
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div style={{ minHeight: '550px', marginBottom: '32px' }}>
        {/* Step 0: Colors */}
        {currentStep === 0 && (
          <div>
            <h2 style={{ marginBottom: '8px', fontSize: '1.8rem' }}>Choose Your Colors</h2>
            <p style={{ marginBottom: '32px', color: '#666' }}>Select colors for each part of your telescope</p>

            <TelescopeViewer
              colors={{
                tubeA: customization.tubeAColor,
                tubeB: customization.tubeBColor,
                base: customization.baseColor,
              }}
              onColorChange={handleColorChange}
            />
          </div>
        )}

        {/* Step 1: Engraving */}
        {currentStep === 1 && (
          <div>
            <h2 style={{ marginBottom: '8px', fontSize: '1.8rem' }}>Add Engraving (Optional)</h2>
            <p style={{ marginBottom: '32px', color: '#666' }}>Personalize your telescope with custom text (max 15 characters)</p>

            <TelescopeViewer
              colors={{
                tubeA: customization.tubeAColor,
                tubeB: customization.tubeBColor,
                base: customization.baseColor,
              }}
              onColorChange={handleColorChange}
              focusTarget="engraving"
              showEngravingUI={true}
              engravingText={customization.engraving}
              onEngravingChange={(text) => updateCustomization({ engraving: text })}
            />

            <div style={{ marginTop: '24px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #2a7a4f 0%, #1d5a3d 100%)',
                padding: '32px',
                borderRadius: '12px',
                color: '#fff',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '0.9rem', marginBottom: '8px', opacity: 0.9 }}>
                  Preview:
                </div>
                <div style={{
                  fontSize: '1.5rem',
                  fontFamily: 'Georgia, serif',
                  fontStyle: 'italic',
                  letterSpacing: '2px',
                }}>
                  {customization.engraving || '(no engraving)'}
                </div>
              </div>

              {customization.engraving && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: 'rgba(42,122,79,0.1)',
                  borderRadius: '8px',
                  color: '#2a7a4f',
                  fontSize: '0.9rem',
                  textAlign: 'center',
                }}>
                  ✓ Engraving will add ₹{ENGRAVING_COST.toLocaleString()} to the total price
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Graphic */}
        {currentStep === 2 && (
          <div>
            <h2 style={{ marginBottom: '8px', fontSize: '1.8rem' }}>Attach Custom Graphic (Optional)</h2>
            <p style={{ marginBottom: '32px', color: '#666' }}>Upload artwork or logo (PNG, SVG, JPG - max 2MB)</p>

            <TelescopeViewer
              colors={{
                tubeA: customization.tubeAColor,
                tubeB: customization.tubeBColor,
                base: customization.baseColor,
              }}
              onColorChange={handleColorChange}
              focusTarget="graphic"
              showGraphicUI={true}
              onGraphicUpload={handleGraphicUpload}
            />

            {graphicPreview && (
              <div style={{ marginTop: '32px' }}>
                <div style={{ fontWeight: 600, marginBottom: '12px' }}>Preview:</div>
                <div style={{
                  background: '#fff',
                  padding: '24px',
                  borderRadius: '12px',
                  border: '2px solid #ddd',
                  textAlign: 'center',
                }}>
                  <img
                    src={graphicPreview}
                    alt="Preview"
                    style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }}
                  />
                  <div style={{ marginTop: '16px', fontSize: '0.9rem', color: '#666' }}>
                    {customization.graphic?.name}
                  </div>
                </div>

                <div style={{
                  marginTop: '24px',
                  padding: '16px',
                  background: 'rgba(74,144,226,0.1)',
                  borderRadius: '8px',
                  color: '#4a90e2',
                  fontSize: '0.9rem',
                }}>
                  ✓ Custom graphic will add ₹{GRAPHIC_COST.toLocaleString()} to the total price
                </div>
              </div>
            )}
          </div>
        )}

{/* Step 3: Review */}
        {currentStep === 3 && (
          <div>
            <h2 style={{ 
              marginBottom: '8px', 
              fontSize: '1.8rem',
              color: '#1a1412', // Dark text on light background
              fontFamily: 'var(--font-display)'
            }}>
              Review Your Customization
            </h2>
            <p style={{ 
              marginBottom: '32px', 
              color: '#5a3214', // Darker muted text
              fontFamily: 'var(--font-body)'
            }}>
              Confirm your choices before adding to cart
            </p>

            <TelescopeViewer
              colors={{
                tubeA: customization.tubeAColor,
                tubeB: customization.tubeBColor,
                base: customization.baseColor,
              }}
              onColorChange={handleColorChange}
              showReviewMode={true}
            />

            <div style={{
              background: '#fbf0db', // Parchment cream
              border: '1px solid rgba(90, 50, 20, 0.15)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-8)',
              marginTop: 'var(--space-8)',
              marginBottom: 'var(--space-6)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            }}>
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <div style={{ 
                  fontWeight: 600, 
                  marginBottom: 'var(--space-4)', 
                  fontSize: 'var(--text-lg)',
                  color: '#1a1412',
                  fontFamily: 'var(--font-ui)'
                }}>
                  Colors Selected
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Tube A', color: customization.tubeAColor },
                    { label: 'Tube B', color: customization.tubeBColor },
                    { label: 'Base', color: customization.baseColor },
                  ].map(item => (
                    <div key={item.label} style={{
                      flex: '1 1 150px',
                      padding: 'var(--space-4)',
                      borderRadius: 'var(--radius-lg)',
                      background: '#fff',
                      border: '1px solid rgba(90, 50, 20, 0.12)',
                      textAlign: 'center',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                    }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: item.color,
                        margin: '0 auto var(--space-2)',
                        border: '3px solid rgba(0, 0, 0, 0.15)',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                      }} />
                      <div style={{ 
                        fontSize: 'var(--text-sm)', 
                        fontWeight: 600,
                        color: '#1a1412',
                        marginBottom: 'var(--space-1)'
                      }}>
                        {item.label}
                      </div>
                      <div style={{ 
                        fontSize: 'var(--text-xs)', 
                        color: '#5a3214'
                      }}>
                        {PASTEL_COLORS.find(c => c.hex === item.color)?.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {customization.engraving && (
                <div style={{ 
                  marginBottom: 'var(--space-6)',
                  paddingBottom: 'var(--space-6)',
                  borderBottom: '1px solid rgba(90, 50, 20, 0.12)'
                }}>
                  <div style={{ 
                    fontWeight: 600, 
                    marginBottom: 'var(--space-3)', 
                    fontSize: 'var(--text-lg)',
                    color: '#1a1412',
                    fontFamily: 'var(--font-ui)'
                  }}>
                    Engraving
                  </div>
                  <div style={{
                    background: '#fff',
                    border: '1px solid rgba(90, 50, 20, 0.12)',
                    padding: 'var(--space-4)',
                    borderRadius: 'var(--radius-lg)',
                    fontFamily: 'Georgia, serif',
                    fontStyle: 'italic',
                    fontSize: 'var(--text-xl)',
                    color: '#1a1412',
                    textAlign: 'center',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                  }}>
                    "{customization.engraving}"
                  </div>
                </div>
              )}

              {customization.graphic && (
                <div style={{
                  paddingBottom: 'var(--space-6)',
                  borderBottom: '1px solid rgba(90, 50, 20, 0.12)'
                }}>
                  <div style={{ 
                    fontWeight: 600, 
                    marginBottom: 'var(--space-3)', 
                    fontSize: 'var(--text-lg)',
                    color: '#1a1412',
                    fontFamily: 'var(--font-ui)'
                  }}>
                    Custom Graphic
                  </div>
                  <div style={{
                    background: '#fff',
                    border: '1px solid rgba(90, 50, 20, 0.12)',
                    padding: 'var(--space-4)',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-4)',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                  }}>
                    {graphicPreview && (
                      <img src={graphicPreview} alt="Graphic" style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-lg)',
                        border: '2px solid rgba(90, 50, 20, 0.15)',
                      }} />
                    )}
                    <div>
                      <div style={{ 
                        fontWeight: 600,
                        color: '#1a1412',
                        marginBottom: 'var(--space-1)'
                      }}>
                        {customization.graphic.name}
                      </div>
                      <div style={{ 
                        fontSize: 'var(--text-sm)', 
                        color: '#5a3214'
                      }}>
                        {(customization.graphic.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{
              background: 'linear-gradient(135deg, var(--accent-green) 0%, #1d5a3d 100%)',
              padding: 'var(--space-8)',
              borderRadius: 'var(--radius-xl)',
              color: '#fff',
              boxShadow: '0 8px 24px rgba(42, 122, 79, 0.3)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                <div>
                  <div style={{ 
                    fontSize: 'var(--text-base)', 
                    opacity: 0.95, 
                    marginBottom: 'var(--space-2)',
                    fontFamily: 'var(--font-ui)'
                  }}>
                    Total Price
                  </div>
                  <div style={{ 
                    fontSize: 'clamp(2rem, 5vw, 2.5rem)', 
                    fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                    marginBottom: 'var(--space-2)'
                  }}>
                    ₹{calculatePrice().toLocaleString()}
                  </div>
                  <div style={{ 
                    fontSize: 'var(--text-sm)', 
                    opacity: 0.9,
                    fontFamily: 'var(--font-body)'
                  }}>
                    Base: ₹{BASE_PRICE.toLocaleString()}
                    {customization.engraving && ` + Engraving: ₹${ENGRAVING_COST.toLocaleString()}`}
                    {customization.graphic && ` + Graphic: ₹${GRAPHIC_COST.toLocaleString()}`}
                  </div>
                </div>
                <div style={{ fontSize: '4rem' }}>🔭</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '16px',
        paddingTop: '24px',
        borderTop: '1px solid #ddd',
      }}>
        {currentStep > 0 && (
          <button
            onClick={prevStep}
            style={{
              padding: '14px 32px',
              background: '#fff',
              border: '2px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600,
              transition: 'all 0.2s ease',
            }}
          >
            ← Previous
          </button>
        )}

        {currentStep < STEPS.length - 1 ? (
          <button
            onClick={nextStep}
            style={{
              marginLeft: 'auto',
              padding: '14px 32px',
              background: 'linear-gradient(135deg, #2a7a4f 0%, #1d5a3d 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600,
              transition: 'all 0.2s ease',
            }}
          >
            Next Step →
          </button>
        ) : (
          <button
            onClick={handleAddToCart}
            style={{
              marginLeft: 'auto',
              padding: '16px 48px',
              background: 'linear-gradient(135deg, #2a7a4f 0%, #1d5a3d 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '1.1rem',
              fontWeight: 700,
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(42,122,79,0.3)',
            }}
          >
            Add to Cart 🛒
          </button>
        )}
      </div>
    </div>
  );
}
