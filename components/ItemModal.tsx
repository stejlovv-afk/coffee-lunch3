import React, { useState, useEffect } from 'react';
import { Product, CartItemOption } from '../types';

interface ItemModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (variantIdx: number, quantity: number, options: CartItemOption, totalPrice: number) => void;
}

// --- CONSTANTS ---
const MILK_OPTIONS = [
  { id: 'classic', label: 'Обычное', price: 0 },
  { id: 'banana', label: 'Банановое', price: 70 }, // Base price for small
  { id: 'coconut', label: 'Кокосовое', price: 70 },
  { id: 'lactose_free', label: 'Безлактозное', price: 70 },
  { id: 'almond', label: 'Миндальное', price: 70 },
];

const SYRUP_GROUPS = [
  {
    name: 'Ореховые',
    items: ['Фисташка', 'Лесной орех', 'Кокос', 'Миндаль']
  },
  {
    name: 'Фруктовые / Ягодные',
    items: ['Красный апельсин', 'Клубника', 'Персик', 'Дыня', 'Яблоко', 'Малина', 'Вишня', 'Лемонграсс']
  },
  {
    name: 'Десертные',
    items: ['Лаванда', 'Имбирный пряник', 'Сливки', 'Попкорн', 'Бамбл гам', 'Соленая карамель']
  }
];

