import React, { useState, useMemo } from 'react';
import { Product } from '../types';

interface ItemModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (variantIdx: number, quantity: number, options: any) => void;
  initialVariantIdx?: number;
}

const MILK_OPTIONS = [
  { id: 'none', label: 'Обычное', price: 0 },
  { id: 'banana', label: 'Банановое', price: 70 },
  { id: 'coconut', label: 'Кокосовое', price: 70 },
  { id: 'almond', label: 'Миндальное', price: 70 },
  { id: 'oat', label: 'Овсяное', price: 70 },
];

const SYRUP_OPTIONS = [
  { id: 'none', label: 'Нет', price: 0 },
  { id: 'caramel', label: 'Карамель', price: 40 },
  { id: 'vanilla', label: 'Ваниль', price: 40 },
  { id: 'hazelnut', label: 'Лесной орех', price: 40 },
  { id: 'coconut', label: 'Кокос', price: 40 },
  { id: 'chocolate', label: 'Шоколад', price: 40 },
];

const ItemModal: React.FC<ItemModalProps> = ({ product, onClose, onAddToCart, initialVariantIdx = 0 }) => {
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(initialVariantIdx);
  const [quantity, setQuantity] = useState(1);
  const [temp, setTemp] = useState<'hot' | 'cold'>('hot');
  const [sugar, setSugar] = useState<number>(0);
  const [cinnamon, setCinnamon] = useState<boolean>(false);
  const [selectedMilk, setSelectedMilk] = useState<string>('none');
  const [selectedSyrup, setSelectedSyrup] = useState<string>('none');

  const basePrice = product.variants[selectedVariantIdx].price;
  
  const totalPrice = useMemo(() => {
    let price = basePrice;
    if (product.isDrink) {
      const milkPrice = MILK_OPTIONS.find(m => m.id === selectedMilk)?.price || 0;
      const syrupPrice = SYRUP_OPTIONS.find(s => s.id === selectedSyrup)?.price || 0;
      price += milkPrice + syrupPrice;
    }
    return price * quantity;
  }, [basePrice, quantity, selectedMilk, selectedSyrup, product.isDrink]);

  const handleAdd = () => {
    onAddToCart(selectedVariantIdx, quantity, {
      temperature: product.isDrink ? temp : undefined,
      sugar: product.isDrink ? sugar : undefined,
      cinnamon: product.isDrink ? cinnamon : undefined,
      milk: product.isDrink && selectedMilk !== 'none' ? selectedMilk : undefined,
      syrup: product.isDrink && selectedSyrup !== 'none' ? selectedSyrup : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose} />
      
      <div className="bg-brand-card w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 relative z-10 animate-slide-up pointer-events-auto max-h-[90vh] overflow-y-auto border-t sm:border border-brand-light">
        <div className="flex gap-4 mb-6">
          <img src={product.image} alt={product.name} className="w-24 h-24 object-cover rounded-2xl shadow-lg" />
          <div>
            <h3 className="text-xl font-bold text-white">{product.name}</h3>
            <p className="text-brand-yellow font-bold text-lg">
              {totalPrice}₽
            </p>
          </div>
        </div>

        {/* Size Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-brand-muted mb-3">Объем / Размер</label>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedVariantIdx(idx)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  selectedVariantIdx === idx 
                    ? 'bg-brand-yellow text-black shadow-[0_0_10px_rgba(250,204,21,0.4)]' 
                    : 'bg-brand-light text-brand-muted hover:bg-zinc-700'
                }`}
              >
                {v.size}
              </button>
            ))}
          </div>
        </div>

        {/* Drink Options */}
        {product.isDrink && (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-brand-muted mb-2">Температура</label>
              <div className="flex bg-brand-light p-1 rounded-xl">
                <button 
                  onClick={() => setTemp('hot')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${temp === 'hot' ? 'bg-brand-card shadow text-brand-yellow' : 'text-brand-muted'}`}
                >
                  Горячий
                </button>
                <button 
                  onClick={() => setTemp('cold')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${temp === 'cold' ? 'bg-brand-card shadow text-blue-400' : 'text-brand-muted'}`}
                >
                  Холодный
                </button>
              </div>
            </div>

            {/* Milk Selection */}
            <div>
               <label className="block text-sm font-medium text-brand-muted mb-2">Молоко</label>
               <div className="relative">
                 <select 
                   value={selectedMilk}
                   onChange={(e) => setSelectedMilk(e.target.value)}
                   className="w-full bg-brand-light text-white p-3 rounded-xl outline-none focus:ring-2 ring-brand-yellow appearance-none"
                 >
                   {MILK_OPTIONS.map(m => (
                     <option key={m.id} value={m.id}>
                       {m.label} {m.price > 0 ? `(+${m.price}₽)` : ''}
                     </option>
                   ))}
                 </select>
                 <div className="absolute right-3 top-3.5 pointer-events-none text-brand-muted">▼</div>
               </div>
            </div>

            {/* Syrup Selection */}
            <div>
               <label className="block text-sm font-medium text-brand-muted mb-2">Сироп</label>
               <div className="relative">
                 <select 
                   value={selectedSyrup}
                   onChange={(e) => setSelectedSyrup(e.target.value)}
                   className="w-full bg-brand-light text-white p-3 rounded-xl outline-none focus:ring-2 ring-brand-yellow appearance-none"
                 >
                   {SYRUP_OPTIONS.map(s => (
                     <option key={s.id} value={s.id}>
                       {s.label} {s.price > 0 ? `(+${s.price}₽)` : ''}
                     </option>
                   ))}
                 </select>
                 <div className="absolute right-3 top-3.5 pointer-events-none text-brand-muted">▼</div>
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-muted mb-2">Сахар ({sugar}г)</label>
              <input 
                type="range" 
                min="0" 
                max="10" 
                step="1" 
                value={sugar}
                onChange={(e) => setSugar(Number(e.target.value))}
                className="w-full accent-brand-yellow h-2 bg-brand-light rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-brand-muted mt-2">
                <span>0г</span>
                <span>5г</span>
                <span>10г</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-brand-muted">Добавить корицу?</span>
              <button 
                onClick={() => setCinnamon(!cinnamon)}
                className={`w-12 h-6 rounded-full transition-colors relative ${cinnamon ? 'bg-brand-yellow' : 'bg-brand-light'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${cinnamon ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 items-center">
          <div className="flex items-center bg-brand-light rounded-xl px-2 border border-transparent hover:border-brand-yellow/30 transition-colors">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 text-xl font-bold text-white pb-1"
            >-</button>
            <span className="w-8 text-center font-bold text-white">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 text-xl font-bold text-white pb-1"
            >+</button>
          </div>
          
          <button 
            onClick={handleAdd}
            className="flex-1 bg-brand-yellow text-black py-4 rounded-2xl font-bold text-lg shadow-[0_0_15px_rgba(250,204,21,0.3)] active:scale-95 transition-transform"
          >
            Добавить за {totalPrice}₽
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemModal;
