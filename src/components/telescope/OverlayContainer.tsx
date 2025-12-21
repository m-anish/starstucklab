import React from 'react';

interface OverlayContainerProps {
  isMobile: boolean;
  zIndex?: number;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const OverlayContainer: React.FC<OverlayContainerProps> = ({
  isMobile,
  zIndex = 15,
  children,
  className = 'parchment parchment--compact',
  style = {}
}) => {
  return (
    <div style={{
      position: 'absolute',
      top: isMobile ? 'auto' : 0,
      left: isMobile ? 'auto' : 0,
      right: isMobile ? 'auto' : 0,
      bottom: isMobile ? 'auto' : 0,
      display: isMobile ? 'none' : 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex,
      pointerEvents: 'none',
    }}>
      <div
        className={className}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          pointerEvents: 'auto',
          minWidth: '220px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          ...style
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default OverlayContainer;
