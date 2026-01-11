import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MENU_ITEMS } from './constants';
import { Category, Product, CartItem, WebAppPayload, Review, CartItemOption } from './types';
import { HeartIcon, PlusIcon, TrashIcon, EyeSlashIcon } from './components/ui/Icons';
import ItemModal from './components/ItemModal';
import AdminPanel from './components/AdminPanel';

declare global {
  interface Window {
    Telegram: any;
  }
}

// --- ICONS for Bottom Nav ---
const HomeIcon: React.FC<{ className?: string, fill?: boolean }> = ({ className, fill }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill={fill ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72m-13.5 8.65h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
  </svg>
);

const ShoppingBagIcon: React.FC<{ className?: string, fill?: boolean }> = ({ className, fill }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill={fill ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
  </svg>
);

const ArrowPathIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

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

// --- Main Component ---
const App: React.FC = () => {
  // --- State ---
  const [activeCategory, setActiveCategory] = useState<Category>('coffee');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hiddenItems, setHiddenItems] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'menu' | 'fav'>('menu');

  // Checkout State
  const [orderTimeType, setOrderTimeType] = useState<'asap' | 'scheduled'>('asap');
  const [scheduledTime, setScheduledTime] = useState('');
  const [orderComment, setOrderComment] = useState('');

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // --- Effects ---
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
        tg.setHeaderColor('#fdf8f6');
        tg.setBackgroundColor('#fdf8f6');
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
                message: 'Минимальная сумма для онлайн-оплаты — 100₽.',
                buttons: [{type: 'ok'}]
            });
        } else {
            alert("Минимальная сумма заказа — 100₽");
        }
        return;
    }

    if (orderTimeType === 'scheduled' && !scheduledTime) {
      alert("Пожалуйста, выберите время готовности");
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
        // Modifiers text generation
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

        // Calculate unit price based on total (hacky but effective for Telegram Invoice line items)
        const unitPrice = item.totalPrice / item.quantity;

        return {
          id: product.id,
          name: product.name,
          size: variant.size,
          count: item.quantity,
          price: unitPrice, // Sending calculated price including modifiers
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
      alert(`[Тест] Заказ на ${payload.total}р сформирован. Время: ${pickupTimeStr}. Коммент: ${orderComment}`);
      setIsSending(false);
    }
  }, [cart, cartTotal, isSending, orderTimeType, scheduledTime, orderComment]);

  // Storage sync
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

    // Create deep unique ID based on ALL options
    const uniqueId = `${productId}-${variantIdx}-${JSON.stringify(options)}`;

    setCart(prev => {
      const existing = prev.find(item => item.uniqueId === uniqueId);
      if (existing) {
        // Update quantity and total price
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
    <div className="min-h-screen pb-32 font-sans text-gray-800 bg-[#fdf8f6]">
      
      {/* --- HEADER --- */}
      <header className="sticky top-0 z-20 bg-[#fdf8f6]/95 backdrop-blur-md px-4 py-3 flex justify-between items-center">
        <div>
          <h1 
            {...handleLongPress}
            className="text-2xl font-black text-coffee-800 tracking-tight select-none cursor-pointer"
            style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
          >
            COFFEE LUNCH
          </h1>
          <p className="text-xs text-coffee-500 font-bold">
             {activeTab === 'menu' ? 'Лучший кофе в городе' : 'Ваше избранное'}
          </p>
        </div>
      </header>

      {/* --- CATEGORY NAV (Only in Menu Tab) --- */}
      {activeTab === 'menu' && (
        <nav className="sticky top-[56px] z-10 bg-[#fdf8f6]/95 backdrop-blur py-2 overflow-x-auto no-scrollbar border-b border-coffee-100/50">
          <div className="flex px-4 gap-2 min-w-max pb-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeCategory === cat.id 
                    ? 'bg-coffee-500 text-white shadow-md' 
                    : 'bg-white text-gray-500 border border-gray-100'
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
             <div className="col-span-2 text-center mt-20 text-gray-400 font-medium">
                 В избранном пока пусто :(
             </div>
        )}
        {displayedItems.map(item => (
          <div 
            key={item.id} 
            className={`bg-white rounded-3xl p-3 shadow-sm flex flex-col justify-between relative transition-transform ${
              hiddenItems.includes(item.id) ? 'opacity-50 grayscale' : ''
            }`}
          >
            <div className="relative mb-2">
              <img 
                src={item.image} 
                alt={item.name} 
                className="w-full aspect-square object-cover rounded-2xl"
                onClick={() => setSelectedProduct(item)} 
              />
              <button 
                onClick={(e) => toggleFavorite(e, item.id)}
                className="absolute top-2 right-2 p-1.5 bg-white/60 backdrop-blur rounded-full text-red-500 transition-transform active:scale-110"
              >
                <HeartIcon className="w-5 h-5" fill={favorites.includes(item.id)} />
              </button>
              {hiddenItems.includes(item.id) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-2xl">
                  <EyeSlashIcon className="w-8 h-8 text-white" />
                </div>
              )}
            </div>
            
            <div>
              <h3 className="font-bold text-gray-900 leading-tight mb-1 text-sm sm:text-base">{item.name}</h3>
              <p className="text-coffee-500 font-extrabold text-lg">
                {item.variants[0].price}₽
              </p>
            </div>

            <button 
              onClick={() => setSelectedProduct(item)}
              className="mt-3 w-full py-3 bg-gray-100 hover:bg-coffee-100 text-coffee-800 rounded-2xl flex items-center justify-center transition-all active:scale-95 group"
            >
              <PlusIcon className="w-6 h-6" />
            </button>
          </div>
        ))}
      </main>

      {/* --- FLOATING CART BUTTON (Above Nav) --- */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-24 left-4 right-4 z-30 animate-slide-up">
           <button 
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-coffee-800/90 backdrop-blur text-white rounded-2xl p-4 shadow-xl flex items-center justify-between active:scale-[0.98] transition-transform"
           >
             <div className="flex items-center gap-3">
               <div className="bg-white/20 px-2.5 py-1 rounded-lg font-bold text-sm">
                 {cart.reduce((a, b) => a + b.quantity, 0)}
               </div>
               <span className="font-bold">Перейти к оплате</span>
             </div>
             <span className="font-black text-lg">{cartTotal}₽</span>
           </button>
        </div>
      )}

      {/* --- BOTTOM NAVIGATION BAR --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-2 px-6 pb-6 z-40 flex justify-between items-center shadow-[0_-5px_15px_rgba(0,0,0,0.02)] safe-area-bottom">
         <button 
            onClick={() => setActiveTab('menu')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'menu' ? 'text-coffee-800' : 'text-gray-400'}`}
         >
            <HomeIcon className="w-7 h-7" fill={activeTab === 'menu'} />
            <span className="text-[10px] font-bold">Меню</span>
         </button>

         <button 
            onClick={() => setActiveTab('fav')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'fav' ? 'text-red-500' : 'text-gray-400'}`}
         >
            <HeartIcon className="w-7 h-7" fill={activeTab === 'fav'} />
            <span className="text-[10px] font-bold">Избранное</span>
         </button>
         
         <button 
            onClick={handleRefresh}
            className="flex flex-col items-center gap-1 text-gray-400 active:text-coffee-500 transition-colors"
         >
            <ArrowPathIcon className="w-7 h-7" />
            <span className="text-[10px] font-bold">Обновить</span>
         </button>

         <button 
            onClick={() => setIsCartOpen(true)}
            className={`flex flex-col items-center gap-1 transition-colors ${cart.length > 0 ? 'text-coffee-500' : 'text-gray-400'}`}
         >
            <div className="relative">
               <ShoppingBagIcon className="w-7 h-7" fill={cart.length > 0} />
               {cart.length > 0 && (
                 <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {cart.reduce((a, b) => a + b.quantity, 0)}
                 </span>
               )}
            </div>
            <span className="text-[10px] font-bold">Корзина</span>
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

      {/* Cart Sheet */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="bg-white w-full max-w-md h-[95vh] rounded-t-3xl sm:rounded-3xl p-6 relative z-10 flex flex-col animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-900">Ваш заказ</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-500 font-bold p-2">Закрыть</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4 no-scrollbar">
              {cart.length === 0 ? (
                <div className="text-center text-gray-400 mt-10">Корзина пуста</div>
              ) : (
                <>
                  {/* Cart Items */}
                  {cart.map((item) => {
                    const product = MENU_ITEMS.find(p => p.id === item.productId);
                    if (!product) return null;
                    const variant = product.variants[item.variantIndex];
                    return (
                      <div key={item.uniqueId} className="flex gap-4 items-start bg-gray-50 p-3 rounded-2xl">
                        <img src={product.image} className="w-16 h-16 rounded-xl object-cover" />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-gray-800 text-sm">{product.name}</h4>
                            <span className="font-bold text-coffee-500">{item.totalPrice}₽</span>
                          </div>
                          <p className="text-[10px] text-gray-500 font-medium leading-tight mt-1">
                            {variant.size}
                            {item.options.milk && ` • ${item.options.milk === 'lactose_free' ? 'Безлакт' : item.options.milk === 'almond' ? 'Миндаль' : item.options.milk === 'banana' ? 'Банан' : 'Кокос'}`}
                            {item.options.syrup && ` • ${item.options.syrup}`}
                            {item.options.temperature && ` • ${item.options.temperature === 'warm' ? 'Тепл' : 'Хол'}`}
                            {item.options.gas !== undefined && ` • ${item.options.gas ? 'Газ' : 'Без газа'}`}
                            {item.options.filtered && ` • Фильтр`}
                            {item.options.heat && ` • Подогреть`}
                            {item.options.cutlery && ` • +Приборы`}
                            {item.options.honey && ` • Мед`}
                            {item.options.sugar && item.options.sugar > 0 && ` • Сахар ${item.options.sugar}г`}
                            {item.options.cinnamon && ` • Корица`}
                          </p>
                          <div className="flex justify-between items-center mt-3">
                             <div className="flex items-center gap-3 bg-white px-2 rounded-lg shadow-sm border border-gray-100">
                                <span className="font-bold text-sm text-gray-600">x{item.quantity}</span>
                             </div>
                             <button onClick={() => removeFromCart(item.uniqueId)} className="text-red-400 p-1">
                               <TrashIcon className="w-5 h-5" />
                             </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* --- Order Details (Time & Comment) --- */}
                  <div className="pt-4 border-t border-dashed border-gray-200">
                    <h3 className="font-bold text-lg mb-3 text-gray-900">Детали получения</h3>
                    
                    {/* Time Selection */}
                    <div className="mb-4 bg-gray-50 p-3 rounded-2xl">
                       <div className="flex bg-white rounded-xl p-1 shadow-sm mb-3">
                         <button 
                           onClick={() => setOrderTimeType('asap')}
                           className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                             orderTimeType === 'asap' ? 'bg-coffee-500 text-white shadow' : 'text-gray-500'
                           }`}
                         >
                           Как можно скорее
                         </button>
                         <button 
                           onClick={() => setOrderTimeType('scheduled')}
                           className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                             orderTimeType === 'scheduled' ? 'bg-coffee-500 text-white shadow' : 'text-gray-500'
                           }`}
                         >
                           Ко времени
                         </button>
                       </div>
                       
                       {orderTimeType === 'scheduled' && (
                         <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-200 animate-slide-up">
                           <ClockIcon className="w-5 h-5 text-gray-400" />
                           <input 
                             type="time" 
                             value={scheduledTime}
                             onChange={(e) => setScheduledTime(e.target.value)}
                             className="flex-1 outline-none text-sm font-bold text-gray-800"
                           />
                         </div>
                       )}
                    </div>

                    {/* Comments */}
                    <div className="mb-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Пожелания бариста</label>
                      <textarea 
                        value={orderComment}
                        onChange={(e) => setOrderComment(e.target.value)}
                        placeholder="Например: поменьше льда, позвонить когда будет готово..."
                        className="w-full bg-gray-50 p-3 rounded-xl text-sm outline-none focus:ring-2 ring-coffee-500 transition-all resize-none h-20"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="pt-2 bg-white safe-area-bottom">
              <button 
                onClick={handleCheckout}
                disabled={isSending}
                className={`w-full text-white py-4 rounded-2xl font-bold text-lg shadow-lg transition-all mb-2 flex items-center justify-center gap-2 ${
                  isSending ? 'bg-coffee-500/80' : 'bg-coffee-500 active:scale-95'
                }`}
              >
                {isSending ? (
                   <>
                     <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"/>
                     Отправка...
                   </>
                ) : (
                   `Оплатить ${cartTotal}₽`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Auth Modal */}
      {showAdminAuth && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur">
          <div className="bg-white p-6 rounded-3xl w-80 shadow-2xl animate-slide-up">
            <h3 className="text-xl font-bold mb-4 text-center">Вход для админа</h3>
            <input 
              type="password" 
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Пароль"
              className="w-full p-3 bg-gray-100 rounded-xl mb-4 text-center text-lg outline-none focus:ring-2 ring-coffee-500"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowAdminAuth(false)} className="flex-1 py-3 text-gray-500 font-bold">Отмена</button>
              <button onClick={verifyAdmin} className="flex-1 py-3 bg-coffee-500 text-white rounded-xl font-bold">Войти</button>
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
