import { Product } from './types';

const IMG_PATH = "./img";
const COMBO_IMG = "./img/combo.jpg"; 

// Helper to apply default modifiers based on category to keep old logic working
const withDefaults = (p: Product): Product => {
  const m = p.modifiers || {};
  
  // Logic from previous ItemModal
  if (p.isDrink) {
      if (['coffee', 'seasonal', 'cacao'].includes(p.category) && !p.id.includes('espresso') && !p.id.includes('bumble')) {
          m.hasMilk = true;
          m.hasSyrup = true;
          m.hasSugar = true;
          m.hasCinnamon = true;
      }
      if (p.category === 'tea' || p.category === 'punch') {
          m.hasSugar = true;
          m.hasSyrup = true;
      }
      if (p.category === 'soda' && !p.id.includes('chern_')) {
          m.isSoda = true;
      }
  }

  if (p.id.includes('bumble')) m.isBumble = true;
  if (p.id.includes('matcha')) { m.isMatcha = true; m.hasMilk = true; m.hasSyrup = true; }
  if (p.id === 'punch_buckthorn') m.isBuckthorn = true;
  if (p.id === 'chern_water') m.isSoda = true; // reusing isSoda for gas flag logic

  if (p.category === 'fast_food') m.heatingType = 'advanced'; // Grill/Micro
  if (['soups', 'hot_dishes', 'combo', 'side_dishes', 'salads'].includes(p.category)) {
      m.needsCutlery = true;
      if (p.category !== 'salads') m.heatingType = 'simple'; // Yes/No
  }

  return { ...p, modifiers: m };
};

