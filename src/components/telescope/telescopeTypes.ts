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
  focusTarget?: string; // 'engraving' or 'graphic' to focus camera on specific area
  showEngravingUI?: boolean;
  engravingText?: string;
  onEngravingChange?: (text: string) => void;
  showGraphicUI?: boolean;
  onGraphicUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showReviewMode?: boolean;
}

export interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}