// site/src/lib/navigation.ts
// Shared utilities for loading navigation data
import navData from '../data/navigation.json';

export interface NavItem {
  label: string;
  href: string;
  priority: number;
}

export interface NavSettings {
  showCart: boolean;
  logoText: string;
}

export interface NavigationData {
  primary: NavItem[];
  settings: NavSettings;
}

const defaultNav: NavigationData = {
  primary: [],
  settings: { showCart: false, logoText: 'STARSTUCK LAB' }
};

export function getNavigation(): NavigationData {
  try {
    // Validate structure
    const data = navData as NavigationData;
    if (!data.primary || !Array.isArray(data.primary)) {
      console.warn('Invalid navigation.json structure, using defaults');
      return defaultNav;
    }
    // Sort by priority
    const sorted = {
      ...data,
      primary: [...data.primary].sort((a, b) => a.priority - b.priority)
    };
    return sorted;
  } catch (err) {
    console.warn('Could not load navigation.json, using defaults:', err);
    return defaultNav;
  }
}

