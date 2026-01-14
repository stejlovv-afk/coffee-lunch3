import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MENU_ITEMS } from './constants';
import { Category, Product, CartItem, WebAppPayload, Review } from './types';
import { HeartIcon, PlusIcon, TrashIcon, EyeSlashIcon, ClockIcon, ChatIcon, HomeIcon, SearchIcon, CartIcon, SparklesIcon } from './components/ui/Icons';
import ItemModal from './components/ItemModal';
import AdminPanel from './components/AdminPanel';
import AIChatModal from './components/AIChatModal';

declare global {
  interface Window {
    Telegram: any;
  }
}

// Maps for Labels
const MILK_LABELS: Record<string, string> = {
  banana: 'Банановое молоко', coconut: 'Кокосовое молоко', almond: 'Миндальное молоко', 
  lactose_free: 'Безлактозное молоко'
};

const SYRUP_LABELS: Record<string, string> = {
    pistachio: 'Фисташка', hazelnut: 'Лесной орех', coconut_syrup: 'Кокос сироп', almond_syrup: 'Миндаль сироп',
    red_orange: 'Красный апельсин', strawberry: 'Клубника', peach: 'Персик', melon: 'Дыня', plum: 'Слива',
    apple: 'Яблоко', raspberry: 'Малина', cherry: 'Вишня', lavender: 'Лаванда', gingerbread: 'Имбирный пряник',
    lemongrass: 'Лемонграсс', popcorn: 'Попкорн', mint: 'Мята', bubblegum: 'Баблгам', salted_caramel: 'Соленая карамель'
};

// --- Helper Hook for Long Press ---
function useLongPress(callback: () => void, ms = 1500) {
  const [startLongPress, setStartLongPress] = useState(false);
  const timerId = useRef<any>(undefined);

  useEffect(() => {
    if (startLongPress) {
      timerId.current = setTimeout(callback, ms);
    } else {
      clearTimeout(timerId.current);
    }
    return () => clearTimeout(timerId.current);
  }, [startLongPress, callback, ms]);

  return {
    onMouseDown: () => setStartLongPress(true),
    onMouseUp: () => setStartLongPress(false),
    onMouseLeave: () => setStartLongPress(false),
    onTouchStart: () => setStartLongPress(true),
    onTouchEnd: () => setStartLongPress(false),
  };
}

const getDefaultTime = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 15);
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const getAddonPrice = (type: 'milk' | 'syrup', variantSize: string) => {
  let sizeLevel = 0; 
  if (variantSize.includes('350')) sizeLevel = 1;
  if (variantSize.includes('450')) sizeLevel = 2;
  if (type === 'milk') return 70 + (sizeLevel * 10);
  if (type === 'syrup') return 30 + (sizeLevel * 10);
  return 0;
};

