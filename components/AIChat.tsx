
import React, { useState, useRef, useEffect } from 'react';
import { SparklesIcon, SendIcon, XMarkIcon, PlusIcon, MicrophoneIcon } from './ui/Icons';
import { Product } from '../types';

interface AIChatProps {
  products: Product[];
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// --- НАСТРОЙКИ (TIMEWEB) ---
const API_URL = import.meta.env.VITE_TIMEWEB_API_URL;
const API_KEY = import.meta.env.VITE_TIMEWEB_API_KEY;

// --- СПИСКИ ДОБАВОК ---
const ADDONS = "Сиропы (Фисташка, Лесной орех, Кокос, Апельсин, Клубника, Вишня, Пряник, Попкорн, Мята, Карамель). Молоко (Банановое, Кокосовое, Миндальное, Безлактозное).";

// --- БЫСТРЫЕ ВОПРОСЫ ---
const SUGGESTIONS = [
    "Хочу кофе", "Что поесть?", "Авторский чай", "Сладкое к кофе"
];

const CATEGORY_NAMES: Record<string, string> = {
    coffee: 'КОФЕ', tea: 'ЧАЙ', seasonal: 'СЕЗОННОЕ', punch: 'ПУНШИ', soda: 'НАПИТКИ',
    fast_food: 'ЕДА', combo: 'КОМБО', hot_dishes: 'ГОРЯЧЕЕ', soups: 'СУПЫ',
    side_dishes: 'ГАРНИРЫ', salads: 'САЛАТЫ', bakery: 'ВЫПЕЧКА', desserts: 'ДЕСЕРТЫ',
    sweets: 'СЛАДОСТИ', ice_cream: 'МОРОЖЕНОЕ'
};

const AIChat: React.FC<AIChatProps> = ({ products, onClose, onAddToCart }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Привет! Я Зернышко ☕️\nРассказать про наши вкусные новинки?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // СУПЕР-СЖАТЫЙ КОНТЕКСТ: Только Название (Цена)
  const getSuperCompactMenu = (): string => {
      const grouped: Record<string, string[]> = {};

      products.forEach(p => {
          if (!grouped[p.category]) grouped[p.category] = [];
          grouped[p.category].push(`${p.name} (${p.variants[0].price}₽)`);
      });

      let contextString = "МЕНЮ:\n";
      for (const [cat, items] of Object.entries(grouped)) {
          const catName = CATEGORY_NAMES[cat] || cat.toUpperCase();
          contextString += `${catName}: ${items.join('; ')}\n`;
      }
      return contextString;
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input.trim();
    if (!textToSend || isLoading) return;

    if (!API_KEY || !API_URL) {
        setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Ошибка: Ключи Timeweb не найдены. Проверьте .env или Secrets.' }]);
        return;
    }

    setInput('');
    const newHistory: Message[] = [...messages, { role: 'user', content: textToSend }];
    setMessages(newHistory);
    setIsLoading(true);

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 60000); 

    try {
      const menuContext = getSuperCompactMenu();

      const systemPromptText = `
        Ты бариста кофейни "Зернышко". 
        Твоя цель: Вкусно описывать еду и напитки, предлагать сочетания и продавать.

        ВОТ МЕНЮ (Только это есть в наличии):
        ${menuContext}
        ${ADDONS}

        ПРАВИЛА:
        1. Если товара нет в списке — вежливо скажи, что он закончился.
        2. Описывай товары аппетитно, используй эмодзи. Не будь роботом.
        3. Если предлагаешь конкретный товар из меню, выдели его название в двойные фигурные скобки: {{Название товара}}.
           Пример: "Попробуйте наш нежный {{Капучино}} или сытную {{Самса с курицей}}".
           Пиши название В ТОЧНОСТИ как в меню.
        4. Не придумывай цены, бери из меню.
      `;

      // Берем последние 6 сообщений для контекста
      const recentHistory = newHistory.slice(-6); 
      const apiMessages = [
          { role: 'system', content: systemPromptText },
          ...recentHistory
      ];

      // Очистка и формирование URL для Timeweb
      const cleanKey = API_KEY.trim();
      let cleanUrl = API_URL.trim();
      if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);
      const endpoint = `${cleanUrl}/chat/completions`;

      // Запрос к Timeweb Cloud AI
      const response = await fetch(endpoint, { 
          method: 'POST', 
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${cleanKey}`,
          },
          body: JSON.stringify({
              model: 'gemini-pro', // Timeweb часто использует это имя модели для Gemini
              messages: apiMessages,
              temperature: 0.7,
              max_tokens: 1000
          }),
          signal: abortController.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
          const errText = await response.text();
          console.error("API Error Response:", errText);
          throw new Error(`Ошибка сервера (${response.status})`);
      }

      const data = await response.json();
      const aiText = data.choices?.[0]?.message?.content;
      
      if (!aiText) throw new Error("Пустой ответ.");

      setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);

    } catch (error: any) {
      console.error("AI Error:", error);
      const errorMsg = error.name === 'AbortError' ? '⏳ Думаю над ответом...' : `⚠️ Ошибка связи: ${error.message}`;
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
    } finally {
      setIsLoading(false);
      clearTimeout(timeoutId);
    }
  };

  const toggleListening = () => {
      if (isListening) {
          recognitionRef.current?.stop();
          return;
      }
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
          alert("Ваш браузер не поддерживает голосовой ввод.");
          return;
      }
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'ru-RU';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognitionRef.current = recognition;
      transcriptRef.current = '';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => {
          setIsListening(false);
          const finalText = transcriptRef.current.trim();
          if (finalText) handleSend(finalText);
      };
      recognition.onerror = (event: any) => {
          setIsListening(false);
      };
      recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results).map((result: any) => result[0].transcript).join('');
          transcriptRef.current = transcript;
          setInput(transcript);
      };
      recognition.start();
  };

  const renderMessageContent = (text: string) => {
    const parts = text.split(/(\{\{.*?\}\})/g);
    
    return parts.map((part, index) => {
        if (part.startsWith('{{') && part.endsWith('}}')) {
            const rawName = part.slice(2, -2).trim();
            const product = products.find(p => p.name.toLowerCase() === rawName.toLowerCase());

            if (!product) return <span key={index} className="font-bold text-brand-yellow">{rawName}</span>;

            return (
                <div key={index} className="my-2 p-2 bg-black/40 rounded-xl border border-brand-yellow/30 flex items-center gap-3 shadow-lg transform transition-all hover:scale-[1.02] cursor-pointer" onClick={() => onAddToCart(product)}>
                    <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-white text-sm truncate">{product.name}</div>
                        <div className="text-brand-yellow font-black text-xs">{product.variants[0].price}₽</div>
                    </div>
                    <button className="bg-brand-yellow text-black p-2 rounded-lg font-bold text-xs shadow-md active:scale-95 transition-transform flex items-center gap-1">
                        <PlusIcon className="w-4 h-4" />
                        Хочу
                    </button>
                </div>
            );
        }
        return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto transition-opacity" onClick={onClose} />
      
      <div className="glass-modal w-full max-w-md h-[85vh] sm:rounded-3xl rounded-t-3xl flex flex-col relative z-10 animate-slide-up pointer-events-auto shadow-2xl overflow-hidden border border-brand-yellow/20">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-brand-dark/90 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-brand-yellow/20 flex items-center justify-center border border-brand-yellow/30 animate-pulse">
               <SparklesIcon className="w-5 h-5 text-brand-yellow" />
            </div>
            <div>
               <h3 className="font-bold text-white leading-tight">Зернышко AI</h3>
               <p className="text-[10px] text-brand-muted font-bold uppercase tracking-wider">Timeweb Power</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-brand-muted hover:text-white transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-0 z-10 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-black/20 to-transparent">
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-brand-yellow text-black rounded-tr-none font-medium' : 'bg-white/10 text-white border border-white/5 rounded-tl-none'}`}>
                    {renderMessageContent(msg.content)}
                </div>
                </div>
            ))}
            {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 p-4 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
                      <div className="w-2 h-2 bg-brand-yellow rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-brand-yellow rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-brand-yellow rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
            )}
            <div ref={messagesEndRef} />
            </div>
        </div>

        {/* Suggestions & Input */}
        <div className="bg-black/40 border-t border-white/10 backdrop-blur-xl safe-area-bottom z-30 flex flex-col">
           <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
              {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => handleSend(s)} className="whitespace-nowrap px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-brand-muted hover:bg-white/10 hover:text-white transition-colors">
                      {s}
                  </button>
              ))}
           </div>

           <div className="px-4 pb-4 flex gap-2 items-center">
             <button 
                onClick={toggleListening} 
                className={`p-3 rounded-xl transition-all border border-white/5 ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse border-red-500/50' : 'bg-white/5 text-brand-muted hover:text-white'}`}
             >
                <MicrophoneIcon className="w-6 h-6" isListening={isListening} />
             </button>
             
             <input 
               type="text" 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSend()}
               placeholder={isListening ? "Слушаю..." : "Посоветуй кофе..."}
               className={`flex-1 glass-input text-white p-3 rounded-xl outline-none focus:border-brand-yellow/50 transition-all placeholder:text-brand-muted/50 ${isListening ? 'border-brand-yellow/30 bg-brand-yellow/5' : ''}`}
             />
             
             <button 
               onClick={() => handleSend()}
               disabled={isLoading || !input.trim()}
               className={`p-3 rounded-xl transition-all flex items-center justify-center aspect-square ${!input.trim() ? 'bg-white/5 text-brand-muted' : 'bg-brand-yellow text-black shadow-[0_0_15px_rgba(250,204,21,0.4)] active:scale-95'}`}
             >
               <SendIcon className="w-6 h-6" />
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