const RAW_MENU_ITEMS: Product[] = [
  // --- COFFEE ---
  {
    id: 'cappuccino',
    name: 'Капучино',
    category: 'coffee',
    isDrink: true,
    image: `${IMG_PATH}/kapuchino.jpg`,
    variants: [{ size: '250мл', price: 190 }, { size: '350мл', price: 230 }, { size: '450мл', price: 270 }],
  },
  {
    id: 'latte',
    name: 'Латте',
    category: 'coffee',
    isDrink: true,
    image: `${IMG_PATH}/latte.jpg`,
    variants: [{ size: '250мл', price: 190 }, { size: '350мл', price: 230 }, { size: '450мл', price: 270 }],
  },
  {
    id: 'espresso',
    name: 'Эспрессо',
    category: 'coffee',
    isDrink: true,
    image: `${IMG_PATH}/espresso1.jpg`,
    variants: [{ size: '30мл', price: 110 }, { size: '60мл', price: 150 }],
  },
  {
    id: 'americano',
    name: 'Американо',
    category: 'coffee',
    isDrink: true,
    image: `${IMG_PATH}/americano.jpg`,
    variants: [{ size: '250мл', price: 180 }, { size: '350мл', price: 220 }, { size: '450мл', price: 260 }],
  },
  {
    id: 'flat_white',
    name: 'Флат Уайт',
    category: 'coffee',
    isDrink: true,
    image: `${IMG_PATH}/эспрессо2.jpg`, 
    variants: [{ size: '250мл', price: 220 }, { size: '350мл', price: 260 }, { size: '450мл', price: 360 }],
  },
  {
    id: 'raf',
    name: 'Раф',
    category: 'coffee',
    isDrink: true,
    image: `${IMG_PATH}/latte.jpg`, 
    variants: [{ size: '250мл', price: 210 }, { size: '350мл', price: 250 }, { size: '450мл', price: 290 }],
  },
  {
    id: 'bumble_warm',
    name: 'Бамбл Теплый',
    category: 'coffee',
    isDrink: true,
    image: `${IMG_PATH}/babblteplo.jpg`,
    variants: [{ size: '250мл', price: 270 }, { size: '350мл', price: 270 }, { size: '450мл', price: 300 }],
  },
  {
    id: 'bumble_cold',
    name: 'Бамбл Холодный',
    category: 'coffee',
    isDrink: true,
    image: `${IMG_PATH}/icebambl.jpg`,
    variants: [{ size: '250мл', price: 270 }, { size: '350мл', price: 300 }],
  },
  {
    id: 'espresso_tonic',
    name: 'Эспрессо Тоник',
    category: 'coffee',
    isDrink: true,
    image: `${IMG_PATH}/granattonic.jpg`,
    description: 'Гранатовый / Обычный',
    variants: [{ size: '250мл', price: 250 }, { size: '350мл', price: 290 }],
  },
  {
    id: 'ice_latte',
    name: 'Айс Латте',
    category: 'coffee',
    isDrink: true,
    image: `${IMG_PATH}/icelatte.jpg`,
    variants: [{ size: '250мл', price: 240 }, { size: '350мл', price: 280 }],
  },
  {
    id: 'matcha',
    name: 'Матча',
    category: 'coffee',
    isDrink: true,
    image: `${IMG_PATH}/matcha.jpg`,
    variants: [{ size: '250мл', price: 180 }, { size: '350мл', price: 220 }, { size: '450мл', price: 260 }],
  },
  {
    id: 'ice_matcha',
    name: 'Айс Матча',
    category: 'coffee',
    isDrink: true,
    image: `${IMG_PATH}/matcha.jpg`,
    variants: [{ size: '250мл', price: 230 }, { size: '350мл', price: 270 }],
  },
  {
    id: 'cacao',
    name: 'Какао',
    category: 'coffee',
    isDrink: true,
    image: `${IMG_PATH}/kakao.jpg`,
    variants: [{ size: '250мл', price: 180 }, { size: '350мл', price: 220 }, { size: '450мл', price: 260 }],
  },

  // --- FAST FOOD ---
  {
    id: 'club_sandwich',
    name: 'Клаб-сэндвич',
    category: 'fast_food',
    isDrink: false,
    image: `${IMG_PATH}/sendvichvetcina.jpg`,
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
    variants: [{ size: 'порция', price: 350 }],
  },
  {
    id: 'greek_salad',
    name: 'Греческий салат',
    category: 'salads',
    isDrink: false,
    image: `${IMG_PATH}/salatgrek.jpg`,
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
    variants: [{ size: '250мл', price: 120 }, { size: '350мл', price: 150 }, { size: '450мл', price: 180 }],
  },
  {
    id: 'tea_green',
    name: 'Чай Зеленый',
    category: 'tea',
    isDrink: true,
    image: `${IMG_PATH}/greentea.jpg`,
    variants: [{ size: '250мл', price: 120 }, { size: '350мл', price: 150 }, { size: '450мл', price: 180 }],
  },
  {
    id: 'tea_karkade',
    name: 'Чай Каркаде',
    category: 'tea',
    isDrink: true,
    image: `${IMG_PATH}/karkadetea.jpg`,
    variants: [{ size: '250мл', price: 120 }, { size: '350мл', price: 150 }, { size: '450мл', price: 180 }],
  },
  {
    id: 'tea_jasmine',
    name: 'Чай Жасмин',
    category: 'tea',
    isDrink: true,
    image: `${IMG_PATH}/greenjasmin.jpg`,
    variants: [{ size: '250мл', price: 120 }, { size: '350мл', price: 150 }, { size: '450мл', price: 180 }],
  },
  {
    id: 'spiced_tea',
    name: 'Пряный Чай',
    category: 'tea',
    isDrink: true,
    image: `${IMG_PATH}/pryanytea.jpg`,
    variants: [{ size: '250мл', price: 240 }, { size: '350мл', price: 280 }, { size: '450мл', price: 320 }],
  },
  {
    id: 'gluhwein',
    name: 'Глинтвейн',
    category: 'tea',
    isDrink: true,
    image: `${IMG_PATH}/glintveinpunch.jpg`,
    variants: [{ size: '350мл', price: 230 }, { size: '450мл', price: 270 }],
  },

  // --- PUNCH ---
  {
    id: 'punch_buckthorn',
    name: 'Облепиховый пунш',
    category: 'punch',
    isDrink: true,
    image: `${IMG_PATH}/oblepihapunch.jpg`,
    variants: [{ size: '350мл', price: 230 }, { size: '450мл', price: 270 }],
  },
  {
    id: 'punch_raspberry',
    name: 'Малиновый пунш',
    category: 'punch',
    isDrink: true,
    image: `${IMG_PATH}/malinapunsh.jpg`,
    variants: [{ size: '350мл', price: 230 }, { size: '450мл', price: 270 }],
  },

  // --- SEASONAL ---
  {
    id: 'latte_halva',
    name: 'Латте Халва',
    category: 'seasonal',
    isDrink: true,
    image: `${IMG_PATH}/lattehalva.jpg`,
    variants: [{ size: '350мл', price: 290 }, { size: '450мл', price: 350 }],
  },
  {
    id: 'latte_pumpkin',
    name: 'Латте Тыква',
    category: 'seasonal',
    isDrink: true,
    image: `${IMG_PATH}/lattetikva.jpg`,
    variants: [{ size: '350мл', price: 290 }, { size: '450мл', price: 350 }],
  },
  {
    id: 'raf_snickers',
    name: 'Раф Сникерс',
    category: 'seasonal',
    isDrink: true,
    image: `${IMG_PATH}/rafsnikers.jpg`,
    variants: [{ size: '350мл', price: 320 }, { size: '450мл', price: 380 }],
  },
  {
    id: 'latte_orange',
    name: 'Латте Orange Christmas',
    category: 'seasonal',
    isDrink: true,
    image: `${IMG_PATH}/latteorangecristmas.jpg`,
    variants: [{ size: '350мл', price: 320 }, { size: '450мл', price: 380 }],
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
    variants: [{ size: '250мл', price: 260 }, { size: '350мл', price: 290 }],
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