type ViewState = 'menu' | 'search' | 'favorites' | 'cart';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('menu');
  const [activeCategory, setActiveCategory] = useState<Category>('coffee');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hiddenItems, setHiddenItems] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // AI Chat State
  const [showAIChat, setShowAIChat] = useState(false);

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // Checkout State
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [pickupTime, setPickupTime] = useState(getDefaultTime());
  const [comment, setComment] = useState('');
  const [username, setUsername] = useState<string>('');

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // --- Init ---
  useEffect(() => {
    const savedFavs = localStorage.getItem('favorites');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
    const savedAdmin = localStorage.getItem('isAdmin');
    if (savedAdmin === 'true') setIsAdmin(true);

    const params = new URLSearchParams(window.location.search);
    const hiddenParam = params.get('hidden');
    if (hiddenParam !== null) {
      if (hiddenParam === '') setHiddenItems([]); 
      else setHiddenItems(hiddenParam.split(','));
    } else {
       const savedHidden = localStorage.getItem('hiddenItems');
       if (savedHidden) setHiddenItems(JSON.parse(savedHidden));
    }

    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      try {
        tg.setHeaderColor('#09090b'); // Matches brand-dark
        tg.setBackgroundColor('#09090b');
        tg.enableClosingConfirmation();
        
        // Get user data
        const user = tg.initDataUnsafe?.user;
        if (user) {
            const userStr = user.username ? `@${user.username}` : `${user.first_name}`;
            setUsername(userStr);
        }
      } catch (e) {
        console.log('TG styling failed', e);
      }
    }
  }, []);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const product = MENU_ITEMS.find(p => p.id === item.productId);
      if (!product) return total;
      
      const variant = product.variants[item.variantIndex];
      let price = variant.price;
      
      if (item.options.milk && item.options.milk !== 'none') price += getAddonPrice('milk', variant.size);
      if (item.options.syrup && item.options.syrup !== 'none') price += getAddonPrice('syrup', variant.size);

      return total + (price * item.quantity);
    }, 0);
  }, [cart]);

  // --- Checkout ---
  const handleCheckout = useCallback(() => {
    if (cart.length === 0 || isSending) return;

    if (cartTotal < 100) {
        if (window.Telegram?.WebApp?.showPopup) {
            window.Telegram.WebApp.showPopup({ title: 'Сумма заказа', message: 'Минимальная сумма — 100₽.', buttons: [{type: 'ok'}] });
        } else {
            alert("Минимальная сумма — 100₽");
        }
        return;
    }

    setIsSending(true);

    const payload: WebAppPayload = {
      action: 'order',
      items: cart.map((item, index) => {
        const product = MENU_ITEMS.find(p => p.id === item.productId)!;
        const variant = product.variants[item.variantIndex];
        
        let details = variant.size;
        
        if (item.options.temperature) details += `, ${item.options.temperature === 'hot' ? 'Горячий' : 'Холодный'}`;
        if (item.options.milk && MILK_LABELS[item.options.milk]) details += `, ${MILK_LABELS[item.options.milk]}`;
        if (item.options.syrup && SYRUP_LABELS[item.options.syrup]) details += `, Сироп: ${SYRUP_LABELS[item.options.syrup]}`;
        if (item.options.sugar !== undefined && item.options.sugar > 0) details += `, Сахар: ${item.options.sugar}г`;
        if (item.options.cinnamon) details += `, Корица`;
        if (item.options.juice) details += `, Сок: ${item.options.juice === 'orange' ? 'Апельсин' : 'Вишня'}`;
        if (item.options.gas !== undefined) details += `, ${item.options.gas ? 'С газом' : 'Без газа'}`;
        if (item.options.matchaColor) details += `, Цвет: ${item.options.matchaColor === 'green' ? 'Зеленая' : 'Синяя'}`;
        if (item.options.honey) details += `, С мёдом`;
        if (item.options.filter !== undefined) details += `, ${item.options.filter ? 'Профильтровать' : 'С ягодами'}`;
        if (item.options.cutlery) details += `, С приборами`;
        if (item.options.heating && item.options.heating !== 'none') {
            details += `, Греть: ${item.options.heating === 'grill' ? 'Гриль' : 'СВЧ'}`;
        }

        // HACK: Add Order Info to the first item description to ensure the admin sees it 
        if (index === 0) {
            details += `\n[Инфо: ${pickupTime}, ${comment || 'без коммент'}, ${username}]`;
        }

        let finalPrice = variant.price;
        if (item.options.milk && item.options.milk !== 'none') finalPrice += getAddonPrice('milk', variant.size);
        if (item.options.syrup && item.options.syrup !== 'none') finalPrice += getAddonPrice('syrup', variant.size);

        return {
          name: product.name,
          size: variant.size,
          count: item.quantity,
          price: finalPrice,
          details
        };
      }),
      total: cartTotal,
      deliveryMethod,
      pickupTime,
      comment,
      username 
    };

    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.sendData(JSON.stringify(payload));
    } else {
      console.log("Order Payload:", payload);
      alert(`[Тест] Заказ отправлен.`);
      setIsSending(false);
    }
  }, [cart, cartTotal, isSending, deliveryMethod, pickupTime, comment, username]);

  // Sync Telegram Button
  useEffect(() => {
    if (!window.Telegram?.WebApp) return;
    const tg = window.Telegram.WebApp;
    const mainBtn = tg.MainButton;

    // Show MainButton only in Cart View
    if (currentView === 'cart' && cart.length > 0) {
        mainBtn.setText(`ОПЛАТИТЬ ${cartTotal}₽`);
        mainBtn.textColor = "#000000";
        mainBtn.color = "#FACC15"; 
        mainBtn.isVisible = true;
        mainBtn.onClick(handleCheckout);
    } else {
        mainBtn.isVisible = false;
        mainBtn.offClick(handleCheckout);
    }
    return () => { mainBtn.offClick(handleCheckout); };
  }, [currentView, cart.length, cartTotal, handleCheckout]);

  useEffect(() => { localStorage.setItem('favorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('hiddenItems', JSON.stringify(hiddenItems)); }, [hiddenItems]);
  useEffect(() => { localStorage.setItem('isAdmin', String(isAdmin)); }, [isAdmin]);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const addToCart = (productId: string, variantIdx: number, quantity: number, options: any) => {
    const product = MENU_ITEMS.find(p => p.id === productId);
    if (!product) return;
    const uniqueId = `${productId}-${variantIdx}-${JSON.stringify(options)}`;
    setCart(prev => {
      const existing = prev.find(item => item.uniqueId === uniqueId);
      if (existing) {
        return prev.map(item => item.uniqueId === uniqueId ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { uniqueId, productId, variantIndex: variantIdx, quantity, options }];
    });
    if(window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
  };

  const removeFromCart = (uniqueId: string) => {
    setCart(prev => prev.filter(i => i.uniqueId !== uniqueId));
  };

  const handleSaveMenuToBot = () => {
    setIsSending(true);
    const payload: WebAppPayload = { action: 'update_menu', hiddenItems: hiddenItems };
    if (window.Telegram?.WebApp) window.Telegram.WebApp.sendData(JSON.stringify(payload));
    else setIsSending(false);
  };

  const handleLongPress = useLongPress(() => setShowAdminAuth(true));
  const verifyAdmin = () => {
    if (adminPassword === '7654') {
      setIsAdmin(true);
      setShowAdminPanel(true);
      setShowAdminAuth(false);
      setAdminPassword('');
    } else alert('Неверный пароль');
  };

  const renderProductGrid = (items: Product[]) => (
    <div className="p-4 grid grid-cols-2 gap-4 pb-32">
        {items.map(item => (
          <div key={item.id} className={`glass-panel rounded-3xl p-3 flex flex-col justify-between relative transition-all active:scale-[0.98] ${hiddenItems.includes(item.id) ? 'opacity-50 grayscale' : ''}`}>
            {/* Glossy Overlay */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none opacity-50"></div>
            
            <div className="relative mb-3 group z-10">
              <img src={item.image} alt={item.name} className="w-full aspect-square object-cover rounded-2xl shadow-lg brightness-90 group-hover:brightness-110 transition-all" onClick={() => setSelectedProduct(item)} />
              <button onClick={(e) => toggleFavorite(e, item.id)} className="absolute top-2 right-2 p-2 bg-black/40 backdrop-blur-md rounded-full text-brand-yellow transition-transform active:scale-125 hover:bg-black/60 border border-white/10">
                <HeartIcon className="w-5 h-5" fill={favorites.includes(item.id)} />
              </button>
              {hiddenItems.includes(item.id) && <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl backdrop-blur-sm"><EyeSlashIcon className="w-8 h-8 text-white" /></div>}
            </div>
            
            <div onClick={() => setSelectedProduct(item)} className="z-10 relative">
              <h3 className="font-bold text-white leading-tight mb-1 text-sm sm:text-base line-clamp-2 min-h-[2.5em] drop-shadow-sm">{item.name}</h3>
              <p className="text-brand-yellow font-black text-lg drop-shadow-md">{item.variants[0].price}₽</p>
            </div>
            
            <button onClick={() => setSelectedProduct(item)} className="z-10 mt-3 w-full py-3 bg-white/10 hover:bg-brand-yellow hover:text-black border border-white/10 text-white rounded-2xl flex items-center justify-center transition-all active:scale-95 group backdrop-blur-sm shadow-inner">
              <PlusIcon className="w-6 h-6 group-active:rotate-90 transition-transform" />
            </button>
          </div>
        ))}
        {items.length === 0 && <div className="col-span-2 text-center text-brand-muted py-10">Товары не найдены</div>}
    </div>
  );

  const categories: {id: Category, label: string}[] = [
    { id: 'coffee', label: 'Кофе' },
    { id: 'tea', label: 'Чай' },
    { id: 'seasonal', label: 'Сезонное' },
    { id: 'punch', label: 'Пунши' },
    { id: 'salads', label: 'Салаты' },
    { id: 'food', label: 'Еда' },
    { id: 'sweets', label: 'Сладости' },
    { id: 'soda', label: 'Напитки' },
  ];

  return (
    <div className="min-h-screen font-sans text-brand-text selection:bg-brand-yellow selection:text-black">
      
      {/* --- HEADER --- */}
      <header className="sticky top-0 z-20 bg-brand-dark/70 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex justify-between items-center transition-colors">
        <div>
          <h1 {...handleLongPress} className="text-2xl font-black text-brand-yellow tracking-tighter select-none cursor-pointer italic drop-shadow-glow">COFFEE LUNCH</h1>
          <p className="text-[10px] text-brand-muted font-bold tracking-widest uppercase opacity-80">Best Coffee In Town</p>
        </div>
        
        <div className="flex items-center gap-2">
            {/* AI CHAT BUTTON */}
            <button 
                onClick={() => setShowAIChat(true)}
                className="p-2 bg-gradient-to-tr from-brand-yellow to-yellow-200 text-black rounded-full shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-pulse hover:animate-none active:scale-90 transition-transform"
            >
                <SparklesIcon className="w-5 h-5" />
            </button>
            
            {username && <div className="text-xs font-bold text-brand-muted/80 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-md hidden sm:block">{username}</div>}
        </div>
      </header>

      {/* --- VIEWS --- */}
      
      {/* VIEW: MENU */}
      {currentView === 'menu' && (
        <>
            <nav className="sticky top-[61px] z-10 bg-brand-dark/80 backdrop-blur-lg py-3 overflow-x-auto no-scrollbar border-b border-transparent shadow-lg">
                <div className="flex px-4 gap-2 min-w-max">
                {categories.map(cat => (
                    <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${activeCategory === cat.id ? 'bg-brand-yellow text-black border-brand-yellow shadow-[0_0_15px_rgba(250,204,21,0.4)] scale-105' : 'bg-white/5 text-brand-muted border-white/5 hover:bg-white/10 hover:border-white/20'}`}>
                    {cat.label}
                    </button>
                ))}
                </div>
            </nav>
            {renderProductGrid(MENU_ITEMS.filter(item => (item.category === activeCategory) && (isAdmin ? true : !hiddenItems.includes(item.id))))}
        </>
      )}

      {/* VIEW: SEARCH */}
      {currentView === 'search' && (
        <div className="p-4">
             <div className="relative mb-6">
                <SearchIcon className="absolute left-4 top-3.5 w-5 h-5 text-brand-muted" />
                <input 
                    type="text" 
                    placeholder="Поиск по меню..." 
                    autoFocus
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full glass-input rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-yellow/50 focus:ring-1 focus:ring-brand-yellow/50 transition-all shadow-lg"
                />
            </div>
            {renderProductGrid(MENU_ITEMS.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()) && (isAdmin ? true : !hiddenItems.includes(item.id))))}
        </div>
      )}

      {/* VIEW: FAVORITES */}
      {currentView === 'favorites' && (
        <div className="pt-4">
            <h2 className="px-4 text-xl font-bold text-white mb-4 drop-shadow-md">Избранное</h2>
            {renderProductGrid(MENU_ITEMS.filter(item => favorites.includes(item.id)))}
        </div>
      )}

      {/* VIEW: CART */}
      {currentView === 'cart' && (
        <div className="p-4 pb-32 animate-fade-in">
            <h2 className="text-2xl font-black text-white uppercase italic mb-6 drop-shadow-md">Корзина</h2>
            
            {/* Delivery Switcher */}
            <div className="glass-panel p-1.5 rounded-2xl flex mb-6">
                 <button onClick={() => setDeliveryMethod('pickup')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${deliveryMethod === 'pickup' ? 'bg-brand-yellow text-black shadow-lg' : 'text-brand-muted hover:text-white'}`}>Самовывоз</button>
                 <button onClick={() => alert("Доставка появится позже!")} className="flex-1 py-3 rounded-xl font-bold text-sm text-brand-muted/50 cursor-not-allowed flex flex-col items-center justify-center leading-none"><span>Доставка</span><span className="text-[9px] mt-0.5 opacity-60">скоро</span></button>
            </div>

            {/* Inputs */}
            <div className="space-y-4 mb-6">
                <div className="glass-panel p-4 rounded-2xl">
                   <label className="flex items-center gap-2 text-sm font-bold text-brand-muted mb-2"><ClockIcon className="w-4 h-4" />Время готовности</label>
                   <input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className="w-full glass-input text-white p-3 rounded-xl outline-none focus:border-brand-yellow/50 focus:ring-1 focus:ring-brand-yellow/50 transition-all [color-scheme:dark]" />
                </div>
                <div className="glass-panel p-4 rounded-2xl">
                   <label className="flex items-center gap-2 text-sm font-bold text-brand-muted mb-2"><ChatIcon className="w-4 h-4" />Комментарий</label>
                   <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Погорячее, поменьше льда..." rows={2} className="w-full glass-input text-white p-3 rounded-xl outline-none focus:border-brand-yellow/50 focus:ring-1 focus:ring-brand-yellow/50 transition-all resize-none placeholder:text-brand-muted/50" />
                </div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-brand-muted opacity-50"><div className="text-4xl mb-2">🛒</div><p>Корзина пуста</p></div>
              ) : (
                cart.map((item) => {
                  const product = MENU_ITEMS.find(p => p.id === item.productId);
                  if (!product) return null;
                  const variant = product.variants[item.variantIndex];
                  let itemPrice = variant.price;
                  if (item.options.milk && item.options.milk !== 'none') itemPrice += getAddonPrice('milk', variant.size);
                  if (item.options.syrup && item.options.syrup !== 'none') itemPrice += getAddonPrice('syrup', variant.size);
                  
                  return (
                    <div key={item.uniqueId} className="flex gap-4 items-start glass-panel p-3 rounded-2xl">
                      <img src={product.image} className="w-16 h-16 rounded-xl object-cover shadow-md" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start"><h4 className="font-bold text-white text-sm drop-shadow-sm">{product.name}</h4><span className="font-bold text-brand-yellow drop-shadow-sm">{itemPrice * item.quantity}₽</span></div>
                        <p className="text-[10px] text-brand-muted font-medium mt-1 leading-tight">
                          {variant.size}
                          {item.options.temperature && ` • ${item.options.temperature === 'hot' ? 'Горячий' : 'Холодный'}`}
                          {item.options.milk && MILK_LABELS[item.options.milk] ? ` • ${MILK_LABELS[item.options.milk]}` : ''}
                          {item.options.syrup && SYRUP_LABELS[item.options.syrup] ? ` • ${SYRUP_LABELS[item.options.syrup]}` : ''}
                          {item.options.juice ? ` • Сок ${item.options.juice}` : ''}
                        </p>
                        <div className="flex justify-between items-center mt-3">
                           <div className="flex items-center gap-3 bg-black/40 px-2 py-1 rounded-lg border border-white/5"><span className="font-bold text-xs text-white">x{item.quantity}</span></div>
                           <button onClick={() => removeFromCart(item.uniqueId)} className="text-red-400 p-2 hover:bg-red-900/20 rounded-lg transition-colors"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Custom Pay Button (Visible if not in TG) */}
            {!window.Telegram?.WebApp && (
                 <div className="pt-8 pb-4">
                    <button onClick={handleCheckout} disabled={isSending} className={`w-full text-black py-4 rounded-2xl font-bold text-lg shadow-[0_0_20px_rgba(250,204,21,0.2)] transition-all mb-2 flex items-center justify-center gap-2 ${isSending ? 'bg-brand-yellow/50 cursor-not-allowed' : 'bg-brand-yellow active:scale-95 hover:bg-yellow-300'}`}>
                        {isSending ? 'Отправка...' : `Оплатить ${cartTotal}₽`}
                    </button>
                 </div>
            )}
        </div>
      )}

      {/* --- BOTTOM NAVIGATION --- */}
      <div className="fixed bottom-0 left-0 right-0 glass-modal safe-area-bottom px-6 py-3 flex justify-between items-center z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/10">
         <button onClick={() => setCurrentView('menu')} className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${currentView === 'menu' ? 'text-brand-yellow drop-shadow-glow' : 'text-brand-muted hover:text-white'}`}>
            <HomeIcon className="w-6 h-6" fill={currentView === 'menu'} />
            <span className="text-[10px] font-bold">Меню</span>
         </button>
         <button onClick={() => setCurrentView('search')} className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${currentView === 'search' ? 'text-brand-yellow drop-shadow-glow' : 'text-brand-muted hover:text-white'}`}>
            <SearchIcon className="w-6 h-6" />
            <span className="text-[10px] font-bold">Поиск</span>
         </button>
         <button onClick={() => setCurrentView('favorites')} className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${currentView === 'favorites' ? 'text-brand-yellow drop-shadow-glow' : 'text-brand-muted hover:text-white'}`}>
            <HeartIcon className="w-6 h-6" fill={currentView === 'favorites'} />
            <span className="text-[10px] font-bold">Избр.</span>
         </button>
         <button onClick={() => setCurrentView('cart')} className={`flex flex-col items-center gap-1 relative transition-all active:scale-90 ${currentView === 'cart' ? 'text-brand-yellow drop-shadow-glow' : 'text-brand-muted hover:text-white'}`}>
            <div className="relative">
                <CartIcon className="w-6 h-6" fill={currentView === 'cart'} />
                {cart.length > 0 && <span className="absolute -top-1 -right-2 bg-brand-yellow text-black text-[10px] font-black px-1.5 rounded-full min-w-[16px] flex items-center justify-center shadow-sm">{cart.reduce((a,b)=>a+b.quantity,0)}</span>}
            </div>
            <span className="text-[10px] font-bold">Корзина</span>
         </button>
      </div>

      {selectedProduct && <ItemModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddToCart={(variantIdx, quantity, options) => addToCart(selectedProduct.id, variantIdx, quantity, options)} />}
      
      {showAIChat && <AIChatModal onClose={() => setShowAIChat(false)} onSelectProduct={(product) => setSelectedProduct(product)} />}
      
      {showAdminAuth && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-xl"><div className="glass-panel p-6 rounded-3xl w-80 shadow-2xl animate-slide-up"><h3 className="text-xl font-bold mb-4 text-center text-white">Вход для админа</h3><input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Пароль" className="w-full p-3 glass-input text-white rounded-xl mb-4 text-center text-lg outline-none focus:ring-2 ring-brand-yellow/50" /><div className="flex gap-2"><button onClick={() => setShowAdminAuth(false)} className="flex-1 py-3 text-brand-muted font-bold hover:text-white transition-colors">Отмена</button><button onClick={verifyAdmin} className="flex-1 py-3 bg-brand-yellow text-black rounded-xl font-bold shadow-lg">Войти</button></div></div></div>}
      {showAdminPanel && <AdminPanel hiddenItems={hiddenItems} onToggleHidden={(id) => setHiddenItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])} onSaveToBot={handleSaveMenuToBot} onClose={() => setShowAdminPanel(false)} isLoading={isSending} />}
    </div>
  );
};

export default App;
