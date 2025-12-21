import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { PASTEL_COLORS } from './telescopeColors';
import { BASE_PRICE, ENGRAVING_COST, GRAPHIC_COST, STEPS } from './telescopeConstants';
import type { CustomizationState, WizardStep } from './telescopeTypes';
import TelescopeViewer from './TelescopeViewer';
import ColorPicker from './ColorPicker';
import StepNavigation from './StepNavigation';

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
  const [cameraState, setCameraState] = useState<{
    position: THREE.Vector3;
    target: THREE.Vector3;
  } | undefined>(undefined);

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

  const handleCameraStateChange = (state: { position: THREE.Vector3; target: THREE.Vector3 }) => {
    setCameraState(state);
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
        graphicData: graphicPreview,
        graphicName: customization.graphic?.name,
      }
    };
    cart.items.push(cartItem);

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    cart.expiry = expiry.toISOString();

    localStorage.setItem('starstucklab_cart', JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: { items: cart.items } }));

    alert('✓ Added to cart!');
    window.location.href = '/shop/m42';
  };

  return (
    <div className="parchment" style={{
      maxWidth: '900px',
      margin: '0 auto',
    }}>
      {/* Back Button */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <a
          href="/shop/m42"
          className="back-link"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            color: 'var(--ink-dark)',
          }}
        >
          ← Back to Product Details
        </a>
      </div>

      {/* Progress Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 'var(--space-6)',
        padding: '0 var(--space-4)',
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
      <div style={{ minHeight: '500px', marginBottom: 'var(--space-6)' }}>
        {/* Step 0: Colors */}
        {currentStep === 0 && (
          <div>
            <StepNavigation
              currentStep={currentStep}
              totalSteps={STEPS.length}
              onPrev={prevStep}
              onNext={nextStep}
              onAddToCart={handleAddToCart}
            />

            <TelescopeViewer
              colors={{
                tubeA: customization.tubeAColor,
                tubeB: customization.tubeBColor,
                base: customization.baseColor,
              }}
              onColorChange={handleColorChange}
              cameraState={cameraState}
              onCameraStateChange={handleCameraStateChange}
            />
          </div>
        )}

        {/* Step 1: Engraving */}
        {currentStep === 1 && (
          <div>
            <StepNavigation
              currentStep={currentStep}
              totalSteps={STEPS.length}
              onPrev={prevStep}
              onNext={nextStep}
              onAddToCart={handleAddToCart}
            />

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
              cameraState={cameraState}
              onCameraStateChange={handleCameraStateChange}
            />

            {/* Mobile Engraving Input - shown below 3D viewer on mobile */}
            <div className="mobile-engraving-ui" style={{
              display: 'none',
              marginTop: 'var(--space-2)'
            }}>
              <div className="parchment parchment--nested" style={{ padding: 'var(--space-4)' }}>
                <h4 style={{ margin: '0 0 var(--space-2) 0', fontSize: '1.1rem' }}>
                  Add Engraving Text
                </h4>
                <input
                  type="text"
                  maxLength={15}
                  value={customization.engraving}
                  onChange={(e) => updateCustomization({ engraving: e.target.value })}
                  placeholder="Enter engraving text..."
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '0.9rem',
                    border: '2px solid rgba(80, 50, 25, 0.25)',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    marginBottom: '4px',
                    background: 'rgba(255, 250, 240, 0.9)',
                    color: 'var(--parchment-text)',
                  }}
                />
                <div style={{
                  fontSize: '0.7rem',
                  color: 'var(--parchment-italic)',
                  textAlign: 'right',
                }}>
                  {customization.engraving.length}/15 characters
                </div>
              </div>
            </div>

            {customization.engraving && (
              <div style={{
                marginTop: 'var(--space-6)',
                padding: 'var(--space-4)',
                background: 'rgba(42,122,79,0.1)',
                borderRadius: 'var(--radius-lg)',
                color: '#2a7a4f',
                fontSize: '0.9rem',
                textAlign: 'center',
              }}>
                ✓ Engraving will add ₹{ENGRAVING_COST.toLocaleString()} to the total price
              </div>
            )}
          </div>
        )}

        {/* Step 2: Graphic */}
        {currentStep === 2 && (
          <div>
            <StepNavigation
              currentStep={currentStep}
              totalSteps={STEPS.length}
              onPrev={prevStep}
              onNext={nextStep}
              onAddToCart={handleAddToCart}
            />

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
              cameraState={cameraState}
              onCameraStateChange={handleCameraStateChange}
            />

            {/* Mobile Graphic Upload - shown below 3D viewer on mobile */}
            <div className="mobile-graphic-ui" style={{
              display: 'none',
              marginTop: 'var(--space-2)'
            }}>
              <div className="parchment parchment--nested" style={{ padding: 'var(--space-4)' }}>
                <h5 style={{ margin: '0 0 var(--space-2) 0', fontSize: '1.1rem' }}>
                  Upload Custom Graphic
                </h5>
                <div style={{
                  border: '2px dashed rgba(80, 50, 25, 0.3)',
                  borderRadius: '6px',
                  padding: '16px 12px',
                  textAlign: 'center',
                  background: 'rgba(255, 250, 240, 0.6)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}>
                  <input
                    type="file"
                    accept=".png,.svg,.jpg,.jpeg"
                    onChange={handleGraphicUpload}
                    style={{ display: 'none' }}
                    id="graphic-upload-mobile"
                  />
                  <label htmlFor="graphic-upload-mobile" style={{ cursor: 'pointer', display: 'block' }}>
                    <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>📁</div>
                    <div style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      marginBottom: '2px',
                      color: 'var(--parchment-heading)'
                    }}>
                      Click to upload
                    </div>
                    <div style={{
                      fontSize: '0.7rem',
                      color: 'var(--parchment-italic)',
                      width: '200px',
                      display: 'inline-block'
                    }}>
                      Simple black and white graphic in PNG, SVG, JPG (max 2MB)
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {graphicPreview && (
              <div style={{ marginTop: 'var(--space-8)' }}>
                <div style={{ fontWeight: 600, marginBottom: 'var(--space-3)' }}>Preview:</div>
                <div className="parchment parchment--nested" style={{
                  textAlign: 'center',
                }}>
                  <img
                    src={graphicPreview}
                    alt="Preview"
                    style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }}
                  />
                  <div style={{ marginTop: 'var(--space-4)', fontSize: '0.9rem' }}>
                    {customization.graphic?.name}
                  </div>
                </div>

                <div style={{
                  marginTop: 'var(--space-6)',
                  padding: 'var(--space-4)',
                  background: 'rgba(74,144,226,0.1)',
                  borderRadius: 'var(--radius-lg)',
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
            <StepNavigation
              currentStep={currentStep}
              totalSteps={STEPS.length}
              onPrev={prevStep}
              onNext={nextStep}
              onAddToCart={handleAddToCart}
              onBuyNow={() => {
                handleAddToCart();
                window.location.href = '/checkout';
              }}
            />

            <TelescopeViewer
              colors={{
                tubeA: customization.tubeAColor,
                tubeB: customization.tubeBColor,
                base: customization.baseColor,
              }}
              onColorChange={handleColorChange}
              showReviewMode={true}
              cameraState={cameraState}
              onCameraStateChange={handleCameraStateChange}
            />

            <div className="parchment parchment--nested" style={{
              marginTop: 'var(--space-4)',
              marginBottom: 'var(--space-2)',
            }}>
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <div style={{
                  fontWeight: 600,
                  marginBottom: 'var(--space-2)',
                  fontSize: 'var(--text-lg)',
                }}>
                  Colors Selected
                </div>
                <div style={{
                  display: 'flex',
                  gap: 'var(--space-2)',
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}>
                  {[
                    { label: 'Tube A', color: customization.tubeAColor },
                    { label: 'Tube B', color: customization.tubeBColor },
                    { label: 'Base', color: customization.baseColor },
                  ].map(item => (
                    <div key={item.label} style={{
                      padding: '16px 8px',
                      borderRadius: '16px',
                      background: item.color,
                      border: '2px solid rgba(0, 0, 0, 0.15)',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: item.color === '#f7f7f7' || item.color === '#ffd100' ? '#333' : '#fff',
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                      minWidth: '60px',
                      maxWidth: '85px',
                      textAlign: 'center',
                      lineHeight: '1.2',
                    }}>
                      {PASTEL_COLORS.find(c => c.hex === item.color)?.name}
                    </div>
                  ))}
                </div>
              </div>

              {customization.engraving && (
                <div style={{
                  marginBottom: 'var(--space-4)',
                  paddingBottom: 'var(--space-4)',
                  borderBottom: '1px solid rgba(90, 50, 20, 0.12)'
                }}>
                  <div style={{
                    fontWeight: 600,
                    marginBottom: 'var(--space-2)',
                    fontSize: 'var(--text-lg)',
                  }}>
                    Engraving
                  </div>
                  <div style={{
                    background: 'rgba(255, 250, 240, 0.6)',
                    border: '1px solid rgba(90, 50, 20, 0.12)',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-lg)',
                    fontFamily: 'Georgia, serif',
                    fontStyle: 'italic',
                    fontSize: 'var(--text-xl)',
                    textAlign: 'center',
                  }}>
                    "{customization.engraving}"
                  </div>
                </div>
              )}

              {customization.graphic && (
                <div style={{ marginTop: 'var(--space-2)' }}>
                  <div style={{
                    fontWeight: 600,
                    marginBottom: 'var(--space-2)',
                    fontSize: 'var(--text-lg)',
                  }}>
                    Custom Graphic
                  </div>
                  <div style={{
                    background: 'rgba(255, 250, 240, 0.6)',
                    border: '1px solid rgba(90, 50, 20, 0.12)',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                  }}>
                    {graphicPreview && (
                      <img src={graphicPreview} alt="Graphic" style={{
                        width: '70px',
                        height: '70px',
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-lg)',
                        border: '2px solid rgba(90, 50, 20, 0.15)',
                      }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                        {customization.graphic.name}
                      </div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--parchment-italic)' }}>
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
                  <div style={{ fontSize: 'var(--text-base)', opacity: 0.95, marginBottom: 'var(--space-2)' }}>
                    Total Price
                  </div>
                  <div style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                    ₹{calculatePrice().toLocaleString()}
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', opacity: 0.9 }}>
                    Base: ₹{BASE_PRICE.toLocaleString()}
                    {customization.engraving && ` + Engraving: ₹${ENGRAVING_COST.toLocaleString()}`}
                    {customization.graphic && ` + Graphic: ₹${GRAPHIC_COST.toLocaleString()}`}
                  </div>
                </div>
                <div style={{ fontSize: '4rem' }}>🔭</div>
              </div>
            </div>

            {/* Bottom Action Buttons */}
            <div style={{
              marginTop: 'var(--space-6)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '16px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={handleAddToCart}
                className="button"
                style={{
                  padding: '16px 24px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #4a7a2a 0%, #2a5a1a 100%)',
                }}
              >
                Add to Cart 🛒
              </button>
              <button
                onClick={() => {
                  handleAddToCart();
                  window.location.href = '/checkout';
                }}
                className="button"
                style={{
                  padding: '16px 48px',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                }}
              >
                Buy Now 💳
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile-specific styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media (max-width: 640px) {
            .mobile-engraving-ui,
            .mobile-graphic-ui {
              display: block !important;
            }
          }
        `
      }} />
    </div>
  );
}
