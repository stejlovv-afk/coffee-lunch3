// ... (imports remain the same)
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MENU_ITEMS, MILK_LABELS, SYRUP_LABELS, SAUCE_LABELS, getAddonPrice } from './constants';
import { Category, Product, CartItem, WebAppPayload, PromoCode } from './types';
import { HeartIcon, PlusIcon, TrashIcon, EyeSlashIcon, ClockIcon, ChatIcon, HomeIcon, SearchIcon, CartIcon, SparklesIcon, XMarkIcon } from './components/ui/Icons';
import ItemModal from './components/ItemModal';
import AdminPanel from './components/AdminPanel';
import AIChat from './components/AIChat';

// ИСПРАВЛЕНИЕ: Удалено дублирующее объявление типов для window.Telegram, которое ломало сборку.
// Типы уже есть в файле vite-env.d.ts

const useLongPress = (callback: () => void, ms = 1000) => {
  const timeoutRef = useRef<any>(null);
  const start = () => { timeoutRef.current = setTimeout(callback, ms); };
  const stop = () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  return { onMouseDown: start, onMouseUp: stop, onMouseLeave: stop, onTouchStart: start, onTouchEnd: stop };
};

const getDefaultTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 15);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};

type ViewState = 'menu' | 'search' | 'favorites' | 'cart';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('menu');
  const [activeCategory, setActiveCategory] = useState<Category>('coffee');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hiddenItems, setHiddenItems] = useState<string[]>([]);
  const [inventory, setInventory] = useState<Record<string, number>>({}); 

  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const [showAiChat, setShowAiChat] = useState(false);
  const [showDevNotice, setShowDevNotice] = useState(() => {
      if (typeof window !== 'undefined') return !localStorage.getItem('hasSeenDevNotice');
      return true;
  });
  const [showAiTooltip, setShowAiTooltip] = useState(true);

  const [allProducts, setAllProducts] = useState<Product[]>(MENU_ITEMS);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [usedPromoCodes, setUsedPromoCodes] = useState<string[]>([]); 

  const [dailyRevenue, setDailyRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [isShiftClosed, setIsShiftClosed] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [pickupTime, setPickupTime] = useState(getDefaultTime());
  const [comment, setComment] = useState('');
  const [username, setUsername] = useState<string>('');
  
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState('');

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // --- Init ---
  useEffect(() => {
    // 1. Load LocalStorage
    const savedFavs = localStorage.getItem('favorites');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
    const savedAdmin = localStorage.getItem('isAdmin');
    if (savedAdmin === 'true') setIsAdmin(true);

    // 2. Parse URL Params
    const params = new URLSearchParams(window.location.search);
    
    // Hidden Items (param 'h' or 'hidden')
    const hiddenParam = params.get('h') || params.get('hidden');
    if (hiddenParam !== null) {
      if (hiddenParam === '') setHiddenItems([]); 
      else setHiddenItems(hiddenParam.split(','));
    }

    // Inventory (param 'i' or 'inv')
    const invParam = params.get('i') || params.get('inv');
    if (invParam) {
        try {
            const invMap: Record<string, number> = {};
            invParam.split('~').forEach(pair => {
                const [id, qty] = pair.split(':');
                if (id && qty !== undefined) invMap[id] = Number(qty);
            });
            setInventory(invMap);
        } catch (e) { console.error("Inv parse error", e); }
    }

    // Stats
    setDailyRevenue(Number(params.get('d') || 0));
    setMonthlyRevenue(Number(params.get('m') || 0));
    setIsShiftClosed(params.get('cl') === '1' || params.get('closed') === 'true');
    
    const usedPromosParam = params.get('u');
    if (usedPromosParam) setUsedPromoCodes(usedPromosParam.split(','));

    const deletedParam = params.get('del');
    const deletedItems = deletedParam ? deletedParam.split(',') : [];

    // 3. Custom Items Merging
    const customParam = params.get('c');
    let mergedProducts = [...MENU_ITEMS];

    // Remove deleted items first from static list
    if (deletedItems.length > 0) {
        mergedProducts = mergedProducts.filter(p => !deletedItems.includes(p.id));
    }

    if (customParam) {
        try {
            const rawItems = decodeURIComponent(customParam).split('~');
            const customProducts: Product[] = rawItems.map(s => {
                // Structure: id|name|category|price|image|modsBase64
                const parts = s.split('|');
                if (parts.length < 4) return null;
                const [id, name, cat, priceStr, img, modsBase64] = parts;
                
                let modifiers = {};
                if (modsBase64) {
                    try {
                        modifiers = JSON.parse(atob(modsBase64));
                    } catch (e) { }
                }

                return {
                    id,
                    name,
                    category: cat as Category,
                    price: Number(priceStr),
                    image: img || '', // Handle empty img
                    isDrink: ['coffee','tea','punch','seasonal','soda'].includes(cat as Category),
                    isCustom: true,
                    variants: [{ size: 'порция', price: Number(priceStr) }],
                    modifiers: modifiers
                };
            }).filter(Boolean) as Product[];
            
            // Merge logic: Replace static item if ID matches, else add
            customProducts.forEach(cp => {
                // Check if we already have this ID (either static or prev custom)
                const existingIndex = mergedProducts.findIndex(p => p.id === cp.id);
                
                if (existingIndex !== -1) {
                    // It exists (likely a static item being overridden)
                    const staticItem = mergedProducts[existingIndex];
                    
                    mergedProducts[existingIndex] = {
                        ...cp,
                        // If no image provided in custom param, fallback to static image
                        image: cp.image || staticItem.image
                    };
                } else {
                    // New item
                    mergedProducts.push(cp);
                }
            });
            
        } catch(e) { console.error("Custom Items parse error", e); }
    }

    // Final filter again just in case a deleted item was re-added incorrectly? No, deleted list wins.
    mergedProducts = mergedProducts.filter(p => !deletedItems.includes(p.id));

    setAllProducts(mergedProducts);

    // 4. Promo Codes
    const promoParam = params.get('p');
    if (promoParam) {
        try {
            const rawPromos = decodeURIComponent(promoParam).split('~');
            const parsedPromos: PromoCode[] = rawPromos.map(s => {
                const parts = s.split('|');
                if (parts.length < 3) return null;
                return {
                    code: parts[0],
                    discountPercent: Number(parts[1]),
                    firstOrderOnly: parts[2] === '1'
                };
            }).filter(Boolean) as PromoCode[];
            setPromoCodes(parsedPromos);
        } catch(e) { console.error("Promo parse error", e); }
    }

    // 5. Telegram Init
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      try {
        tg.setHeaderColor('#09090b');
        tg.setBackgroundColor('#09090b');
        tg.enableClosingConfirmation();
        const user = tg.initDataUnsafe?.user;
        if (user) {
            const userStr = user.username ? `@${user.username}` : `${user.first_name}`;
            setUsername(userStr);
        }
      } catch (e) {}
    }
  }, []);

  const rawTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const product = allProducts.find(p => p.id === item.productId);
      if (!product) return total;
      
      const variant = product.variants[item.variantIndex];
      let price = variant.price;
      
      if (item.options.milk && item.options.milk !== 'none') price += getAddonPrice('milk', variant.size);
      if (item.options.syrup && item.options.syrup !== 'none') price += getAddonPrice('syrup', variant.size);
      if (item.options.sauce) price += getAddonPrice('sauce', variant.size);

      return total + (price * item.quantity);
    }, 0);
  }, [cart, allProducts]);

  const discountAmount = useMemo(() => {
      if (!appliedPromo) return 0;
      return Math.round((rawTotal * appliedPromo.discountPercent) / 100);
  }, [rawTotal, appliedPromo]);

  const finalTotal = rawTotal - discountAmount;

  const handleApplyPromo = () => {
      const code = promoInput.toUpperCase().trim();
      const found = promoCodes.find(p => p.code === code);
      
      if (!found) {
          setPromoError('Неверный код');
          setAppliedPromo(null);
          return;
      }
      
      if (found.firstOrderOnly && usedPromoCodes.includes(found.code)) {
          setPromoError('Вы уже использовали этот промокод');
          setAppliedPromo(null);
          return;
      }

      setAppliedPromo(found);
      setPromoError('');
      setPromoInput(''); 
      if(window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
  };

  const removePromo = () => {
      setAppliedPromo(null);
      setPromoInput('');
      setPromoError('');
  };

  // --- Checkout ---
  const handleCheckout = useCallback(() => {
    if (cart.length === 0 || isSending) return;

    if (finalTotal < 1) { 
         alert("Сумма заказа слишком мала");
         return;
    }

    setIsSending(true);

    const payload: WebAppPayload = {
      action: 'order',
      items: cart.map((item, index) => {
        const product = allProducts.find(p => p.id === item.productId)!;
        const variant = product.variants[item.variantIndex];
        
        let details = variant.size;
        
        if (item.options.temperature) details += `, ${item.options.temperature === 'hot' ? 'Горячий' : 'Холодный'}`;
        if (item.options.milk && MILK_LABELS[item.options.milk]) details += `, ${MILK_LABELS[item.options.milk]}`;
        if (item.options.syrup && SYRUP_LABELS[item.options.syrup]) details += `, Сироп: ${SYRUP_LABELS[item.options.syrup]}`;
        if (item.options.sauce && SAUCE_LABELS[item.options.sauce]) details += `, Соус: ${SAUCE_LABELS[item.options.sauce]}`;
        if (item.options.sugar !== undefined && item.options.sugar > 0) details += `, Сахар: ${item.options.sugar}г`;
        if (item.options.cinnamon) details += `, Корица`;
        if (item.options.juice) details += `, Сок: ${item.options.juice === 'orange' ? 'Апельсин' : 'Вишня'}`;
        if (item.options.gas !== undefined) details += `, ${item.options.gas ? 'С газом' : 'Без газа'}`;
        if (item.options.matchaColor) details += `, Цвет: ${item.options.matchaColor === 'green' ? 'Зеленая' : 'Синяя'}`;
        if (item.options.honey) details += `, С мёдом`;
        if (item.options.filter !== undefined) details += `, ${item.options.filter ? 'Профильтровать' : 'С ягодами'}`;
        if (item.options.cutlery) details += `, С приборами`;
        if (item.options.heating && item.options.heating !== 'none') {
            if (item.options.heating === 'yes') details += `, Подогреть`;
            else details += `, Греть: ${item.options.heating === 'grill' ? 'Гриль' : 'СВЧ'}`;
        }
        
        if (item.options.hotDogSausage) details += `, Сосиска: ${item.options.hotDogSausage === 'pork' ? 'Свиная' : 'Говяжья'}`;
        if (item.options.hotDogOnion !== undefined) details += `, ${item.options.hotDogOnion ? 'С луком' : 'Без лука'}`;
        if (item.options.hotDogSauces && item.options.hotDogSauces.length > 0) {
            const sauceNames = item.options.hotDogSauces.map(s => SAUCE_LABELS[s]).join(', ');
            details += `, Соусы: ${sauceNames}`;
        }
        
        if (item.options.tonicType) details += `, Тоник: ${item.options.tonicType === 'classic' ? 'Классический' : 'Гранатовый'}`;

        if (index === 0) {
            details += `\n[Инфо: ${pickupTime}, ${comment || 'без коммент'}, ${username}]`;
        }

        let finalPrice = variant.price;
        if (item.options.milk && item.options.milk !== 'none') finalPrice += getAddonPrice('milk', variant.size);
        if (item.options.syrup && item.options.syrup !== 'none') finalPrice += getAddonPrice('syrup', variant.size);
        if (item.options.sauce) finalPrice += getAddonPrice('sauce', variant.size);

        return {
          name: product.name,
          size: variant.size,
          count: item.quantity,
          price: finalPrice,
          details
        };
      }),
      total: finalTotal,
      deliveryMethod,
      pickupTime,
      comment,
      username,
      promoCode: appliedPromo?.code,
      discountAmount: discountAmount
    };

    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.sendData(JSON.stringify(payload));
    } else {
      console.log("Order Payload:", payload);
      alert(`[Тест] Заказ отправлен.`);
      setIsSending(false);
    }
  }, [cart, finalTotal, isSending, deliveryMethod, pickupTime, comment, username, allProducts, appliedPromo, discountAmount]);

  useEffect(() => {
    if (!window.Telegram?.WebApp) return;
    const tg = window.Telegram.WebApp;
    const mainBtn = tg.MainButton;

    if (currentView === 'cart' && cart.length > 0 && !isShiftClosed) {
        mainBtn.setText(`ОПЛАТИТЬ ${finalTotal}₽`);
        mainBtn.textColor = "#000000";
        mainBtn.color = "#FACC15"; 
        mainBtn.isVisible = true;
        mainBtn.onClick(handleCheckout);
    } else {
        mainBtn.isVisible = false;
        mainBtn.offClick(handleCheckout);
    }
    return () => { mainBtn.offClick(handleCheckout); };
  }, [currentView, cart.length, finalTotal, handleCheckout, isShiftClosed]);

  useEffect(() => { localStorage.setItem('favorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('hiddenItems', JSON.stringify(hiddenItems)); }, [hiddenItems]);
  useEffect(() => { localStorage.setItem('isAdmin', String(isAdmin)); }, [isAdmin]);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const addToCart = (productId: string, variantIdx: number, quantity: number, options: any) => {
    if (isShiftClosed) return; 
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const stock = inventory[productId];
    if (stock !== undefined) {
         const currentInCart = cart.filter(i => i.productId === productId).reduce((acc, i) => acc + i.quantity, 0);
         if (currentInCart + quantity > stock) {
             alert(`Доступно всего ${stock} шт.`);
             return;
         }
    }

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

  // --- ADMIN ACTIONS ---
  const handleSaveMenuToBot = () => {
    setIsSending(true);
    const payload: WebAppPayload = { action: 'update_menu', hiddenItems: hiddenItems, inventory: inventory };
    if (window.Telegram?.WebApp) window.Telegram.WebApp.sendData(JSON.stringify(payload));
    else { console.log('Mock Send:', payload); setIsSending(false); }
  };

  const handleToggleShift = (closed: boolean) => {
      setIsSending(true);
      const payload: WebAppPayload = { action: 'toggle_shift', isClosed: closed };
      if (window.Telegram?.WebApp) window.Telegram.WebApp.sendData(JSON.stringify(payload));
      else { setIsShiftClosed(closed); setIsSending(false); }
  };

  const handleAddProduct = (payload: any) => {
      setIsSending(true);
      const actionPayload: WebAppPayload = { 
          action: 'add_product', 
          product: {
              name: payload.name,
              category: payload.category,
              price: payload.price,
              image: payload.image,
              modifiers: payload.modifiers 
          } as unknown as Product
      };
      if (window.Telegram?.WebApp) window.Telegram.WebApp.sendData(JSON.stringify(actionPayload));
      else { alert("Mock Added"); setIsSending(false); }
  };

  const handleEditProduct = (id: string, payload: any) => {
      setIsSending(true);
      const actionPayload: WebAppPayload = { 
          action: 'edit_product', 
          id, 
          product: {
              name: payload.name,
              category: payload.category,
              price: payload.price,
              image: payload.image,
              modifiers: payload.modifiers 
          } as unknown as Product
      };
      if (window.Telegram?.WebApp) window.Telegram.WebApp.sendData(JSON.stringify(actionPayload));
      else { alert("Mock Edited"); setIsSending(false); }
  };
  
  const handleDeleteProduct = (ids: string[]) => {
      setIsSending(true);
      const payload: WebAppPayload = { action: 'delete_product', ids };
      if (window.Telegram?.WebApp) window.Telegram.WebApp.sendData(JSON.stringify(payload));
      else { alert("Mock Deleted"); setIsSending(false); }
  };

  const handleAddPromo = (promo: PromoCode) => {
      setIsSending(true);
      const payload: WebAppPayload = { action: 'add_promo', promo };
      if (window.Telegram?.WebApp) window.Telegram.WebApp.sendData(JSON.stringify(payload));
      else { alert("Mock Promo Added"); setIsSending(false); }
  };

  const handleDeletePromo = (code: string) => {
      setIsSending(true);
      const payload: WebAppPayload = { action: 'delete_promo', code };
      if (window.Telegram?.WebApp) window.Telegram.WebApp.sendData(JSON.stringify(payload));
      else { alert("Mock Promo Deleted"); setIsSending(false); }
  };

  const handleCloseDevNotice = () => {
      setShowDevNotice(false);
      localStorage.setItem('hasSeenDevNotice', 'true');
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
        {items.map(item => {
            const stock = inventory[item.id];
            const isSoldOut = stock !== undefined && stock <= 0;
            const isHidden = hiddenItems.includes(item.id);
            const isDisabled = isSoldOut || isHidden || isShiftClosed;
            
            return (
              <div key={item.id} className={`glass-panel rounded-3xl p-3 flex flex-col justify-between relative transition-all active:scale-[0.98] ${isDisabled ? 'opacity-60 grayscale' : ''}`}>
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none opacity-50"></div>
                <div className="relative mb-3 group z-10">
                  <img src={item.image} alt={item.name} className="w-full aspect-square object-cover rounded-2xl shadow-lg brightness-90 group-hover:brightness-110 transition-all" onClick={() => !isDisabled && setSelectedProduct(item)} />
                  <button onClick={(e) => toggleFavorite(e, item.id)} className="absolute top-2 right-2 p-2 bg-black/40 backdrop-blur-md rounded-full text-brand-yellow transition-transform active:scale-125 hover:bg-black/60 border border-white/10">
                    <HeartIcon className="w-5 h-5" fill={favorites.includes(item.id)} />
                  </button>
                  {isHidden && <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl backdrop-blur-sm"><EyeSlashIcon className="w-8 h-8 text-white" /></div>}
                  {isSoldOut && !isHidden && <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl backdrop-blur-sm"><span className="text-white font-bold border border-white/20 bg-red-500/50 px-3 py-1 rounded-lg">Закончилось</span></div>}
                  {stock !== undefined && stock > 0 && <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-lg border border-white/10"><span className="text-[10px] font-bold text-white">Ост: {stock}</span></div>}
                </div>
                <div onClick={() => !isDisabled && setSelectedProduct(item)} className="z-10 relative">
                  <h3 className="font-bold text-white leading-tight mb-1 text-sm sm:text-base line-clamp-2 min-h-[2.5em] drop-shadow-sm">{item.name}</h3>
                  <p className="text-brand-yellow font-black text-lg drop-shadow-md">{item.variants[0].price}₽</p>
                </div>
                <button onClick={() => !isDisabled && setSelectedProduct(item)} disabled={isDisabled} className={`z-10 mt-3 w-full py-3 border border-white/10 rounded-2xl flex items-center justify-center transition-all active:scale-95 group backdrop-blur-sm shadow-inner ${isDisabled ? 'bg-white/5 cursor-not-allowed' : 'bg-white/10 hover:bg-brand-yellow hover:text-black text-white'}`}>
                  <PlusIcon className="w-6 h-6 group-active:rotate-90 transition-transform" />
                </button>
              </div>
            );
        })}
        {items.length === 0 && <div className="col-span-2 text-center text-brand-muted py-10">Товары не найдены</div>}
    </div>
  );

  const categories: {id: Category, label: string}[] = [
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
    { id: 'bakery', label: 'Выпечка' },
    { id: 'desserts', label: 'Десерты' },
    { id: 'sweets', label: 'Сладости' },
    { id: 'ice_cream', label: 'Мороженое' },
  ];

  return (
    <div className="min-h-screen font-sans text-brand-text selection:bg-brand-yellow selection:text-black relative">
      {isShiftClosed && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center animate-fade-in">
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10"><span className="text-4xl">😴</span></div>
              <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Кофейня закрыта</h2>
              <p className="text-brand-muted text-lg font-medium">Бариста отдыхает. <br/> Ждем вас в рабочее время!</p>
              <div {...handleLongPress} className="absolute top-0 left-0 right-0 h-24 bg-transparent" />
          </div>
      )}

      {showDevNotice && (
        <div className="fixed top-2 left-2 right-2 z-[45] animate-slide-up">
           <div className="glass-panel p-3 rounded-xl flex items-start gap-3 border-yellow-500/30 bg-black/80 backdrop-blur-md shadow-2xl">
              <span className="text-xl">🚧</span>
              <div className="flex-1 text-xs text-white/90 leading-tight"><span className="font-bold text-brand-yellow block mb-0.5">Тестовый режим</span>Бот в разработке.</div>
              <button onClick={handleCloseDevNotice} className="text-white/50 hover:text-white p-1"><XMarkIcon className="w-4 h-4" /></button>
           </div>
        </div>
      )}

      {showAiTooltip && !isShiftClosed && !showAiChat && (
          <div className="fixed bottom-36 right-4 z-40 max-w-[200px] animate-bounce-short">
              <div className="glass-panel p-3 rounded-xl border-brand-yellow/30 bg-black/80 relative text-xs">
                  <div className="absolute -bottom-2 right-6 w-4 h-4 bg-black/80 border-r border-b border-brand-yellow/30 transform rotate-45"></div>
                  <div className="flex gap-2"><span className="text-lg">🤖</span><p className="text-white/90">Я <b>ИИ-помощник</b>!</p></div>
                  <button onClick={() => setShowAiTooltip(false)} className="absolute -top-2 -left-2 bg-white/10 rounded-full p-1 border border-white/10 text-white/50 hover:text-white"><XMarkIcon className="w-3 h-3" /></button>
              </div>
          </div>
      )}

      <header className="sticky top-0 z-20 bg-brand-dark/70 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex justify-between items-center transition-colors">
        <div>
          <h1 {...handleLongPress} className="text-2xl font-black text-brand-yellow tracking-tighter select-none cursor-pointer italic drop-shadow-glow">COFFEE LUNCH</h1>
          <p className="text-[10px] text-brand-muted font-bold tracking-widest uppercase opacity-80">Best Coffee In Town</p>
        </div>
        <div className="flex items-center gap-2">{username && <div className="text-xs font-bold text-brand-muted/80 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-md hidden sm:block">{username}</div>}</div>
      </header>

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
            {renderProductGrid(allProducts.filter(item => (item.category === activeCategory) && !hiddenItems.includes(item.id)))}
        </>
      )}

      {/* VIEW: SEARCH */}
      {currentView === 'search' && (
        <div className="p-4">
             <div className="relative mb-6">
                <SearchIcon className="absolute left-4 top-3.5 w-5 h-5 text-brand-muted" />
                <input type="text" placeholder="Поиск по меню..." autoFocus value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full glass-input rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-yellow/50 focus:ring-1 focus:ring-brand-yellow/50 transition-all shadow-lg" />
            </div>
            {renderProductGrid(allProducts.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()) && !hiddenItems.includes(item.id)))}
        </div>
      )}

      {/* VIEW: FAVORITES */}
      {currentView === 'favorites' && (
        <div className="pt-4">
            <h2 className="px-4 text-xl font-bold text-white mb-4 drop-shadow-md">Избранное</h2>
            {renderProductGrid(allProducts.filter(item => favorites.includes(item.id)))}
        </div>
      )}

      {/* VIEW: CART */}
      {currentView === 'cart' && (
        <div className="p-4 pb-32 animate-fade-in">
            <h2 className="text-2xl font-black text-white uppercase italic mb-6 drop-shadow-md">Корзина</h2>
            
            <div className="glass-panel p-1.5 rounded-2xl flex mb-6">
                 <button onClick={() => setDeliveryMethod('pickup')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${deliveryMethod === 'pickup' ? 'bg-brand-yellow text-black shadow-lg' : 'text-brand-muted hover:text-white'}`}>Самовывоз</button>
                 <button onClick={() => alert("Доставка появится позже!")} className="flex-1 py-3 rounded-xl font-bold text-sm text-brand-muted/50 cursor-not-allowed flex flex-col items-center justify-center leading-none"><span>Доставка</span><span className="text-[9px] mt-0.5 opacity-60">скоро</span></button>
            </div>

            <div className="glass-panel p-4 rounded-2xl mb-4 relative overflow-hidden">
                <label className="flex items-center gap-2 text-sm font-bold text-brand-muted mb-2"><SparklesIcon className="w-4 h-4" />Промокод</label>
                {appliedPromo ? (
                    <div className="flex justify-between items-center bg-brand-yellow/10 border border-brand-yellow/30 rounded-xl p-3">
                        <div><span className="font-bold text-brand-yellow tracking-wider">{appliedPromo.code}</span><span className="text-xs text-brand-muted ml-2">(-{appliedPromo.discountPercent}%)</span></div>
                        <button onClick={removePromo} className="text-xs text-red-400 font-bold border-b border-red-400/30">Удалить</button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <input type="text" value={promoInput} onChange={(e) => setPromoInput(e.target.value)} className="flex-1 glass-input text-white p-3 rounded-xl outline-none focus:border-brand-yellow/50 uppercase" placeholder="CODE..." />
                        <button onClick={handleApplyPromo} className="bg-white/10 hover:bg-white/20 px-4 rounded-xl font-bold text-sm transition-colors">OK</button>
                    </div>
                )}
                {promoError && <div className="text-red-400 text-xs mt-2 font-medium">{promoError}</div>}
            </div>

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

            <div className="flex justify-between items-center mb-4 px-2">
                <span className="text-brand-muted font-bold">Итого:</span>
                <div className="text-right">
                    {appliedPromo && <span className="text-sm text-brand-muted line-through mr-2">{rawTotal}₽</span>}
                    <span className="text-xl font-black text-white">{finalTotal}₽</span>
                </div>
            </div>

            <div className="space-y-3">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-brand-muted opacity-50"><div className="text-4xl mb-2">🛒</div><p>Корзина пуста</p></div>
              ) : (
                cart.map((item) => {
                  const product = allProducts.find(p => p.id === item.productId);
                  if (!product) return null;
                  const variant = product.variants[item.variantIndex];
                  let itemPrice = variant.price;
                  if (item.options.milk && item.options.milk !== 'none') itemPrice += getAddonPrice('milk', variant.size);
                  if (item.options.syrup && item.options.syrup !== 'none') itemPrice += getAddonPrice('syrup', variant.size);
                  if (item.options.sauce) itemPrice += getAddonPrice('sauce', variant.size);
                  
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
                          {item.options.sauce && SAUCE_LABELS[item.options.sauce] ? ` • Соус: ${SAUCE_LABELS[item.options.sauce]}` : ''}
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

            {!window.Telegram?.WebApp && (
                 <div className="pt-8 pb-4">
                    <button onClick={handleCheckout} disabled={isSending} className={`w-full text-black py-4 rounded-2xl font-bold text-lg shadow-[0_0_20px_rgba(250,204,21,0.2)] transition-all mb-2 flex items-center justify-center gap-2 ${isSending ? 'bg-brand-yellow/50 cursor-not-allowed' : 'bg-brand-yellow active:scale-95 hover:bg-yellow-300'}`}>
                        {isSending ? 'Отправка...' : `Оплатить ${finalTotal}₽`}
                    </button>
                 </div>
            )}
        </div>
      )}

      {!isShiftClosed && (
        <button onClick={() => { setShowAiChat(true); setShowAiTooltip(false); }} className="fixed bottom-20 right-4 z-40 bg-brand-yellow text-black p-4 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.5)] active:scale-95 transition-all hover:bg-yellow-300 border-2 border-white/20">
          <SparklesIcon className="w-6 h-6 animate-pulse" />
        </button>
      )}

      <div className="fixed bottom-0 left-0 right-0 glass-modal safe-area-bottom px-6 py-3 flex justify-between items-center z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/10">
         <button onClick={() => setCurrentView('menu')} className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${currentView === 'menu' ? 'text-brand-yellow drop-shadow-glow' : 'text-brand-muted hover:text-white'}`}><HomeIcon className="w-6 h-6" fill={currentView === 'menu'} /><span className="text-[10px] font-bold">Меню</span></button>
         <button onClick={() => setCurrentView('search')} className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${currentView === 'search' ? 'text-brand-yellow drop-shadow-glow' : 'text-brand-muted hover:text-white'}`}><SearchIcon className="w-6 h-6" /><span className="text-[10px] font-bold">Поиск</span></button>
         <button onClick={() => setCurrentView('favorites')} className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${currentView === 'favorites' ? 'text-brand-yellow drop-shadow-glow' : 'text-brand-muted hover:text-white'}`}><HeartIcon className="w-6 h-6" fill={currentView === 'favorites'} /><span className="text-[10px] font-bold">Избр.</span></button>
         <button onClick={() => setCurrentView('cart')} className={`flex flex-col items-center gap-1 relative transition-all active:scale-90 ${currentView === 'cart' ? 'text-brand-yellow drop-shadow-glow' : 'text-brand-muted hover:text-white'}`}>
            <div className="relative">
                <CartIcon className="w-6 h-6" fill={currentView === 'cart'} />
                {cart.length > 0 && <span className="absolute -top-1 -right-2 bg-brand-yellow text-black text-[10px] font-black px-1.5 rounded-full min-w-[16px] flex items-center justify-center shadow-sm">{cart.reduce((a,b)=>a+b.quantity,0)}</span>}
            </div>
            <span className="text-[10px] font-bold">Корзина</span>
         </button>
      </div>

      {selectedProduct && <ItemModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddToCart={(variantIdx, quantity, options) => addToCart(selectedProduct.id, variantIdx, quantity, options)} inventory={inventory} />}
      {showAiChat && <AIChat products={allProducts.filter(p => !hiddenItems.includes(p.id) && (inventory[p.id] === undefined || inventory[p.id] > 0))} onClose={() => setShowAiChat(false)} onAddToCart={(product) => setSelectedProduct(product)} />}

      {showAdminPanel && (
          <AdminPanel 
            products={allProducts}
            promoCodes={promoCodes}
            hiddenItems={hiddenItems} 
            inventory={inventory}
            onToggleHidden={(id) => setHiddenItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])} 
            onSaveToBot={handleSaveMenuToBot} 
            onClose={() => setShowAdminPanel(false)} 
            isLoading={isSending} 
            dailyRevenue={dailyRevenue} 
            monthlyRevenue={monthlyRevenue} 
            isShiftClosed={isShiftClosed}
            onToggleShift={handleToggleShift}
            onAddProduct={handleAddProduct}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
            onAddPromo={handleAddPromo}
            onDeletePromo={handleDeletePromo}
            onUpdateInventory={setInventory}
          />
      )}
      
      {showAdminAuth && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-xl">
              <div className="glass-panel p-6 rounded-3xl w-80 shadow-2xl animate-slide-up">
                  <h3 className="text-xl font-bold mb-4 text-center text-white">Вход для админа</h3>
                  <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Пароль" className="w-full p-3 glass-input text-white rounded-xl mb-4 text-center text-lg outline-none focus:ring-2 ring-brand-yellow/50" />
                  <div className="flex gap-2">
                      <button onClick={() => setShowAdminAuth(false)} className="flex-1 py-3 text-brand-muted font-bold hover:text-white transition-colors">Отмена</button>
                      <button onClick={verifyAdmin} className="flex-1 py-3 bg-brand-yellow text-black rounded-xl font-bold shadow-lg">Войти</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;
