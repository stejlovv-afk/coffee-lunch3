
import React, { useState, useRef, useEffect } from 'react';
import { SparklesIcon, SendIcon, XMarkIcon, PlusIcon, MicrophoneIcon } from './ui/Icons';
import { Product, Category } from '../types';

interface AIChatProps {
  products: Product[];
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// --- НАСТРОЙКИ TIMEWEB AI ---
const TIMEWEB_API_URL = 'https://agent.timeweb.cloud/api/v1/cloud-ai/agents/aabb17cb-c1df-4ccb-b419-f438bb89fec1/v1';
const TIMEWEB_API_KEY = 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCIsImtpZCI6IjFrYnhacFJNQGJSI0tSbE1xS1lqIn0.eyJ1c2VyIjoicW40ODM4MjAiLCJ0eXBlIjoiYXBpX2tleSIsImFwaV9rZXlfaWQiOiI1ZDA5MjAzYS03OTg0LTRjMTQtYmVkYS1jNjJlNTBkMDFlODgiLCJpYXQiOjE3Njk2MzY5MDJ9.BKZO8nPYf7ueqwQEr6gRxB_nqsO91ChQPq7Jh1FZff6WVWACQ0KmQdpTCIFH2jXzilW14mNqx856gRNp-xlyTJkmyB6EAWdVPnjreSk3ENaMEEzz1Jc8AyREP7q_qkzJHzsvoql1OXYFGD1aok7iBpNNEZqgPEmi-qLp8cv9T8zDNG5l6vBJjJctfzpN29vrUcyeDqLKEny05K6vYALXx-l0QFMM082rwJcW2y2DVZsnbS4_BA8wYSGUz1TciBAJJAVgxNJXZ87-xK_PmR-oMzNND2TeXl_Miez_HdOuit6kC6kQipbw-anCLFdaTxc3UXOWF_zuskPqeb3s9RmtyYLnDMIfPHSwl0K-IvDmShQVKIEdRM7QUq52xLfqLjPjjTaOdPcWAjaRLW_PKrFleARmyoHoSRN2g9UWY-EeuJVUBj-7SBRygyjp_O4BRtlUcTi51WGGE5RNx_n5JMcn_DfzvZEjkh3vthztn4S1X35LW8Go7AGEmS_JlDX_VU_z';

// --- СПИСКИ ДОБАВОК ---
const AVAILABLE_MILK = "Банановое, Кокосовое, Миндальное, Безлактозное, Обычное";
const AVAILABLE_SYRUPS = "Фисташка, Лесной орех, Кокос, Миндаль, Кр. апельсин, Клубника, Персик, Дыня, Слива, Яблоко, Малина, Вишня, Лаванда, Пряник, Лемонграсс, Попкорн, Мята, Баблгам, Сол. карамель";

// --- БЫСТРЫЕ ВОПРОСЫ ---
const SUGGESTIONS = [
    "Хочу кофе", "Что поесть?", "Авторский чай", "Сладкое к кофе"
];

// Русские названия категорий для красивого вывода
const CATEGORY_NAMES: Record<string, string> = {
    coffee: 'КОФЕ', tea: 'ЧАЙ', seasonal: 'СЕЗОННОЕ', punch: 'ПУНШИ', soda: 'НАПИТКИ',
    fast_food: 'ФАСТФУД', combo: 'КОМБО ОБЕДЫ', hot_dishes: 'ГОРЯЧЕЕ', soups: 'СУПЫ',
    side_dishes: 'ГАРНИРЫ', salads: 'САЛАТЫ', bakery: 'ВЫПЕЧКА', desserts: 'ДЕСЕРТЫ',
    sweets: 'СЛАДОСТИ', ice_cream: 'МОРОЖЕНОЕ'
};

const AIChat: React.FC<AIChatProps> = ({ products, onClose, onAddToCart }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Привет! Я Зернышко ☕️\nПодсказать что-то из еды или напитков?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Refs for voice input
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Генерация полного контекста меню
  // Мы берем ВСЕ продукты, которые пришли в props (они уже отфильтрованы в App.tsx)
  const getFullMenuContext = (): string => {
      const grouped: Record<string, string[]> = {};

      products.forEach(p => {
          if (!grouped[p.category]) grouped[p.category] = [];
          // Формат: Название (Цена) {{ID}}
          grouped[p.category].push(`${p.name} (${p.variants[0].price}₽) {{${p.id}}}`);
      });

      let contextString = "АКТУАЛЬНОЕ МЕНЮ (Только то, что есть в наличии):\n";
      
      for (const [cat, items] of Object.entries(grouped)) {
          const catName = CATEGORY_NAMES[cat] || cat.toUpperCase();
          contextString += `\n--- ${catName} ---\n${items.join(', ')}\n`;
      }

      return contextString;
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input.trim();
    if (!textToSend || isLoading) return;

    setInput('');
    const newHistory: Message[] = [...messages, { role: 'user', content: textToSend }];
    setMessages(newHistory);
    setIsLoading(true);

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 60000); 

    try {
      // 1. Получаем ПОЛНЫЙ список доступных товаров
      const menuContext = getFullMenuContext();

      // 2. Строгий системный промпт
      const systemPromptText = `
        Ты бариста "Зернышко".
        
        Твоя задача — продавать товары ИСКЛЮЧИТЕЛЬНО из списка ниже.
        
        СПИСОК ДОСТУПНЫХ ТОВАРОВ:
        ${menuContext}

        ДОБАВКИ (можно предлагать к кофе/чаю):
        Сиропы: ${AVAILABLE_SYRUPS}
        Молоко: ${AVAILABLE_MILK}

        СТРОГИЕ ПРАВИЛА:
        1. Если пользователь просит товар, которого НЕТ в списке (например, Латте, если он скрыт) — ты ОБЯЗАН сказать: "К сожалению, [Товар] сейчас закончился или выведен из меню". НЕ предлагай его.
        2. Если товар есть в списке — расскажи о нем вкусно и предложи добавить его в корзину, указав ID в формате {{ID}}.
        3. Если просят "что-нибудь поесть" — посмотри разделы ФАСТФУД, ВЫПЕЧКА, ГОРЯЧЕЕ, СУПЫ в списке. Там есть Сосиски, Самса, Супы и т.д.
        4. Не придумывай цены. Бери их из списка.
        5. Будь краток и вежлив.
      `;

      // 3. Формируем историю
      const recentHistory = newHistory.slice(-6); 
      const apiMessages = [
          { role: 'system', content: systemPromptText },
          ...recentHistory
      ];

      const response = await fetch(`${TIMEWEB_API_URL}/chat/completions`, { 
          method: 'POST', 
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${TIMEWEB_API_KEY}`,
          },
          body: JSON.stringify({
              model: 'gemini-3-flash-preview', 
              messages: apiMessages,
              temperature: 0.4, // Понижаем температуру, чтобы он меньше фантазировал
              max_tokens: 800 
          }),
          signal: abortController.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`Ошибка сервера (${response.status})`);

      const data = await response.json();
      const aiText = data.choices?.[0]?.message?.content;
      
      if (!aiText) throw new Error("Пустой ответ.");

      setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);

    } catch (error: any) {
      console.error("AI Error:", error);
      const errorMsg = error.name === 'AbortError' ? '⏳ Долго думал...' : `⚠️ Ошибка связи`;
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
          if (finalText) {
              handleSend(finalText);
          }
      };

      recognition.onerror = (event: any) => {
          console.error("Speech error", event.error);
          setIsListening(false);
      };

      recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
              .map((result: any) => result[0].transcript)
              .join('');
          
          transcriptRef.current = transcript;
          setInput(transcript);
      };

      recognition.start();
  };

  const renderMessageContent = (text: string) => {
    const parts = text.split(/(\{\{.*?\}\})/g);
    return parts.map((part, index) => {
        if (part.startsWith('{{') && part.endsWith('}}')) {
            const productId = part.slice(2, -2).trim();
            const product = products.find(p => p.id === productId);
            if (!product) return null;

            return (
                <div key={index} className="my-2 p-2 bg-black/40 rounded-xl border border-brand-yellow/30 flex items-center gap-3 shadow-lg transform transition-all hover:scale-[1.02]">
                    <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-white text-sm truncate">{product.name}</div>
                        <div className="text-brand-yellow font-black text-xs">{product.variants[0].price}₽</div>
                    </div>
                    <button 
                        onClick={() => onAddToCart(product)}
                        className="bg-brand-yellow text-black p-2 rounded-lg font-bold text-xs shadow-md active:scale-95 transition-transform flex items-center gap-1"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Выбрать
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
           {/* Quick Suggestions */}
           <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
              {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => handleSend(s)} className="whitespace-nowrap px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-brand-muted hover:bg-white/10 hover:text-white transition-colors">
                      {s}
                  </button>
              ))}
           </div>

           {/* Input Bar */}
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
