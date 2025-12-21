// site/src/lib/cart.ts
// Client-side cart management using localStorage

export interface CartItem {
  id: string;  // Unique identifier for cart items
  slug: string;
  title: string;
  price: string;  // Price as string (matches product format)
  currency: string;
  quantity: number;
  customization?: any;  // Optional customization data
}

const CART_STORAGE_KEY = 'starstucklab_cart';
const CART_EXPIRY_DAYS = 30; // Cart expires after 30 days

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) return [];
    
    const data = JSON.parse(stored);
    
    // Check expiry
    if (data.expiry && new Date() > new Date(data.expiry)) {
      clearCart();
      return [];
    }
    
    return data.items || [];
  } catch (e) {
    console.error('Error reading cart from localStorage:', e);
    return [];
  }
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + CART_EXPIRY_DAYS);
    
    const data = {
      items,
      expiry: expiry.toISOString(),
      updated: new Date().toISOString()
    };
    
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(data));
    
    // Dispatch custom event for cart updates
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: { items } }));
  } catch (e) {
    console.error('Error saving cart to localStorage:', e);
  }
}

// Generate a unique ID for cart items
function generateCartItemId(): string {
  return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function addToCart(product: { slug: string; title: string; price: string; currency: string }): void {
  const cart = getCart();
  const existingIndex = cart.findIndex(item => item.slug === product.slug);

  if (existingIndex >= 0) {
    // Increment quantity if already in cart
    cart[existingIndex].quantity += 1;
  } else {
    // Add new item
    cart.push({
      id: generateCartItemId(),
      ...product,
      quantity: 1
    });
  }

  saveCart(cart);
}

export function removeFromCart(itemId: string): void {
  const cart = getCart().filter(item => item.id !== itemId);
  saveCart(cart);
}

export function updateQuantity(itemId: string, quantity: number): void {
  if (quantity <= 0) {
    removeFromCart(itemId);
    return;
  }

  const cart = getCart();
  const item = cart.find(i => i.id === itemId);
  if (item) {
    item.quantity = quantity;
    saveCart(cart);
  }
}

export function clearCart(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CART_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('cart:updated', { detail: { items: [] } }));
}

export function getCartItemCount(): number {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartTotal(): { total: number; currency: string } {
  const cart = getCart();
  if (cart.length === 0) return { total: 0, currency: 'INR' };
  
  const currency = cart[0].currency;
  const total = cart.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    return sum + (price * item.quantity);
  }, 0);
  
  return { total, currency };
}
