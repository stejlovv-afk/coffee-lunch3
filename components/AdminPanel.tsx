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
    <div className="fixed inset-0 z-50 bg-brand-dark flex flex-col animate-slide-up">
      <div className="p-4 border-b border-brand-light flex justify-between items-center bg-brand-card">
        <h2 className="text-xl font-bold text-brand-yellow">Админ Меню</h2>
        <button onClick={onClose} className="text-brand-muted font-medium hover:text-white transition-colors">Закрыть</button>
      </div>
      
      <div className="bg-yellow-900/20 p-4 border-b border-yellow-800/50 text-sm text-yellow-500">
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
              className={`flex items-center justify-between p-3 rounded-xl border border-transparent cursor-pointer transition-colors ${
                isHidden 
                  ? 'bg-red-900/20 border-red-900/30' 
                  : 'bg-brand-light hover:bg-brand-light/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <img src={item.image} className={`w-10 h-10 rounded-full object-cover ${isHidden ? 'opacity-50 grayscale' : ''}`} />
                <span className={`font-bold ${isHidden ? 'text-red-400 line-through' : 'text-brand-text'}`}>
                  {item.name}
                </span>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded ${isHidden ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                {isHidden ? 'СКРЫТО' : 'АКТИВНО'}
              </span>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-brand-light bg-brand-card safe-area-bottom">
        <button 
          onClick={onSaveToBot}
          className="w-full bg-brand-yellow text-black py-3 rounded-xl font-bold text-lg shadow-[0_0_15px_rgba(250,204,21,0.3)] active:scale-95 transition-transform"
        >
          Сохранить в Telegram
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;
