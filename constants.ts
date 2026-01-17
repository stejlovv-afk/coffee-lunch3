import { Product } from './types';

// Используем пути относительно корня сайта. 
// Vite соберет файлы из public/img и положит их в корень/img.
const IMG_PATH = "./img";

export const MENU_ITEMS: Product[] = [
  // --- COFFEE ---
  {
    id: 'cappuccino',
    name: 'Капучино',
    category: 'coffee',
    isDrink: true,
    image: `${IMG_PATH}/kapuchino.jpg`,
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
    image: `${IMG_PATH}/latte.jpg`,
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
    image: `${IMG_PATH}/espresso1.jpg`,
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
    image: `${IMG_PATH}/americano.jpg`,
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
    image: `${IMG_PATH}/эспрессо2.jpg`, 
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
    image: `${IMG_PATH}/latte.jpg`, 
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
    image: `${IMG_PATH}/babblteplo.jpg`,
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
    image: `${IMG_PATH}/icebambl.jpg`,
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
    image: `${IMG_PATH}/granattonic.jpg`,
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
    image: `${IMG_PATH}/icelatte.jpg`,
    variants: [
      { size: '250мл', price: 240 },
      { size: '350мл', price: 280 },
    ],
  },
  {
    id: 'matcha',
    name: 'Матча',
    category: 'coffee',
    isDrink: true,
    image: `${IMG_PATH}/matcha.jpg`,
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
    image: `${IMG_PATH}/matcha.jpg`,
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
    image: `${IMG_PATH}/kakao.jpg`,
    variants: [
      { size: '250мл', price: 180 },
      { size: '350мл', price: 220 },
      { size: '450мл', price: 260 },
    ],
  },

  // --- FAST FOOD (Sandwiches, Croissants) ---
  {
    id: 'club_sandwich',
    name: 'Клаб-сэндвич',
    category: 'fast_food',
    isDrink: false,
    image: `${IMG_PATH}/sendvichvetcina.jpg`,
    description: 'С ветчиной и сыром',
    variants: [{ size: 'шт', price: 280 }],
  },
  {
    id: 'croissant_salmon',
    name: 'Круассан с лососем',
    category: 'fast_food',
    isDrink: false,
    image: `${IMG_PATH}/unnamed (1).jpg`, 
    variants: [{ size: 'шт', price: 390 }],
  },

  // --- SALADS ---
  {
    id: 'caesar_chicken',
    name: 'Цезарь с курицей',
    category: 'salads',
    isDrink: false,
    image: `${IMG_PATH}/salatcezar.jpg`,
    description: 'Классический цезарь с сочной куриной грудкой',
    variants: [{ size: 'порция', price: 350 }],
  },
  {
    id: 'greek_salad',
    name: 'Греческий салат',
    category: 'salads',
    isDrink: false,
    image: `${IMG_PATH}/salatgrek.jpg`,
    description: 'Свежие овощи, фета и оливки',
    variants: [{ size: 'порция', price: 320 }],
  },
  {
    id: 'olivie',
    name: 'Оливье',
    category: 'salads',
    isDrink: false,
    image: `${IMG_PATH}/olivie.jpg`, 
    variants: [{ size: 'порция', price: 200 }],
  },

  // --- TEA ---
  {
    id: 'tea_black',
    name: 'Чай Черный',
    category: 'tea',
    isDrink: true,
    image: `${IMG_PATH}/teablack.jpg`,
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
    image: `${IMG_PATH}/greentea.jpg`,
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
    image: `${IMG_PATH}/karkadetea.jpg`,
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
    image: `${IMG_PATH}/greenjasmin.jpg`,
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
    image: `${IMG_PATH}/pryanytea.jpg`,
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
    image: `${IMG_PATH}/glintveinpunch.jpg`,
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
    image: `${IMG_PATH}/oblepihapunch.jpg`,
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
    image: `${IMG_PATH}/malinapunsh.jpg`,
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
    image: `${IMG_PATH}/lattehalva.jpg`,
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
    image: `${IMG_PATH}/lattetikva.jpg`,
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
    image: `${IMG_PATH}/rafsnikers.jpg`,
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
    image: `${IMG_PATH}/latteorangecristmas.jpg`,
    variants: [
      { size: '350мл', price: 320 },
      { size: '450мл', price: 380 },
    ],
  },

  // --- SODA/DRINKS ---
  {
    id: 'chern_cola',
    name: 'Черноголовка Cola',
    category: 'soda',
    isDrink: false,
    image: `${IMG_PATH}/colachernogo.jpg`,
    variants: [{ size: '0.5', price: 140 }],
  },
  {
    id: 'chern_baikal',
    name: 'Черноголовка Байкал',
    category: 'soda',
    isDrink: false,
    image: `${IMG_PATH}/baikalchernogo.jpg`,
    variants: [{ size: '0.5', price: 140 }],
  },
  {
    id: 'chern_water',
    name: 'Черноголовка Газ/Негаз',
    category: 'soda',
    isDrink: false,
    image: `${IMG_PATH}/negazcernogo.jpg`,
    variants: [{ size: '0.5', price: 70 }],
  },
  {
    id: 'chern_lemonade',
    name: 'Черноголовка Лимонад',
    category: 'soda',
    isDrink: false,
    image: `${IMG_PATH}/lemonchernogo.jpg`,
    variants: [{ size: '0.5', price: 140 }],
  },
  {
    id: 'chern_orange',
    name: 'Черноголовка Апельсин-Юдзу',
    category: 'soda',
    isDrink: false,
    image: `${IMG_PATH}/chernogolovkaorange.jpg`,
    variants: [{ size: 'шт', price: 110 }],
  },
  {
    id: 'lemonade',
    name: 'Лимонад Авторский',
    category: 'soda',
    isDrink: true,
    image: `${IMG_PATH}/lemonchernogo.jpg`, // Заглушка, если нет фото авторского
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
    image: `${IMG_PATH}/cosmos.jpg`,
    variants: [{ size: 'шт', price: 130 }],
  },
  {
    id: 'energy_cosmos_orig',
    name: 'Cosmos Оригинальный',
    category: 'soda',
    isDrink: false,
    image: `${IMG_PATH}/cosmosorig.jpg`,
    variants: [{ size: 'шт', price: 130 }],
  },
  {
    id: 'energy_adr_sugarfree',
    name: 'Adrenaline Без сахара',
    category: 'soda',
    isDrink: false,
    image: `${IMG_PATH}/adrenalinnosugar.jpg`,
    variants: [{ size: 'шт', price: 200 }],
  },
  {
    id: 'energy_adr_orig',
    name: 'Adrenaline Оригинальный',
    category: 'soda',
    isDrink: false,
    image: `${IMG_PATH}/adrenalin.jpg`,
    variants: [{ size: 'шт', price: 200 }],
  },
  {
    id: 'juice_tomat',
    name: 'Il Primo Томат',
    category: 'soda',
    isDrink: false,
    image: `${IMG_PATH}/iltomato.jpg`,
    variants: [{ size: 'шт', price: 120 }],
  },
  {
    id: 'juice_apple',
    name: 'Il Primo Яблоко',
    category: 'soda',
    isDrink: false,
    image: `${IMG_PATH}/ilapple.jpg`,
    variants: [{ size: 'шт', price: 120 }],
  },
  {
    id: 'juice_orange',
    name: 'Il Primo Апельсин',
    category: 'soda',
    isDrink: false,
    image: `${IMG_PATH}/ilorange.jpg`,
    variants: [{ size: 'шт', price: 120 }],
  },
  {
    id: 'lipton_peach',
    name: 'Lipton Персик',
    category: 'soda',
    isDrink: false,
    image: `${IMG_PATH}/lipton.jpg`,
    variants: [{ size: 'шт', price: 130 }],
  },
];
