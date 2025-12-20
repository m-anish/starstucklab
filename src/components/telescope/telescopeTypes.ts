export interface CustomizationState {
  tubeAColor: string;
  tubeBColor: string;
  baseColor: string;
  engraving: string;
  graphic: File | null;
}

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface TelescopeViewerProps {
  colors: { tubeA: string; tubeB: string; base: string };
  onColorChange: (part: 'tubeA' | 'tubeB' | 'base', color: string) => void;
  focusTarget?: string; // STL filename to focus camera on
  showEngravingUI?: boolean;
  engravingText?: string;
  onEngravingChange?: (text: string) => void;
}

export interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}
