import React, { useState, useMemo } from 'react';
import { Product } from '../types';

interface ItemModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (variantIdx: number, quantity: number, options: any) => void;
  initialVariantIdx?: number;
}

// --- DATA ---
const MILK_OPTIONS = [
  { id: 'none', label: 'Обычное', basePrice: 0 },
  { id: 'lactose_free', label: 'Безлактозное', basePrice: 70 }, // Base price for 250ml
  { id: 'banana', label: 'Банановое', basePrice: 70 },
  { id: 'coconut', label: 'Кокосовое', basePrice: 70 },
  { id: 'almond', label: 'Миндальное', basePrice: 70 },
];

const SYRUP_GROUPS = {
  'Ореховые': [
    { id: 'pistachio', label: 'Фисташка' },
    { id: 'hazelnut', label: 'Лесной орех' },
    { id: 'coconut_syrup', label: 'Кокос' },
    { id: 'almond_syrup', label: 'Миндаль' },
  ],
  'Ягодные/Фруктовые': [
    { id: 'red_orange', label: 'Кр. апельсин' },
    { id: 'strawberry', label: 'Клубника' },
    { id: 'peach', label: 'Персик' },
    { id: 'melon', label: 'Дыня' },
    { id: 'plum', label: 'Слива' },
    { id: 'apple', label: 'Яблоко' },
    { id: 'raspberry', label: 'Малина' },
    { id: 'cherry', label: 'Вишня' },
  ],
  'Десертные/Другие': [
    { id: 'lavender', label: 'Лаванда' },
    { id: 'gingerbread', label: 'Пряник' },
    { id: 'lemongrass', label: 'Лемонграсс' },
    { id: 'popcorn', label: 'Попкорн' },
    { id: 'mint', label: 'Мята' },
    { id: 'bubblegum', label: 'Баблгам' },
    { id: 'salted_caramel', label: 'Сол. карамель' },
  ]
};

// --- HELPERS ---
const getAddonPrice = (type: 'milk' | 'syrup', size: string) => {
  let sizeLevel = 0; // 0 = 250, 1 = 350, 2 = 450
  if (size.includes('350')) sizeLevel = 1;
  if (size.includes('450')) sizeLevel = 2;

  if (type === 'milk') return 70 + (sizeLevel * 10);
  if (type === 'syrup') return 30 + (sizeLevel * 10);
  return 0;
};

