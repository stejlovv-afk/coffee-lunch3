export type Category = 'coffee' | 'tea' | 'seasonal' | 'punch' | 'sweets' | 'soda' | 'add-ons';

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
  isDrink: boolean; // Determines if temp/sugar/cinnamon options are available
  description?: string;
}

export interface CartItemOption {
  temperature?: 'hot' | 'cold';
  sugar?: number; // grams
  cinnamon?: boolean;
}

export interface CartItem {
  uniqueId: string; // generated based on id + options
  productId: string;
  variantIndex: number; // Index in the product.variants array
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

export interface OrderPayload {
  items: {
    name: string;
    size: string;
    count: number;
    price: number;
    details: string;
  }[];
  total: number;
}