import { Product } from './types';

// Placeholder images (Unsplash)
const COFFEE_IMG = "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80";
const TEA_IMG = "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&w=400&q=80";
const SEASONAL_IMG = "https://images.unsplash.com/photo-1612548403247-aa2873e9422d?auto=format&fit=crop&w=400&q=80";
const PUNCH_IMG = "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80";
const SWEET_IMG = "https://images.unsplash.com/photo-1499195333224-3ce974eecb47?auto=format&fit=crop&w=400&q=80";
const SODA_IMG = "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80";

export const MENU_ITEMS: Product[] = [
  // --- COFFEE ---
  {
    id: 'cappuccino',
    name: 'Капучино',
    category: 'coffee',
    isDrink: true,
    image: COFFEE_IMG,
    variants: [
      { size: '250мл', price: 190 },
      { size: '350мл', price: 230 },
      { size: '450мл', price: 270 },
    ],
  },
  {
    id: 'latte',
    name: 'Латте',
    category: 'coffee',
    isDrink: true,
    image: COFFEE_IMG,
    variants: [
      { size: '250мл', price: 190 },
      { size: '350мл', price: 230 },
      { size: '450мл', price: 270 },
    ],
  },
  {
    id: 'espresso',
    name: 'Эспрессо',
    category: 'coffee',
    isDrink: true,
    image: COFFEE_IMG,
    variants: [
      { size: '30мл', price: 110 },
      { size: '60мл', price: 150 },
    ],
  },
  {
    id: 'americano',
    name: 'Американо',
    category: 'coffee',
    isDrink: true,
    image: COFFEE_IMG,
    variants: [
      { size: '250мл', price: 180 },
      { size: '350мл', price: 220 },
      { size: '450мл', price: 260 },
    ],
  },
  {
    id: 'flat_white',
    name: 'Флат Уайт',
    category: 'coffee',
    isDrink: true,
    image: COFFEE_IMG,
    variants: [
      { size: '250мл', price: 220 },
      { size: '350мл', price: 260 },
      { size: '450мл', price: 360 },
    ],
  },
  {
    id: 'raf',
    name: 'Раф',
    category: 'coffee',
    isDrink: true,
    image: COFFEE_IMG,
    variants: [
      { size: '250мл', price: 210 },
      { size: '350мл', price: 250 },
      { size: '450мл', price: 290 },
    ],
  },
  {
    id: 'bumble_warm',
    name: 'Бамбл Теплый',
    category: 'coffee',
    isDrink: true,
    image: COFFEE_IMG,
    variants: [
      { size: '250мл', price: 270 },
      { size: '350мл', price: 270 },
      { size: '450мл', price: 300 },
    ],
  },
  {
    id: 'bumble_cold',
    name: 'Бамбл Холодный',
    category: 'coffee',
    isDrink: true,
    image: COFFEE_IMG,
    variants: [
      { size: '250мл', price: 270 },
      { size: '350мл', price: 300 },
    ],
  },
  {
    id: 'espresso_tonic',
    name: 'Эспрессо Тоник',
    category: 'coffee',
    isDrink: true,
    image: COFFEE_IMG,
    description: 'Гранатовый / Обычный',
    variants: [
      { size: '250мл', price: 250 },
      { size: '350мл', price: 290 },
    ],
  },
  {
    id: 'ice_latte',
    name: 'Айс Латте',
    category: 'coffee',
    isDrink: true,
    image: COFFEE_IMG,
    variants: [
      { size: '250мл', price: 240 },
      { size: '350мл', price: 280 },
    ],
  },
  {
    id: 'matcha',
    name: 'Матча',
    category: 'coffee', // Kept near coffee as requested logic or use tea
    isDrink: true,
    image: TEA_IMG,
    variants: [
      { size: '250мл', price: 180 },
      { size: '350мл', price: 220 },
      { size: '450мл', price: 260 },
    ],
  },
  {
    id: 'ice_matcha',
    name: 'Айс Матча',
    category: 'coffee',
    isDrink: true,
    image: TEA_IMG,
    variants: [
      { size: '250мл', price: 230 },
      { size: '350мл', price: 270 },
    ],
  },
  {
    id: 'cacao',
    name: 'Какао',
    category: 'coffee',
    isDrink: true,
    image: COFFEE_IMG,
    variants: [
      { size: '250мл', price: 180 },
      { size: '350мл', price: 220 },
      { size: '450мл', price: 260 },
    ],
  },

  // --- TEA ---
  {
    id: 'tea_black',
    name: 'Чай Черный',
    category: 'tea',
    isDrink: true,
    image: TEA_IMG,
    variants: [
        { size: '250мл', price: 120 },
        { size: '350мл', price: 150 },
        { size: '450мл', price: 180 },
    ]
  },
  {
    id: 'tea_green',
    name: 'Чай Зеленый',
    category: 'tea',
    isDrink: true,
    image: TEA_IMG,
    variants: [
        { size: '250мл', price: 120 },
        { size: '350мл', price: 150 },
        { size: '450мл', price: 180 },
    ]
  },
  {
    id: 'tea_karkade',
    name: 'Чай Каркаде',
    category: 'tea',
    isDrink: true,
    image: TEA_IMG,
    variants: [
        { size: '250мл', price: 120 },
        { size: '350мл', price: 150 },
        { size: '450мл', price: 180 },
    ]
  },
  {
    id: 'tea_jasmine',
    name: 'Чай Жасмин',
    category: 'tea',
    isDrink: true,
    image: TEA_IMG,
    variants: [
        { size: '250мл', price: 120 },
        { size: '350мл', price: 150 },
        { size: '450мл', price: 180 },
    ]
  },
  {
    id: 'spiced_tea',
    name: 'Пряный Чай',
    category: 'tea',
    isDrink: true,
    image: TEA_IMG,
    variants: [
      { size: '250мл', price: 240 },
      { size: '350мл', price: 280 },
      { size: '450мл', price: 320 },
    ],
  },
  {
    id: 'gluhwein',
    name: 'Глинтвейн',
    category: 'tea',
    isDrink: true,
    image: TEA_IMG,
    variants: [
      { size: '350мл', price: 230 },
      { size: '450мл', price: 270 },
    ],
  },

  // --- PUNCH ---
  {
    id: 'punch_buckthorn',
    name: 'Облепиховый пунш',
    category: 'punch',
    isDrink: true,
    image: PUNCH_IMG,
    variants: [
      { size: '350мл', price: 230 },
      { size: '450мл', price: 270 },
    ],
  },
  {
    id: 'punch_raspberry',
    name: 'Малиновый пунш',
    category: 'punch',
    isDrink: true,
    image: PUNCH_IMG,
    variants: [
      { size: '350мл', price: 230 },
      { size: '450мл', price: 270 },
    ],
  },

  // --- SEASONAL ---
  {
    id: 'latte_halva',
    name: 'Латте Халва',
    category: 'seasonal',
    isDrink: true,
    image: SEASONAL_IMG,
    variants: [
      { size: '350мл', price: 290 },
      { size: '450мл', price: 350 },
    ],
  },
  {
    id: 'latte_pumpkin',
    name: 'Латте Тыква',
    category: 'seasonal',
    isDrink: true,
    image: SEASONAL_IMG,
    variants: [
      { size: '350мл', price: 290 },
      { size: '450мл', price: 350 },
    ],
  },
  {
    id: 'raf_snickers',
    name: 'Раф Сникерс',
    category: 'seasonal',
    isDrink: true,
    image: SEASONAL_IMG,
    variants: [
      { size: '350мл', price: 320 },
      { size: '450мл', price: 380 },
    ],
  },
  {
    id: 'latte_orange',
    name: 'Латте Orange Christmas',
    category: 'seasonal',
    isDrink: true,
    image: SEASONAL_IMG,
    variants: [
      { size: '350мл', price: 320 },
      { size: '450мл', price: 380 },
    ],
  },

  // --- SWEETS ---
  {
    id: 'bombbar_hazel',
    name: 'Bombbar Лесной Орех',
    category: 'sweets',
    isDrink: false,
    image: SWEET_IMG,
    variants: [{ size: 'шт', price: 130 }],
  },
  {
    id: 'bombbar_rasp',
    name: 'Bombbar Малиновый',
    category: 'sweets',
    isDrink: false,
    image: SWEET_IMG,
    variants: [{ size: 'шт', price: 130 }],
  },
  {
    id: 'bombbar_coco',
    name: 'Bombbar Кокос',
    category: 'sweets',
    isDrink: false,
    image: SWEET_IMG,
    variants: [{ size: 'шт', price: 130 }],
  },
  {
    id: 'snaqer',
    name: 'Snaqer Орех-Карамель',
    category: 'sweets',
    isDrink: false,
    image: SWEET_IMG,
    variants: [{ size: 'шт', price: 130 }],
  },
  {
    id: 'chika_currant',
    name: 'Chika Biscuit Смородина',
    category: 'sweets',
    isDrink: false,
    image: SWEET_IMG,
    variants: [{ size: 'шт', price: 170 }],
  },
  {
    id: 'chika_banana',
    name: 'Chika Biscuit Банан',
    category: 'sweets',
    isDrink: false,
    image: SWEET_IMG,
    variants: [{ size: 'шт', price: 170 }],
  },
  {
    id: 'chokopie',
    name: 'Choko Pie',
    category: 'sweets',
    isDrink: false,
    image: SWEET_IMG,
    variants: [{ size: 'шт', price: 30 }],
  },
  {
    id: 'choc_bitter',
    name: 'Горький Шоколад',
    category: 'sweets',
    isDrink: false,
    image: SWEET_IMG,
    variants: [{ size: 'шт', price: 80 }],
  },
  {
    id: 'choc_milk',
    name: 'Молочный Шоколад',
    category: 'sweets',
    isDrink: false,
    image: SWEET_IMG,
    variants: [{ size: 'шт', price: 80 }],
  },
  {
    id: 'bar_chudo',
    name: 'Батончик Чудо',
    category: 'sweets',
    isDrink: false,
    image: SWEET_IMG,
    variants: [{ size: 'шт', price: 60 }],
  },
  {
    id: 'bar_babaev',
    name: 'Бабаевский Батончик',
    category: 'sweets',
    isDrink: false,
    image: SWEET_IMG,
    variants: [{ size: 'шт', price: 100 }],
  },
  {
    id: 'gum_eclipse',
    name: 'Жвачка Eclipse',
    category: 'sweets',
    isDrink: false,
    image: SWEET_IMG,
    variants: [{ size: 'шт', price: 80 }],
  },

  // --- SODA/DRINKS ---
  {
    id: 'chern_cola',
    name: 'Черноголовка Cola',
    category: 'soda',
    isDrink: false,
    image: SODA_IMG,
    variants: [{ size: '0.5', price: 140 }],
  },
  {
    id: 'chern_baikal',
    name: 'Черноголовка Байкал',
    category: 'soda',
    isDrink: false,
    image: SODA_IMG,
    variants: [{ size: '0.5', price: 140 }],
  },
  {
    id: 'chern_water',
    name: 'Черноголовка Газ/Негаз',
    category: 'soda',
    isDrink: false,
    image: SODA_IMG,
    variants: [{ size: '0.5', price: 70 }],
  },
  {
    id: 'chern_lemonade',
    name: 'Черноголовка Лимонад',
    category: 'soda',
    isDrink: false,
    image: SODA_IMG,
    variants: [{ size: '0.5', price: 140 }],
  },
  {
    id: 'chern_orange',
    name: 'Черноголовка Апельсин-Юдзу',
    category: 'soda',
    isDrink: false,
    image: SODA_IMG,
    variants: [{ size: 'шт', price: 110 }],
  },
  {
    id: 'lemonade',
    name: 'Лимонад Авторский',
    category: 'soda',
    isDrink: true,
    image: SODA_IMG,
    description: 'Скиви-Фейхоа, Манго-Маракуйя, Смородина-Мята',
    variants: [
      { size: '250мл', price: 260 },
      { size: '350мл', price: 290 },
    ],
  },
  {
    id: 'energy_cosmos_tropic',
    name: 'Cosmos Тропический',
    category: 'soda',
    isDrink: false,
    image: SODA_IMG,
    variants: [{ size: 'шт', price: 130 }],
  },
  {
    id: 'energy_cosmos_orig',
    name: 'Cosmos Оригинальный',
    category: 'soda',
    isDrink: false,
    image: SODA_IMG,
    variants: [{ size: 'шт', price: 130 }],
  },
  {
    id: 'energy_adr_sugarfree',
    name: 'Adrenaline Без сахара',
    category: 'soda',
    isDrink: false,
    image: SODA_IMG,
    variants: [{ size: 'шт', price: 200 }],
  },
  {
    id: 'energy_adr_orig',
    name: 'Adrenaline Оригинальный',
    category: 'soda',
    isDrink: false,
    image: SODA_IMG,
    variants: [{ size: 'шт', price: 200 }],
  },
  {
    id: 'juice_tomat',
    name: 'Il Primo Томат',
    category: 'soda',
    isDrink: false,
    image: SODA_IMG,
    variants: [{ size: 'шт', price: 120 }],
  },
  {
    id: 'juice_apple',
    name: 'Il Primo Яблоко',
    category: 'soda',
    isDrink: false,
    image: SODA_IMG,
    variants: [{ size: 'шт', price: 120 }],
  },
  {
    id: 'juice_orange',
    name: 'Il Primo Апельсин',
    category: 'soda',
    isDrink: false,
    image: SODA_IMG,
    variants: [{ size: 'шт', price: 120 }],
  },
  {
    id: 'lipton_peach',
    name: 'Lipton Персик',
    category: 'soda',
    isDrink: false,
    image: SODA_IMG,
    variants: [{ size: 'шт', price: 130 }],
  },
];
