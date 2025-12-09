// site/src/lib/scenes.ts
// Fixed version - correct import path for Vite/Rollup
import imagesManifest from '../../public/data/images.json';

export interface SceneSources {
  generated: string | null;
  master: string | null;
  desktop: string | null;
  laptop: string | null;
  tablet: string | null;
  mobile: string | null;
  thumb: string | null;
}

interface ImageManifest {
  scenes?: Record<string, {
    variants?: Array<{
      id?: string;
      type?: string;
      aspect?: string;
      filename?: string;
    }>;
  }>;
}

// Load manifest at import time (build-time)
const manifest: ImageManifest = imagesManifest;

function findVariantFilename(
  sceneKey: string,
  opts: { id?: string; type?: string; aspect?: string } = {}
): string | null {
  const scene = manifest.scenes?.[sceneKey];
  if (!scene || !Array.isArray(scene.variants)) return null;
  
  if (opts.id) {
    const byId = scene.variants.find(v => v.id === opts.id && v.filename);
    if (byId) return byId.filename || null;
  }
  if (opts.aspect) {
    const byAspect = scene.variants.find(v => v.aspect === opts.aspect && v.filename);
    if (byAspect) return byAspect.filename || null;
  }
  if (opts.type) {
    const byType = scene.variants.find(v => v.type === opts.type && v.filename);
    if (byType) return byType.filename || null;
  }
  return null;
}

function staticUrlFromManifest(
  sceneKey: string,
  manifestFilename: string | null,
  baseUrl: string
): string | null {
  if (!manifestFilename) return null;
  // Use path joining that works in browser
  return `${baseUrl}${sceneKey}/${manifestFilename}`;
}

export function getSceneSources(sceneKey: string, baseUrl?: string): SceneSources {
  const base = baseUrl || '/';
  const assetsBase = base.replace(/\/?$/, '/') + 'assets/';
  
  const byId = (id: string) => findVariantFilename(sceneKey, { id });
  const filenames: Record<string, string | null> = {
    generated: byId('generated'),
    master: byId('master'),
    desktop: byId('desktop'),
    laptop: byId('laptop'),
    tablet: byId('tablet'),
    mobile: byId('mobile'),
    thumb: byId('thumb'),
  };
  
  const urls: SceneSources = {} as SceneSources;
  for (const [k, fname] of Object.entries(filenames)) {
    urls[k as keyof SceneSources] = fname 
      ? staticUrlFromManifest(sceneKey, fname, assetsBase) 
      : null;
  }
  return urls;
}

export function getDefaultFallback(sceneKey: string, baseUrl?: string): string {
  const base = baseUrl || '/';
  return `${base.replace(/\/?$/, '/')}assets/${sceneKey}/${sceneKey}-master.webp`;
}