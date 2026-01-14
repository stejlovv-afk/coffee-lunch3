import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { MENU_ITEMS } from '../constants';
import { SendIcon, SparklesIcon } from './ui/Icons';

interface AIChatModalProps {
  onClose: () => void;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AIChatModal: React.FC<AIChatModalProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Привет! Я твой ИИ-Бариста ☕️. Подсказать, какой кофе выбрать, или подобрать десерт к напитку?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
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
      // Инициализация Gemini Client
      // ВАЖНО: process.env.API_KEY должен быть настроен в вашей среде сборки (Vite .env)
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      // Формируем контекст меню для нейросети
      const menuContext = MENU_ITEMS.map(item => 
        `- ${item.name} (${item.category}): ${item.variants.map(v => v.price + 'р').join('/')} ${item.description || ''}`
      ).join('\n');

      const systemInstruction = `
        Ты дружелюбный и экспертный бариста в кофейне "Coffee Lunch".
        Твоя цель: помогать клиентам выбирать напитки и еду, основываясь на их предпочтениях.
        
        Вот наше актуальное меню (используй только его, не выдумывай позиции):
        ${menuContext}
        
        Правила:
        1. Если клиент спрашивает "что взять", узнай его предпочтения (кислое/горькое, с молоком/без, горячее/холодное).
        2. Всегда предлагай "пейринг" (сочетание). Например: к капучино предложи круассан или шоколад.
        3. Отвечай кратко, емко и с эмодзи. Стиль общения: неформальный, теплый.
        4. Если просят что-то, чего нет в меню, вежливо скажи об этом и предложи альтернативу из меню.
        5. Цены указывай в рублях.
      `;

      // Используем модель gemini-1.5-flash как более быструю для чатов (или 2.5-flash по инструкции, если доступна)
      // В инструкции сказано использовать gemini-3-flash-preview для простых текстовых задач, 
      // но для чата лучше всего подходит модель с хорошей историей контекста. 
      // Используем gemini-3-flash-preview как указано в лучших практиках для текстовых задач.
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
            ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
            { role: 'user', parts: [{ text: userMsg }] }
        ],
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.7, // Немного креативности
        }
      });

      const text = response.text || 'Извините, я задумался о зернах и прослушал... Повторите?';
      
      setMessages(prev => [...prev, { role: 'model', text }]);

    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'Упс, у меня перерыв на кофе (ошибка связи). Попробуйте позже!' }]);
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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose} />
      
      {/* Modal Window */}
      <div className="glass-modal w-full max-w-md h-[80vh] rounded-3xl relative z-10 animate-slide-up pointer-events-auto shadow-2xl flex flex-col overflow-hidden border border-white/10 bg-[#09090b]">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-yellow flex items-center justify-center text-black">
              <SparklesIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">ИИ-Бариста</h3>
              <p className="text-[10px] text-brand-muted">Онлайн • Знает всё о кофе</p>
            </div>
          </div>
          <button onClick={onClose} className="text-brand-muted hover:text-white p-2 text-sm font-bold">Закрыть</button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-brand-yellow text-black font-medium rounded-tr-none shadow-lg shadow-yellow-500/10' 
                    : 'glass-panel text-white rounded-tl-none border border-white/10'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex justify-start">
               <div className="glass-panel px-4 py-3 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
                 <div className="w-1.5 h-1.5 bg-brand-muted rounded-full animate-bounce"></div>
                 <div className="w-1.5 h-1.5 bg-brand-muted rounded-full animate-bounce delay-100"></div>
                 <div className="w-1.5 h-1.5 bg-brand-muted rounded-full animate-bounce delay-200"></div>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 border-t border-white/10 bg-black/40 backdrop-blur-md">
          <div className="relative flex items-center">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Спроси про кофе..." 
              className="w-full glass-input text-white pl-4 pr-12 py-3.5 rounded-2xl outline-none focus:border-brand-yellow/50 transition-all placeholder:text-white/20"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !inputValue.trim()}
              className="absolute right-2 p-2 bg-brand-yellow text-black rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
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
