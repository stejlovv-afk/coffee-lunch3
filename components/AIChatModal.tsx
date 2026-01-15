import React, { useState, useRef, useEffect } from 'react';
import { MENU_ITEMS } from '../constants';
import { Product } from '../types';
import { SendIcon, SparklesIcon, PlusIcon } from './ui/Icons';

interface AIChatModalProps {
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  suggestedProducts?: Product[];
}

const AIChatModal: React.FC<AIChatModalProps> = ({ onClose, onSelectProduct }) => {
  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Привет! Я ваш AI-бариста. Я знаю всё о нашем кофе и десертах. Что бы вы хотели попробовать? ☕️' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- 1. LOCAL LOGIC (Мгновенная и надежная - запасной вариант) ---
  const callLocalLogic = (text: string) => {
    const lower = text.toLowerCase();
    let foundIds: string[] = [];
    let responseText = "";

    // Поиск товаров
    const matchedItems = MENU_ITEMS.filter(item => {
      const matchName = item.name.toLowerCase().includes(lower);
      const matchCat = translateCategory(item.category).includes(lower);
      // Синонимы
      if (lower.includes('поесть') && (item.category === 'food' || item.category === 'salads')) return true;
      if (lower.includes('пить') && item.isDrink) return true;
      if (lower.includes('слад') && item.category === 'sweets') return true;
      if (lower.includes('бодр') && item.id.includes('espresso')) return true;
      return matchName || matchCat;
    });

    if (matchedItems.length > 0) {
      const topItems = matchedItems.slice(0, 3);
      foundIds = topItems.map(i => i.id);
      const names = topItems.map(i => i.name).join(', ');
      
      const phrases = [
        `Как насчет этого? ${names} — отличный выбор!`,
        `Нашел для вас кое-что вкусное: ${names}.`,
        `Рекомендую попробовать: ${names}.`,
      ];
      responseText = phrases[Math.floor(Math.random() * phrases.length)];
    } else {
      if (lower.includes('привет')) responseText = "Привет! Готов принять заказ.";
      else if (lower.includes('как дела')) responseText = "Я всего лишь код, но настроение — кофейное! ☕️";
      else if (lower.includes('спасибо')) responseText = "Рад стараться! 💛";
      else responseText = "У нас очень вкусное меню, но я не совсем понял запрос. Попробуйте спросить про 'кофе' или 'десерты'!";
    }

    return { text: responseText, ids: foundIds };
  };

  const translateCategory = (cat: string) => {
    const map: Record<string, string> = {
      coffee: 'кофе латте капучино', tea: 'чай', seasonal: 'сезонное', punch: 'пунш',
      sweets: 'сладости десерт шоколад', soda: 'напитки вода лимонад', salads: 'салаты обед', food: 'еда перекус сэндвич'
    };
    return map[cat] || '';
  };

  // --- 2. ONLINE AI (Qwen 2.5 - Smartest Free Model for RU) ---
  const callSmartAI = async (text: string, history: Message[]) => {
    // 1. Формируем компактный контекст меню
    const menuContext = MENU_ITEMS.map(i => 
      `${i.name} (${i.variants[0].price}р, ID:${i.id})`
    ).join('; ');
    
    // 2. Системный промпт (Личность + Инструкции)
    const systemPrompt = `Ты профессиональный бариста в кофейне "Coffee Lunch". 
Твоя задача: вежливо общаться и продавать позиции из меню.
Меню: [${menuContext}].

ПРАВИЛА:
1. Отвечай на русском языке, живо и эмоционально (используй эмодзи).
2. Если пользователь просит посоветовать — предложи 1-2 конкретных товара из меню, опиши, почему они вкусные.
3. ВАЖНО: Если ты упоминаешь конкретные товары, в конце ответа добавь технический блок: ||ID:${JSON.stringify(["id_товара"])}||
   Пример: "Возьмите Латте, он очень нежный! ☕️ ||ID:["latte"]||"
4. Не предлагай товары, которых нет в меню.
5. Будь краток (не более 3-4 предложений).`;

    // 3. Собираем историю (последние 6 сообщений для контекста)
    const dialogHistory = history.slice(-6).map(m => 
      `${m.role === 'user' ? 'Клиент' : 'Бариста'}: ${m.content.replace(/\|\|ID:.*?\|\|/g, '')}`
    ).join('\n');

    const fullPrompt = `${systemPrompt}\n\nДиалог:\n${dialogHistory}\nКлиент: ${text}\nБариста:`;

    // 4. Запрос к Pollinations (Proxy) с моделью Qwen
    // Qwen - это китайская модель, она не блокирует РФ и очень умная.
    const url = `https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}?model=qwen&seed=${Math.floor(Math.random() * 10000)}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 сек таймаут

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('API Error');
      const textData = await response.text();
      
      return parseAIResponse(textData);
    } catch (e) {
      console.warn("AI failed, switching to local:", e);
      return null; 
    }
  };

  // Парсинг ответа
  const parseAIResponse = (raw: string) => {
    let text = raw;
    let ids: string[] = [];
    
    // Ищем наш специальный тег ||ID:["..."]||
    const match = raw.match(/\|\|ID:(.*?)\|\|/);
    if (match) {
      try {
        ids = JSON.parse(match[1]);
        text = raw.replace(match[0], '').trim();
      } catch (e) {}
    }
    return { text, ids };
  };

  // --- HANDLERS ---

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    const userText = inputValue.trim();
    
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Пробуем умный AI (Qwen)
      let result = await callSmartAI(userText, messages);

      // Если AI не ответил, используем локальную логику
      if (!result || !result.text) {
        result = callLocalLogic(userText);
      }

      if (result) {
        const products = MENU_ITEMS.filter(i => result?.ids.includes(i.id));
        setMessages(prev => [...prev, { role: 'assistant', content: result.text, suggestedProducts: products }]);
      }

    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Что-то связь барахлит, но я всё равно готов принять заказ!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto transition-opacity" onClick={onClose} />
      
      {/* Modal Window */}
      <div className="glass-modal w-full max-w-md h-[85vh] rounded-3xl relative z-10 animate-slide-up pointer-events-auto shadow-[0_0_50px_rgba(250,204,21,0.1)] flex flex-col overflow-hidden bg-[#09090b] border border-white/10">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-yellow to-yellow-500 text-black flex items-center justify-center shadow-lg shadow-brand-yellow/20 animate-pulse">
              <SparklesIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">AI Бариста</h3>
              <p className="text-[10px] text-brand-muted font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block shadow-[0_0_5px_rgba(34,197,94,0.8)]"></span>
                Qwen AI (Smart)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors">
            ✕
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}>
              
              {/* Bubble */}
              <div 
                className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm backdrop-blur-sm ${
                  msg.role === 'user' 
                    ? 'bg-brand-yellow text-black font-bold rounded-tr-sm shadow-[0_4px_15px_rgba(250,204,21,0.2)]' 
                    : 'bg-white/10 text-white border border-white/5 rounded-tl-sm'
                }`}
              >
                {msg.content}
              </div>

              {/* Product Cards (if any) */}
              {msg.role === 'assistant' && msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                <div className="mt-3 flex flex-col gap-2 w-full max-w-[90%]">
                  <span className="text-[10px] text-brand-muted font-bold uppercase ml-1 tracking-widest">Рекомендую:</span>
                  {msg.suggestedProducts.map(product => (
                    <div 
                      key={product.id} 
                      onClick={() => onSelectProduct(product)} 
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-black/40 border border-white/10 hover:border-brand-yellow/50 hover:bg-white/5 active:scale-95 transition-all cursor-pointer group"
                    >
                      <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover shadow-sm" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate group-hover:text-brand-yellow transition-colors">{product.name}</h4>
                        <p className="text-xs text-brand-muted font-mono">{product.variants[0].price}₽</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-brand-yellow text-black flex items-center justify-center shadow-lg transform group-hover:rotate-90 transition-transform">
                        <PlusIcon className="w-5 h-5" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/5 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center border border-white/5">
                <div className="w-1.5 h-1.5 bg-brand-yellow rounded-full animate-[bounce_1s_infinite_0ms]"></div>
                <div className="w-1.5 h-1.5 bg-brand-yellow rounded-full animate-[bounce_1s_infinite_200ms]"></div>
                <div className="w-1.5 h-1.5 bg-brand-yellow rounded-full animate-[bounce_1s_infinite_400ms]"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/10 bg-black/60 backdrop-blur-xl">
          <div className="relative flex items-center group">
            <input 
              type="text" 
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)} 
              onKeyDown={handleKeyDown} 
              placeholder="Хочу что-то сладкое..."
              className="w-full bg-white/5 text-white pl-5 pr-14 py-4 rounded-2xl outline-none border border-white/10 focus:border-brand-yellow/50 focus:bg-white/10 transition-all placeholder:text-white/20 font-medium" 
            />
            <button 
              onClick={handleSend} 
              disabled={isLoading || !inputValue.trim()} 
              className="absolute right-2 p-2.5 bg-brand-yellow text-black rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-[0_0_15px_rgba(250,204,21,0.3)]"
            >
              <SendIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AIChatModal;
