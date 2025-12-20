import * as THREE from 'three';

export const pickColorForFile = (fileName: string, tubeA: string, tubeB: string, base: string): string => {
  const name = fileName.toLowerCase().replace(/['"]/g, '').replace(/\s+/g, '-').replace(/_/g, '-').trim();
  if (name.startsWith('tube-a-')) return tubeA;
  if (name.startsWith('tube-b-')) return tubeB;
  if (name.startsWith('base-')) return base;
  if (name.startsWith('mount-')) return '#f5f5f5';
  if (name.startsWith('rod-')) return '#d6d6d6';
  if (name.startsWith('black-')) return '#1a1a1a';
  if (name.startsWith('mirror-')) return '#b2d9db';
  return '#9a9a9a';
};

export const positionModel = (mesh: THREE.Mesh, fileName: string): void => {
  // Scale down if needed (STL files might be in different units)
  const scale = 0.1; // Adjust this based on actual model sizes
  mesh.scale.setScalar(scale);
};
