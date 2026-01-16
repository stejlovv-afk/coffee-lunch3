import React, { useState } from 'react';
import { MENU_ITEMS } from '../constants';
import { SearchIcon } from './ui/Icons';

interface AdminPanelProps {
  hiddenItems: string[];
  onToggleHidden: (id: string) => void;
  onSaveToBot: () => void;
  onClose: () => void;
  isLoading: boolean;
  dailyRevenue: number;
  monthlyRevenue: number;
  isShiftClosed: boolean;
  onToggleShift: (isClosed: boolean) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  hiddenItems, onToggleHidden, onSaveToBot, onClose, isLoading,
  dailyRevenue, monthlyRevenue, isShiftClosed, onToggleShift
}) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'revenue'>('menu');
  const [searchTerm, setSearchTerm] = useState('');
  const [showShiftConfirm, setShowShiftConfirm] = useState(false);

  const filteredItems = MENU_ITEMS.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleShiftClick = () => {
      // Если смена закрыта (мы хотим открыть) - подтверждение не нужно, просто открываем.
      // Если смена открыта (хотим закрыть) - спрашиваем подтверждение.
      if (!isShiftClosed) {
          setShowShiftConfirm(true);
      } else {
          onToggleShift(false); // Открыть
      }
  };

  const confirmCloseShift = () => {
      onToggleShift(true); // Закрыть
      setShowShiftConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex flex-col animate-slide-up">
      {/* Header */}
      <div className="p-4 border-b border-white/10 glass-panel">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-brand-yellow drop-shadow-sm">Админ Панель</h2>
          <button onClick={onClose} disabled={isLoading} className="text-brand-muted font-medium hover:text-white transition-colors">
            {isLoading ? '' : 'Закрыть'}
          </button>
        </div>

        {/* Shift Status Button */}
        <div className="mb-4">
             <button 
                onClick={handleShiftClick}
                disabled={isLoading}
                className={`w-full py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                    isShiftClosed 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30' 
                    : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                }`}
             >
                 <div className={`w-3 h-3 rounded-full ${isShiftClosed ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                 {isShiftClosed ? 'СМЕНА ЗАКРЫТА (Нажмите, чтобы открыть)' : 'СМЕНА ОТКРЫТА (Нажмите, чтобы закрыть)'}
             </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-black/40 p-1 rounded-xl mb-4">
            <button 
                onClick={() => setActiveTab('menu')} 
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'menu' ? 'bg-white/10 text-brand-yellow shadow-md' : 'text-brand-muted'}`}
            >
                Меню
            </button>
            <button 
                onClick={() => setActiveTab('revenue')} 
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'revenue' ? 'bg-white/10 text-brand-yellow shadow-md' : 'text-brand-muted'}`}
            >
                Выручка
            </button>
        </div>
        
        {/* Поиск (Только для меню) */}
        {activeTab === 'menu' && (
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
        )}
      </div>
      
      {activeTab === 'menu' ? (
        <>
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
        </>
      ) : (
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {/* Daily Revenue */}
              <div className="glass-panel p-6 rounded-2xl border border-brand-yellow/20 relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-yellow/10 rounded-full blur-2xl group-hover:bg-brand-yellow/20 transition-colors"></div>
                  <h3 className="text-brand-muted text-sm font-bold uppercase tracking-widest mb-1">Выручка за сегодня</h3>
                  <div className="text-4xl font-black text-white drop-shadow-md">
                      {dailyRevenue.toLocaleString('ru-RU')} <span className="text-brand-yellow">₽</span>
                  </div>
              </div>

              {/* Monthly Revenue */}
               <div className="glass-panel p-6 rounded-2xl border border-purple-500/20 relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors"></div>
                  <h3 className="text-brand-muted text-sm font-bold uppercase tracking-widest mb-1">Выручка за месяц</h3>
                  <div className="text-4xl font-black text-white drop-shadow-md">
                      {monthlyRevenue.toLocaleString('ru-RU')} <span className="text-purple-400">₽</span>
                  </div>
              </div>

              <div className="text-center text-xs text-brand-muted/50 mt-10">
                  <p>Данные обновляются при открытии приложения.</p>
                  <p>Чтобы обновить, закройте и откройте меню заново.</p>
              </div>
          </div>
      )}

      {/* Confirmation Modal */}
      {showShiftConfirm && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="glass-panel p-6 rounded-3xl w-full max-w-sm shadow-2xl border border-red-500/30">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                      <div className="w-8 h-8 rounded bg-red-500 animate-pulse"></div>
                  </div>
                  <h3 className="text-xl font-bold text-center text-white mb-2">Закрыть смену?</h3>
                  <p className="text-center text-brand-muted text-sm mb-6">
                      Пользователи не смогут делать заказы, пока вы снова не откроете смену.
                  </p>
                  <div className="flex gap-3">
                      <button 
                        onClick={() => setShowShiftConfirm(false)}
                        className="flex-1 py-3 rounded-xl font-bold bg-white/10 hover:bg-white/20 transition-colors"
                      >
                          Отмена
                      </button>
                      <button 
                        onClick={confirmCloseShift}
                        className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white shadow-lg shadow-red-500/30 active:scale-95 transition-transform"
                      >
                          Закрыть
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminPanel;
