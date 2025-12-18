// src/components/telescope/colorMatcher.ts
export type ColorCategory = 'tube-a' | 'tube-b' | 'base' | 'arm' | 'eyepiece' | 'other';

export function matchPartToColor(partName: string): ColorCategory {
  const name = partName.toLowerCase().replace(/[_\s]/g, '-');

  // Tube assembly parts
  if (name.includes('tube-a') || name.includes('tubea')) {
    console.log('Matched tube-a:', partName);
    return 'tube-a';
  }
  if (name.includes('tube-b') || name.includes('tubeb')) {
    console.log('Matched tube-b:', partName);
    return 'tube-b';
  }

  // Mount/base parts
  if (name.includes('base')) {
    console.log('Matched base:', partName);
    return 'base';
  }
  if (name.includes('arm')) return 'arm';

  // Eyepiece (usually stays black/metallic)
  if (name.includes('eyepiece') || name.includes('eye-piece')) return 'eyepiece';

  // Log unknown parts for debugging
  // console.log('Unknown part category:', partName);
  return 'other';
}

export function applyColorToCategory(
  category: ColorCategory,
  tubeColor: string,
  mountColor: string
): string {
  switch (category) {
    case 'tube-a':
    case 'tube-b':
      return tubeColor;
    case 'base':
    case 'arm':
      return mountColor;
    case 'eyepiece':
      return '#2d3748'; // Dark gray/black
    default:
      return '#cccccc'; // Default gray
  }
}