import React from 'react';
import { PASTEL_COLORS } from './telescopeColors';
import type { ColorPickerProps } from './telescopeTypes';

const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange }) => {
  const textColor = (hex: string) => {
    const c = hex.replace('#', '');
    const r = parseInt(c.substr(0, 2), 16);
    const g = parseInt(c.substr(2, 2), 16);
    const b = parseInt(c.substr(4, 2), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#000' : '#fff';
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600, fontSize: '0.95rem' }}>
        {label}
      </label>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))',
        gap: '12px',
      }}>
        {PASTEL_COLORS.map(color => (
          <button
            key={color.hex}
            onClick={() => onChange(color.hex)}
            style={{
              width: '100%',
              height: '70px',
              borderRadius: '8px',
              background: color.hex,
              border: value === color.hex ? '3px solid #2a7a4f' : '2px solid rgba(0,0,0,0.2)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: textColor(color.hex),
              padding: '4px',
              textAlign: 'center',
              lineHeight: '1.2',
              boxShadow: value === color.hex ? '0 0 0 2px rgba(42,122,79,0.3)' : 'none',
            }}
          >
            {color.name.split(' ').join('\n')}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ColorPicker;
