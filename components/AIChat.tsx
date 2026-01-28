
import React, { useState, useRef, useEffect } from 'react';
import { SparklesIcon, SendIcon, XMarkIcon } from './ui/Icons';
import { Product } from '../types';

interface AIChatProps {
  products: Product[];
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// NOTE: In production, it is recommended to use a Proxy Server to hide the API Key.
// For this mini-app demo, we are using the client-side call directly.
const API_KEY = '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';

const AIChat: React.FC<AIChatProps> = ({ products, onClose, onAddToCart }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Привет! Я ваш AI-бариста. ☕️\nНе знаете, что выбрать? Расскажите, что вы любите (сладкое, с кислинкой, сытное), и я посоветую идеальный вариант!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Create context from products
      // We limit the context size slightly to ensure speed
      const menuContext = products.map(p => 
        `- ${p.name} (${p.category}): ${p.variants[0].price}₽`
      ).join('\n');

      const systemPrompt = `
        Ты - дружелюбный и харизматичный бариста в кофейне "Coffee Lunch". 
        Твоя цель - помочь клиенту выбрать еду и напитки из меню.
        
        МЕНЮ:
        ${menuContext}

        ПРАВИЛА:
        1. Рекомендуй ТОЛЬКО позиции из списка выше. Если товара нет, скажи, что его нет, и предложи альтернативу.
        2. Всегда старайся вежливо предложить дополнение (Upsell). Например: "К этому кофе отлично подойдет наш круассан" или "Добавим сироп?".
        3. Отвечай кратко, с эмодзи, дружелюбно.
        4. Если клиент спрашивает цену, бери её из меню.
        5. Язык общения: Русский.
      `;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          // OpenRouter requires a valid URL for the Referer. 
          // Using a hardcoded valid URL bypasses issues with 'localhost' or 'file://' in WebViews.
          "HTTP-Referer": "https://coffee-lunch-app.github.io", 
          "X-Title": "Coffee Lunch App",        
        },
        body: JSON.stringify({
          "model": "google/gemini-flash-1.5", 
          "messages": [
            { "role": "system", "content": systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { "role": "user", "content": userMessage }
          ]
        })
      });

      // Check for HTTP errors first
      if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Ошибка API (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      
      if (data.error) {
          throw new Error(data.error.message || "API вернул ошибку");
      }

      if (data.choices && data.choices.length > 0) {
        const aiResponse = data.choices[0].message.content;
        setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Пустой ответ от нейросети.' }]);
      }

    } catch (error: any) {
      console.error("AI Chat Error:", error);
      // Display the ACTUAL error to the user for debugging purposes
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${error.message || 'Неизвестная ошибка сети'}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto transition-opacity" onClick={onClose} />
      
      <div className="glass-modal w-full max-w-md h-[85vh] sm:rounded-3xl rounded-t-3xl flex flex-col relative z-10 animate-slide-up pointer-events-auto shadow-2xl overflow-hidden border border-brand-yellow/20">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-brand-dark/90 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-brand-yellow/20 flex items-center justify-center border border-brand-yellow/30">
               <SparklesIcon className="w-5 h-5 text-brand-yellow" />
            </div>
            <div>
               <h3 className="font-bold text-white leading-tight">AI Бариста</h3>
               <p className="text-[10px] text-brand-muted font-bold uppercase tracking-wider">Powered by Gemini</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-brand-muted hover:text-white transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-black/20 to-transparent">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-brand-yellow text-black rounded-tr-none font-medium' 
                    : 'bg-white/10 text-white border border-white/5 rounded-tl-none'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex justify-start">
               <div className="bg-white/10 p-3 rounded-2xl rounded-tl-none flex gap-1">
                 <div className="w-2 h-2 bg-brand-yellow rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-brand-yellow rounded-full animate-bounce delay-100"></div>
                 <div className="w-2 h-2 bg-brand-yellow rounded-full animate-bounce delay-200"></div>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-black/40 border-t border-white/10 backdrop-blur-xl safe-area-bottom">
           <div className="flex gap-2">
             <input 
               type="text" 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSend()}
               placeholder="Посоветуй что-нибудь к кофе..." 
               className="flex-1 glass-input text-white p-3 rounded-xl outline-none focus:border-brand-yellow/50 transition-all placeholder:text-brand-muted/50"
             />
             <button 
               onClick={handleSend}
               disabled={isLoading || !input.trim()}
               className={`p-3 rounded-xl transition-all flex items-center justify-center aspect-square ${
                 !input.trim() 
                   ? 'bg-white/5 text-brand-muted' 
                   : 'bg-brand-yellow text-black shadow-[0_0_15px_rgba(250,204,21,0.4)] active:scale-95'
               }`}
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
