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
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-slide-up">
      <div className="p-4 border-b flex justify-between items-center bg-coffee-50">
        <h2 className="text-xl font-bold text-coffee-800">Админ Меню</h2>
        <button onClick={onClose} className="text-gray-500 font-medium">Закрыть</button>
      </div>
      
      <div className="bg-yellow-50 p-4 border-b border-yellow-100 text-sm text-yellow-800">
        <p>1. Нажмите на товары, чтобы скрыть/показать их.</p>
        <p>2. Обязательно нажмите <b>"Сохранить в Telegram"</b>, чтобы меню обновилось у всех клиентов.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {MENU_ITEMS.map((item) => {
          const isHidden = hiddenItems.includes(item.id);
          return (
            <div 
              key={item.id} 
              onClick={() => onToggleHidden(item.id)}
              className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                isHidden ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <img src={item.image} className={`w-10 h-10 rounded-full object-cover ${isHidden ? 'opacity-50' : ''}`} />
                <span className={`font-bold ${isHidden ? 'text-red-700 line-through' : 'text-gray-800'}`}>
                  {item.name}
                </span>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded ${isHidden ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>
                {isHidden ? 'СКРЫТО' : 'АКТИВНО'}
              </span>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t bg-white safe-area-bottom">
        <button 
          onClick={onSaveToBot}
          className="w-full bg-coffee-500 text-white py-3 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform"
        >
          Сохранить в Telegram
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;
