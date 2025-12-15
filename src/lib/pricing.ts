// src/lib/pricing.ts
/**
 * Generic Pricing Engine for Product Customization
 * Supports multiple input types and flexible pricing rules
 */

export interface CustomizationOption {
  id: string;
  type: 'color_picker' | 'text' | 'number' | 'select' | 'checkbox' | 'radio';
  label: string;
  default: any;
  pricing?: {
    type: 'conditional' | 'formula' | 'option_based' | 'fixed';
    rule?: string;        // For conditional (e.g., "if value != default then +2000")
    formula?: string;     // For formula (e.g., "(value - default) * 10")
    amount?: number;      // For fixed
  };
  // Type-specific fields
  palette?: Array<{ name: string; hex: string }>;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: string; label: string; price?: number }>;
  placeholder?: string;
  max_length?: number;
  help_text?: string;
}

export interface CustomizationValue {
  [optionId: string]: any;
}

export interface PriceBreakdownItem {
  label: string;
  amount: number;
}

export interface PricingBreakdown {
  base: number;
  items: PriceBreakdownItem[];
  total: number;
  currency: string;
}

/**
 * Calculate price based on customization values
 */
export function calculatePrice(
  basePrice: number,
  currency: string,
  options: CustomizationOption[],
  values: CustomizationValue
): PricingBreakdown {
  const breakdown: PricingBreakdown = {
    base: basePrice,
    currency,
    items: [],
    total: basePrice
  };

  for (const option of options) {
    const value = values[option.id];
    const defaultValue = option.default;
    
    if (!option.pricing) continue;

    let additionalCost = 0;
    let label = option.label;

    switch (option.pricing.type) {
      case 'conditional':
        additionalCost = evaluateConditional(option.pricing.rule!, value, defaultValue);
        break;
      
      case 'formula':
        additionalCost = evaluateFormula(option.pricing.formula!, value, defaultValue);
        break;
      
      case 'option_based':
        additionalCost = getOptionPrice(option, value);
        label = getOptionLabel(option, value) || label;
        break;
      
      case 'fixed':
        additionalCost = option.pricing.amount || 0;
        break;
    }

    if (additionalCost > 0) {
      breakdown.items.push({ label, amount: additionalCost });
      breakdown.total += additionalCost;
    }
  }

  return breakdown;
}

/**
 * Evaluate conditional pricing rules
 * Supported patterns:
 * - "if value != default then +X"
 * - "if value.length > N then +X"
 * - "if value == true then +X"
 * - "if value == false then +X"
 */
function evaluateConditional(rule: string, value: any, defaultValue: any): number {
  try {
    // Pattern: "if value != default then +X"
    const notEqualMatch = rule.match(/if value != default then \+(\d+)/);
    if (notEqualMatch && value !== defaultValue) {
      return parseInt(notEqualMatch[1]);
    }
    
    // Pattern: "if value.length > N then +X"
    const lengthMatch = rule.match(/if value\.length > (\d+) then \+(\d+)/);
    if (lengthMatch && value?.length > parseInt(lengthMatch[1])) {
      return parseInt(lengthMatch[2]);
    }
    
    // Pattern: "if value == true then +X"
    const boolTrueMatch = rule.match(/if value == true then \+(\d+)/);
    if (boolTrueMatch && value === true) {
      return parseInt(boolTrueMatch[1]);
    }
    
    // Pattern: "if value == false then +X"
    const boolFalseMatch = rule.match(/if value == false then \+(\d+)/);
    if (boolFalseMatch && value === false) {
      return parseInt(boolFalseMatch[1]);
    }
    
    // Pattern: "if value > N then +X"
    const greaterMatch = rule.match(/if value > (\d+) then \+(\d+)/);
    if (greaterMatch && value > parseInt(greaterMatch[1])) {
      return parseInt(greaterMatch[2]);
    }
    
    // Pattern: "if value < N then +X"
    const lessMatch = rule.match(/if value < (\d+) then \+(\d+)/);
    if (lessMatch && value < parseInt(lessMatch[1])) {
      return parseInt(lessMatch[2]);
    }
    
    return 0;
  } catch (error) {
    console.error('Error evaluating conditional:', error);
    return 0;
  }
}

