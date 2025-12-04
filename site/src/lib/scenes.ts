// site/src/lib/scenes.ts
// Shared utilities for loading and resolving image scene manifests
import fs from 'fs';
import path from 'path';

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

let cachedManifest: ImageManifest | null = null;

function loadManifest(): ImageManifest {
  if (cachedManifest) return cachedManifest;
  
  const manifestPath = new URL('../data/images.json', import.meta.url);
  try {
    cachedManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (err) {
    console.warn(`Could not read images manifest: ${err}`);
    cachedManifest = { scenes: {} };
  }
  return cachedManifest;
}

function findVariantFilename(
  sceneKey: string,
  opts: { id?: string; type?: string; aspect?: string } = {}
): string | null {
  const manifest = loadManifest();
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
  return path.posix.join(baseUrl, sceneKey, manifestFilename);
}

export function getSceneSources(sceneKey: string, baseUrl?: string): SceneSources {
  const base = baseUrl || String(import.meta.env.BASE_URL || '/');
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
  const base = baseUrl || String(import.meta.env.BASE_URL || '/');
  return `${base.replace(/\/?$/, '/')}assets/${sceneKey}/${sceneKey}-master.webp`;
}

