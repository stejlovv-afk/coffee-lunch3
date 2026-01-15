import React, { useState, useRef, useEffect } from 'react';
import { MENU_ITEMS } from '../constants';
import { Product } from '../types';
import { SendIcon, SparklesIcon, PlusIcon } from './ui/Icons';

interface AIChatModalProps {
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  suggestedProducts?: Product[];
}

const QUICK_ACTIONS = [
  "☕️ Посоветуй кофе",
  "🥐 Хочу перекусить",
  "🍊 Что-то цитрусовое",
  "🍬 Сладкое к кофе",
  "🎲 На твой вкус"
];

const AIChatModal: React.FC<AIChatModalProps> = ({ onClose, onSelectProduct }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Привет! 👋 Я ваш AI-бариста. Я знаю всё меню наизусть. Напишите, чего хочется (например "кофе с халвой" или "что-то сытное"), и я моментально это найду!' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // --- AI LOGIC ---

  const getSystemPrompt = () => {
    // Формируем "карту" меню для нейросети
    const menuMap = MENU_ITEMS.map(item => 
      `"${item.name}" (ID: ${item.id}, Категория: ${item.category}, Цена: ${item.variants[0].price}р)`
    ).join('; ');

    return `
Ты — профессиональный, дружелюбный бариста в кофейне Coffee Lunch.
ТВОЯ ЗАДАЧА: Помогать клиенту выбрать товары из меню.

МЕНЮ КОФЕЙНИ:
[${menuMap}]

ПРАВИЛА:
1. Твои ответы должны быть живыми, с эмодзи.
2. Если пользователь просит что-то, чего нет (например, "суши"), вежливо откажи и предложи альтернативу из меню (например, сэндвич).
3. Если пользователь просит "не Х" (например, "не бамбл"), НИКОГДА не предлагай Х.
4. Понимай контекст: "с халвой" -> Латте Халва; "поесть" -> Салаты или Сэндвичи.

ФОРМАТ ОТВЕТА (СТРОГО JSON):
Ты должен отвечать ВСЕГДА только валидным JSON объектом без markdown разметки.
{
  "text": "Текст твоего ответа клиенту...",
  "ids": ["id_товара_1", "id_товара_2"]
}
Если товаров для рекомендации нет, массив "ids" должен быть пустым.
    `.trim();
  };

  const callGemini = async (userMessage: string, history: Message[]) => {
    const messagesPayload = [
        { role: 'system', content: getSystemPrompt() },
        ...history.slice(-6).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        })),
        { role: 'user', content: userMessage }
    ];

    // Используем POST запрос к pollinations.ai для поддержки длинных промптов
    const url = 'https://text.pollinations.ai/';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(new Error("Timeout")), 45000); // 45 сек таймаут

      const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messages: messagesPayload,
            model: 'openai', // Используем стандартную модель для стабильности POST запросов
            temperature: 0.7
        }),
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
          const errorText = await response.text();
          console.error("AI API Error:", response.status, errorText);
          throw new Error(`Network error: ${response.status}`);
      }
      
      let rawText = await response.text();
      
      // Очистка от возможных markdown-тегов (```json ... ```)
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

      // Парсинг JSON
      try {
        const parsed = JSON.parse(rawText);
        return {
            text: parsed.text || "Простите, я немного запутался. Повторите?",
            ids: Array.isArray(parsed.ids) ? parsed.ids : []
        };
      } catch (e) {
        // Если AI вернул не JSON, пробуем использовать текст как ответ
        console.warn("AI returned non-JSON:", rawText);
        return {
            text: rawText || "Что-то пошло не так с ответом AI.",
            ids: []
        };
      }

    } catch (e: any) {
      console.error("AI Error:", e);
      // Обработка таймаута или аборта запроса
      if (e.name === 'AbortError' || (e.message && (e.message.includes('aborted') || e.message.includes('Timeout')))) {
          return {
            text: "Сервер долго думает 🐢. Похоже, там очередь. Спросите еще раз!",
            ids: []
          };
      }
      return {
        text: "Связь с космосом прервалась 🛸. Попробуйте еще раз!",
        ids: []
      };
    }
  };

  // --- UI HANDLERS ---

  const typeMessage = async (fullText: string, productIds: string[]) => {
    setIsTyping(true);
    let currentText = '';
    // Скорость печати
    const speed = 15; 

    setMessages(prev => [...prev, { role: 'assistant', content: '', suggestedProducts: [] }]);
    
    // Эффект печатания
    for (let i = 0; i < fullText.length; i++) {
      currentText += fullText[i];
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last.role === 'assistant') {
             return [...prev.slice(0, -1), { ...last, content: currentText }];
        }
        return prev;
      });
      // Пропускаем задержку на пробелах для динамики
      if (fullText[i] !== ' ') await new Promise(r => setTimeout(r, speed));
    }

    // Показываем товары только когда текст допечатался
    if (productIds.length > 0) {
        const products = MENU_ITEMS.filter(i => productIds.includes(i.id));
        setMessages(prev => {
            const last = prev[prev.length - 1];
            return [...prev.slice(0, -1), { ...last, suggestedProducts: products }];
        });
    }
    
    setIsTyping(false);
  };

  const handleSend = async (text: string = inputValue) => {
    if (!text.trim() || isLoading || isTyping) return;
    
    const userText = text.trim();
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const result = await callGemini(userText, messages);
      await typeMessage(result.text, result.ids);
    } catch (e) {
      await typeMessage("Что-то пошло не так. Попробуйте еще раз!", []);
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
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <SparklesIcon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">AI Assistant</h3>
              <p className="text-[10px] text-brand-muted font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block shadow-[0_0_5px_rgba(96,165,250,0.8)]"></span>
                Neural Network
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors">
            ✕
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}>
              
              {/* Message Bubble */}
              <div 
                className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm backdrop-blur-sm transition-all ${
                  msg.role === 'user' 
                    ? 'bg-brand-yellow text-black font-bold rounded-tr-sm shadow-[0_4px_15px_rgba(250,204,21,0.2)]' 
                    : 'bg-white/10 text-white border border-white/5 rounded-tl-sm'
                }`}
              >
                {msg.content}
              </div>

              {/* Product Suggestions */}
              {msg.role === 'assistant' && msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                <div className="mt-3 flex flex-col gap-2 w-full max-w-[90%] animate-slide-up">
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
          
          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-white/5 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center border border-white/5">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-[bounce_1s_infinite_0ms]"></div>
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-[bounce_1s_infinite_200ms]"></div>
                <div className="w-1.5 h-1.5 bg-brand-yellow rounded-full animate-[bounce_1s_infinite_400ms]"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions (Chips) */}
        {!isLoading && !isTyping && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar mask-gradient">
            {QUICK_ACTIONS.map((action, i) => (
               <button 
                 key={i} 
                 onClick={() => handleSend(action)}
                 className="whitespace-nowrap px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-brand-yellow/30 rounded-full text-xs font-bold text-brand-muted hover:text-white transition-all active:scale-95"
               >
                 {action}
               </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-white/10 bg-black/60 backdrop-blur-xl">
          <div className="relative flex items-center group">
            <input 
              type="text" 
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)} 
              onKeyDown={handleKeyDown} 
              disabled={isLoading || isTyping}
              placeholder="Спроси что угодно..."
              className="w-full bg-white/5 text-white pl-5 pr-14 py-4 rounded-2xl outline-none border border-white/10 focus:border-brand-yellow/50 focus:bg-white/10 transition-all placeholder:text-white/20 font-medium disabled:opacity-50" 
            />
            <button 
              onClick={() => handleSend()} 
              disabled={isLoading || isTyping || !inputValue.trim()} 
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
