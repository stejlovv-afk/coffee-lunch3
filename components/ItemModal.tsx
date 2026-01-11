import React, { useState } from 'react';
import { Product, CartItemOption } from '../types';

interface ItemModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (variantIdx: number, quantity: number, options: CartItemOption, totalPrice: number) => void;
}

const ItemModal: React.FC<ItemModalProps> = ({ product, onClose, onAddToCart }) => {
  const [variantIdx, setVariantIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  
  // Options
  const [temp, setTemp] = useState<'warm' | 'cold'>('cold');
  const [gas, setGas] = useState<boolean>(true);
  const [milk, setMilk] = useState<string>('classic');
  const [syrup, setSyrup] = useState<string | null>(null);
  const [honey, setHoney] = useState<boolean>(false);
  const [filtered, setFiltered] = useState<boolean>(false);
  const [heat, setHeat] = useState<boolean>(false);
  const [cutlery, setCutlery] = useState<boolean>(false);
  const [sugar, setSugar] = useState(0);
  const [cinnamon, setCinnamon] = useState(false);

  // Logic Helpers
  const isRaf = product.id.includes('raf');
  const isBumble = product.id.includes('bumble');
  const isWater = product.id === 'chern_water';
  const isPunch = product.category === 'punch';
  const isBuckthorn = product.id === 'punch_buckthorn';
  const isSeasonal = product.category === 'seasonal';
  const isCoffee = product.category === 'coffee';
  const isFood = ['sandwiches', 'hot', 'salads'].includes(product.category);
  const canHeat = ['sandwiches', 'hot'].includes(product.category);

  const showMilk = isCoffee && !isRaf && !isBumble;
  const showSyrup = isCoffee && !isSeasonal && !isRaf && !isBumble; 

  // Pricing
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
      heat: canHeat ? heat : undefined,
      cutlery: isFood ? cutlery : undefined,
      sugar: (isCoffee || product.category === 'tea') ? sugar : undefined,
      cinnamon: (isCoffee || product.category === 'tea') ? cinnamon : undefined
    }, finalPrice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[4px] transition-opacity" onClick={onClose} />
      
      <div className="bg-white w-full max-w-lg rounded-t-[32px] relative z-10 animate-slide-up max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl pb-safe">
        
        {/* Grabber */}
        <div className="sticky top-0 bg-white z-20 w-full flex justify-center pt-3 pb-4 rounded-t-[32px]">
           <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        <div className="px-6 pb-6">
          {/* Header */}
          <div className="flex gap-5 mb-8">
            <img src={product.image} alt={product.name} className="w-32 h-32 object-cover rounded-[20px] shadow-md bg-gray-100" />
            <div className="flex flex-col justify-center">
              <h3 className="text-3xl font-bold text-coffee-primary leading-tight mb-2">{product.name}</h3>
              <p className="text-3xl font-bold text-coffee-primary">{finalPrice}₽</p>
            </div>
          </div>

          {/* Size Selector (Segmented Control Style) */}
          <div className="mb-8">
            <label className="block text-[13px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Размер</label>
            <div className="bg-gray-100 p-1 rounded-[14px] flex">
              {product.variants.map((v, idx) => (
                <button
                  key={idx}
                  onClick={() => setVariantIdx(idx)}
                  className={`flex-1 py-2.5 rounded-[12px] text-[15px] font-semibold transition-all ${
                    variantIdx === idx 
                      ? 'bg-white text-black shadow-sm' 
                      : 'text-gray-500'
                  }`}
                >
                  {v.size}
                </button>
              ))}
            </div>
          </div>

          {/* Food Options */}
          {isFood && (
            <div className="mb-8 space-y-4">
               {canHeat && (
                 <div className="flex items-center justify-between py-1">
                    <span className="text-[17px] font-medium text-black">Подогреть</span>
                    <input type="checkbox" className="ios-switch" checked={heat} onChange={() => setHeat(!heat)} />
                 </div>
               )}
               <div className="w-full h-[1px] bg-gray-100"></div>
               <div className="flex items-center justify-between py-1">
                  <span className="text-[17px] font-medium text-black">Приборы</span>
                  <input type="checkbox" className="ios-switch" checked={cutlery} onChange={() => setCutlery(!cutlery)} />
               </div>
            </div>
          )}

          {/* Bumble Temp */}
          {isBumble && (
            <div className="mb-8">
               <label className="block text-[13px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Температура</label>
               <div className="bg-gray-100 p-1 rounded-[14px] flex">
                  <button onClick={() => setTemp('warm')} className={`flex-1 py-2 rounded-[12px] text-sm font-bold ${temp === 'warm' ? 'bg-white shadow text-orange-500' : 'text-gray-500'}`}>Теплый</button>
                  <button onClick={() => setTemp('cold')} className={`flex-1 py-2 rounded-[12px] text-sm font-bold ${temp === 'cold' ? 'bg-white shadow text-blue-500' : 'text-gray-500'}`}>Холодный</button>
               </div>
            </div>
          )}

          {/* Milk Options */}
          {showMilk && (
            <div className="mb-8">
              <label className="block text-[13px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Молоко</label>
              <div className="flex flex-wrap gap-2">
                {[{ id: 'classic', label: 'Обычное' }, { id: 'banana', label: 'Банан' }, { id: 'coconut', label: 'Кокос' }, { id: 'lactose_free', label: 'Безлакт' }, { id: 'almond', label: 'Миндаль' }].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMilk(m.id)}
                    className={`px-4 py-2 rounded-full text-[15px] font-medium transition-all border ${
                      milk === m.id
                        ? 'bg-coffee-primary border-coffee-primary text-white'
                        : 'bg-white border-gray-200 text-gray-600'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Syrups */}
          {showSyrup && (
            <div className="mb-8">
               <div className="flex justify-between items-center mb-3">
                  <label className="text-[13px] font-semibold text-gray-400 uppercase tracking-wide">Сироп</label>
                  {syrup && <button onClick={() => setSyrup(null)} className="text-[13px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md">Сбросить</button>}
               </div>
               <div className="space-y-4">
                 <div className="flex flex-wrap gap-2">
                   {['Фисташка', 'Лесной орех', 'Кокос', 'Карамель', 'Ваниль', 'Лаванда'].map(item => (
                     <button
                       key={item}
                       onClick={() => setSyrup(item === syrup ? null : item)}
                       className={`px-4 py-2 rounded-full text-[15px] font-medium transition-all border ${
                         syrup === item
                           ? 'bg-coffee-accent border-coffee-accent text-coffee-primary'
                           : 'bg-white border-gray-200 text-gray-600'
                       }`}
                     >
                       {item}
                     </button>
                   ))}
                 </div>
               </div>
            </div>
          )}

          {/* Sugar & Cinnamon */}
          {(isCoffee || product.category === 'tea') && (
             <div className="mb-8 bg-gray-50 p-5 rounded-[20px]">
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-[15px] font-medium">Сахар</span>
                    <span className="text-[15px] font-bold text-gray-500">{sugar}г</span>
                  </div>
                  <input 
                    type="range" min="0" max="10" step="5" value={sugar}
                    onChange={(e) => setSugar(Number(e.target.value))}
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[17px] font-medium">Корица</span>
                  <input type="checkbox" className="ios-switch" checked={cinnamon} onChange={() => setCinnamon(!cinnamon)} />
                </div>
             </div>
          )}

          {/* Action Bar */}
          <div className="flex gap-4 items-center pt-2">
            <div className="flex items-center bg-gray-100 rounded-[16px] px-2 h-14">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-full text-2xl text-gray-500 font-medium pb-1">-</button>
              <span className="w-6 text-center font-bold text-xl">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-full text-2xl text-gray-500 font-medium pb-1">+</button>
            </div>
            
            <button 
              onClick={handleAdd}
              className="flex-1 bg-coffee-primary text-white h-14 rounded-[16px] font-bold text-[17px] shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              Добавить за {finalPrice}₽
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemModal;
