export type Category = 'coffee' | 'tea' | 'seasonal' | 'punch' | 'soda' | 'salads' | 'soups' | 'hot_dishes' | 'side_dishes' | 'combo' | 'fast_food' | 'sweets' | 'ice_cream' | 'desserts' | 'bakery';

export interface ProductVariant {
  size: string;
  price: number;
}

export interface ProductModifiers {
  hasMilk?: boolean;      
  hasSyrup?: boolean;     
  hasSugar?: boolean;     
  hasCinnamon?: boolean;  
  hasSauce?: boolean;     
  hasTemp?: boolean;      
  heatingType?: 'none' | 'simple' | 'advanced'; 
  needsCutlery?: boolean; 
  isBumble?: boolean;     
  isMatcha?: boolean;     
  isBuckthorn?: boolean;  
  isSoda?: boolean;       
  isHotDog?: boolean;     
  isEspressoTonic?: boolean; 
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
  modifiers?: ProductModifiers;
  price?: number; 
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
  hotDogSauces?: string[]; 
  tonicType?: 'classic' | 'pomegranate';      
}

export interface CartItem {
  uniqueId: string;
  productId: string;
  variantIndex: number;
  quantity: number;
  options: CartItemOption;
}

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

export interface MenuUpdateActionPayload {
  action: 'update_menu';
  hiddenItems: string[];
  inventory: Record<string, number>;
}

export interface ToggleShiftPayload {
  action: 'toggle_shift';
  isClosed: boolean;
}

export interface AddProductPayload {
  action: 'add_product';
  product: Product; 
}

export interface EditProductPayload {
  action: 'edit_product';
  id: string;
  product: Product;
}

export interface DeleteProductPayload {
  action: 'delete_product';
  id?: string;    
  ids?: string[]; 
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
