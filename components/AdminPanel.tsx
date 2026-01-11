import React from 'react';
import { MENU_ITEMS } from '../constants';

interface AdminPanelProps {
  hiddenItems: string[];
  onToggleHidden: (id: string) => void;
  onSaveToBot: () => void;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ hiddenItems, onToggleHidden, onSaveToBot, onClose }) => {
  return (
    <div className="fixed inset-0 z-[70] bg-[#F2F2F7] flex flex-col animate-slide-up">
      <div className="pt-safe px-4 pb-4 bg-white/80 backdrop-blur-md border-b border-gray-200 flex justify-between items-center sticky top-0">
        <h2 className="text-[28px] font-bold text-black mt-2">Админка</h2>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold mt-2">✕</button>
      </div>
      
      <div className="bg-yellow-100 p-4 text-sm text-yellow-800 font-medium">
        <p>1. Отметьте товары, которых НЕТ в наличии.</p>
        <p>2. Нажмите <b>"Сохранить"</b> внизу, чтобы обновить меню у всех.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
        {MENU_ITEMS.map((item) => {
          const isHidden = hiddenItems.includes(item.id);
          return (
            <div 
              key={item.id} 
              onClick={() => onToggleHidden(item.id)}
              className={`flex items-center justify-between p-3 rounded-[16px] border cursor-pointer transition-all active:scale-[0.98] ${
                isHidden ? 'bg-red-50 border-red-200' : 'bg-white border-transparent shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                   <img src={item.image} className={`w-12 h-12 rounded-[10px] object-cover bg-gray-100 ${isHidden ? 'grayscale' : ''}`} />
                   {isHidden && <div className="absolute inset-0 bg-red-500/20 rounded-[10px]" />}
                </div>
                <div>
                   <span className={`font-semibold block ${isHidden ? 'text-red-700 line-through' : 'text-gray-900'}`}>
                     {item.name}
                   </span>
                   <span className="text-xs text-gray-500">{item.category}</span>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isHidden ? 'border-red-500 bg-red-500' : 'border-gray-300'}`}>
                 {isHidden && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 pb-safe z-10">
        <button 
          onClick={onSaveToBot}
          className="w-full bg-[#1C1C1E] text-white py-4 rounded-[16px] font-bold text-[17px] shadow-lg active:scale-95 transition-transform"
        >
          Сохранить изменения
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;
