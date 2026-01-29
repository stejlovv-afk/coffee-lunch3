
import { Product } from './types';

const IMG_PATH = "./img";
const COMBO_IMG = "./img/combo.jpg"; 

// Helper to apply default modifiers based on category to keep old logic working
const withDefaults = (p: Product): Product => {
  const m = p.modifiers || {};
  
  // Logic from previous ItemModal
  if (p.isDrink) {
      // Coffee logic (excluding Americano, Espresso, Bumble from Standard Milk)
      if (['coffee', 'seasonal', 'cacao'].includes(p.category) && 
          !p.id.includes('espresso') && 
          !p.id.includes('bumble') && 
          !p.id.includes('americano')) { // Removed Americano from having milk default
          m.hasMilk = true;
      }

      // Syrups, Sugar, Cinnamon for Coffee/Seasonal/Cacao (General)
      if (['coffee', 'seasonal', 'cacao'].includes(p.category) && !p.id.includes('espresso') && !p.id.includes('bumble')) {
          m.hasSyrup = true;
          m.hasSugar = true;
          m.hasCinnamon = true;
      }
      
      // Explicitly allow Sugar/Cinnamon for Americano, but NO Milk by default above
      if (p.id.includes('americano')) {
          m.hasSugar = true;
          m.hasCinnamon = true;
          m.hasSyrup = true;
      }

      // Tea/Punch logic
      if (p.category === 'tea' || p.category === 'punch') {
          m.hasSugar = true;
          m.hasSyrup = true;
      }
  }

  // Bumble logic (Syrups added)
  if (p.id.includes('bumble')) {
      m.isBumble = true;
      m.hasSyrup = true; // Added syrups for Bumble
  }

  if (p.id.includes('matcha')) { m.isMatcha = true; m.hasMilk = true; m.hasSyrup = true; }
  if (p.id === 'punch_buckthorn') m.isBuckthorn = true;
  
  // Espresso Tonic logic
  if (p.id === 'espresso_tonic') m.isEspressoTonic = true;

  // Soda logic: All sodas/drinks get Temperature choice
  if (p.category === 'soda') {
      m.hasTemp = true;
  }
  
  if (p.id === 'chern_water') m.isSoda = true; // Still keep isSoda for gas logic

  if (p.category === 'fast_food') m.heatingType = 'advanced'; // Grill/Micro
  if (['soups', 'hot_dishes', 'combo', 'side_dishes', 'salads'].includes(p.category)) {
      m.needsCutlery = true;
      if (p.category !== 'salads') m.heatingType = 'simple'; // Yes/No
  }

  if (p.id === 'hot_dog_danish') {
      m.isHotDog = true;
  }

  return { ...p, modifiers: m };
};

