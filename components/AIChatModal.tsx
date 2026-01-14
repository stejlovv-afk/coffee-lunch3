import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { MENU_ITEMS } from '../constants';
import { Product } from '../types';
import { SendIcon, SparklesIcon, PlusIcon } from './ui/Icons';

interface AIChatModalProps {
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

interface Message {
  role: 'user' | 'model';
  text: string;
  suggestedProducts?: Product[];
}

// Схема ответа для JSON режима
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    answerText: {
      type: Type.STRING,
      description: "Текст ответа баристы, дружелюбный и с эмодзи."
    },
    suggestedItemIds: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Массив ID товаров из меню, которые подходят под запрос (максимум 3)."
    }
  },
  required: ["answerText", "suggestedItemIds"],
};

const AIChatModal: React.FC<AIChatModalProps> = ({ onClose, onSelectProduct }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Привет! Я твой ИИ-Бариста ☕️. Подсказать что-нибудь бодрящее или сладкое?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg = inputValue.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInputValue('');
    setIsLoading(true);

    try {
      // 1. Получаем ключ. Используем "as any", чтобы TypeScript не ругался на отсутствие API_KEY в типах Node
      // Vite заменит process.env.API_KEY на строку во время сборки.
      const apiKey = (process.env as any).API_KEY;
      
      if (!apiKey || apiKey.trim() === '') {
        throw new Error("API Key is missing. Check GitHub Secrets configuration.");
      }

      // 2. Инициализация клиента
      const ai = new GoogleGenAI({ apiKey });
      
      // 3. Формируем контекст меню
      const menuContext = MENU_ITEMS.map(item => 
        `ID:${item.id}|Name:${item.name}|Price:${item.variants[0].price}rub`
      ).join('\n');

      const systemInstruction = `
        Ты — опытный бариста в кофейне "Coffee Lunch". 
        Твоя задача — консультировать гостей и продавать им вкусные сочетания из меню.
        
        МЕНЮ:
        ${menuContext}
        
        ПРАВИЛА:
        1. Отвечай кратко, тепло, используй эмодзи.
        2. Если гость просит совет, предложи 1-2 конкретных товара из меню.
        3. Твой ответ ВСЕГДА должен быть в формате JSON.
      `;

      // 4. Запрос к модели
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: [
            ...messages.map(m => ({ 
                role: m.role, 
                parts: [{ text: m.text }] 
            })),
            { role: 'user', parts: [{ text: userMsg }] }
        ],
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.6,
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        }
      });

      // 5. Обработка ответа
      let rawText = response.text || '{}';
      rawText = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      
      let jsonResponse;
      try {
        jsonResponse = JSON.parse(rawText);
      } catch (e) {
        console.error("JSON Parse Error", e);
        jsonResponse = { answerText: "Что-то пошло не так, но я всё равно готов принять заказ!", suggestedItemIds: [] };
      }

      const text = jsonResponse.answerText || '...';
      const itemIds = jsonResponse.suggestedItemIds || [];

      const suggestedProducts = MENU_ITEMS.filter(item => itemIds.includes(item.id));

      setMessages(prev => [...prev, { role: 'model', text, suggestedProducts }]);

    } catch (error: any) {
      console.error('AI Error:', error);
      let errorText = 'Упс, связь с космосом прервалась. Попробуй еще раз!';
      
      if (error.message && error.message.includes('API Key is missing')) {
         errorText = 'Ошибка настройки: Не найден API ключ (GEMINI_API_KEY).';
      }

      setMessages(prev => [...prev, { role: 'model', text: errorText }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductClick = (product: Product) => {
    onSelectProduct(product);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose} />
      
      <div className="glass-modal w-full max-w-md h-[85vh] rounded-3xl relative z-10 animate-slide-up pointer-events-auto shadow-2xl flex flex-col overflow-hidden border border-white/10 bg-[#09090b]">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-yellow flex items-center justify-center text-black shadow-[0_0_10px_rgba(250,204,21,0.5)]">
              <SparklesIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">ИИ-Бариста</h3>
              <p className="text-[10px] text-brand-muted">Coffee Lunch</p>
            </div>
          </div>
          <button onClick={onClose} className="text-brand-muted hover:text-white p-2 text-sm font-bold transition-colors">Закрыть</button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-brand-yellow text-black font-medium rounded-tr-none shadow-yellow-500/10' : 'glass-panel text-white rounded-tl-none border border-white/10'}`}>
                {msg.text}
              </div>
              
              {/* Suggestions */}
              {msg.role === 'model' && msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                <div className="mt-2 flex flex-col gap-2 w-full max-w-[85%] animate-fade-in">
                  <span className="text-[10px] text-brand-muted font-bold uppercase ml-1">Рекомендую:</span>
                  {msg.suggestedProducts.map(product => (
                    <div key={product.id} onClick={() => handleProductClick(product)} className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-brand-yellow/30 active:scale-95 transition-all cursor-pointer group">
                      <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate group-hover:text-brand-yellow transition-colors">{product.name}</h4>
                        <p className="text-xs text-brand-muted">{product.variants[0].price}₽</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-brand-yellow text-black flex items-center justify-center shadow-lg transform group-hover:rotate-90 transition-transform"><PlusIcon className="w-5 h-5" /></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {isLoading && <div className="flex justify-start"><div className="glass-panel px-4 py-3 rounded-2xl rounded-tl-none flex gap-1.5 items-center"><div className="w-1.5 h-1.5 bg-brand-yellow rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-brand-yellow rounded-full animate-bounce delay-100"></div><div className="w-1.5 h-1.5 bg-brand-yellow rounded-full animate-bounce delay-200"></div></div></div>}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 border-t border-white/10 bg-black/60 backdrop-blur-xl">
          <div className="relative flex items-center">
            <input 
                type="text" 
                value={inputValue} 
                onChange={(e) => setInputValue(e.target.value)} 
                onKeyDown={handleKeyDown} 
                placeholder="Посоветуй кофе..." 
                className="w-full glass-input text-white pl-4 pr-12 py-3.5 rounded-2xl outline-none focus:border-brand-yellow/50 transition-all placeholder:text-white/30" 
            />
            <button onClick={handleSend} disabled={isLoading || !inputValue.trim()} className="absolute right-2 p-2 bg-brand-yellow text-black rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-lg"><SendIcon className="w-5 h-5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatModal;
