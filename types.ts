export type Category = 'coffee' | 'tea' | 'seasonal' | 'punch' | 'sweets' | 'soda' | 'salads' | 'food';

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
  isCustom?: boolean; // Флаг для кастомных товаров
}

export interface CartItemOption {
  temperature?: 'hot' | 'cold';
  sugar?: number;
  cinnamon?: boolean;
  milk?: string;
  syrup?: string;
  // Новые опции
  juice?: 'orange' | 'cherry';         // Для Бамбл
  gas?: boolean;                       // Для воды (true = с газом)
  honey?: boolean;                     // Для облепихи
  filter?: boolean;                    // Для облепихи (профильтровать)
  cutlery?: boolean;                   // Приборы
  heating?: 'grill' | 'microwave' | 'none'; // Подогрев
  matchaColor?: 'green' | 'blue';      // Цвет матчи
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
  deliveryMethod: 'pickup' | 'delivery';
  pickupTime: string;
  comment: string;
  username?: string; 
}

// Data sent to Bot to update Menu
export interface MenuUpdateActionPayload {
  action: 'update_menu';
  hiddenItems: string[];
}

export interface ToggleShiftPayload {
  action: 'toggle_shift';
  isClosed: boolean;
}

export interface AddProductPayload {
  action: 'add_product';
  product: {
    name: string;
    category: Category;
    price: number;
    image: string;
  }
}

export interface DeleteProductPayload {
  action: 'delete_product';
  id: string;
}

export interface RefreshMenuPayload {
  action: 'refresh_menu';
}

export type WebAppPayload = OrderActionPayload | MenuUpdateActionPayload | RefreshMenuPayload | ToggleShiftPayload | AddProductPayload | DeleteProductPayload;
