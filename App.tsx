import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MENU_ITEMS } from './constants';
import { Category, Product, CartItem, WebAppPayload, CartItemOption } from './types';
import { HeartIcon, PlusIcon, TrashIcon, EyeSlashIcon } from './components/ui/Icons';
import ItemModal from './components/ItemModal';
import AdminPanel from './components/AdminPanel';

declare global {
  interface Window {
    Telegram: any;
  }
}

// --- iOS Style Icons (Thinner stroke) ---
const HomeIcon: React.FC<{ className?: string, fill?: boolean }> = ({ className, fill }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill={fill ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72m-13.5 8.65h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
  </svg>
);

const ShoppingBagIcon: React.FC<{ className?: string, fill?: boolean }> = ({ className, fill }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill={fill ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
  </svg>
);

const ArrowPathIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

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

const App: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<Category>('coffee');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hiddenItems, setHiddenItems] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'menu' | 'fav'>('menu');
  const [orderTimeType, setOrderTimeType] = useState<'asap' | 'scheduled'>('asap');
  const [scheduledTime, setScheduledTime] = useState('');
  const [orderComment, setOrderComment] = useState('');

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Scrolled state for Header transparency effect
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const savedFavs = localStorage.getItem('favorites');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));

    const savedAdmin = localStorage.getItem('isAdmin');
    if (savedAdmin === 'true') setIsAdmin(true);

    const params = new URLSearchParams(window.location.search);
    const hiddenParam = params.get('hidden');
    
    if (hiddenParam !== null) {
      if (hiddenParam === '') {
          setHiddenItems([]); 
      } else {
          setHiddenItems(hiddenParam.split(','));
      }
    } else {
       const savedHidden = localStorage.getItem('hiddenItems');
       if (savedHidden) setHiddenItems(JSON.parse(savedHidden));
    }

    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      try {
        tg.setHeaderColor('#F2F2F7'); // Match iOS bg
        tg.setBackgroundColor('#F2F2F7');
        tg.enableClosingConfirmation();
      } catch (e) {
        console.log('TG styling failed', e);
      }
    }
  }, []);

  const handleRefresh = () => {
     if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.sendData(JSON.stringify({ action: 'refresh_menu' }));
        setTimeout(() => window.Telegram.WebApp.close(), 100);
     } else {
        window.location.reload();
     }
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.totalPrice, 0);
  }, [cart]);

  const handleCheckout = useCallback(() => {
    if (cart.length === 0 || isSending) return;

    if (cartTotal < 100) {
        if (window.Telegram?.WebApp?.showPopup) {
            window.Telegram.WebApp.showPopup({
                title: 'Сумма заказа',
                message: 'Минимальная сумма — 100₽.',
                buttons: [{type: 'ok'}]
            });
        } else {
            alert("Минимальная сумма заказа — 100₽");
        }
        return;
    }

    if (orderTimeType === 'scheduled' && !scheduledTime) {
      alert("Выберите время");
      return;
    }

    setIsSending(true);

    const pickupTimeStr = orderTimeType === 'asap' ? 'Как можно скорее' : scheduledTime;

    const payload: WebAppPayload = {
      action: 'order',
      items: cart.map(item => {
        const product = MENU_ITEMS.find(p => p.id === item.productId)!;
        const variant = product.variants[item.variantIndex];
        
        let details = variant.size;
        if (item.options.temperature) details += `, ${item.options.temperature === 'warm' ? 'Теплый' : 'Холодный'}`;
        if (item.options.gas !== undefined) details += `, ${item.options.gas ? 'Газ' : 'Без газа'}`;
        if (item.options.milk) {
            const milkLabels: Record<string, string> = { banana: 'Банан', coconut: 'Кокос', lactose_free: 'Безлакт', almond: 'Миндаль' };
            details += `, Мол: ${milkLabels[item.options.milk] || 'Альтерн'}`;
        }
        if (item.options.syrup) details += `, Сироп: ${item.options.syrup}`;
        if (item.options.honey) details += `, +Мед`;
        if (item.options.filtered) details += `, Фильтр`;
        if (item.options.heat) details += `, Подогреть`;
        if (item.options.cutlery) details += `, +Приборы`;
        if (item.options.sugar && item.options.sugar > 0) details += `, Сахар: ${item.options.sugar}г`;
        if (item.options.cinnamon) details += `, Корица`;

        const unitPrice = item.totalPrice / item.quantity;

        return {
          id: product.id,
          name: product.name,
          size: variant.size,
          count: item.quantity,
          price: unitPrice, 
          details
        };
      }),
      total: cartTotal,
      pickupTime: pickupTimeStr,
      comment: orderComment
    };

    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      try {
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        tg.sendData(JSON.stringify(payload));
      } catch (e) {
        setIsSending(false);
        alert("Ошибка отправки! Запустите бота заново.");
      }
    } else {
      console.log("Order Payload:", payload);
      alert(`[Тест] Заказ на ${payload.total}р сформирован.`);
      setIsSending(false);
    }
  }, [cart, cartTotal, isSending, orderTimeType, scheduledTime, orderComment]);

  useEffect(() => { localStorage.setItem('favorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('hiddenItems', JSON.stringify(hiddenItems)); }, [hiddenItems]);
  useEffect(() => { localStorage.setItem('isAdmin', String(isAdmin)); }, [isAdmin]);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const addToCart = (productId: string, variantIdx: number, quantity: number, options: CartItemOption, totalPrice: number) => {
    const product = MENU_ITEMS.find(p => p.id === productId);
    if (!product) return;

    const uniqueId = `${productId}-${variantIdx}-${JSON.stringify(options)}`;

    setCart(prev => {
      const existing = prev.find(item => item.uniqueId === uniqueId);
      if (existing) {
        return prev.map(item => 
          item.uniqueId === uniqueId 
            ? { ...item, quantity: item.quantity + quantity, totalPrice: item.totalPrice + totalPrice }
            : item
        );
      }
      return [...prev, { uniqueId, productId, variantIndex: variantIdx, quantity, options, totalPrice }];
    });
    
    if(window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
  };

  const removeFromCart = (uniqueId: string) => {
    setCart(prev => prev.filter(i => i.uniqueId !== uniqueId));
  };

  const handleSaveMenuToBot = () => {
    const payload: WebAppPayload = {
      action: 'update_menu',
      hiddenItems: hiddenItems
    };
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.sendData(JSON.stringify(payload));
      setTimeout(() => window.Telegram.WebApp.close(), 100);
    }
  };

  const handleLongPress = useLongPress(() => {
    setShowAdminAuth(true);
    if(window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
    }
  });

  const verifyAdmin = () => {
    if (adminPassword === '7654') {
      setIsAdmin(true);
      setShowAdminPanel(true);
      setShowAdminAuth(false);
      setAdminPassword('');
    } else {
      alert('Неверный пароль');
    }
  };

  const visibleItems = MENU_ITEMS.filter(item => 
    (item.category === activeCategory) && 
    (isAdmin ? true : !hiddenItems.includes(item.id))
  );

  const categories: {id: Category, label: string}[] = [
    { id: 'coffee', label: 'Кофе' },
    { id: 'tea', label: 'Чай' },
    { id: 'seasonal', label: 'Сезонное' },
    { id: 'sandwiches', label: 'Сэндвичи' },
    { id: 'hot', label: 'Горячее' },
    { id: 'salads', label: 'Салаты' },
    { id: 'punch', label: 'Пунши' },
    { id: 'sweets', label: 'Сладости' },
    { id: 'soda', label: 'Напитки' },
  ];

  const displayedItems = activeTab === 'menu' 
    ? visibleItems 
    : MENU_ITEMS.filter(item => favorites.includes(item.id));

  return (
    <div className="min-h-screen pb-24 font-sans text-ios-text bg-ios-bg selection:bg-coffee-accent selection:text-black">
      
      {/* --- HEADER (Large Title + Glass) --- */}
      <header className={`sticky top-0 z-20 px-4 pt-10 pb-2 transition-all duration-300 ${isScrolled ? 'glass-panel' : ''}`}>
        <div className="flex justify-between items-end mb-2">
          <div className="flex flex-col">
            <h1 
              {...handleLongPress}
              className={`font-bold tracking-tight text-coffee-primary transition-all duration-300 ${isScrolled ? 'text-xl text-center w-full absolute left-0' : 'text-3xl'}`}
            >
              Coffee Lunch
            </h1>
            <span className={`text-ios-hint font-medium text-sm transition-opacity duration-300 ${isScrolled ? 'opacity-0 h-0' : 'opacity-100'}`}>
              {activeTab === 'menu' ? 'Меню' : 'Избранное'}
            </span>
          </div>
        </div>
      </header>

      {/* --- CATEGORY PILLS --- */}
      {activeTab === 'menu' && (
        <nav className={`sticky z-10 py-2 overflow-x-auto no-scrollbar transition-all duration-300 ${isScrolled ? 'top-[50px] glass-panel' : 'top-[100px] bg-ios-bg'}`}>
          <div className="flex px-4 gap-2 min-w-max pb-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-5 py-2.5 rounded-full text-[15px] font-semibold transition-all active:scale-95 ${
                  activeCategory === cat.id 
                    ? 'bg-coffee-primary text-white shadow-lg' 
                    : 'bg-white text-ios-hint'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* --- PRODUCT GRID --- */}
      <main className="p-4 grid grid-cols-2 gap-4">
        {displayedItems.length === 0 && activeTab === 'fav' && (
             <div className="col-span-2 flex flex-col items-center justify-center mt-20 text-ios-hint font-medium opacity-60">
                 <HeartIcon className="w-12 h-12 mb-2" />
                 <p>В избранном пусто</p>
             </div>
        )}
        {displayedItems.map(item => (
          <div 
            key={item.id} 
            onClick={() => setSelectedProduct(item)}
            className={`bg-white rounded-[24px] p-0 shadow-ios flex flex-col relative active:scale-press transition-transform duration-200 overflow-hidden group ${
              hiddenItems.includes(item.id) ? 'opacity-60 grayscale' : ''
            }`}
          >
            <div className="relative w-full aspect-square">
              <img 
                src={item.image} 
                alt={item.name} 
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <button 
                onClick={(e) => toggleFavorite(e, item.id)}
                className="absolute top-2.5 right-2.5 w-9 h-9 flex items-center justify-center bg-white/70 backdrop-blur-md rounded-full text-red-500 shadow-sm transition-transform active:scale-90 z-10"
              >
                <HeartIcon className="w-5 h-5" fill={favorites.includes(item.id)} />
              </button>
              {hiddenItems.includes(item.id) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                  <EyeSlashIcon className="w-10 h-10 text-white drop-shadow-md" />
                </div>
              )}
            </div>
            
            <div className="p-3.5 flex flex-col flex-1">
              <div className="flex-1">
                 <h3 className="font-semibold text-coffee-primary text-[15px] leading-snug mb-1">{item.name}</h3>
                 <p className="text-ios-hint text-xs line-clamp-2">{item.description}</p>
              </div>
              
              <div className="flex justify-between items-end mt-3">
                <span className="text-[17px] font-bold text-coffee-primary">
                  {item.variants[0].price}₽
                </span>
                <div className="w-8 h-8 rounded-full bg-coffee-accent text-coffee-primary flex items-center justify-center shadow-sm">
                   <PlusIcon className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* --- CART FLOATING BUTTON --- */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-24 left-4 right-4 z-30 animate-slide-up">
           <button 
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-coffee-primary/95 backdrop-blur text-white rounded-[20px] p-4 shadow-xl flex items-center justify-between active:scale-[0.98] transition-transform"
           >
             <div className="flex items-center gap-3">
               <div className="bg-coffee-accent text-coffee-primary px-3 py-1 rounded-full font-bold text-sm">
                 {cart.reduce((a, b) => a + b.quantity, 0)}
               </div>
               <span className="font-semibold text-[17px]">Оформить заказ</span>
             </div>
             <span className="font-bold text-[17px]">{cartTotal}₽</span>
           </button>
        </div>
      )}

      {/* --- TAB BAR (Glassmorphism) --- */}
      <div className="fixed bottom-0 left-0 right-0 glass-tabbar pb-[env(safe-area-inset-bottom)] pt-2 px-6 z-40 flex justify-between items-center h-[88px]">
         <button 
            onClick={() => setActiveTab('menu')}
            className={`flex flex-col items-center gap-1 transition-all w-16 ${activeTab === 'menu' ? 'text-coffee-primary' : 'text-ios-hint'}`}
         >
            <HomeIcon className="w-6 h-6" fill={activeTab === 'menu'} />
            <span className="text-[10px] font-medium">Меню</span>
         </button>

         <button 
            onClick={() => setActiveTab('fav')}
            className={`flex flex-col items-center gap-1 transition-all w-16 ${activeTab === 'fav' ? 'text-coffee-primary' : 'text-ios-hint'}`}
         >
            <HeartIcon className="w-6 h-6" fill={activeTab === 'fav'} />
            <span className="text-[10px] font-medium">Избранное</span>
         </button>
         
         <button 
            onClick={handleRefresh}
            className="flex flex-col items-center gap-1 text-ios-hint active:text-coffee-primary transition-all w-16"
         >
            <ArrowPathIcon className="w-6 h-6" />
            <span className="text-[10px] font-medium">Обновить</span>
         </button>

         <button 
            onClick={() => setIsCartOpen(true)}
            className={`flex flex-col items-center gap-1 transition-all w-16 ${cart.length > 0 ? 'text-coffee-primary' : 'text-ios-hint'}`}
         >
            <div className="relative">
               <ShoppingBagIcon className="w-6 h-6" fill={cart.length > 0} />
               {cart.length > 0 && (
                 <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-[#fdf8f6]">
                    {cart.reduce((a, b) => a + b.quantity, 0)}
                 </span>
               )}
            </div>
            <span className="text-[10px] font-medium">Корзина</span>
         </button>
      </div>

      {/* --- MODALS --- */}
      {selectedProduct && (
        <ItemModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onAddToCart={(variantIdx, quantity, options, totalPrice) => 
            addToCart(selectedProduct.id, variantIdx, quantity, options, totalPrice)
          }
        />
      )}

      {/* --- CART SHEET --- */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity" onClick={() => setIsCartOpen(false)} />
          <div className="bg-ios-bg w-full h-[92vh] rounded-t-[32px] relative z-10 flex flex-col animate-slide-up shadow-2xl overflow-hidden">
            
            {/* Grabber */}
            <div className="w-full h-8 flex items-center justify-center bg-ios-bg pt-3 pb-1" onClick={() => setIsCartOpen(false)}>
                <div className="w-10 h-1.5 rounded-full bg-gray-300"></div>
            </div>

            <div className="px-6 pb-4 flex justify-between items-center bg-ios-bg border-b border-gray-200">
              <h2 className="text-[28px] font-bold text-coffee-primary">Корзина</h2>
              <button onClick={() => setIsCartOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-ios-hint">
                    <ShoppingBagIcon className="w-16 h-16 opacity-20 mb-4" />
                    <p className="text-lg font-medium">Корзина пуста</p>
                </div>
              ) : (
                <>
                  {cart.map((item) => {
                    const product = MENU_ITEMS.find(p => p.id === item.productId);
                    if (!product) return null;
                    const variant = product.variants[item.variantIndex];
                    return (
                      <div key={item.uniqueId} className="flex gap-4 items-start bg-white p-4 rounded-[20px] shadow-sm">
                        <img src={product.image} className="w-16 h-16 rounded-[14px] object-cover bg-gray-100" />
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-semibold text-coffee-primary">{product.name}</h4>
                            <span className="font-semibold text-coffee-primary">{item.totalPrice}₽</span>
                          </div>
                          <p className="text-[13px] text-gray-500 leading-snug mb-3">
                            {variant.size}
                            {item.options.milk && ` • ${item.options.milk}`}
                            {item.options.syrup && ` • ${item.options.syrup}`}
                            {item.options.heat && ` • Подогреть`}
                            {item.options.cutlery && ` • Приборы`}
                            {item.options.sugar > 0 && ` • Сахар ${item.options.sugar}г`}
                          </p>
                          <div className="flex justify-between items-center">
                             <div className="flex items-center gap-3 bg-gray-100 px-3 py-1 rounded-[10px]">
                                <span className="font-semibold text-sm text-gray-800">x{item.quantity}</span>
                             </div>
                             <button onClick={() => removeFromCart(item.uniqueId)} className="text-red-400 p-2 active:opacity-50">
                               <TrashIcon className="w-5 h-5" />
                             </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="mt-8">
                    <h3 className="font-bold text-xl mb-4 text-coffee-primary px-2">Детали заказа</h3>
                    
                    <div className="bg-white rounded-[20px] p-4 shadow-sm mb-4">
                       <div className="flex bg-gray-100/80 p-1 rounded-[12px] mb-4 relative">
                         <button 
                           onClick={() => setOrderTimeType('asap')}
                           className={`flex-1 py-2 text-[13px] font-semibold rounded-[10px] transition-all z-10 ${
                             orderTimeType === 'asap' ? 'bg-white shadow-sm text-black' : 'text-gray-500'
                           }`}
                         >
                           Как можно скорее
                         </button>
                         <button 
                           onClick={() => setOrderTimeType('scheduled')}
                           className={`flex-1 py-2 text-[13px] font-semibold rounded-[10px] transition-all z-10 ${
                             orderTimeType === 'scheduled' ? 'bg-white shadow-sm text-black' : 'text-gray-500'
                           }`}
                         >
                           Ко времени
                         </button>
                       </div>
                       
                       {orderTimeType === 'scheduled' && (
                         <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-[14px] border border-gray-100 animate-slide-up">
                           <ClockIcon className="w-5 h-5 text-gray-400" />
                           <input 
                             type="time" 
                             value={scheduledTime}
                             onChange={(e) => setScheduledTime(e.target.value)}
                             className="flex-1 outline-none bg-transparent text-base font-semibold text-coffee-primary"
                           />
                         </div>
                       )}
                    </div>

                    <div className="bg-white rounded-[20px] p-4 shadow-sm">
                      <label className="block text-[13px] font-semibold text-gray-400 uppercase tracking-wide mb-2 pl-1">Комментарий</label>
                      <textarea 
                        value={orderComment}
                        onChange={(e) => setOrderComment(e.target.value)}
                        placeholder="Пожелания к заказу..."
                        className="w-full bg-gray-50 p-3 rounded-[14px] text-[15px] outline-none border border-transparent focus:bg-white focus:border-coffee-accent transition-all resize-none h-24"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 bg-white border-t border-gray-100 safe-area-bottom">
              <button 
                onClick={handleCheckout}
                disabled={isSending}
                className={`w-full text-coffee-primary py-4 rounded-[18px] font-bold text-[17px] shadow-lg transition-all flex items-center justify-center gap-2 ${
                  isSending ? 'bg-coffee-accent/50' : 'bg-coffee-accent active:scale-[0.98]'
                }`}
              >
                {isSending ? (
                   <>
                     <span className="animate-spin h-5 w-5 border-2 border-coffee-primary border-t-transparent rounded-full"/>
                     Отправка...
                   </>
                ) : (
                   `Оплатить Apple Pay ${cartTotal}₽`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdminAuth && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-[24px] w-80 shadow-2xl animate-slide-up">
            <h3 className="text-xl font-bold mb-6 text-center text-coffee-primary">Вход в Админку</h3>
            <input 
              type="password" 
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Пароль"
              className="w-full p-4 bg-gray-100 rounded-[16px] mb-4 text-center text-lg outline-none focus:ring-2 ring-coffee-accent"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowAdminAuth(false)} className="flex-1 py-3 text-gray-500 font-semibold rounded-[14px] bg-gray-50">Отмена</button>
              <button onClick={verifyAdmin} className="flex-1 py-3 bg-coffee-primary text-white rounded-[14px] font-semibold">Войти</button>
            </div>
          </div>
        </div>
      )}

      {showAdminPanel && (
        <AdminPanel 
          hiddenItems={hiddenItems}
          onToggleHidden={(id) => setHiddenItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
          onSaveToBot={handleSaveMenuToBot}
          onClose={() => setShowAdminPanel(false)}
        />
      )}
    </div>
  );
};

export default App;
