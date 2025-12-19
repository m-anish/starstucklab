// src/components/telescope/colorMatcher.ts

export function pickColorForFile(
  fileName: string,
  tubeColor: string,
  mountColor: string
): string {

  // normalize name
  const name = fileName
    .toLowerCase()
    .replace(/['"]/g, '')        // remove quotes
    .replace(/\s+/g, '-')        // replace spaces with dashes
    .replace(/_/g, '-')          // underscores → dashes
    .trim();

  // category rules
  if (name.startsWith('tube-')) return tubeColor;
  if (name.startsWith('base-')) return mountColor;

  // fallback gray
  return '#9a9a9a';
}
