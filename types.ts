
export type Category = 'coffee' | 'tea' | 'seasonal' | 'punch' | 'soda' | 'salads' | 'soups' | 'hot_dishes' | 'side_dishes' | 'combo' | 'fast_food' | 'sweets' | 'ice_cream' | 'desserts' | 'bakery';

export interface ProductVariant {
  size: string;
  price: number;
}

export interface ProductModifiers {
  hasMilk?: boolean;      // Обычное, альтернативное
  hasSyrup?: boolean;     // Сиропы
  hasSugar?: boolean;     // Сахар
  hasCinnamon?: boolean;  // Корица
  hasSauce?: boolean;     // Соусы (Сырный, Кетчуп и т.д.)
  hasTemp?: boolean;      // Температура (Холодный/Теплый) - принудительно
  heatingType?: 'none' | 'simple' | 'advanced'; // simple = Да/Нет, advanced = Гриль/СВЧ
  needsCutlery?: boolean; // Приборы
  isBumble?: boolean;     // Спец. опция для бамбла (выбор сока)
  isMatcha?: boolean;     // Спец. опция для матчи (цвет)
  isBuckthorn?: boolean;  // Спец. опция для облепихи (мед/фильтр)
  isSoda?: boolean;       // Газ/Негаз, Температура (legacy flag)
  isHotDog?: boolean;     // Спец. опция для хот-дога
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  variants: ProductVariant[];
  image: string;
  isDrink: boolean;
  description?: string;
  isCustom?: boolean; 
  modifiers?: ProductModifiers; // Новое поле настроек
}

export interface PromoCode {
  code: string;
  discountPercent: number;
  firstOrderOnly: boolean;
}

export interface CartItemOption {
  temperature?: 'hot' | 'cold';
  sugar?: number;
  cinnamon?: boolean;
  milk?: string;
  syrup?: string;
  sauce?: 'cheese' | 'ketchup' | 'mustard' | 'bbq';
  juice?: 'orange' | 'cherry';         
  gas?: boolean;                       
  honey?: boolean;                     
  filter?: boolean;                    
  cutlery?: boolean;                   
  heating?: 'grill' | 'microwave' | 'none' | 'yes'; 
  matchaColor?: 'green' | 'blue';
  hotDogSausage?: 'pork' | 'beef';
  hotDogOnion?: boolean;
  hotDogSauces?: string[]; // Array of sauce IDs for hot dog      
}

export interface CartItem {
  uniqueId: string;
  productId: string;
  variantIndex: number;
  quantity: number;
  options: CartItemOption;
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
  promoCode?: string; 
  discountAmount?: number; 
}

// Data sent to Bot to update Menu
export interface MenuUpdateActionPayload {
  action: 'update_menu';
  hiddenItems: string[];
  inventory: Record<string, number>; // Added inventory data
}

export interface ToggleShiftPayload {
  action: 'toggle_shift';
  isClosed: boolean;
}

export interface AddProductPayload {
  action: 'add_product';
  product: Product; // Send full product object
}

export interface EditProductPayload {
  action: 'edit_product';
  id: string;
  product: Product;
}

export interface DeleteProductPayload {
  action: 'delete_product';
  id?: string;    // Single delete (optional now)
  ids?: string[]; // Bulk delete
}

export interface AddPromoPayload {
  action: 'add_promo';
  promo: PromoCode;
}

export interface DeletePromoPayload {
  action: 'delete_promo';
  code: string;
}

export type WebAppPayload = 
  | OrderActionPayload 
  | MenuUpdateActionPayload 
  | ToggleShiftPayload 
  | AddProductPayload 
  | EditProductPayload
  | DeleteProductPayload
  | AddPromoPayload
  | DeletePromoPayload;
