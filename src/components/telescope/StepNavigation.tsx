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
      gap: '16px',
      marginBottom: 'var(--space-6)',
    }}>
      {currentStep > 0 && (
        <button
          onClick={onPrev}
          className="button"
          style={{
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
          }}
        >
          Next Step →
        </button>
      ) : (
        <div style={{ display: 'flex', gap: '16px', marginLeft: 'auto' }}>
          {onBuyNow ? (
            <>
              <button
                onClick={onAddToCart}
                className="button"
                style={{
                  padding: '16px 24px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
                }}
              >
                Add to Cart 🛒
              </button>
              <button
                onClick={onBuyNow}
                className="button"
                style={{
                  padding: '16px 48px',
                  fontSize: '1.1rem',
                  fontWeight: 700,
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
                padding: '16px 48px',
                fontSize: '1.1rem',
                fontWeight: 700,
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
