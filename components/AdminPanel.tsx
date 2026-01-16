import React, { useState } from 'react';
import { Category, Product } from '../types';
import { SearchIcon, PlusIcon, TrashIcon } from './ui/Icons';

interface AdminPanelProps {
  products: Product[]; // Теперь принимаем полный список товаров
  hiddenItems: string[];
  onToggleHidden: (id: string) => void;
  onSaveToBot: () => void;
  onClose: () => void;
  isLoading: boolean;
  dailyRevenue: number;
  monthlyRevenue: number;
  isShiftClosed: boolean;
  onToggleShift: (isClosed: boolean) => void;
  onAddProduct: (product: { name: string; category: Category; price: number; image: string }) => void;
  onDeleteProduct: (id: string) => void;
}

const CATEGORIES: {id: Category, label: string}[] = [
    { id: 'coffee', label: 'Кофе' },
    { id: 'tea', label: 'Чай' },
    { id: 'seasonal', label: 'Сезонное' },
    { id: 'punch', label: 'Пунши' },
    { id: 'salads', label: 'Салаты' },
    { id: 'food', label: 'Еда' },
    { id: 'sweets', label: 'Сладости' },
    { id: 'soda', label: 'Напитки' },
];

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  products, hiddenItems, onToggleHidden, onSaveToBot, onClose, isLoading,
  dailyRevenue, monthlyRevenue, isShiftClosed, onToggleShift, onAddProduct, onDeleteProduct
}) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'add' | 'delete' | 'revenue'>('menu');
  const [searchTerm, setSearchTerm] = useState('');
  const [showShiftConfirm, setShowShiftConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null); // For delete confirmation

  // New Product Form State
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCat, setNewCat] = useState<Category>('coffee');
  const [newImage, setNewImage] = useState('');

  const filteredItems = products.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter only custom items for the delete tab
  const customItems = products.filter(item => item.isCustom);

  const handleShiftClick = () => {
      if (!isShiftClosed) {
          setShowShiftConfirm(true);
      } else {
          onToggleShift(false);
      }
  };

  const confirmCloseShift = () => {
      onToggleShift(true); 
      setShowShiftConfirm(false);
  };

  const handleAddSubmit = () => {
      if (!newName || !newPrice || !newImage) {
          alert("Заполните все поля");
          return;
      }
      onAddProduct({
          name: newName,
          category: newCat,
          price: Number(newPrice),
          image: newImage
      });
      // Clear form
      setNewName('');
      setNewPrice('');
      setNewImage('');
      alert("Товар отправлен на добавление!");
  };

  const confirmDelete = () => {
      if (deleteId) {
          onDeleteProduct(deleteId);
          setDeleteId(null);
      }
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
                 {isShiftClosed ? 'СМЕНА ЗАКРЫТА (Открыть)' : 'СМЕНА ОТКРЫТА (Закрыть)'}
             </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-black/40 p-1 rounded-xl mb-4 overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTab('menu')} className={`flex-1 min-w-[70px] py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'menu' ? 'bg-white/10 text-brand-yellow shadow-md' : 'text-brand-muted'}`}>Меню</button>
            <button onClick={() => setActiveTab('add')} className={`flex-1 min-w-[70px] py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'add' ? 'bg-white/10 text-brand-yellow shadow-md' : 'text-brand-muted'}`}>Добавить</button>
            <button onClick={() => setActiveTab('delete')} className={`flex-1 min-w-[70px] py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'delete' ? 'bg-white/10 text-brand-yellow shadow-md' : 'text-brand-muted'}`}>Удалить</button>
            <button onClick={() => setActiveTab('revenue')} className={`flex-1 min-w-[70px] py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'revenue' ? 'bg-white/10 text-brand-yellow shadow-md' : 'text-brand-muted'}`}>Выручка</button>
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
      
      {/* CONTENT: MENU */}
      {activeTab === 'menu' && (
        <>
            <div className="bg-brand-yellow/5 p-4 border-b border-brand-yellow/10 text-xs text-brand-yellow/80">
                <p>1. Нажмите на товар, чтобы скрыть/показать.</p>
                <p>2. "Сохранить и Разослать" обновит бота.</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {filteredItems.map((item) => {
                const isHidden = hiddenItems.includes(item.id);
                return (
                    <div key={item.id} onClick={() => !isLoading && onToggleHidden(item.id)} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors backdrop-blur-sm ${isHidden ? 'bg-red-900/10 border-red-500/20' : 'bg-white/5 border-white/5 hover:bg-white/10'} ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex items-center gap-3">
                        <img src={item.image} className={`w-10 h-10 rounded-full object-cover border border-white/10 ${isHidden ? 'opacity-50 grayscale' : ''}`} />
                        <span className={`font-bold text-sm ${isHidden ? 'text-red-400 line-through' : 'text-brand-text'}`}>{item.name}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded border ${isHidden ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>{isHidden ? 'СКРЫТО' : 'АКТИВНО'}</span>
                    </div>
                );
                })}
            </div>
            <div className="p-4 border-t border-white/10 glass-panel safe-area-bottom">
                <button onClick={onSaveToBot} disabled={isLoading} className={`w-full py-3 rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(250,204,21,0.3)] transition-all flex items-center justify-center gap-2 ${isLoading ? 'bg-brand-yellow/50 text-black/50 cursor-not-allowed' : 'bg-brand-yellow text-black active:scale-95'}`}>
                {isLoading ? 'Рассылка...' : 'Сохранить и Разослать'}
                </button>
            </div>
        </>
      )}

      {/* CONTENT: ADD PRODUCT */}
      {activeTab === 'add' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <h3 className="text-white font-bold text-lg mb-2">Новый товар</h3>
              
              <div>
                  <label className="text-xs text-brand-muted uppercase font-bold ml-1">Название</label>
                  <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full glass-input p-3 rounded-xl text-white outline-none focus:border-brand-yellow/50" placeholder="Например: Пончик" />
              </div>

              <div>
                  <label className="text-xs text-brand-muted uppercase font-bold ml-1">Цена (₽)</label>
                  <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} className="w-full glass-input p-3 rounded-xl text-white outline-none focus:border-brand-yellow/50" placeholder="150" />
              </div>

              <div>
                  <label className="text-xs text-brand-muted uppercase font-bold ml-1">Категория</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                      {CATEGORIES.map(cat => (
                          <button 
                            key={cat.id} 
                            onClick={() => setNewCat(cat.id)} 
                            className={`py-2 rounded-lg text-xs font-bold border ${newCat === cat.id ? 'bg-brand-yellow text-black border-brand-yellow' : 'bg-white/5 text-brand-muted border-white/10'}`}
                          >
                              {cat.label}
                          </button>
                      ))}
                  </div>
              </div>

              <div>
                  <label className="text-xs text-brand-muted uppercase font-bold ml-1">Ссылка на фото</label>
                  <input type="text" value={newImage} onChange={e => setNewImage(e.target.value)} className="w-full glass-input p-3 rounded-xl text-white outline-none focus:border-brand-yellow/50" placeholder="https://..." />
                  <p className="text-[10px] text-brand-muted mt-1">Скопируйте URL картинки из интернета или Telegram.</p>
              </div>

              <div className="pt-4">
                  <button onClick={handleAddSubmit} disabled={isLoading} className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold border border-white/20 flex items-center justify-center gap-2">
                      <PlusIcon className="w-5 h-5" />
                      Добавить товар
                  </button>
              </div>
          </div>
      )}

      {/* CONTENT: DELETE PRODUCT */}
      {activeTab === 'delete' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <div className="bg-red-500/5 p-4 border border-red-500/10 rounded-xl mb-4 text-xs text-red-300">
                  <p>Здесь можно удалить товары, добавленные вручную.</p>
                  <p className="font-bold mt-1">Действие необратимо.</p>
              </div>

              {customItems.length === 0 ? (
                  <div className="text-center text-brand-muted py-10 opacity-50">
                      Нет добавленных товаров
                  </div>
              ) : (
                  customItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/5">
                        <div className="flex items-center gap-3">
                            <img src={item.image} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                            <div>
                                <h4 className="font-bold text-sm text-brand-text">{item.name}</h4>
                                <p className="text-[10px] text-brand-muted">{item.variants[0].price}₽</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setDeleteId(item.id)} 
                            disabled={isLoading}
                            className="p-2 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-colors"
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                  ))
              )}
          </div>
      )}

      {/* CONTENT: REVENUE */}
      {activeTab === 'revenue' && (
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              <div className="glass-panel p-6 rounded-2xl border border-brand-yellow/20 relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-yellow/10 rounded-full blur-2xl group-hover:bg-brand-yellow/20 transition-colors"></div>
                  <h3 className="text-brand-muted text-sm font-bold uppercase tracking-widest mb-1">Выручка за сегодня</h3>
                  <div className="text-4xl font-black text-white drop-shadow-md">
                      {dailyRevenue.toLocaleString('ru-RU')} <span className="text-brand-yellow">₽</span>
                  </div>
              </div>
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

      {/* Confirmation Modal: SHIFT */}
      {showShiftConfirm && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="glass-panel p-6 rounded-3xl w-full max-w-sm shadow-2xl border border-red-500/30">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                      <div className="w-8 h-8 rounded bg-red-500 animate-pulse"></div>
                  </div>
                  <h3 className="text-xl font-bold text-center text-white mb-2">Закрыть смену?</h3>
                  <p className="text-center text-brand-muted text-sm mb-6">
                      Пользователи не смогут делать заказы. <br/> <span className="text-brand-yellow">Выручка за день обнулится.</span>
                  </p>
                  <div className="flex gap-3">
                      <button onClick={() => setShowShiftConfirm(false)} className="flex-1 py-3 rounded-xl font-bold bg-white/10 hover:bg-white/20 transition-colors">Отмена</button>
                      <button onClick={confirmCloseShift} className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white shadow-lg shadow-red-500/30 active:scale-95 transition-transform">Закрыть</button>
                  </div>
              </div>
          </div>
      )}

      {/* Confirmation Modal: DELETE PRODUCT */}
      {deleteId && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="glass-panel p-6 rounded-3xl w-full max-w-sm shadow-2xl border border-red-500/30">
                  <h3 className="text-xl font-bold text-center text-white mb-2">Удалить товар?</h3>
                  <p className="text-center text-brand-muted text-sm mb-6">
                      Товар исчезнет из меню навсегда.
                  </p>
                  <div className="flex gap-3">
                      <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl font-bold bg-white/10 hover:bg-white/20 transition-colors">Отмена</button>
                      <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white shadow-lg shadow-red-500/30 active:scale-95 transition-transform">Удалить</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminPanel;
