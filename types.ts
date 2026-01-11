export type Category = 'coffee' | 'tea' | 'seasonal' | 'punch' | 'sandwiches' | 'hot' | 'salads' | 'sweets' | 'soda';

export interface ProductVariant {
  size: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  variants: ProductVariant[];
  image: string;
  isDrink: boolean;
  description?: string;
}

export interface CartItemOption {
  // Drink specifics
  temperature?: 'warm' | 'cold'; // Only for Bumble
  gas?: boolean; // For water (true = gas, false = no gas)
  
  // Modifiers
  milk?: string;
  syrup?: string;
  
  // Punch specifics
  honey?: boolean;
  filtered?: boolean;

  // Food specifics
  heat?: boolean;
  cutlery?: boolean;

  // Legacy/Basic
  sugar?: number;
  cinnamon?: boolean;
}

export interface CartItem {
  uniqueId: string;
  productId: string;
  variantIndex: number;
  quantity: number;
  options: CartItemOption;
  totalPrice: number; // Added to track price with modifiers
}

export interface Review {
  id: string;
  productId: string;
  author: string;
  text: string;
  rating: number;
  date: string;
}

// Data sent to Bot for an Order
export interface OrderActionPayload {
  action: 'order';
  items: {
    id: string;
    name: string;
    size: string;
    count: number;
    price: number;
    details: string;
  }[];
  total: number;
  pickupTime: string; // "Как можно скорее" or specific time like "14:30"
  comment: string;
}

// Data sent to Bot to update Menu
export interface MenuUpdateActionPayload {
  action: 'update_menu';
  hiddenItems: string[];
}

export interface RefreshMenuPayload {
    action: 'refresh_menu';
}

export type WebAppPayload = OrderActionPayload | MenuUpdateActionPayload | RefreshMenuPayload;
