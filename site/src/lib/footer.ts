// site/src/lib/footer.ts
// Shared utilities for loading footer data
import footerData from '../data/footer.json';

export interface FooterLink {
  label: string;
  href: string;
  order?: number;
}

export interface FooterSection {
  id: string;
  title: string;
  description?: string;
  links?: FooterLink[];
}

export interface FooterSettings {
  copyrightText: string;
}

export interface FooterData {
  sections: FooterSection[];
  settings: FooterSettings;
}

const defaultFooter: FooterData = {
  sections: [
    {
      id: "about",
      title: "Starstuck Lab",
      description: "Building small machines for an indifferent universe",
      links: []
    },
    {
      id: "workbench",
      title: "Quick Links",
      links: [
        { label: "Projects", href: "/projects", order: 1 },
        { label: "Shop", href: "/shop", order: 2 },
        { label: "Contact", href: "/contact", order: 3 }
      ]
    },
    {
      id: "legal",
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "/privacy", order: 1 },
        { label: "Terms of Service", href: "/terms", order: 2 }
      ]
    }
  ],
  settings: {
    copyrightText: "Starstuck Lab. All rights reserved."
  }
};

export function getFooterData(): FooterData {
  try {
    // Validate structure
    const data = footerData as FooterData;
    if (!data.sections || !Array.isArray(data.sections)) {
      console.warn('Invalid footer.json structure, using defaults');
      return defaultFooter;
    }
    return data;
  } catch (err) {
    console.warn('Could not load footer.json, using defaults:', err);
    return defaultFooter;
  }
}

export function getFooterSection(sectionId: string): FooterSection | null {
  const footer = getFooterData();
  return footer.sections.find(s => s.id === sectionId) || null;
}