import React, { useState } from 'react';
import { Product } from '../types';

interface ItemModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (variantIdx: number, quantity: number, options: any) => void;
  initialVariantIdx?: number;
}

const ItemModal: React.FC<ItemModalProps> = ({ product, onClose, onAddToCart, initialVariantIdx = 0 }) => {
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(initialVariantIdx);
  const [quantity, setQuantity] = useState(1);
  const [temp, setTemp] = useState<'hot' | 'cold'>('hot');
  const [sugar, setSugar] = useState<number>(0);
  const [cinnamon, setCinnamon] = useState<boolean>(false);

  const handleAdd = () => {
    onAddToCart(selectedVariantIdx, quantity, {
      temperature: product.isDrink ? temp : undefined,
      sugar: product.isDrink ? sugar : undefined,
      cinnamon: product.isDrink ? cinnamon : undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
      
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 relative z-10 animate-slide-up pointer-events-auto max-h-[90vh] overflow-y-auto">
        <div className="flex gap-4 mb-6">
          <img src={product.image} alt={product.name} className="w-24 h-24 object-cover rounded-2xl shadow-md" />
          <div>
            <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
            <p className="text-coffee-500 font-bold text-lg">
              {product.variants[selectedVariantIdx].price * quantity}₽
            </p>
          </div>
        </div>

        {/* Size Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Объем / Размер</label>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedVariantIdx(idx)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedVariantIdx === idx 
                    ? 'bg-coffee-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Температура</label>
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button 
                  onClick={() => setTemp('hot')}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${temp === 'hot' ? 'bg-white shadow text-coffee-500' : 'text-gray-500'}`}
                >
                  Горячий
                </button>
                <button 
                  onClick={() => setTemp('cold')}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${temp === 'cold' ? 'bg-white shadow text-blue-500' : 'text-gray-500'}`}
                >
                  Холодный
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Сахар ({sugar}г)</label>
              <input 
                type="range" 
                min="0" 
                max="10" 
                step="1" 
                value={sugar}
                onChange={(e) => setSugar(Number(e.target.value))}
                className="w-full accent-coffee-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0г</span>
                <span>5г</span>
                <span>10г</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Добавить корицу?</span>
              <button 
                onClick={() => setCinnamon(!cinnamon)}
                className={`w-12 h-6 rounded-full transition-colors relative ${cinnamon ? 'bg-coffee-500' : 'bg-gray-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${cinnamon ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 items-center">
          <div className="flex items-center bg-gray-100 rounded-xl px-2">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 text-xl font-bold text-gray-600 pb-1"
            >-</button>
            <span className="w-8 text-center font-bold">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 text-xl font-bold text-gray-600 pb-1"
            >+</button>
          </div>
          
          <button 
            onClick={handleAdd}
            className="flex-1 bg-coffee-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform"
          >
            Добавить за {product.variants[selectedVariantIdx].price * quantity}₽
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemModal;