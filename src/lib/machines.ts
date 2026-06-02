// site/src/lib/machines.ts
// Shared utilities for loading the machines registry — the single source of
// truth for the Starstuck Lab "constellation" of products. Drives the
// /machines index page and (later) per-product OG/meta.
//
// Phase 0: a plain JSON registry (mirrors navigation.json / footer.json). It can
// graduate to a Keystatic-editable content collection later without changing
// this contract.
import machinesData from '../data/machines.json';

/** What kind of thing it is. Drives the badge label. */
export type MachineKind = 'telescope' | 'hardware' | 'software';

/** How you engage with it. Drives the call-to-action verb. */
export type MachineAccess = 'buy' | 'details' | 'enquire' | 'open' | 'read' | 'soon';

export interface Machine {
  slug: string;
  name: string;
  tagline: string;
  blurb: string;
  kind: MachineKind;
  access: MachineAccess;
  /** Human status string, e.g. "Unit 001 · Brooding", "Monthly · June 2026". */
  status: string;
  /** Where the card links. null = no destination yet (e.g. "soon"). */
  url: string | null;
  /** true = off to a spoke subdomain (new tab); false = internal hub route. */
  external: boolean;
  /** Optional GitHub repo URL, shown as a secondary link. */
  repo: string | null;
  /** The product's signature accent (hex), for a subtle per-card tint. */
  accent: string;
  /** Optional card image (web path), e.g. populated by tools/gen_machine_cards.py. */
  image?: string | null;
  /** How to render the image: "hero"/"generated" fill the thumb; "icon" centers the mark on the accent. */
  image_kind?: 'hero' | 'icon' | 'generated' | null;
  order: number;
  featured: boolean;
}

interface MachinesData {
  machines: Machine[];
}

/** Returns all machines, sorted by `order`. */
export function getMachines(): Machine[] {
  try {
    const data = machinesData as MachinesData;
    if (!data.machines || !Array.isArray(data.machines)) {
      console.warn('Invalid machines.json structure, using empty list');
      return [];
    }
    return [...data.machines].sort((a, b) => a.order - b.order);
  } catch (err) {
    console.warn('Could not load machines.json, using empty list:', err);
    return [];
  }
}

/** Human label for the kind badge. */
export function kindLabel(kind: MachineKind): string {
  switch (kind) {
    case 'telescope': return 'Telescope';
    case 'hardware':  return 'Instrument';
    case 'software':  return 'Software';
    default:          return 'Instrument';
  }
}

/**
 * Maps an access mode to its call-to-action.
 * `isLink: false` means the card is informational only (no destination yet).
 */
export function machineCta(access: MachineAccess): { label: string; isLink: boolean } {
  switch (access) {
    case 'buy':     return { label: 'View in shop',   isLink: true };
    case 'details': return { label: 'View details',   isLink: true };
    case 'enquire': return { label: 'Enquire',        isLink: true };
    case 'open':    return { label: 'Open the app',   isLink: true };
    case 'read':    return { label: 'Read the story', isLink: true };
    case 'soon':    return { label: 'Coming soon',    isLink: false };
    default:        return { label: 'View',           isLink: true };
  }
}
