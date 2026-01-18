
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
  { id: 'combo_45', name: 'Гречка с тефтелей из индейки', category: 'combo', isDrink: false, image: COMBO_IMG, variants: [{ size: 'порция', price: 280 }] },

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
];

export const MENU_ITEMS = RAW_MENU_ITEMS.map(withDefaults);