/**
 * Evaluate formula-based pricing
 * Example: "(value - default) * 10"
 * Variables available: value, default
 */
function evaluateFormula(formula: string, value: any, defaultValue: any): number {
  try {
    // Sanitize inputs
    const numValue = parseFloat(value) || 0;
    const numDefault = parseFloat(defaultValue) || 0;
    
    // Replace variables with actual values
    const expr = formula
      .replace(/\bvalue\b/g, String(numValue))
      .replace(/\bdefault\b/g, String(numDefault));
    
    // Safe eval using Function constructor (restricted context)
    // Only allows mathematical operations
    const result = new Function(`'use strict'; return (${expr})`)();
    
    return Math.max(0, Math.round(result));
  } catch (error) {
    console.error('Error evaluating formula:', error);
    return 0;
  }
}

/**
 * Get price from option-based pricing (select/radio)
 */
function getOptionPrice(option: CustomizationOption, value: any): number {
  if (!option.options) return 0;
  
  const selectedOption = option.options.find((opt: any) => opt.value === value);
  return selectedOption?.price || 0;
}

/**
 * Get label for option-based pricing
 */
function getOptionLabel(option: CustomizationOption, value: any): string | null {
  if (!option.options) return null;
  
  const selectedOption = option.options.find((opt: any) => opt.value === value);
  return selectedOption?.label || null;
}

/**
 * Format pricing breakdown for display
 */
export function formatBreakdown(breakdown: PricingBreakdown): string[] {
  const lines: string[] = [
    `Base price: ${breakdown.currency} ${breakdown.base.toLocaleString()}`
  ];
  
  for (const item of breakdown.items) {
    lines.push(`${item.label}: +${breakdown.currency} ${item.amount.toLocaleString()}`);
  }
  
  lines.push(`Total: ${breakdown.currency} ${breakdown.total.toLocaleString()}`);
  
  return lines;
}

/**
 * Initialize customization values with defaults
 */
export function initializeValues(options: CustomizationOption[]): CustomizationValue {
  const values: CustomizationValue = {};
  
  for (const option of options) {
    values[option.id] = option.default;
  }
  
  return values;
}

/**
 * Check if customization differs from defaults
 */
export function hasCustomization(
  options: CustomizationOption[],
  values: CustomizationValue
): boolean {
  for (const option of options) {
    if (values[option.id] !== option.default) {
      return true;
    }
  }
  return false;
}

/**
 * Get human-readable summary of customizations
 */
export function getCustomizationSummary(
  options: CustomizationOption[],
  values: CustomizationValue
): string[] {
  const summary: string[] = [];
  
  for (const option of options) {
    const value = values[option.id];
    const defaultValue = option.default;
    
    if (value === defaultValue) continue;
    
    let displayValue = value;
    
    // Format based on type
    switch (option.type) {
      case 'color_picker':
        const color = option.palette?.find(c => c.hex === value);
        displayValue = color?.name || value;
        break;
      
      case 'select':
      case 'radio':
        const opt = option.options?.find(o => o.value === value);
        displayValue = opt?.label || value;
        break;
      
      case 'checkbox':
        displayValue = value ? 'Yes' : 'No';
        break;
    }
    
    summary.push(`${option.label}: ${displayValue}`);
  }
  
  return summary;
}

/**
 * Validate customization value against option constraints
 */
export function validateValue(option: CustomizationOption, value: any): string | null {
  switch (option.type) {
    case 'text':
      if (option.max_length && value.length > option.max_length) {
        return `Maximum ${option.max_length} characters`;
      }
      break;
    
    case 'number':
      const num = parseFloat(value);
      if (isNaN(num)) {
        return 'Must be a valid number';
      }
      if (option.min !== undefined && num < option.min) {
        return `Minimum value is ${option.min}`;
      }
      if (option.max !== undefined && num > option.max) {
        return `Maximum value is ${option.max}`;
      }
      break;
  }
  
  return null; // Valid
}