import React, { useState, useEffect } from 'react';
import { PASTEL_COLORS } from './telescopeColors';
import { BASE_PRICE, ENGRAVING_COST, GRAPHIC_COST, STEPS } from './telescopeConstants';
import type { CustomizationState, WizardStep } from './telescopeTypes';
import TelescopeViewer from './TelescopeViewer';
import ColorPicker from './ColorPicker';

// ============================================================================
// MAIN WIZARD COMPONENT
// ============================================================================

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
    // Get existing cart
    const stored = localStorage.getItem('starstucklab_cart');
    const cart = stored ? JSON.parse(stored) : { items: [] };

    // Convert graphic to base64 for storage
    if (customization.graphic && graphicPreview) {
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
          graphicData: graphicPreview,
          graphicName: customization.graphic.name,
        }
      };

      cart.items.push(cartItem);
    } else {
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
        }
      };

      cart.items.push(cartItem);
    }

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    cart.expiry = expiry.toISOString();

    localStorage.setItem('starstucklab_cart', JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: { items: cart.items } }));

    // Show success message and redirect back to product page
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
      <div style={{ minHeight: '500px', marginBottom: '32px' }}>
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
              focusTarget="tube-a-uta-for-sleeve.stl"
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

            <div style={{
              border: '2px dashed #ddd',
              borderRadius: '12px',
              padding: '48px',
              textAlign: 'center',
              background: '#fafafa',
              cursor: 'pointer',
            }}>
              <input
                type="file"
                accept=".png,.svg,.jpg,.jpeg"
                onChange={handleGraphicUpload}
                style={{ display: 'none' }}
                id="graphic-upload"
              />
              <label htmlFor="graphic-upload" style={{ cursor: 'pointer' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📁</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>
                  Click to upload or drag and drop
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  PNG, SVG, or JPG (max 2MB)
                </div>
              </label>
            </div>

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
                  background: 'rgba(42,122,79,0.1)',
                  borderRadius: '8px',
                  color: '#2a7a4f',
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
            <h2 style={{ marginBottom: '8px', fontSize: '1.8rem' }}>Review Your Customization</h2>
            <p style={{ marginBottom: '32px', color: '#666' }}>Confirm your choices before adding to cart</p>

            <div style={{
              background: '#f5f5f5',
              padding: '32px',
              borderRadius: '12px',
              marginBottom: '24px',
            }}>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontWeight: 600, marginBottom: '12px', fontSize: '1.1rem' }}>Colors</div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {[
                    { label: 'Tube A', color: customization.tubeAColor },
                    { label: 'Tube B', color: customization.tubeBColor },
                    { label: 'Base', color: customization.baseColor },
                  ].map(item => (
                    <div key={item.label} style={{
                      flex: 1,
                      padding: '16px',
                      borderRadius: '8px',
                      background: '#fff',
                      textAlign: 'center',
                    }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: item.color,
                        margin: '0 auto 8px',
                        border: '3px solid rgba(0,0,0,0.1)',
                      }} />
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.label}</div>
                      <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
                        {PASTEL_COLORS.find(c => c.hex === item.color)?.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {customization.engraving && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontWeight: 600, marginBottom: '12px', fontSize: '1.1rem' }}>Engraving</div>
                  <div style={{
                    background: '#fff',
                    padding: '16px',
                    borderRadius: '8px',
                    fontFamily: 'Georgia, serif',
                    fontStyle: 'italic',
                    fontSize: '1.2rem',
                  }}>
                    "{customization.engraving}"
                  </div>
                </div>
              )}

              {customization.graphic && (
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '12px', fontSize: '1.1rem' }}>Custom Graphic</div>
                  <div style={{
                    background: '#fff',
                    padding: '16px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}>
                    {graphicPreview && (
                      <img src={graphicPreview} alt="Graphic" style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                      }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 600 }}>{customization.graphic.name}</div>
                      <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>
                        {(customization.graphic.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #2a7a4f 0%, #1d5a3d 100%)',
              padding: '32px',
              borderRadius: '12px',
              color: '#fff',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '4px' }}>Total Price</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>
                    ₹{calculatePrice().toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '8px' }}>
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
