import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MENU_ITEMS } from './constants';
import { Category, Product, CartItem, WebAppPayload, Review } from './types';
import { HeartIcon, PlusIcon, TrashIcon, EyeSlashIcon, CheckIcon } from './components/ui/Icons';
import ItemModal from './components/ItemModal';
import AdminPanel from './components/AdminPanel';

declare global {
  interface Window {
    Telegram: any;
  }
}

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
  
  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Reviews (Placeholder for UI)
  const [reviews, setReviews] = useState<Record<string, Review[]>>({});

  // --- Effects ---
  useEffect(() => {
    // 1. Load basic local settings
    const savedFavs = localStorage.getItem('favorites');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));

    const savedReviews = localStorage.getItem('reviews');
    if (savedReviews) setReviews(JSON.parse(savedReviews));

    const savedAdmin = localStorage.getItem('isAdmin');
    if (savedAdmin === 'true') setIsAdmin(true);

    // 2. CRITICAL: Load HIDDEN ITEMS from URL (This syncs with Bot)
    // The Bot adds ?hidden=id1,id2 to the URL when opening the app
    const params = new URLSearchParams(window.location.search);
    const hiddenParam = params.get('hidden');
    
    if (hiddenParam) {
      // If URL has params, use them (Master Source)
      setHiddenItems(hiddenParam.split(','));
    } else {
       // Fallback to local storage only if URL is clean
       const savedHidden = localStorage.getItem('hiddenItems');
       if (savedHidden) setHiddenItems(JSON.parse(savedHidden));
    }

    // 3. Setup Telegram WebApp
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      try {
        tg.setHeaderColor('#fdf8f6');
        tg.setBackgroundColor('#fdf8f6');
        tg.enableClosingConfirmation();
        if (!tg.isExpanded) tg.expand();
      } catch (e) {
        console.log('TG styling failed', e);
      }
    }
  }, []);

  // --- Checkout Logic ---
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const product = MENU_ITEMS.find(p => p.id === item.productId);
      if (!product) return total;
      return total + (product.variants[item.variantIndex].price * item.quantity);
    }, 0);
  }, [cart]);

  const handleCheckout = useCallback(() => {
    if (cart.length === 0 || isSending) return;

    // VALIDATION: Minimum amount for Telegram Payments (approx 70-100 RUB required)
    if (cartTotal < 100) {
        if (window.Telegram?.WebApp?.showPopup) {
            window.Telegram.WebApp.showPopup({
                title: 'Сумма заказа',
                message: 'Минимальная сумма для онлайн-оплаты — 100₽. Пожалуйста, добавьте еще товары.',
                buttons: [{type: 'ok'}]
            });
        } else {
            alert("Минимальная сумма заказа — 100₽");
        }
        return;
    }

    setIsSending(true);

    // Prepare payload for Bot
    const payload: WebAppPayload = {
      action: 'order',
      items: cart.map(item => {
        const product = MENU_ITEMS.find(p => p.id === item.productId)!;
        const variant = product.variants[item.variantIndex];
        
        let details = variant.size;
        if (item.options.temperature) details += `, ${item.options.temperature === 'hot' ? 'Гор' : 'Хол'}`;
        if (item.options.sugar !== undefined && item.options.sugar > 0) details += `, Сахар: ${item.options.sugar}г`;
        if (item.options.cinnamon) details += `, Корица`;

        return {
          name: product.name,
          size: variant.size,
          count: item.quantity,
          price: variant.price,
          details
        };
      }),
      total: cartTotal
    };

    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      try {
        if (tg.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('success');
        }
        
        // Send data to Bot
        tg.sendData(JSON.stringify(payload));
        
        // Don't close immediately in dev mode, but in prod we close
        // setTimeout(() => tg.close(), 500); 
      } catch (e) {
        setIsSending(false);
        alert("Ошибка отправки! Запустите бота заново.");
      }
    } else {
      console.log("Order Payload:", payload);
      alert(`[Тест браузера] Заказ на ${payload.total}р сформирован.`);
      setIsSending(false);
    }
  }, [cart, cartTotal, isSending]);

  // Sync MainButton (optional, but good for backup)
  useEffect(() => {
    if (!window.Telegram?.WebApp) return;
    const tg = window.Telegram.WebApp;
    const mainBtn = tg.MainButton;

    if (isCartOpen && cart.length > 0) {
        mainBtn.setText(`ОПЛАТИТЬ ${cartTotal}₽`);
        // mainBtn.show(); 
        mainBtn.onClick(handleCheckout);
    } else {
        mainBtn.hide();
        mainBtn.offClick(handleCheckout);
    }

    return () => {
        mainBtn.offClick(handleCheckout);
    };
  }, [isCartOpen, cart.length, cartTotal, handleCheckout]);

  // Sync local storage on state change
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('hiddenItems', JSON.stringify(hiddenItems));
  }, [hiddenItems]);

  useEffect(() => {
    localStorage.setItem('isAdmin', String(isAdmin));
  }, [isAdmin]);

  // --- Logic ---
  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const addToCart = (productId: string, variantIdx: number, quantity: number, options: any) => {
    const product = MENU_ITEMS.find(p => p.id === productId);
    if (!product) return;

    const uniqueId = `${productId}-${variantIdx}-${JSON.stringify(options)}`;

    setCart(prev => {
      const existing = prev.find(item => item.uniqueId === uniqueId);
      if (existing) {
        return prev.map(item => 
          item.uniqueId === uniqueId 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { uniqueId, productId, variantIndex: variantIdx, quantity, options }];
    });
    
    if(window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
  };

  const removeFromCart = (uniqueId: string) => {
    setCart(prev => prev.filter(i => i.uniqueId !== uniqueId));
  };

  // --- Admin Save Logic (SYNC WITH BOT) ---
  const handleSaveMenuToBot = () => {
    const payload: WebAppPayload = {
      action: 'update_menu',
      hiddenItems: hiddenItems
    };

    if (window.Telegram?.WebApp) {
      // Send the list of hidden items to the bot
      // The bot will store this and append ?hidden=... to future URLs
      window.Telegram.WebApp.sendData(JSON.stringify(payload));
    } else {
      console.log("Menu Update Payload:", payload);
      alert("Меню сохранено (Тест). В Telegram бот получил бы список скрытых товаров.");
    }
  };

  // --- Admin Auth ---
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

  // --- Render ---
  const visibleItems = MENU_ITEMS.filter(item => 
    (item.category === activeCategory) && 
    (isAdmin ? true : !hiddenItems.includes(item.id))
  );

  const categories: {id: Category, label: string}[] = [
    { id: 'coffee', label: 'Кофе' },
    { id: 'tea', label: 'Чай' },
    { id: 'seasonal', label: 'Сезонное' },
    { id: 'punch', label: 'Пунши' },
    { id: 'sweets', label: 'Сладости' },
    { id: 'soda', label: 'Напитки' },
  ];

  return (
    <div className="min-h-screen pb-24 font-sans text-gray-800">
      
      {/* Header */}
      <header className="sticky top-0 z-20 bg-coffee-50/95 backdrop-blur-md shadow-sm px-4 py-3 flex justify-between items-center transition-colors">
        <div>
          <h1 
            {...handleLongPress}
            className="text-2xl font-black text-coffee-800 tracking-tight select-none cursor-pointer active:scale-95 transition-transform user-select-none"
            style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
          >
            COFFEE LUNCH
          </h1>
          <p className="text-xs text-coffee-500 font-bold">Лучший кофе в городе</p>
        </div>
        <button 
          onClick={() => {
            const favs = MENU_ITEMS.filter(i => favorites.includes(i.id));
            if (favs.length === 0) return alert("Избранное пусто");
            alert("Ваши избранные товары:\n" + favs.map(i => i.name).join(', ')); 
          }}
          className="p-2 bg-coffee-100/50 rounded-full text-coffee-500 transition-transform active:scale-90"
        >
          <HeartIcon className="w-6 h-6" fill={favorites.length > 0} />
        </button>
      </header>

      {/* Category Nav */}
      <nav className="sticky top-[60px] z-10 bg-coffee-50/95 backdrop-blur shadow-sm py-2 overflow-x-auto no-scrollbar">
        <div className="flex px-4 gap-3 min-w-max">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2 rounded-2xl text-sm font-bold transition-all ${
                activeCategory === cat.id 
                  ? 'bg-coffee-500 text-white shadow-lg scale-105' 
                  : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Product Grid */}
      <main className="p-4 grid grid-cols-2 gap-4">
        {visibleItems.map(item => (
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
                className="absolute top-2 right-2 p-1.5 bg-white/60 backdrop-blur rounded-full text-red-500 transition-transform active:scale-125"
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
              className="mt-3 w-full py-3 bg-gray-100 hover:bg-coffee-100 text-coffee-800 rounded-2xl flex items-center justify-center transition-all active:scale-95 active:bg-coffee-200 group"
            >
              <PlusIcon className="w-6 h-6 group-active:animate-bounce-short" />
            </button>
          </div>
        ))}
      </main>

      {/* Glass Cart Bar (Bottom) */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-40 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="w-full pointer-events-auto bg-coffee-500/90 backdrop-blur-md border border-white/20 text-white rounded-3xl p-4 shadow-xl flex items-center justify-between active:scale-[0.98] transition-all animate-slide-up"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 px-3 py-1 rounded-full font-bold">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </div>
              <span className="font-bold text-lg">Корзина</span>
            </div>
            <span className="font-black text-xl tracking-wide">{cartTotal}₽</span>
          </button>
        </div>
      )}

      {/* Modals */}
      {selectedProduct && (
        <ItemModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onAddToCart={(variantIdx, quantity, options) => addToCart(selectedProduct.id, variantIdx, quantity, options)}
        />
      )}

      {/* Cart Sheet */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="bg-white w-full max-w-md h-[85vh] rounded-t-3xl sm:rounded-3xl p-6 relative z-10 flex flex-col animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-900">Ваш заказ</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-500 font-bold p-2">Закрыть</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4">
              {cart.length === 0 ? (
                <div className="text-center text-gray-400 mt-10">Корзина пуста</div>
              ) : (
                cart.map((item) => {
                  const product = MENU_ITEMS.find(p => p.id === item.productId);
                  if (!product) return null;
                  const variant = product.variants[item.variantIndex];
                  return (
                    <div key={item.uniqueId} className="flex gap-4 items-start bg-gray-50 p-3 rounded-2xl">
                      <img src={product.image} className="w-16 h-16 rounded-xl object-cover" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-gray-800">{product.name}</h4>
                          <span className="font-bold text-coffee-500">{variant.price * item.quantity}₽</span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium">
                          {variant.size}
                          {item.options.temperature && ` • ${item.options.temperature === 'hot' ? 'Гор' : 'Хол'}`}
                          {item.options.sugar !== undefined && item.options.sugar > 0 && ` • Сахар ${item.options.sugar}г`}
                          {item.options.cinnamon && ` • Корица`}
                        </p>
                        <div className="flex justify-between items-center mt-2">
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
                })
              )}
            </div>

            {/* Custom Brown Button (Always Visible) */}
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

      {/* Admin Panel */}
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
