import React, { useState } from 'react';
import { MENU_ITEMS } from '../constants';
import { SearchIcon } from './ui/Icons';

interface AdminPanelProps {
  hiddenItems: string[];
  onToggleHidden: (id: string) => void;
  onSaveToBot: () => void;
  onClose: () => void;
  isLoading: boolean;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ hiddenItems, onToggleHidden, onSaveToBot, onClose, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = MENU_ITEMS.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex flex-col animate-slide-up">
      <div className="p-4 border-b border-white/10 glass-panel">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-brand-yellow drop-shadow-sm">Админ Меню</h2>
          <button onClick={onClose} disabled={isLoading} className="text-brand-muted font-medium hover:text-white transition-colors">
            {isLoading ? '' : 'Закрыть'}
          </button>
        </div>
        
        {/* Поиск */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-brand-muted" />
          <input 
            type="text" 
            placeholder="Найти товар..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full glass-input rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-yellow/50"
          />
        </div>
      </div>
      
      <div className="bg-brand-yellow/5 p-4 border-b border-brand-yellow/10 text-xs text-brand-yellow/80">
        <p>1. Нажмите на товар, чтобы скрыть/показать.</p>
        <p>2. "Сохранить и Разослать" обновит бота.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredItems.map((item) => {
          const isHidden = hiddenItems.includes(item.id);
          return (
            <div 
              key={item.id} 
              onClick={() => !isLoading && onToggleHidden(item.id)}
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors backdrop-blur-sm ${
                isHidden 
                  ? 'bg-red-900/10 border-red-500/20' 
                  : 'bg-white/5 border-white/5 hover:bg-white/10'
              } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="flex items-center gap-3">
                <img src={item.image} className={`w-10 h-10 rounded-full object-cover border border-white/10 ${isHidden ? 'opacity-50 grayscale' : ''}`} />
                <span className={`font-bold text-sm ${isHidden ? 'text-red-400 line-through' : 'text-brand-text'}`}>
                  {item.name}
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded border ${isHidden ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                {isHidden ? 'СКРЫТО' : 'АКТИВНО'}
              </span>
            </div>
          );
        })}
        {filteredItems.length === 0 && (
          <div className="text-center text-brand-muted py-10">Товары не найдены</div>
        )}
      </div>

      <div className="p-4 border-t border-white/10 glass-panel safe-area-bottom">
        <button 
          onClick={onSaveToBot}
          disabled={isLoading}
          className={`w-full py-3 rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(250,204,21,0.3)] transition-all flex items-center justify-center gap-2 ${
             isLoading 
               ? 'bg-brand-yellow/50 text-black/50 cursor-not-allowed' 
               : 'bg-brand-yellow text-black active:scale-95'
          }`}
        >
          {isLoading ? (
            <>
              <span className="animate-spin h-5 w-5 border-2 border-black/50 border-t-transparent rounded-full"/>
              Рассылка...
            </>
          ) : (
            'Сохранить и Разослать'
          )}
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;