const ItemModal: React.FC<ItemModalProps> = ({ product, onClose, onAddToCart, initialVariantIdx = 0 }) => {
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(initialVariantIdx);
  const [quantity, setQuantity] = useState(1);
  
  // Options State
  const [temp, setTemp] = useState<'hot' | 'cold'>('cold'); // Default cold for sodas
  const [sugar, setSugar] = useState<number>(0);
  const [cinnamon, setCinnamon] = useState<boolean>(false);
  const [selectedMilk, setSelectedMilk] = useState<string>('none');
  const [selectedSyrup, setSelectedSyrup] = useState<string>('none');
  
  // Specific Options
  const [bumbleJuice, setBumbleJuice] = useState<'orange' | 'cherry'>('orange');
  const [waterGas, setWaterGas] = useState<boolean>(false); // false = без газа
  const [buckthornHoney, setBuckthornHoney] = useState<boolean>(false);
  const [buckthornFilter, setBuckthornFilter] = useState<boolean>(false);
  const [cutlery, setCutlery] = useState<boolean>(false);
  const [heating, setHeating] = useState<'grill' | 'microwave' | 'none' | 'yes'>('none');
  const [matchaColor, setMatchaColor] = useState<'green' | 'blue'>('green');

  // UI State for Tooltips
  const [showFilterTooltip, setShowFilterTooltip] = useState(false);
  const [showMatchaTooltip, setShowMatchaTooltip] = useState(false);

  const currentVariant = product.variants[selectedVariantIdx];
  const basePrice = currentVariant.price;

  // --- LOGIC ---
  
  const milkPrice = useMemo(() => {
    if (selectedMilk === 'none') return 0;
    return getAddonPrice('milk', currentVariant.size);
  }, [selectedMilk, currentVariant.size]);

  const syrupPrice = useMemo(() => {
    if (selectedSyrup === 'none') return 0;
    return getAddonPrice('syrup', currentVariant.size);
  }, [selectedSyrup, currentVariant.size]);

  const totalPrice = (basePrice + milkPrice + syrupPrice) * quantity;

  // Hide Milk logic: Espresso, Americano, Punch, TEA
  const canHaveMilk = product.isDrink && 
                      !['espresso', 'americano'].includes(product.id) && 
                      product.category !== 'punch' &&
                      product.category !== 'tea' && 
                      !product.id.includes('bumble') && 
                      !product.id.includes('chern_'); 

  // Logic for temperature: SODA category can have Warm/Cold.
  const canHaveTemp = product.category === 'soda' && !product.id.includes('chern_');

  // New Categories Logic
  const needsCutlery = ['salads', 'soups', 'hot_dishes', 'combo', 'side_dishes'].includes(product.category);
  const needsHeatingSimple = ['soups', 'hot_dishes', 'combo', 'side_dishes'].includes(product.category);
  const needsHeatingAdvanced = product.category === 'fast_food';

  const handleAdd = () => {
    onAddToCart(selectedVariantIdx, quantity, {
      temperature: canHaveTemp ? temp : undefined,
      sugar: product.isDrink && !product.id.includes('chern') ? sugar : undefined,
      cinnamon: product.isDrink ? cinnamon : undefined,
      milk: canHaveMilk && selectedMilk !== 'none' ? selectedMilk : undefined,
      syrup: product.isDrink && selectedSyrup !== 'none' ? selectedSyrup : undefined,
      // Specifics
      juice: product.id.includes('bumble') ? bumbleJuice : undefined,
      gas: product.id === 'chern_water' ? waterGas : undefined,
      honey: product.id === 'punch_buckthorn' ? buckthornHoney : undefined,
      filter: product.id === 'punch_buckthorn' ? buckthornFilter : undefined,
      cutlery: needsCutlery ? cutlery : undefined,
      heating: (needsHeatingSimple || needsHeatingAdvanced) ? heating : undefined,
      matchaColor: product.id.includes('matcha') ? matchaColor : undefined,
    });
    onClose();
  };

  const displayMilkPrice = getAddonPrice('milk', currentVariant.size);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto transition-opacity" onClick={onClose} />
      
      <div className="glass-modal w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 relative z-10 animate-slide-up pointer-events-auto max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl">
        
        {/* Header */}
        <div className="flex gap-4 mb-6">
          <img src={product.image} alt={product.name} className="w-24 h-24 object-cover rounded-2xl shadow-lg border border-white/10" />
          <div className="flex flex-col justify-center">
            <h3 className="text-xl font-bold text-white leading-tight mb-1 drop-shadow-md">{product.name}</h3>
            <p className="text-brand-yellow font-black text-2xl drop-shadow-sm">
              {totalPrice}₽
            </p>
          </div>
        </div>

        {/* --- Variant / Size Selector --- */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-3">Размер</label>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedVariantIdx(idx)}
                className={`px-4 py-3 rounded-xl text-sm font-bold transition-all border ${
                  selectedVariantIdx === idx 
                    ? 'bg-brand-yellow text-black border-brand-yellow shadow-[0_0_15px_rgba(250,204,21,0.4)]' 
                    : 'bg-white/5 text-brand-muted border-white/5 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                {v.size}
              </button>
            ))}
          </div>
        </div>

        {/* ================= SPECIAL OPTIONS ================= */}

        {/* 1. Bumble Juice */}
        {product.id.includes('bumble') && (
          <div className="mb-6">
             <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">Сок (Бесплатно)</label>
             <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
                <button onClick={() => setBumbleJuice('orange')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${bumbleJuice === 'orange' ? 'bg-white/10 text-brand-yellow shadow-sm border border-white/10' : 'text-brand-muted'}`}>Апельсиновый</button>
                <button onClick={() => setBumbleJuice('cherry')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${bumbleJuice === 'cherry' ? 'bg-white/10 text-red-400 shadow-sm border border-white/10' : 'text-brand-muted'}`}>Вишневый</button>
             </div>
          </div>
        )}

        {/* 2. Chernogolovka Water Gas */}
        {product.id === 'chern_water' && (
          <div className="mb-6">
             <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">Газация</label>
             <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
                <button onClick={() => setWaterGas(false)} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${!waterGas ? 'bg-white/10 text-white shadow-sm border border-white/10' : 'text-brand-muted'}`}>Не газированная</button>
                <button onClick={() => setWaterGas(true)} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${waterGas ? 'bg-white/10 text-blue-400 shadow-sm border border-white/10' : 'text-brand-muted'}`}>С газом</button>
             </div>
          </div>
        )}

        {/* 3. Matcha Color */}
        {product.id.includes('matcha') && (
          <div className="mb-6 relative">
             <div className="flex items-center gap-2 mb-2">
                <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider">Цвет матчи</label>
                <button onClick={() => setShowMatchaTooltip(!showMatchaTooltip)} className="w-5 h-5 rounded-full bg-white/10 text-brand-muted flex items-center justify-center text-xs font-bold border border-white/10">?</button>
             </div>
             {showMatchaTooltip && (
               <div className="absolute top-0 left-28 z-20 glass-panel text-white text-xs p-3 rounded-xl shadow-xl w-48">
                 <p className="mb-1"><span className="text-green-400 font-bold">Зеленая:</span> Японский чай.</p>
                 <p><span className="text-blue-400 font-bold">Синяя:</span> Из тайской орхидеи.</p>
               </div>
             )}
             <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
                <button onClick={() => setMatchaColor('green')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${matchaColor === 'green' ? 'bg-green-900/40 text-green-400 shadow-sm border border-green-500/20' : 'text-brand-muted'}`}>Зеленая</button>
                <button onClick={() => setMatchaColor('blue')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${matchaColor === 'blue' ? 'bg-blue-900/40 text-blue-400 shadow-sm border border-blue-500/20' : 'text-brand-muted'}`}>Синяя</button>
             </div>
          </div>
        )}

        {/* 4. Buckthorn Options */}
        {product.id === 'punch_buckthorn' && (
          <div className="mb-6 space-y-3">
             {/* Honey */}
             <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
               <span className="text-sm font-bold text-white">Добавить мёд?</span>
               <div onClick={() => setBuckthornHoney(!buckthornHoney)} className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors border border-white/10 ${buckthornHoney ? 'bg-brand-yellow/80' : 'bg-black/40'}`}>
                 <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${buckthornHoney ? 'left-7' : 'left-1'}`} />
               </div>
             </div>
             {/* Filter */}
             <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl relative border border-white/5">
               <div className="flex items-center gap-2">
                 <span className="text-sm font-bold text-white">Профильтровать?</span>
                 <button onClick={() => setShowFilterTooltip(!showFilterTooltip)} className="w-5 h-5 rounded-full bg-white/10 text-white flex items-center justify-center text-xs font-bold border border-white/10">?</button>
               </div>
               {showFilterTooltip && (
                 <div className="absolute top-10 left-0 z-20 glass-panel text-brand-muted text-xs p-3 rounded-xl shadow-xl w-64">
                   Если не профильтровать, могут попадаться косточки, но будут ягоды.
                 </div>
               )}
               <div onClick={() => setBuckthornFilter(!buckthornFilter)} className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors border border-white/10 ${buckthornFilter ? 'bg-brand-yellow/80' : 'bg-black/40'}`}>
                 <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${buckthornFilter ? 'left-7' : 'left-1'}`} />
               </div>
             </div>
          </div>
        )}

        {/* 5. Cutlery (New Categories) */}
        {needsCutlery && (
           <div className="mb-6 flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
             <span className="text-sm font-bold text-white">Нужны приборы?</span>
             <div onClick={() => setCutlery(!cutlery)} className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors border border-white/10 ${cutlery ? 'bg-brand-yellow/80' : 'bg-black/40'}`}>
               <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${cutlery ? 'left-7' : 'left-1'}`} />
             </div>
           </div>
        )}

        {/* 6. Simple Heating (Yes/No) - Soups, Hot Dishes, Combo */}
        {needsHeatingSimple && (
          <div className="mb-6 flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
             <span className="text-sm font-bold text-white">Подогреть еду?</span>
             <div onClick={() => setHeating(heating === 'yes' ? 'none' : 'yes')} className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors border border-white/10 ${heating === 'yes' ? 'bg-brand-yellow/80' : 'bg-black/40'}`}>
               <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${heating === 'yes' ? 'left-7' : 'left-1'}`} />
             </div>
           </div>
        )}

        {/* 7. Advanced Heating (Fast Food / Sandwiches) */}
        {needsHeatingAdvanced && (
          <div className="mb-6">
            <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">Подогреть?</label>
             <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
                <button onClick={() => setHeating('none')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${heating === 'none' ? 'bg-white/10 text-white shadow-sm border border-white/10' : 'text-brand-muted'}`}>Холодным</button>
                <button onClick={() => setHeating('microwave')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${heating === 'microwave' ? 'bg-white/10 text-brand-yellow shadow-sm border border-white/10' : 'text-brand-muted'}`}>СВЧ</button>
                <button onClick={() => setHeating('grill')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${heating === 'grill' ? 'bg-white/10 text-orange-400 shadow-sm border border-white/10' : 'text-brand-muted'}`}>Гриль</button>
             </div>
          </div>
        )}


        {/* ================= DRINK OPTIONS ================= */}
        {product.isDrink && !product.id.includes('chern_') && (
          <div className="space-y-6 mb-6">
            
            {/* Temp */}
            {canHaveTemp && (
              <div>
                <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">Температура</label>
                <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
                  <button onClick={() => setTemp('cold')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${temp === 'cold' ? 'bg-white/10 shadow-sm border border-white/10 text-blue-400' : 'text-brand-muted'}`}>Холодный</button>
                  <button onClick={() => setTemp('hot')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${temp === 'hot' ? 'bg-white/10 shadow-sm border border-white/10 text-brand-yellow' : 'text-brand-muted'}`}>Теплый</button>
                </div>
              </div>
            )}

            {/* Milk Selection */}
            {canHaveMilk && (
              <div className="mb-6">
                 <div className="flex justify-between mb-3">
                   <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider">Молоко</label>
                   {selectedMilk !== 'none' && <span className="text-xs font-bold text-brand-yellow">+{milkPrice}₽</span>}
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {MILK_OPTIONS.map(m => (
                       <button
                         key={m.id}
                         onClick={() => setSelectedMilk(m.id)}
                         className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                            selectedMilk === m.id 
                            ? 'bg-brand-yellow text-black border-brand-yellow shadow-sm' 
                            : 'bg-white/5 text-brand-muted border-white/5 hover:bg-white/10'
                         }`}
                       >
                         {m.label} {m.basePrice > 0 ? ` (+${displayMilkPrice}₽)` : ''}
                       </button>
                    ))}
                 </div>
              </div>
            )}

            {/* Syrup Selection */}
            <div>
               <div className="flex justify-between mb-3">
                 <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider">Сироп</label>
                 {selectedSyrup !== 'none' && <span className="text-xs font-bold text-brand-yellow">+{syrupPrice}₽</span>}
               </div>
               
               <div className="space-y-4">
                  {Object.entries(SYRUP_GROUPS).map(([group, options]) => (
                    <div key={group}>
                       <h4 className="text-[10px] text-brand-muted/70 font-bold uppercase mb-2 ml-1">{group}</h4>
                       <div className="flex flex-wrap gap-2">
                          {options.map(s => (
                             <button
                               key={s.id}
                               onClick={() => setSelectedSyrup(selectedSyrup === s.id ? 'none' : s.id)}
                               className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                                  selectedSyrup === s.id 
                                  ? 'bg-brand-yellow text-black border-brand-yellow shadow-sm' 
                                  : 'bg-white/5 text-brand-muted border-white/5 hover:bg-white/10'
                               }`}
                             >
                               {s.label}
                             </button>
                          ))}
                       </div>
                    </div>
                  ))}
               </div>
               {selectedSyrup !== 'none' && (
                  <div className="mt-3">
                     <button onClick={() => setSelectedSyrup('none')} className="text-xs text-red-400 font-bold border-b border-red-400/30 pb-0.5">
                        Убрать сироп
                     </button>
                  </div>
               )}
            </div>

            {/* Sugar Slider */}
            <div>
              <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">Сахар ({sugar}г)</label>
              <input 
                type="range" 
                min="0" 
                max="10" 
                step="1" 
                value={sugar}
                onChange={(e) => setSugar(Number(e.target.value))}
                className="w-full accent-brand-yellow h-2 bg-black/30 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-brand-muted mt-2 font-mono">
                <span>0г</span>
                <span>5г</span>
                <span>10г</span>
              </div>
            </div>

            {/* Cinnamon */}
            <div className="flex items-center justify-between py-2 border-t border-white/5 mt-4">
              <span className="text-sm font-bold text-white">Добавить корицу?</span>
              <button 
                onClick={() => setCinnamon(!cinnamon)}
                className={`w-12 h-6 rounded-full transition-colors relative border border-white/10 ${cinnamon ? 'bg-brand-yellow/80' : 'bg-black/40'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${cinnamon ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex gap-3 items-center pt-2">
          <div className="flex items-center bg-white/5 rounded-2xl px-2 h-14 border border-white/10 hover:border-brand-yellow/30 transition-colors">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-full text-2xl font-bold text-white flex items-center justify-center active:text-brand-yellow"
            >-</button>
            <span className="w-8 text-center font-bold text-white text-lg">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-full text-2xl font-bold text-white flex items-center justify-center active:text-brand-yellow"
            >+</button>
          </div>
          
          <button 
            onClick={handleAdd}
            className="flex-1 bg-brand-yellow text-black h-14 rounded-2xl font-black text-lg shadow-[0_0_20px_rgba(250,204,21,0.4)] active:scale-95 transition-transform uppercase tracking-wide"
          >
            Добавить {totalPrice}₽
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemModal;
