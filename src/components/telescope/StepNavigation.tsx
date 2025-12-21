import React from 'react';

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
  onAddToCart: () => void;
  onBuyNow?: () => void; // Only used in review step
}

const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  totalSteps,
  onPrev,
  onNext,
  onAddToCart,
  onBuyNow
}) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      gap: '12px',
      marginBottom: 'var(--space-4)',
    }}>
      {currentStep > 0 && (
        <button
          onClick={onPrev}
          className="button"
          style={{
            padding: '10px 16px',
            fontSize: '0.9rem',
            background: 'linear-gradient(135deg, #e8d4ab 0%, #d4c4a0 100%)',
            color: 'var(--ink-dark)',
            border: '2px solid rgba(107, 74, 40, 0.3)',
          }}
        >
          ← Previous
        </button>
      )}

      {currentStep < totalSteps - 1 ? (
        <button
          onClick={onNext}
          className="button"
          style={{
            marginLeft: 'auto',
            padding: '10px 16px',
            fontSize: '0.9rem',
          }}
        >
          Next Step →
        </button>
      ) : (
        <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
          {onBuyNow ? (
            <>
              <button
                onClick={onAddToCart}
                className="button"
                style={{
                  padding: '10px 16px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #4a7a2a 0%, #2a5a1a 100%)',
                }}
              >
                Add to Cart 🛒
              </button>
              <button
                onClick={onBuyNow}
                className="button"
                style={{
                  padding: '10px 24px',
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                Buy Now 💳
              </button>
            </>
          ) : (
            <button
              onClick={onAddToCart}
              className="button"
              style={{
                padding: '10px 24px',
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              Add to Cart 🛒
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default StepNavigation;
