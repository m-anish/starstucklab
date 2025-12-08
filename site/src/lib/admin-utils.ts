/**
 * Admin Interface Utilities
 *
 * Global utilities for the admin interface
 */

// Admin utility functions
export const AdminUtils = {
  showNotification: (message: string, type: string = 'info') => {
    // Simple notification system
    console.log(`[${type.toUpperCase()}] ${message}`);
    // TODO: Implement proper notification UI
  },

  setLoading: (element: HTMLElement, loading: boolean) => {
    if (loading) {
      element.classList.add('loading');
    } else {
      element.classList.remove('loading');
    }
  }
};

// Make available globally for inline scripts
if (typeof window !== 'undefined') {
  (window as any).AdminUtils = AdminUtils;
}