const ItemModal: React.FC<ItemModalProps> = ({ product, onClose, onAddToCart }) => {
  const [variantIdx, setVariantIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  
  // Options
  const [temp, setTemp] = useState<'warm' | 'cold'>('cold');
  const [gas, setGas] = useState<boolean>(true); // true = gas, false = no gas
  const [milk, setMilk] = useState<string>('classic');
  const [syrup, setSyrup] = useState<string | null>(null);
  const [honey, setHoney] = useState<boolean>(false);
  const [filtered, setFiltered] = useState<boolean>(false);
  const [showFilterHelp, setShowFilterHelp] = useState(false);
  const [sugar, setSugar] = useState(0);
  const [cinnamon, setCinnamon] = useState(false);

  // --- LOGIC HELPERS ---
  const isRaf = product.id.includes('raf');
  const isBumble = product.id.includes('bumble');
  const isWater = product.id === 'chern_water';
  const isPunch = product.category === 'punch';
  const isBuckthorn = product.id === 'punch_buckthorn';
  const isSeasonal = product.category === 'seasonal';
  const isCoffee = product.category === 'coffee';
  
  // Milk logic: Coffee only, exclude Raf, exclude Bumble (usually no milk choice for bumble in basic menu unless specified, assuming standard OJ+Espresso)
  // User said: "Add alt milk to every coffee except Raf".
  const showMilk = isCoffee && !isRaf && !isBumble;

  // Syrup logic: "Add to every coffee...". Usually tea too, but user said "to every coffee". 
  // User said: "In seasonal do not add syrups".
  const showSyrup = isCoffee && !isSeasonal && !isRaf && !isBumble; // Raf usually has its own syrup, but okay to add more? Usually Raf is a complete drink. User said "Except Raf" for milk, implied logic for syrups is usually "Custom syrups for basic drinks". Let's allow for Latte/Cappuccino/Americano/Espresso.

  // --- PRICING CALCULATOR ---
  // Milk: 70 (250ml), 80 (350ml), 90 (450ml)
  // Syrups: 30 (250ml), 40 (350ml), 50 (450ml)
  // We assume variant 0 is small, 1 medium, 2 large. 
  // If only 2 variants (Espresso), logic maps 0->Small, 1->Medium.
  
  const getModifierPrice = (baseSmall: number, baseMed: number, baseLarge: number) => {
    if (variantIdx === 0) return baseSmall;
    if (variantIdx === 1) return baseMed;
    return baseLarge;
  };

  const milkPrice = milk === 'classic' ? 0 : getModifierPrice(70, 80, 90);
  const syrupPrice = syrup ? getModifierPrice(30, 40, 50) : 0;
  
  const oneItemPrice = product.variants[variantIdx].price + (showMilk ? milkPrice : 0) + (showSyrup ? syrupPrice : 0);
  const finalPrice = oneItemPrice * quantity;

  const handleAdd = () => {
    onAddToCart(variantIdx, quantity, {
      temperature: isBumble ? temp : undefined,
      gas: isWater ? gas : undefined,
      milk: showMilk && milk !== 'classic' ? milk : undefined,
      syrup: showSyrup && syrup ? syrup : undefined,
      honey: isBuckthorn ? honey : undefined,
      filtered: isPunch ? filtered : undefined,
      sugar: (isCoffee || product.category === 'tea') ? sugar : undefined,
      cinnamon: (isCoffee || product.category === 'tea') ? cinnamon : undefined
    }, finalPrice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose} />
      
      <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-3xl p-6 relative z-10 animate-slide-up pointer-events-auto max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl">
        
        {/* Header */}
        <div className="flex gap-5 mb-6">
          <img src={product.image} alt={product.name} className="w-28 h-28 object-cover rounded-2xl shadow-lg" />
          <div className="flex flex-col justify-center">
            <h3 className="text-2xl font-black text-gray-900 leading-tight mb-1">{product.name}</h3>
            {product.description && <p className="text-xs text-gray-500 mb-2">{product.description}</p>}
            <p className="text-coffee-500 font-black text-2xl">
              {finalPrice}₽
            </p>
          </div>
        </div>

        {/* --- SIZE --- */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Объем</label>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v, idx) => (
              <button
                key={idx}
                onClick={() => setVariantIdx(idx)}
                className={`px-5 py-3 rounded-xl text-sm font-bold transition-all border-2 ${
                  variantIdx === idx 
                    ? 'border-coffee-500 bg-coffee-50 text-coffee-800 shadow-sm' 
                    : 'border-transparent bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {v.size}
              </button>
            ))}
          </div>
        </div>

        {/* --- BUMBLE TEMP --- */}
        {isBumble && (
          <div className="mb-6">
             <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Температура</label>
             <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                <button 
                  onClick={() => setTemp('warm')}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${temp === 'warm' ? 'bg-white shadow text-orange-500' : 'text-gray-500'}`}
                >
                  Теплый
                </button>
                <button 
                  onClick={() => setTemp('cold')}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${temp === 'cold' ? 'bg-white shadow text-blue-500' : 'text-gray-500'}`}
                >
                  Холодный
                </button>
             </div>
          </div>
        )}

        {/* --- WATER GAS --- */}
        {isWater && (
          <div className="mb-6">
             <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Газация</label>
             <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                <button 
                  onClick={() => setGas(true)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${gas ? 'bg-white shadow text-blue-500' : 'text-gray-500'}`}
                >
                  Газ
                </button>
                <button 
                  onClick={() => setGas(false)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${!gas ? 'bg-white shadow text-blue-500' : 'text-gray-500'}`}
                >
                  Без газа
                </button>
             </div>
          </div>
        )}

        {/* --- MILK (Coffee, No Raf) --- */}
        {showMilk && (
          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
               Молоко {milk !== 'classic' && <span className="text-coffee-500">+{milkPrice}₽</span>}
            </label>
            <div className="flex flex-wrap gap-2">
              {MILK_OPTIONS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMilk(m.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    milk === m.id
                      ? 'border-coffee-500 bg-coffee-50 text-coffee-800'
                      : 'border-gray-200 bg-white text-gray-600'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- SYRUPS (Coffee, No Seasonal) --- */}
        {showSyrup && (
          <div className="mb-6">
             <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Сироп {syrup && <span className="text-coffee-500">+{syrupPrice}₽</span>}
                </label>
                {syrup && <button onClick={() => setSyrup(null)} className="text-xs text-red-400 font-bold">Сбросить</button>}
             </div>
             
             <div className="space-y-3">
               {SYRUP_GROUPS.map(group => (
                 <div key={group.name}>
                   <p className="text-[10px] text-gray-400 font-bold mb-1 ml-1">{group.name}</p>
                   <div className="flex flex-wrap gap-1.5">
                     {group.items.map(item => (
                       <button
                         key={item}
                         onClick={() => setSyrup(item === syrup ? null : item)}
                         className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                           syrup === item
                             ? 'border-coffee-500 bg-coffee-500 text-white'
                             : 'border-gray-200 bg-gray-50 text-gray-600'
                         }`}
                       >
                         {item}
                       </button>
                     ))}
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* --- PUNCH OPTIONS --- */}
        {isPunch && (
          <div className="mb-6 space-y-3">
             {/* Honey for Buckthorn */}
             {isBuckthorn && (
               <div className="flex items-center justify-between bg-yellow-50 p-3 rounded-xl border border-yellow-100">
                  <span className="font-bold text-yellow-800 text-sm">Добавить мед?</span>
                  <div 
                    onClick={() => setHoney(!honey)}
                    className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer ${honey ? 'bg-yellow-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-sm ${honey ? 'left-6' : 'left-1'}`} />
                  </div>
               </div>
             )}

             {/* Filter with Tooltip */}
             <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100 relative">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-700 text-sm">Профильтровать?</span>
                  <button 
                    onClick={() => setShowFilterHelp(!showFilterHelp)}
                    className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold"
                  >
                    ?
                  </button>
                </div>
                
                {/* Tooltip */}
                {showFilterHelp && (
                  <div className="absolute top-10 left-0 bg-gray-800 text-white text-xs p-2 rounded-lg z-20 shadow-xl w-64">
                    Если не фильтровать, в напитке будут ягоды, но могут попадаться косточки.
                  </div>
                )}

                <div 
                  onClick={() => setFiltered(!filtered)}
                  className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer ${filtered ? 'bg-coffee-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-sm ${filtered ? 'left-6' : 'left-1'}`} />
                </div>
             </div>
          </div>
        )}

        {/* --- BASIC OPTIONS (Sugar/Cinnamon) --- */}
        {(isCoffee || product.category === 'tea') && (
           <div className="mb-6 bg-gray-50 p-4 rounded-2xl">
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 mb-2">Сахар ({sugar}г)</label>
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  step="5" 
                  value={sugar}
                  onChange={(e) => setSugar(Number(e.target.value))}
                  className="w-full accent-coffee-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-bold">
                  <span>0г</span>
                  <span>5г</span>
                  <span>10г</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-600">Добавить корицу?</span>
                <div 
                  onClick={() => setCinnamon(!cinnamon)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${cinnamon ? 'bg-coffee-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm ${cinnamon ? 'left-6' : 'left-1'}`} />
                </div>
              </div>
           </div>
        )}

        {/* --- ACTIONS --- */}
        <div className="flex gap-3 items-center pt-2 safe-area-bottom">
          <div className="flex items-center bg-gray-100 rounded-2xl px-1 h-14">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-12 h-full text-2xl font-bold text-gray-500 hover:text-gray-800"
            >-</button>
            <span className="w-8 text-center font-black text-lg">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="w-12 h-full text-2xl font-bold text-gray-500 hover:text-gray-800"
            >+</button>
          </div>
          
          <button 
            onClick={handleAdd}
            className="flex-1 bg-coffee-500 text-white h-14 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <span>Добавить</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-lg text-sm">{finalPrice}₽</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemModal;
