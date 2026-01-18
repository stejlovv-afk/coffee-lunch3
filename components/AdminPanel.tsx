
import React, { useState, useEffect } from 'react';
import { Category, Product, PromoCode, ProductModifiers } from '../types';
import { SearchIcon, PlusIcon, TrashIcon } from './ui/Icons';

interface AdminPanelProps {
  products: Product[]; 
  promoCodes: PromoCode[];
  hiddenItems: string[];
  onToggleHidden: (id: string) => void;
  onSaveToBot: () => void;
  onClose: () => void;
  isLoading: boolean;
  dailyRevenue: number;
  monthlyRevenue: number;
  isShiftClosed: boolean;
  onToggleShift: (isClosed: boolean) => void;
  onAddProduct: (product: any) => void;
  onEditProduct: (id: string, product: any) => void;
  onDeleteProduct: (ids: string[]) => void;
  onAddPromo: (promo: PromoCode) => void;
  onDeletePromo: (code: string) => void;
}

const CATEGORIES: {id: Category, label: string}[] = [
    { id: 'coffee', label: 'Кофе' },
    { id: 'tea', label: 'Чай' },
    { id: 'seasonal', label: 'Сезонное' },
    { id: 'punch', label: 'Пунши' },
    { id: 'soda', label: 'Напитки' },
    { id: 'fast_food', label: 'Фастфуд' },
    { id: 'combo', label: 'Комбо' },
    { id: 'hot_dishes', label: 'Горячее' },
    { id: 'soups', label: 'Супы' },
    { id: 'side_dishes', label: 'Гарниры' },
    { id: 'salads', label: 'Салаты' },
    { id: 'sweets', label: 'Сладости' },
];

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  products, promoCodes, hiddenItems, onToggleHidden, onSaveToBot, onClose, isLoading,
  dailyRevenue, monthlyRevenue, isShiftClosed, onToggleShift, onAddProduct, onEditProduct, onDeleteProduct,
  onAddPromo, onDeletePromo
}) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'editor' | 'revenue' | 'promo'>('menu');
  const [searchTerm, setSearchTerm] = useState('');
  const [editorSearchTerm, setEditorSearchTerm] = useState(''); 
  const [showShiftConfirm, setShowShiftConfirm] = useState(false);
  
  // Editor State
  const [editorMode, setEditorMode] = useState<'list' | 'form'>('list');
  const [editId, setEditId] = useState<string | null>(null);
  
  // Bulk Selection
  const [selectedDeleteIds, setSelectedDeleteIds] = useState<string[]>([]);

  // Form State
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCat, setNewCat] = useState<Category>('coffee');
  const [newImage, setNewImage] = useState('');
  const [modifiers, setModifiers] = useState<ProductModifiers>({});

  // Promo Form State
  const [promoCode, setPromoCode] = useState('');
  const [promoPercent, setPromoPercent] = useState('');
  const [promoFirstOrder, setPromoFirstOrder] = useState(false);

  // Filtered items for Menu tab
  const filteredMenuItems = products.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtered items for Editor tab
  const filteredEditorItems = products.filter(item => 
    item.name.toLowerCase().includes(editorSearchTerm.toLowerCase())
  );

  const startEdit = (product: Product) => {
      setEditId(product.id);
      setNewName(product.name);
      setNewPrice(String(product.variants[0].price));
      setNewCat(product.category);
      setNewImage(product.image);
      setModifiers(product.modifiers || {});
      setEditorMode('form');
      setActiveTab('editor');
  };

  const startAdd = () => {
      setEditId(null);
      setNewName('');
      setNewPrice('');
      setNewCat('coffee');
      setNewImage('');
      setModifiers({});
      setEditorMode('form');
      setActiveTab('editor');
  };

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

  const handleEditorSubmit = () => {
      if (!newName || !newPrice || !newImage) {
          alert("Заполните все поля");
          return;
      }
      
      const payload = {
          name: newName,
          category: newCat,
          price: Number(newPrice),
          image: newImage,
          modifiers: modifiers
      };

      if (editId) {
          onEditProduct(editId, payload);
          alert("Товар обновлен!");
      } else {
          onAddProduct(payload);
          alert("Товар добавлен!");
      }
      setEditorMode('list');
  };

  const handleDelete = (id: string) => {
      if (confirm("Удалить этот товар?")) {
          onDeleteProduct([id]);
          setEditorMode('list');
      }
  };

  const handleBulkDelete = () => {
      if (selectedDeleteIds.length === 0) return;
      if (confirm(`Удалить выбранные товары (${selectedDeleteIds.length})?`)) {
          onDeleteProduct(selectedDeleteIds);
          setSelectedDeleteIds([]);
      }
  };

  const toggleSelectId = (id: string) => {
      setSelectedDeleteIds(prev => 
          prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
  };

  const handleAddPromoSubmit = () => {
      if (!promoCode || !promoPercent) {
          alert("Заполните код и процент");
          return;
      }
      onAddPromo({
          code: promoCode.toUpperCase().trim(),
          discountPercent: Number(promoPercent),
          firstOrderOnly: promoFirstOrder
      });
      setPromoCode('');
      setPromoPercent('');
      setPromoFirstOrder(false);
      alert("Промокод добавлен!");
  };

  const toggleModifier = (key: keyof ProductModifiers, value: any) => {
      setModifiers(prev => ({...prev, [key]: value}));
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

        {/* Shift Status */}
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
        <div className="flex bg-black/40 p-1 rounded-xl mb-4 overflow-x-auto no-scrollbar gap-1">
            <button onClick={() => setActiveTab('menu')} className={`flex-1 min-w-[60px] py-2 rounded-lg text-[10px] font-bold transition-all ${activeTab === 'menu' ? 'bg-white/10 text-brand-yellow shadow-md' : 'text-brand-muted'}`}>Меню</button>
            <button onClick={() => setActiveTab('editor')} className={`flex-1 min-w-[60px] py-2 rounded-lg text-[10px] font-bold transition-all ${activeTab === 'editor' ? 'bg-white/10 text-brand-yellow shadow-md' : 'text-brand-muted'}`}>Редактор</button>
            <button onClick={() => setActiveTab('promo')} className={`flex-1 min-w-[60px] py-2 rounded-lg text-[10px] font-bold transition-all ${activeTab === 'promo' ? 'bg-white/10 text-brand-yellow shadow-md' : 'text-brand-muted'}`}>Промо</button>
            <button onClick={() => setActiveTab('revenue')} className={`flex-1 min-w-[60px] py-2 rounded-lg text-[10px] font-bold transition-all ${activeTab === 'revenue' ? 'bg-white/10 text-brand-yellow shadow-md' : 'text-brand-muted'}`}>Выручка</button>
        </div>
      </div>
      
      {/* TAB: MENU */}
      {activeTab === 'menu' && (
        <>
            <div className="px-4 pb-2">
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

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {filteredMenuItems.map((item) => {
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

      {/* TAB: EDITOR (List + Form) */}
      {activeTab === 'editor' && (
          <div className="flex-1 overflow-y-auto p-4">
              {editorMode === 'list' ? (
                  <div className="space-y-4">
                      <div className="flex gap-2 mb-2">
                          <button onClick={startAdd} className="flex-1 py-3 bg-brand-yellow text-black rounded-xl font-bold flex items-center justify-center gap-2">
                              <PlusIcon className="w-5 h-5" /> Добавить
                          </button>
                          {selectedDeleteIds.length > 0 && (
                              <button onClick={handleBulkDelete} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 animate-fade-in">
                                  <TrashIcon className="w-5 h-5" /> Удалить ({selectedDeleteIds.length})
                              </button>
                          )}
                      </div>

                      <div className="relative mb-4">
                        <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-brand-muted" />
                        <input 
                            type="text" 
                            placeholder="Поиск для редактирования..." 
                            value={editorSearchTerm}
                            onChange={(e) => setEditorSearchTerm(e.target.value)}
                            className="w-full glass-input rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-yellow/50"
                        />
                      </div>
                      
                      <h3 className="text-white font-bold text-lg mb-2">Все товары</h3>
                      {filteredEditorItems.length === 0 ? <div className="text-center text-brand-muted text-sm py-4">Товары не найдены</div> : (
                          <div className="space-y-2 pb-10">
                              {filteredEditorItems.map(item => (
                                  <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${selectedDeleteIds.includes(item.id) ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/5'}`}>
                                      <div className="flex items-center gap-3 overflow-hidden flex-1">
                                          {/* Checkbox for Bulk Select */}
                                          <div onClick={() => toggleSelectId(item.id)} className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors ${selectedDeleteIds.includes(item.id) ? 'bg-red-500 border-red-500' : 'border-white/20'}`}>
                                              {selectedDeleteIds.includes(item.id) && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                                          </div>
                                          <img src={item.image} className="w-10 h-10 rounded-full object-cover flex-shrink-0" onClick={() => startEdit(item)} />
                                          <div className="min-w-0" onClick={() => startEdit(item)}><h4 className="font-bold text-sm text-white truncate">{item.name}</h4><p className="text-xs text-brand-muted">{item.variants[0].price}₽</p></div>
                                      </div>
                                      <div className="flex gap-2 flex-shrink-0">
                                          <button onClick={() => startEdit(item)} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">✏️</button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              ) : (
                  <div className="space-y-4 pb-10">
                      <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-bold text-lg">{editId ? 'Редактирование' : 'Новый товар'}</h3>
                          <button onClick={() => setEditorMode('list')} className="text-sm text-brand-muted">Назад</button>
                      </div>
                      
                      <div><label className="text-xs text-brand-muted uppercase font-bold ml-1">Название</label><input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full glass-input p-3 rounded-xl text-white outline-none" placeholder="Название" /></div>
                      <div><label className="text-xs text-brand-muted uppercase font-bold ml-1">Цена (₽)</label><input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} className="w-full glass-input p-3 rounded-xl text-white outline-none" placeholder="150" /></div>
                      <div>
                          <label className="text-xs text-brand-muted uppercase font-bold ml-1">Категория</label>
                          <div className="grid grid-cols-2 gap-2 mt-1">
                              {CATEGORIES.map(cat => (
                                  <button key={cat.id} onClick={() => setNewCat(cat.id)} className={`py-2 rounded-lg text-xs font-bold border ${newCat === cat.id ? 'bg-brand-yellow text-black border-brand-yellow' : 'bg-white/5 text-brand-muted border-white/10'}`}>{cat.label}</button>
                              ))}
                          </div>
                      </div>
                      <div><label className="text-xs text-brand-muted uppercase font-bold ml-1">Фото (URL)</label><input type="text" value={newImage} onChange={e => setNewImage(e.target.value)} className="w-full glass-input p-3 rounded-xl text-white outline-none" placeholder="https://..." /></div>

                      {/* --- OPTIONS CHECKBOXES --- */}
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                          <h4 className="text-xs font-bold text-brand-yellow uppercase tracking-wider mb-2">Опции товара</h4>
                          
                          <div className="flex items-center justify-between">
                              <span className="text-sm text-white">Молоко</span>
                              <input type="checkbox" checked={modifiers.hasMilk || false} onChange={e => toggleModifier('hasMilk', e.target.checked)} className="accent-brand-yellow w-5 h-5" />
                          </div>
                          <div className="flex items-center justify-between">
                              <span className="text-sm text-white">Сироп</span>
                              <input type="checkbox" checked={modifiers.hasSyrup || false} onChange={e => toggleModifier('hasSyrup', e.target.checked)} className="accent-brand-yellow w-5 h-5" />
                          </div>
                          <div className="flex items-center justify-between">
                              <span className="text-sm text-white">Сахар</span>
                              <input type="checkbox" checked={modifiers.hasSugar || false} onChange={e => toggleModifier('hasSugar', e.target.checked)} className="accent-brand-yellow w-5 h-5" />
                          </div>
                          <div className="flex items-center justify-between">
                              <span className="text-sm text-white">Корица</span>
                              <input type="checkbox" checked={modifiers.hasCinnamon || false} onChange={e => toggleModifier('hasCinnamon', e.target.checked)} className="accent-brand-yellow w-5 h-5" />
                          </div>
                          <div className="flex items-center justify-between">
                              <span className="text-sm text-white">Можно Соус</span>
                              <input type="checkbox" checked={modifiers.hasSauce || false} onChange={e => toggleModifier('hasSauce', e.target.checked)} className="accent-brand-yellow w-5 h-5" />
                          </div>
                          <div className="flex items-center justify-between">
                              <span className="text-sm text-white">Можно Температуру</span>
                              <input type="checkbox" checked={modifiers.hasTemp || false} onChange={e => toggleModifier('hasTemp', e.target.checked)} className="accent-brand-yellow w-5 h-5" />
                          </div>
                          <div className="flex items-center justify-between">
                              <span className="text-sm text-white">Нужны приборы</span>
                              <input type="checkbox" checked={modifiers.needsCutlery || false} onChange={e => toggleModifier('needsCutlery', e.target.checked)} className="accent-brand-yellow w-5 h-5" />
                          </div>
                          
                          <div>
                              <span className="text-sm text-white block mb-1">Разогрев</span>
                              <div className="flex bg-black/40 rounded-lg p-1">
                                  <button onClick={() => toggleModifier('heatingType', 'none')} className={`flex-1 py-1 text-xs rounded ${(!modifiers.heatingType || modifiers.heatingType === 'none') ? 'bg-white/20 text-white' : 'text-brand-muted'}`}>Нет</button>
                                  <button onClick={() => toggleModifier('heatingType', 'simple')} className={`flex-1 py-1 text-xs rounded ${modifiers.heatingType === 'simple' ? 'bg-brand-yellow text-black' : 'text-brand-muted'}`}>Да/Нет</button>
                                  <button onClick={() => toggleModifier('heatingType', 'advanced')} className={`flex-1 py-1 text-xs rounded ${modifiers.heatingType === 'advanced' ? 'bg-orange-500 text-white' : 'text-brand-muted'}`}>Гриль/СВЧ</button>
                              </div>
                          </div>
                      </div>

                      <div className="pt-4 flex gap-2">
                          {editId && <button onClick={() => handleDelete(editId)} className="flex-1 py-3 bg-red-500/10 text-red-400 rounded-xl font-bold border border-red-500/20">Удалить</button>}
                          <button onClick={handleEditorSubmit} disabled={isLoading} className="flex-[2] py-3 bg-brand-yellow text-black rounded-xl font-bold shadow-lg">Сохранить</button>
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* TAB: PROMO */}
      {activeTab === 'promo' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div className="space-y-4 border-b border-white/5 pb-6">
                  <h3 className="text-white font-bold text-lg">Создать промокод</h3>
                  <div><label className="text-xs text-brand-muted uppercase font-bold ml-1">Код</label><input type="text" value={promoCode} onChange={e => setPromoCode(e.target.value)} className="w-full glass-input p-3 rounded-xl text-white outline-none uppercase" placeholder="SALE2024" /></div>
                  <div><label className="text-xs text-brand-muted uppercase font-bold ml-1">Скидка (%)</label><input type="number" value={promoPercent} onChange={e => setPromoPercent(e.target.value)} className="w-full glass-input p-3 rounded-xl text-white outline-none" placeholder="10" /></div>
                  <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="text-sm font-bold text-white">Только первый заказ?</span>
                      <button onClick={() => setPromoFirstOrder(!promoFirstOrder)} className={`w-12 h-6 rounded-full transition-colors relative border border-white/10 ${promoFirstOrder ? 'bg-brand-yellow/80' : 'bg-black/40'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${promoFirstOrder ? 'left-7' : 'left-1'}`} />
                      </button>
                  </div>
                  <button onClick={handleAddPromoSubmit} disabled={isLoading} className="w-full py-3 bg-brand-yellow text-black rounded-xl font-bold shadow-lg flex items-center justify-center gap-2">Сохранить</button>
              </div>

              <div>
                  <h3 className="text-white font-bold text-lg mb-3">Активные промокоды</h3>
                  {promoCodes.length === 0 ? <div className="text-center text-brand-muted text-sm">Список пуст</div> : (
                      <div className="space-y-2">
                          {promoCodes.map(p => (
                             <div key={p.code} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                 <div>
                                     <h4 className="font-bold text-brand-yellow tracking-wider">{p.code}</h4>
                                     <div className="text-[10px] text-brand-muted flex gap-2">
                                         <span>-{p.discountPercent}%</span>
                                         {p.firstOrderOnly && <span className="text-blue-400">• Только первый</span>}
                                     </div>
                                 </div>
                                 <button onClick={() => onDeletePromo(p.code)} disabled={isLoading} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"><TrashIcon className="w-4 h-4" /></button>
                             </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* TAB: REVENUE */}
      {activeTab === 'revenue' && (
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              <div className="glass-panel p-6 rounded-2xl border border-brand-yellow/20 relative overflow-hidden group">
                  <h3 className="text-brand-muted text-sm font-bold uppercase tracking-widest mb-1">Выручка за сегодня</h3>
                  <div className="text-4xl font-black text-white drop-shadow-md">{dailyRevenue.toLocaleString('ru-RU')} <span className="text-brand-yellow">₽</span></div>
              </div>
               <div className="glass-panel p-6 rounded-2xl border border-purple-500/20 relative overflow-hidden group">
                  <h3 className="text-brand-muted text-sm font-bold uppercase tracking-widest mb-1">Выручка за месяц</h3>
                  <div className="text-4xl font-black text-white drop-shadow-md">{monthlyRevenue.toLocaleString('ru-RU')} <span className="text-purple-400">₽</span></div>
              </div>
          </div>
      )}

      {/* Confirmation Modals */}
      {showShiftConfirm && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="glass-panel p-6 rounded-3xl w-full max-w-sm shadow-2xl border border-red-500/30">
                  <h3 className="text-xl font-bold text-center text-white mb-2">Закрыть смену?</h3>
                  <div className="flex gap-3"><button onClick={() => setShowShiftConfirm(false)} className="flex-1 py-3 rounded-xl font-bold bg-white/10 hover:bg-white/20">Отмена</button><button onClick={confirmCloseShift} className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white">Закрыть</button></div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminPanel;