const RAW_MENU_ITEMS: Product[] = [
  // --- COFFEE ---
  { id: 'cappuccino', name: 'Капучино', category: 'coffee', isDrink: true, image: `${IMG_PATH}/kapuchino.jpg`, variants: [{ size: '250мл', price: 190 }, { size: '350мл', price: 230 }, { size: '450мл', price: 270 }] },
  { id: 'latte', name: 'Латте', category: 'coffee', isDrink: true, image: `${IMG_PATH}/latte.jpg`, variants: [{ size: '250мл', price: 190 }, { size: '350мл', price: 230 }, { size: '450мл', price: 270 }] },
  { id: 'espresso', name: 'Эспрессо', category: 'coffee', isDrink: true, image: `${IMG_PATH}/espresso1.jpg`, variants: [{ size: '30мл', price: 110 }, { size: '60мл', price: 150 }] },
  { id: 'americano', name: 'Американо', category: 'coffee', isDrink: true, image: `${IMG_PATH}/americano.jpg`, variants: [{ size: '250мл', price: 180 }, { size: '350мл', price: 220 }, { size: '450мл', price: 260 }] },
  { id: 'flat_white', name: 'Флэт Уайт', category: 'coffee', isDrink: true, image: `${IMG_PATH}/эспрессо2.jpg`, variants: [{ size: '250мл', price: 220 }, { size: '350мл', price: 260 }, { size: '450мл', price: 360 }] },
  { id: 'raf', name: 'Раф', category: 'coffee', isDrink: true, image: `${IMG_PATH}/latte.jpg`, variants: [{ size: '250мл', price: 210 }, { size: '350мл', price: 250 }, { size: '450мл', price: 290 }] },
  
  // Bumble Warm (Standard)
  { id: 'bumble_warm', name: 'Бамбл Теплый', category: 'coffee', isDrink: true, image: `${IMG_PATH}/babblteplo.jpg`, variants: [{ size: '250мл', price: 270 }, { size: '350мл', price: 270 }, { size: '450мл', price: 300 }] },
  
  // Bumble Cold (Sizes shifted: 250->removed, 350->old price of 250, 450->old price of 350)
  // Old 250(270), 350(300). New: 350(270), 450(300).
  { id: 'bumble_cold', name: 'Бамбл Холодный', category: 'coffee', isDrink: true, image: `${IMG_PATH}/icebambl.jpg`, variants: [{ size: '350мл', price: 270 }, { size: '450мл', price: 300 }] },
  
  // Espresso Tonic (Sizes shifted: 350ml = 250rub, 450ml = 290rub)
  { id: 'espresso_tonic', name: 'Эспрессо Тоник', category: 'coffee', isDrink: true, image: `${IMG_PATH}/granattonic.jpg`, description: 'Гранатовый / Обычный', variants: [{ size: '350мл', price: 250 }, { size: '450мл', price: 290 }] },
  
  // Ice Latte (Sizes shifted)
  // Old 250(240), 350(280). New 350(240), 450(280).
  { id: 'ice_latte', name: 'Айс Латте', category: 'coffee', isDrink: true, image: `${IMG_PATH}/icelatte.jpg`, variants: [{ size: '350мл', price: 240 }, { size: '450мл', price: 280 }] },
  
  { id: 'matcha', name: 'Матча', category: 'coffee', isDrink: true, image: `${IMG_PATH}/matcha.jpg`, variants: [{ size: '250мл', price: 180 }, { size: '350мл', price: 220 }, { size: '450мл', price: 260 }] },
  
  // Ice Matcha (Sizes shifted)
  // Old 250(230), 350(270). New 350(230), 450(270).
  { id: 'ice_matcha', name: 'Айс Матча', category: 'coffee', isDrink: true, image: `${IMG_PATH}/matcha.jpg`, variants: [{ size: '350мл', price: 230 }, { size: '450мл', price: 270 }] },
  
  { id: 'cacao', name: 'Какао', category: 'coffee', isDrink: true, image: `${IMG_PATH}/kakao.jpg`, variants: [{ size: '250мл', price: 180 }, { size: '350мл', price: 220 }, { size: '450мл', price: 260 }] },

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

  // --- PUNCH ---
  {
    id: 'punch_buckthorn',
    name: 'Облепиховый Пунш',
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
    name: 'Малиновый Пунш',
    category: 'punch',
    isDrink: true,
    image: `${IMG_PATH}/malinapunch.jpg`,
    variants: [
      { size: '350мл', price: 230 },
      { size: '450мл', price: 270 },
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
    image: `${IMG_PATH}/lemonchernogo.jpg`,
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

  // --- FAST FOOD ---
  { id: 'croissant_salmon', name: 'Круассан с лососем', category: 'fast_food', isDrink: false, image: `${IMG_PATH}/unnamed (1).jpg`, variants: [{ size: 'шт', price: 390 }] },
  { id: 'sandwich_chicken', name: 'Сэндвич с курицей', category: 'fast_food', isDrink: false, image: 'https://picsum.photos/300/300?random=101', variants: [{ size: 'шт', price: 280 }] },
  { id: 'sandwich_pork', name: 'Сэндвич с бужениной', category: 'fast_food', isDrink: false, image: 'https://picsum.photos/300/300?random=102', variants: [{ size: 'шт', price: 280 }] },
  { id: 'sandwich_ham', name: 'Сэндвич с ветчиной', category: 'fast_food', isDrink: false, image: 'https://picsum.photos/300/300?random=103', variants: [{ size: 'шт', price: 280 }] },
  { id: 'hot_dog_danish', name: 'Хот-дог Датский', category: 'fast_food', isDrink: false, image: 'https://picsum.photos/300/300?random=104', variants: [{ size: 'шт', price: 260 }] },

  // --- SALADS ---
  { id: 'greek_salad', name: 'Греческий салат', category: 'salads', isDrink: false, image: `${IMG_PATH}/salatgrek.jpg`, variants: [{ size: 'порция', price: 250 }] },
  { id: 'nicoise_salad', name: 'Нисуаз салат', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=201', variants: [{ size: 'порция', price: 280 }] },
  { id: 'caesar_salad', name: 'Цезарь салат', category: 'salads', isDrink: false, image: `${IMG_PATH}/salatcezar.jpg`, variants: [{ size: 'порция', price: 280 }] },
  { id: 'olivie_salad', name: 'Оливье салат', category: 'salads', isDrink: false, image: `${IMG_PATH}/olivie.jpg`, variants: [{ size: 'порция', price: 160 }] },
  { id: 'koketka_salad', name: 'Кокетка салат', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=202', variants: [{ size: 'порция', price: 160 }] },
  { id: 'ocean_island_salad', name: 'Океанский островок салат', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=203', variants: [{ size: 'порция', price: 180 }] },
  { id: 'beans_pepper_salad', name: 'Фасоль с болгарским перцем', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=204', variants: [{ size: 'порция', price: 150 }] },
  { id: 'pharaoh_salad', name: 'Фараон салат', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=205', variants: [{ size: 'порция', price: 220 }] },
  { id: 'original_salad', name: 'Оригинальный салат', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=206', variants: [{ size: 'порция', price: 160 }] },
  { id: 'beet_prune_salad', name: 'Салат из свеклы с черносливом', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=207', variants: [{ size: 'порция', price: 150 }] },
  { id: 'snack_salad', name: 'Закусочный салат', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=208', variants: [{ size: 'порция', price: 160 }] },
  { id: 'colored_salad', name: 'Цветной салат', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=209', variants: [{ size: 'порция', price: 170 }] },
  { id: 'eggplant_sweet_sour', name: 'Салат из баклажан с кисло-сладким', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=210', variants: [{ size: 'порция', price: 250 }] },
  { id: 'overseas_salad', name: 'Заморский салат', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=211', variants: [{ size: 'порция', price: 160 }] },
  { id: 'korean_carrot', name: 'Морковь по-корейски', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=212', variants: [{ size: 'порция', price: 130 }] },
  { id: 'summer_salad', name: 'Летний салат', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=213', variants: [{ size: 'порция', price: 190 }] },
  { id: 'vinaigrette', name: 'Винегрет салат', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=214', variants: [{ size: 'порция', price: 150 }] },
  { id: 'chicken_celery_salad', name: 'Курица с сельдереем салат', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=215', variants: [{ size: 'порция', price: 260 }] },
  { id: 'cabbage_cucumber_pepper', name: 'Салат из капусты с огурцом и перцем', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=216', variants: [{ size: 'порция', price: 150 }] },
  { id: 'beet_cheese_walnut', name: 'Свекла с сыром и грецким орехом', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=217', variants: [{ size: 'порция', price: 150 }] },
  { id: 'mangold_salad', name: 'Салат Мангольд', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=218', variants: [{ size: 'порция', price: 250 }] },
  { id: 'green_cucumber_salad', name: 'Салат Зеленый с огурцом', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=219', variants: [{ size: 'порция', price: 150 }] },
  { id: 'spring_salad', name: 'Салат Весна', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=220', variants: [{ size: 'порция', price: 150 }] },
  { id: 'vitamin_salad', name: 'Салат Витаминный', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=221', variants: [{ size: 'порция', price: 150 }] },
  { id: 'sea_cocktail_salad', name: 'Салат Морской коктейль', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=222', variants: [{ size: 'порция', price: 330 }] },
  { id: 'tabouleh_couscous', name: 'Салат Табуле с кускусом', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=223', variants: [{ size: 'порция', price: 150 }] },
  { id: 'sea_kale_salad', name: 'Салат с морской капустой', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=224', variants: [{ size: 'порция', price: 180 }] },
  { id: 'salmon_light_salt', name: 'Лосось Слабой Соли', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=225', variants: [{ size: 'порция', price: 400 }] },
  { id: 'cucumber_sour_cream', name: 'Салат из огурцов со сметаной', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=226', variants: [{ size: 'порция', price: 150 }] },
  { id: 'vegetable_salad_simple', name: 'Салат Овощной', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=227', variants: [{ size: 'порция', price: 180 }] },
  { id: 'june_salad', name: 'Салат Июньский', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=228', variants: [{ size: 'порция', price: 150 }] },
  { id: 'light_salted_cucumber', name: 'Малосольный огурец', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=229', variants: [{ size: 'порция', price: 800 }] },
  { id: 'eggplant_georgian', name: 'Баклажаны по-Грузински', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=230', variants: [{ size: 'порция', price: 150 }] },
  { id: 'bean_salad_simple', name: 'Салат Фасолька', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=231', variants: [{ size: 'порция', price: 160 }] },
  { id: 'berlin_salad', name: 'Салат Берлинский', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=232', variants: [{ size: 'порция', price: 180 }] },
  { id: 'crab_salad', name: 'Салат Крабовый', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=233', variants: [{ size: 'порция', price: 170 }] },
  { id: 'light_salad', name: 'Салат Легкий', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=234', variants: [{ size: 'порция', price: 190 }] },
  { id: 'radish_cabbage_salad', name: 'Салат из редиса с капустой', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=235', variants: [{ size: 'порция', price: 140 }] },
  { id: 'salmon_salad', name: 'Салат с семгой', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=236', variants: [{ size: 'порция', price: 170 }] },
  { id: 'vegetable_field_salad', name: 'Салат Овощная поляна', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=237', variants: [{ size: 'порция', price: 220 }] },
  { id: 'cabbage_croutons_salad', name: 'Салат из капусты с сухарикам', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=238', variants: [{ size: 'порция', price: 150 }] },
  { id: 'crab_veg_salad', name: 'Крабовый с овощами', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=239', variants: [{ size: 'порция', price: 150 }] },
  { id: 'beet_cheese_sour_cream', name: 'Салат из свеклы с сыром и сметаной', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=240', variants: [{ size: 'порция', price: 130 }] },
  { id: 'sauerkraut_salad', name: 'Салат из квашенной капусты', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=241', variants: [{ size: 'порция', price: 130 }] },
  { id: 'valencia_salad', name: 'Салат Валенсия', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=242', variants: [{ size: 'порция', price: 170 }] },
  { id: 'spicy_beef_salad', name: 'Салат Пикантный с говядиной', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=243', variants: [{ size: 'порция', price: 250 }] },
  { id: 'peking_salad', name: 'Салат Пекинский', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=244', variants: [{ size: 'порция', price: 200 }] },
  { id: 'hunting_salad', name: 'Салат Охотничий', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=245', variants: [{ size: 'порция', price: 160 }] },
  { id: 'autumn_salad', name: 'Салат Осенний', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=246', variants: [{ size: 'порция', price: 130 }] },
  { id: 'cod_liver_salad', name: 'Салат с печенью трески', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=247', variants: [{ size: 'порция', price: 270 }] },
  { id: 'bacon_cheese_salad', name: 'Салат с беконом и сыром', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=248', variants: [{ size: 'порция', price: 260 }] },
  { id: 'health_salad', name: 'Салат Здоровье', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=249', variants: [{ size: 'порция', price: 150 }] },
  { id: 'chuka_cucumber', name: 'Чука с огурцом', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=250', variants: [{ size: 'порция', price: 220 }] },
  { id: 'winter_evening_salad', name: 'Салат Зимний вечер', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=251', variants: [{ size: 'порция', price: 240 }] },
  { id: 'carrot_apple_salad', name: 'Салат Морковь с яблоком', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=252', variants: [{ size: 'порция', price: 150 }] },
  { id: 'mushroom_miracle', name: 'Грибное чудо', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=253', variants: [{ size: 'порция', price: 220 }] },
  { id: 'breeze_salad', name: 'Салат Бриз', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=254', variants: [{ size: 'порция', price: 170 }] },
  { id: 'fresh_salad', name: 'Салат Фрэш', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=255', variants: [{ size: 'порция', price: 150 }] },
  { id: 'tomato_salad_cute', name: 'Салат Помидорка', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=256', variants: [{ size: 'порция', price: 160 }] },
  { id: 'sun_salad', name: 'Салат Солнышко', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=257', variants: [{ size: 'порция', price: 150 }] },
  { id: 'chicken_pineapple_salad', name: 'Курица с ананасом', category: 'salads', isDrink: false, image: 'https://picsum.photos/300/300?random=258', variants: [{ size: 'порция', price: 270 }] },

  // --- HOT DISHES ---
  { id: 'meat_french', name: 'Мясо по-французски', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=301', variants: [{ size: 'порция', price: 240 }] },
  { id: 'chicken_mushroom', name: 'Куриное филе с грибами', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=302', variants: [{ size: 'порция', price: 240 }] },
  { id: 'chicken_escalope', name: 'Эскалоп куриный', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=303', variants: [{ size: 'порция', price: 200 }] },
  { id: 'chicken_cheese_filet', name: 'Куриное филе в сыре', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=304', variants: [{ size: 'порция', price: 230 }] },
  { id: 'beefsteak_egg', name: 'Бифштекс с яйцом и зеленью', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=305', variants: [{ size: 'порция', price: 230 }] },
  { id: 'pink_salmon_home', name: 'Горбуша по-домашнему', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=306', variants: [{ size: 'порция', price: 300 }] },
  { id: 'chicken_shuba', name: 'Куриное филе под "Шубкой"', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=307', variants: [{ size: 'порция', price: 230 }] },
  { id: 'chicken_pineapple', name: 'Куриное филе с ананасом', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=308', variants: [{ size: 'порция', price: 280 }] },
  { id: 'pork_pilaf', name: 'Плов из свинины', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=309', variants: [{ size: 'порция', price: 200 }] },
  { id: 'chicken_tomato_filet', name: 'Филе куриное с помидором', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=310', variants: [{ size: 'порция', price: 240 }] },
  { id: 'fried_liver_onion', name: 'Жареная печень с луком', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=311', variants: [{ size: 'порция', price: 180 }] },
  { id: 'chicken_cream_filet', name: 'Филе куриное в сливках', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=312', variants: [{ size: 'порция', price: 220 }] },
  { id: 'pasta_bolognese', name: '"Болоньезе" паста', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=313', variants: [{ size: 'порция', price: 220 }] },
  { id: 'chicken_envelope', name: 'Конверт куриный', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=314', variants: [{ size: 'порция', price: 270 }] },
  { id: 'roast_home', name: 'Жаркое по-Домашнему', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=315', variants: [{ size: 'порция', price: 220 }] },
  { id: 'pasta_carbonara', name: '"Карбонара" паста', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=316', variants: [{ size: 'порция', price: 220 }] },
  { id: 'udon_turkey', name: 'Лапша "УДОН" с индейкой', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=317', variants: [{ size: 'порция', price: 220 }] },
  { id: 'pork_albanian', name: 'Свинина по-Албански', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=318', variants: [{ size: 'порция', price: 190 }] },
  { id: 'kiev_cutlet', name: 'Котлета по-Киевски', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=319', variants: [{ size: 'порция', price: 230 }] },
  { id: 'ptitim_seafood', name: 'Паста "Птитим" с морепродуктами', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=320', variants: [{ size: 'порция', price: 260 }] },
  { id: 'liver_cake', name: 'Торт "Печеночный"', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=321', variants: [{ size: 'порция', price: 150 }] },
  { id: 'cauliflower_bechamel', name: 'Цветная капуста под "Бешамель"', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=322', variants: [{ size: 'порция', price: 240 }] },
  { id: 'broccoli_salmon_cream', name: 'Брокколи с семгой и сливочным', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=323', variants: [{ size: 'порция', price: 290 }] },
  { id: 'paella_seafood', name: 'Паэлья с морепродуктами', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=324', variants: [{ size: 'порция', price: 260 }] },
  { id: 'antipasto_zucchini', name: 'Антипасто с кабачком', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=325', variants: [{ size: 'порция', price: 290 }] },
  { id: 'stewed_liver', name: 'Печень тушенная', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=326', variants: [{ size: 'порция', price: 170 }] },
  { id: 'pasta_navy', name: 'Макароны по-флотски', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=327', variants: [{ size: 'порция', price: 200 }] },
  { id: 'omelet_salmon', name: 'Омлет с семгой сыром и зеленью', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=328', variants: [{ size: 'порция', price: 190 }] },
  { id: 'omelet_bacon', name: 'Омлет с беконом', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=329', variants: [{ size: 'порция', price: 190 }] },
  { id: 'zucchini_tomato', name: 'Кабачок с помидором', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=330', variants: [{ size: 'порция', price: 150 }] },
  { id: 'chicken_cheesecake', name: 'Ватрушка куриная', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=331', variants: [{ size: 'порция', price: 200 }] },
  { id: 'stuffed_eggplant', name: 'Баклажаны фаршированные', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=332', variants: [{ size: 'порция', price: 1000 }] },
  { id: 'wok_chicken', name: 'ВОК с курицей', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=333', variants: [{ size: 'порция', price: 250 }] },
  { id: 'chicken_cheese_hat', name: 'Курица под сырной шапкой', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=334', variants: [{ size: 'порция', price: 250 }] },
  { id: 'cordon_bleu', name: 'Кордон-блю из курицы', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=335', variants: [{ size: 'порция', price: 210 }] },
  { id: 'zrazy_cabbage', name: 'Зразы картофельные с капустой', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=336', variants: [{ size: 'порция', price: 190 }] },
  { id: 'schnitzel_chicken', name: 'Шницель Куриный', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=337', variants: [{ size: 'порция', price: 180 }] },
  { id: 'basket_veg', name: 'Корзиночка с овощами', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=338', variants: [{ size: 'порция', price: 260 }] },
  { id: 'cutlet_pozhar', name: 'Котлета "Пожарская"', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=339', variants: [{ size: 'порция', price: 200 }] },
  { id: 'omelet_classic', name: 'Омлет Классический', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=340', variants: [{ size: 'порция', price: 700 }] },
  { id: 'minced_cutlets', name: 'Рубленные котлеты', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=341', variants: [{ size: 'порция', price: 270 }] },
  { id: 'cutlet_spicy', name: 'Котлета Пикантная', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=342', variants: [{ size: 'порция', price: 190 }] },
  { id: 'stewed_cabbage_bacon', name: 'Тушеная капуста с беконом', category: 'hot_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=343', variants: [{ size: 'порция', price: 180 }] },

  // --- BAKERY ---
  { id: 'croissant_raspberry', name: 'Круассан Малиновый', category: 'bakery', isDrink: false, image: 'https://picsum.photos/300/300?random=401', variants: [{ size: 'шт', price: 130 }] },
  { id: 'croissant_salt_caramel', name: 'Круассан Соленая Карамель', category: 'bakery', isDrink: false, image: 'https://picsum.photos/300/300?random=402', variants: [{ size: 'шт', price: 140 }] },
  { id: 'croissant_chocolate', name: 'Круассан с Шоколадом', category: 'bakery', isDrink: false, image: 'https://picsum.photos/300/300?random=403', variants: [{ size: 'шт', price: 180 }] },
  { id: 'donut_raspberry', name: 'Донат Малина-Смородина', category: 'bakery', isDrink: false, image: 'https://picsum.photos/300/300?random=404', variants: [{ size: 'шт', price: 170 }] },
  { id: 'bun_curd', name: 'Булочка с творогом', category: 'bakery', isDrink: false, image: 'https://picsum.photos/300/300?random=405', variants: [{ size: 'шт', price: 120 }] },
  { id: 'bun_jam', name: 'Булочка с повидлом', category: 'bakery', isDrink: false, image: 'https://picsum.photos/300/300?random=406', variants: [{ size: 'шт', price: 120 }] },
  { id: 'pizza_mini', name: 'Пицца', category: 'bakery', isDrink: false, image: 'https://picsum.photos/300/300?random=407', variants: [{ size: 'шт', price: 130 }] },
  { id: 'samsa_cheese', name: 'Самса с сыром', category: 'bakery', isDrink: false, image: 'https://picsum.photos/300/300?random=408', variants: [{ size: 'шт', price: 190 }] },
  { id: 'sausage_dough', name: 'Сосиска в тесте', category: 'bakery', isDrink: false, image: 'https://picsum.photos/300/300?random=409', variants: [{ size: 'шт', price: 110 }] },
  { id: 'samsa_chicken', name: 'Самса с курицей', category: 'bakery', isDrink: false, image: 'https://picsum.photos/300/300?random=410', variants: [{ size: 'шт', price: 180 }] },

  // --- DESSERTS ---
  { id: 'trifle_snickers', name: 'Трайфл Сникерс', category: 'desserts', isDrink: false, image: 'https://picsum.photos/300/300?random=501', variants: [{ size: 'шт', price: 260 }] },
  { id: 'tube_condensed_milk', name: 'Трубочка со сгущенкой', category: 'desserts', isDrink: false, image: 'https://picsum.photos/300/300?random=502', variants: [{ size: 'шт', price: 160 }] },
  { id: 'shu_berry', name: 'Шу Ягодное', category: 'desserts', isDrink: false, image: 'https://picsum.photos/300/300?random=503', variants: [{ size: 'шт', price: 160 }] },
  { id: 'eclair_napoleon', name: 'Эклер Наполеон', category: 'desserts', isDrink: false, image: 'https://picsum.photos/300/300?random=504', variants: [{ size: 'шт', price: 180 }] },
  { id: 'eclair_snickers', name: 'Эклер Сникерс', category: 'desserts', isDrink: false, image: 'https://picsum.photos/300/300?random=505', variants: [{ size: 'шт', price: 180 }] },
  { id: 'eclair_chocolate', name: 'Эклер Шоколадный', category: 'desserts', isDrink: false, image: 'https://picsum.photos/300/300?random=506', variants: [{ size: 'шт', price: 180 }] },
  { id: 'cake_potato', name: 'Пирожное Картошка', category: 'desserts', isDrink: false, image: 'https://picsum.photos/300/300?random=507', variants: [{ size: 'шт', price: 150 }] },
  { id: 'honey_cake', name: 'Торт Медовик', category: 'desserts', isDrink: false, image: 'https://picsum.photos/300/300?random=508', variants: [{ size: 'шт', price: 220 }] },
  { id: 'cheesecake_cherry', name: 'Чизкейк с вишней', category: 'desserts', isDrink: false, image: 'https://picsum.photos/300/300?random=509', variants: [{ size: 'шт', price: 200 }] },

  // --- ICE CREAM ---
  { id: 'ice_vanilla_choco', name: 'Ванильно-шоколадное', category: 'ice_cream', isDrink: false, image: 'https://picsum.photos/300/300?random=601', variants: [{ size: 'шт', price: 110 }] },
  { id: 'ice_plombir_cow', name: 'Пломбир Коровка (ваф. ст.)', category: 'ice_cream', isDrink: false, image: 'https://picsum.photos/300/300?random=602', variants: [{ size: 'шт', price: 130 }] },
  { id: 'ice_eskimo_berry', name: 'Эскимо Черника-Голубика', category: 'ice_cream', isDrink: false, image: 'https://picsum.photos/300/300?random=603', variants: [{ size: 'шт', price: 120 }] },
  { id: 'ice_creme_brulee', name: 'Крем-Брюле Коровка', category: 'ice_cream', isDrink: false, image: 'https://picsum.photos/300/300?random=604', variants: [{ size: 'шт', price: 130 }] },
  { id: 'ice_eskimo_zephyr', name: 'Эскимо Зефир Мишка', category: 'ice_cream', isDrink: false, image: 'https://picsum.photos/300/300?random=605', variants: [{ size: 'шт', price: 120 }] },

  // --- SOUPS ---
  { id: 'potato_mushroom_soup', name: 'Картофельно-грибной суп', category: 'soups', isDrink: false, image: 'https://picsum.photos/300/300?random=26', variants: [{ size: 'порция', price: 170 }] },
  { id: 'ural_soup', name: 'Уральский суп Coffee\'Lunch', category: 'soups', isDrink: false, image: 'https://picsum.photos/300/300?random=27', variants: [{ size: 'порция', price: 160 }] },
  { id: 'rassolnik', name: 'Рассольник Coffee\'Lunch', category: 'soups', isDrink: false, image: 'https://picsum.photos/300/300?random=28', variants: [{ size: 'порция', price: 180 }] },
  { id: 'buckwheat_soup', name: 'Суп гречневый с курицей', category: 'soups', isDrink: false, image: 'https://picsum.photos/300/300?random=29', variants: [{ size: 'порция', price: 170 }] },
  { id: 'shchi_summer', name: 'Щи летние Coffee\'Lunch', category: 'soups', isDrink: false, image: 'https://picsum.photos/300/300?random=30', variants: [{ size: 'порция', price: 170 }] },
  { id: 'shchi_green', name: 'Щи зеленые Coffee\'Lunch', category: 'soups', isDrink: false, image: 'https://picsum.photos/300/300?random=31', variants: [{ size: 'порция', price: 160 }] },
  { id: 'creamy_tomato_chickpea', name: 'Сливочно-томатный с нутом', category: 'soups', isDrink: false, image: 'https://picsum.photos/300/300?random=32', variants: [{ size: 'порция', price: 160 }] },
  { id: 'lentil_bulgur_soup', name: 'Суп с чечевицей и булгуром', category: 'soups', isDrink: false, image: 'https://picsum.photos/300/300?random=33', variants: [{ size: 'порция', price: 160 }] },
  { id: 'borscht', name: 'Борщ со сметаной Coffee\'Lunch', category: 'soups', isDrink: false, image: 'https://picsum.photos/300/300?random=34', variants: [{ size: 'порция', price: 170 }] },
  { id: 'chicken_lentil_soup', name: 'Суп куриный с чечевицей', category: 'soups', isDrink: false, image: 'https://picsum.photos/300/300?random=35', variants: [{ size: 'порция', price: 170 }] },
  { id: 'cream_soup_mushroom', name: 'Крем-суп с грибами Coffee\'Lunch', category: 'soups', isDrink: false, image: 'https://picsum.photos/300/300?random=36', variants: [{ size: 'порция', price: 160 }] },
  { id: 'solyanka', name: 'Солянка по-домашнему', category: 'soups', isDrink: false, image: 'https://picsum.photos/300/300?random=37', variants: [{ size: 'порция', price: 190 }] },
  { id: 'pea_soup', name: 'Суп "Гороховый" Coffee\'Lunch', category: 'soups', isDrink: false, image: 'https://picsum.photos/300/300?random=38', variants: [{ size: 'порция', price: 180 }] },
  { id: 'ukha_scandinavian', name: 'Уха "Скандинавская"', category: 'soups', isDrink: false, image: 'https://picsum.photos/300/300?random=39', variants: [{ size: 'порция', price: 250 }] },
  { id: 'dumpling_soup', name: 'Суп с клецками Coffee\'Lunch', category: 'soups', isDrink: false, image: 'https://picsum.photos/300/300?random=40', variants: [{ size: 'порция', price: 170 }] },
  { id: 'lagman', name: 'Лагман', category: 'soups', isDrink: false, image: 'https://picsum.photos/300/300?random=41', variants: [{ size: 'порция', price: 170 }] },
  { id: 'cream_soup_pea', name: 'Крем-суп гороховый Coffee\'Lunch', category: 'soups', isDrink: false, image: 'https://picsum.photos/300/300?random=42', variants: [{ size: 'порция', price: 180 }] },
  { id: 'cheese_cream_soup', name: 'Сырный крем-суп Coffee\'Lunch', category: 'soups', isDrink: false, image: 'https://picsum.photos/300/300?random=43', variants: [{ size: 'порция', price: 180 }] },
  { id: 'chicken_noodle', name: 'Лапша куриная Coffee\'Lunch', category: 'soups', isDrink: false, image: 'https://picsum.photos/300/300?random=44', variants: [{ size: 'порция', price: 160 }] },
  { id: 'mushroom_noodle', name: 'Лапша грибная Coffee\'Lunch', category: 'soups', isDrink: false, image: 'https://picsum.photos/300/300?random=45', variants: [{ size: 'порция', price: 160 }] },
  { id: 'kharcho', name: 'Суп "Харчо" Coffee\'Lunch', category: 'soups', isDrink: false, image: 'https://picsum.photos/300/300?random=46', variants: [{ size: 'порция', price: 190 }] },
  { id: 'bean_soup', name: 'Суп "Фасолевый" Coffee\'Lunch', category: 'soups', isDrink: false, image: 'https://picsum.photos/300/300?random=47', variants: [{ size: 'порция', price: 180 }] },
  { id: 'creamy_ptitim', name: 'Суп сливочный с птитимом', category: 'soups', isDrink: false, image: 'https://picsum.photos/300/300?random=48', variants: [{ size: 'порция', price: 160 }] },
  { id: 'cream_soup_broccoli', name: 'Крем-суп с брокколи', category: 'soups', isDrink: false, image: 'https://picsum.photos/300/300?random=49', variants: [{ size: 'порция', price: 180 }] },
  { id: 'ukha_rostov', name: 'Уха "Ростовская" Coffee\'Lunch', category: 'soups', isDrink: false, image: 'https://picsum.photos/300/300?random=50', variants: [{ size: 'порция', price: 180 }] },
  { id: 'sytny_chicken', name: 'Суп "Сытный" с курицей', category: 'soups', isDrink: false, image: 'https://picsum.photos/300/300?random=51', variants: [{ size: 'порция', price: 170 }] },
  { id: 'okroshka', name: 'Окрошка Coffee\'Lunch', category: 'soups', isDrink: false, image: 'https://picsum.photos/300/300?random=52', variants: [{ size: 'порция', price: 170 }] },
  { id: 'meatball_soup', name: 'Суп с фрикадельками', category: 'soups', isDrink: false, image: 'https://picsum.photos/300/300?random=53', variants: [{ size: 'порция', price: 170 }] },
  { id: 'vegetable_soup', name: 'Суп овощной (постный)', category: 'soups', isDrink: false, image: 'https://picsum.photos/300/300?random=54', variants: [{ size: 'порция', price: 150 }] },

  // --- SIDE DISHES (GARNISHES) ---
  { id: 'soba_veg', name: 'Соба с овощами Coffee\'Lunch', category: 'side_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=1', variants: [{ size: 'порция', price: 150 }] },
  { id: 'buckwheat', name: 'Гречка отварная Coffee\'Lunch', category: 'side_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=2', variants: [{ size: 'порция', price: 70 }] },
  { id: 'bulgur_veg', name: 'Булгур с овощами Coffee\'Lunch', category: 'side_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=3', variants: [{ size: 'порция', price: 110 }] },
  { id: 'ragout_veg', name: 'Рагу овощное Coffee\'Lunch', category: 'side_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=4', variants: [{ size: 'порция', price: 120 }] },
  { id: 'zucchini_saute', name: 'Соте из кабачков Coffee\'Lunch', category: 'side_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=5', variants: [{ size: 'порция', price: 180 }] },
  { id: 'cabbage_stew', name: 'Капуста тушеная Coffee\'Lunch', category: 'side_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=6', variants: [{ size: 'порция', price: 100 }] },
  { id: 'draniki', name: 'Драники с чесночным соусом', category: 'side_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=7', variants: [{ size: 'порция', price: 180 }] },
  { id: 'veg_steamed', name: 'Овощи припущенные', category: 'side_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=8', variants: [{ size: 'порция', price: 130 }] },
  { id: 'funchoza_veg', name: 'Овощи с фунчозой Coffee\'Lunch', category: 'side_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=9', variants: [{ size: 'порция', price: 150 }] },
  { id: 'lobio', name: 'Лобио Coffee\'Lunch', category: 'side_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=10', variants: [{ size: 'порция', price: 150 }] },
  { id: 'beans_mix', name: 'Микс бобовых с овощами', category: 'side_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=11', variants: [{ size: 'порция', price: 140 }] },
  { id: 'oatmeal', name: 'Каша "Овсянная" с маслом', category: 'side_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=12', variants: [{ size: 'порция', price: 90 }] },
  { id: 'spaghetti', name: 'Спагетти Coffee\'Lunch', category: 'side_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=13', variants: [{ size: 'порция', price: 110 }] },
  { id: 'mashed_potatoes', name: 'Пюре картофельное Coffee\'Lunch', category: 'side_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=14', variants: [{ size: 'порция', price: 90 }] },
  { id: 'rice_veg', name: 'Рис с овощами Coffee\'Lunch', category: 'side_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=15', variants: [{ size: 'порция', price: 120 }] },
  { id: 'fried_zucchini', name: 'Кабачки жареные со сметанным соусом', category: 'side_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=16', variants: [{ size: 'порция', price: 190 }] },
  { id: 'ptitim', name: 'Паста "Птитим" с овощами', category: 'side_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=17', variants: [{ size: 'порция', price: 180 }] },
  { id: 'cauliflower_batter', name: 'Капуста цветная в кляре Coffee\'Lunch', category: 'side_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=18', variants: [{ size: 'порция', price: 150 }] },
  { id: 'green_beans', name: 'Фасоль стручковая тушеная', category: 'side_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=19', variants: [{ size: 'порция', price: 140 }] },
  { id: 'rice_basmati', name: 'Рис Басмати Coffee\'Lunch', category: 'side_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=20', variants: [{ size: 'порция', price: 100 }] },
  { id: 'potato_slices', name: 'Картофель по-деревенски', category: 'side_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=21', variants: [{ size: 'порция', price: 150 }] },
  { id: 'eggplant_breaded', name: 'Баклажаны в панировке', category: 'side_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=22', variants: [{ size: 'порция', price: 200 }] },
  { id: 'veg_grill', name: 'Овощи гриль Coffee\'Lunch', category: 'side_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=23', variants: [{ size: 'порция', price: 200 }] },
  { id: 'rice_porridge', name: 'Каша рисовая молочная', category: 'side_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=24', variants: [{ size: 'порция', price: 90 }] },
  { id: 'ajapsandali', name: 'Аджапсандал', category: 'side_dishes', isDrink: false, image: 'https://picsum.photos/300/300?random=25', variants: [{ size: 'порция', price: 200 }] },

  // --- SWEETS ---
  { id: 'bombbar_hazelnut', name: 'BOMBBAR Фундучное Пралине', category: 'sweets', isDrink: false, image: `${IMG_PATH}/bombbarfunduk.jpg`, variants: [{ size: 'шт', price: 130 }] },
  { id: 'bombbar_coconut', name: 'BOMBBAR Кокосовый Торт', category: 'sweets', isDrink: false, image: `${IMG_PATH}/bombbarcocos.jpg`, variants: [{ size: 'шт', price: 130 }] },
  { id: 'snaq_fabriq_hazelnut', name: 'SNAQ FABRIQ Фундук-Карамель', category: 'sweets', isDrink: false, image: `${IMG_PATH}/snaqerfunduk.jpg`, variants: [{ size: 'шт', price: 130 }] },
  { id: 'eclipse', name: 'Eclipse Coffee\'Lunch', category: 'sweets', isDrink: false, image: `${IMG_PATH}/eclipce.jpg`, variants: [{ size: 'шт', price: 80 }] },
  { id: 'chikalab_blackcurrant', name: 'CHIKALAB Черная Смородина печ.', category: 'sweets', isDrink: false, image: `${IMG_PATH}/chikabicuitblackcurrant.jpg`, variants: [{ size: 'шт', price: 170 }] },
  { id: 'bombbar_raspberry', name: 'BOMBBAR Малиновый Сорбет', category: 'sweets', isDrink: false, image: `${IMG_PATH}/bombbarmalina.jpg`, variants: [{ size: 'шт', price: 130 }] },
  { id: 'rioba_milk', name: 'Rioba Молочный Шоколад 20г', category: 'sweets', isDrink: false, image: `${IMG_PATH}/chokolatmoloko.jpg`, variants: [{ size: 'шт', price: 80 }] },
  { id: 'rioba_dark', name: 'Rioba Горький Шоколад 20г', category: 'sweets', isDrink: false, image: `${IMG_PATH}/chokolatgorkiy.jpg`, variants: [{ size: 'шт', price: 80 }] },
  { id: 'chocopie', name: 'Чоко Пай', category: 'sweets', isDrink: false, image: `${IMG_PATH}/chokopie.jpg`, variants: [{ size: 'шт', price: 30 }] },
  { id: 'miracle', name: 'Обыкновенное чудо', category: 'sweets', isDrink: false, image: `${IMG_PATH}/chudo.jpg`, variants: [{ size: 'шт', price: 60 }] },
  { id: 'babaevsky', name: 'Бабаевский Батончик', category: 'sweets', isDrink: false, image: `${IMG_PATH}/babka.jpg`, variants: [{ size: 'шт', price: 100 }] },
  { id: 'chikalab_banana', name: 'CHIKALAB Бисквит Банан', category: 'sweets', isDrink: false, image: `${IMG_PATH}/chikabiscuitbanan.jpg`, variants: [{ size: 'шт', price: 170 }] },

  // --- COMBOS ---
  { id: 'combo_1', name: 'Гречка с мясом по-французски', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 270 }] },
  { id: 'combo_2', name: 'Рис курица с грибами', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 270 }] },
  { id: 'combo_3', name: 'Пюре с котлетой "Пикантной"', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] },
  { id: 'combo_4', name: 'Рагу с ленивым голубцом', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 240 }] },
  { id: 'combo_5', name: 'Пюре с куриной ватрушкой', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] },
  { id: 'combo_6', name: 'Гречка с котлетой по-домашнему', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] },
  { id: 'combo_7', name: 'Пюре с печенью тушеной', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] },
  { id: 'combo_8', name: 'Гречка с ватрушкой куриной', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] },
  { id: 'combo_9', name: 'Пюре с тефтелей из индейки', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] },
  { id: 'combo_10', name: 'Рис с куриной котлетой', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] },
  { id: 'combo_11', name: 'Гречка с азу', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] },
  { id: 'combo_12', name: 'Гречка с куриной котлетой', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] },
  { id: 'combo_13', name: 'Пюре с котлетой по-киевски', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 240 }] },
  { id: 'combo_14', name: 'Рис с тефтелей из свинины', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] },
  { id: 'combo_15', name: 'Рис с ленивым голубцом', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] },
  { id: 'combo_16', name: 'Рис с бефстроганов', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 320 }] },
  { id: 'combo_17', name: 'Пюре с бефстроганов', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 320 }] },
  { id: 'combo_18', name: 'Пюре с гуляшом', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] },
  { id: 'combo_19', name: 'Пюре с котлетой и яйцом Coffee\'Lunch', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] },
  { id: 'combo_20', name: 'Рис с ветчиной под сыром Coffee\'Lunch', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] },
  { id: 'combo_21', name: 'Гречка с ветчиной под сыром', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] },
  { id: 'combo_22', name: 'Булгур с постной котлетой', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 300 }] },
  { id: 'combo_23', name: 'Гречка с постной котлетой', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] },
  { id: 'combo_24', name: 'Гречка с печенью', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] },
  { id: 'combo_25', name: 'Гречка с ленивым голубцом', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] },
  { id: 'combo_26', name: 'Филе су-вид с рисом', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 380 }] },
  { id: 'combo_27', name: 'Пюре с ветчиной под сыром', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] },
  { id: 'combo_28', name: 'Картофельное пюре с тефтелей', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] },
  { id: 'combo_29', name: 'Гречка с тефтелей', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] },
  { id: 'combo_30', name: 'Рис со свино-говяжьей котлетой', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] },
  { id: 'combo_31', name: 'Рис с печенью тушеной', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] },
  { id: 'combo_32', name: 'Гречка с свино-говяжьей котлетой', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] },
  { id: 'combo_33', name: 'Пюре с куриной котлетой', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] },
  { id: 'combo_34', name: 'Пюре со свино-говяжьей котлетой', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] },
  { id: 'combo_35', name: 'Рис с куриной ватрушкой', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] },
  { id: 'combo_36', name: 'Пюре с рубленной куриной котлетой', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] },
  { id: 'combo_37', name: 'Пюре с котлетой по-домашнему', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] },
  { id: 'combo_38', name: 'Макароны с куриной ватрушкой', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 240 }] },
  { id: 'combo_39', name: 'Рис с куриной рубленной котлетой', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] },
  { id: 'combo_40', name: 'Макароны со свино-говяжьей котлетой', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 240 }] },
  { id: 'combo_41', name: 'Макароны с ленивым голубцом', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 240 }] },
  { id: 'combo_42', name: 'Рис с котлетой по-домашнему', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] },
  { id: 'combo_43', name: 'Гречка с рубленной куриной котлетой', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] },
  { id: 'combo_44', name: 'Рис с гуляшом', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] },
  { id: 'combo_45', name: 'Гречка с тефтелей из индейки', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] }
];

export const MENU_ITEMS = RAW_MENU_ITEMS.map(withDefaults);

export const MILK_LABELS: Record<string, string> = {
  'none': 'Обычное',
  'lactose_free': 'Безлактозное',
  'banana': 'Банановое',
  'coconut': 'Кокосовое',
  'almond': 'Миндальное',
};

export const SYRUP_LABELS: Record<string, string> = {
    'none': 'Нет',
    'pistachio': 'Фисташка',
    'hazelnut': 'Лесной орех',
    'coconut_syrup': 'Кокос',
    'almond_syrup': 'Миндаль',
    'red_orange': 'Кр. апельсин',
    'strawberry': 'Клубника',
    'peach': 'Персик',
    'melon': 'Дыня',
    'plum': 'Слива',
    'apple': 'Яблоко',
    'raspberry': 'Малина',
    'cherry': 'Вишня',
    'lavender': 'Лаванда',
    'gingerbread': 'Пряник',
    'lemongrass': 'Лемонграсс',
    'popcorn': 'Попкорн',
    'mint': 'Мята',
    'bubblegum': 'Баблгам',
    'salted_caramel': 'Сол. карамель'
};

export const SAUCE_LABELS: Record<string, string> = {
    'cheese': 'Сырный',
    'ketchup': 'Кетчуп',
    'mustard': 'Горчичный',
    'bbq': 'Барбекю'
};

export const getAddonPrice = (type: 'milk' | 'syrup' | 'sauce', size: string) => {
  if (type === 'sauce') return 40;

  let sizeLevel = 0; // 0 = 250, 1 = 350, 2 = 450
  if (size.includes('350')) sizeLevel = 1;
  if (size.includes('450')) sizeLevel = 2;

  if (type === 'milk') return 70 + (sizeLevel * 10);
  if (type === 'syrup') return 30 + (sizeLevel * 10);
  return 0;
};
