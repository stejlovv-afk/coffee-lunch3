export type Category = 'coffee' | 'tea' | 'seasonal' | 'punch' | 'sweets' | 'soda';

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
  temperature?: 'hot' | 'cold';
  sugar?: number;
  cinnamon?: boolean;
}

export interface CartItem {
  uniqueId: string;
  productId: string;
  variantIndex: number;
  quantity: number;
  options: CartItemOption;
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
    name: string;
    size: string;
    count: number;
    price: number;
    details: string;
  }[];
  total: number;
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
