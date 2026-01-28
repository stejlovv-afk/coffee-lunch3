
import React, { useState, useRef, useEffect } from 'react';
import { SparklesIcon, SendIcon, XMarkIcon, KeyIcon, PlusIcon } from './ui/Icons';
import { Product } from '../types';

interface AIChatProps {
  products: Product[];
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

interface Message {
  role: 'user' | 'model'; // Google API использует 'model' вместо 'assistant'
  content: string;
}

// 1. ТВОЙ GOOGLE КЛЮЧ
const DEFAULT_KEY = 'AIzaSyCgAd7WzVgafJSYguKsch0JACo1MEPXauE';

// 2. ТВОЙ CLOUDFLARE ПРОКСИ
const DEFAULT_BASE_URL = 'https://ancient-wind-bb8b.stejlovv.workers.dev';

// 3. ДОСТУПНЫЕ МОДЕЛИ (ID должны соответствовать тем, что принимает API)
// Обычно 'gemini-2.5' в API это 'gemini-2.0-flash-lite-preview-02-05' или просто 'gemini-1.5-flash'
const AVAILABLE_MODELS = [
  { id: 'gemini-2.0-flash-lite-preview-02-05', name: 'Gemini 2.5 Flash Lite (Быстрая ⚡️)' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Стабильная 🔥)' },
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Exp (Мощная 🧠)' },
];

const AIChat: React.FC<AIChatProps> = ({ products, onClose, onAddToCart }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: 'Привет! Я Зернышко ☕️\nЯ знаю всё о нашем меню. Что ты хочешь попробовать?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Settings State
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('google_api_key') || DEFAULT_KEY);
  const [baseUrl, setBaseUrl] = useState<string>(() => localStorage.getItem('google_proxy_url') || DEFAULT_BASE_URL);
  const [selectedModel, setSelectedModel] = useState<string>(() => localStorage.getItem('google_model') || AVAILABLE_MODELS[0].id);
  
  const [showSettings, setShowSettings] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);
  const [tempUrl, setTempUrl] = useState(baseUrl);
  const [tempModel, setTempModel] = useState(selectedModel);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, showSettings]);

  // Sync settings helper
  useEffect(() => {
    if (showSettings) {
        setTempKey(apiKey);
        setTempUrl(baseUrl);
        setTempModel(selectedModel);
    }
  }, [showSettings, apiKey, baseUrl, selectedModel]);

  const handleSaveSettings = () => {
      const cleanedKey = tempKey.trim();
      const cleanedUrl = tempUrl.trim().replace(/\/$/, ''); // убираем слеш в конце
      
      setApiKey(cleanedKey);
      setBaseUrl(cleanedUrl);
      setSelectedModel(tempModel);
      
      localStorage.setItem('google_api_key', cleanedKey);
      localStorage.setItem('google_proxy_url', cleanedUrl);
      localStorage.setItem('google_model', tempModel);
      
      setShowSettings(false);
      setMessages(prev => [...prev, { role: 'model', content: '✅ Настройки обновлены.' }]);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (!apiKey) {
        setShowSettings(true);
        setMessages(prev => [...prev, { role: 'model', content: '🔑 Пожалуйста, проверьте API ключ.' }]);
        return;
    }

    const userMessage = input.trim();
    setInput('');
    const newHistory: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newHistory);
    setIsLoading(true);

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 60000); 

    try {
      // 1. Формируем контекст меню
      const menuContext = products.map(p => 
        `- ${p.name} (${p.category}) ID:${p.id} : ${p.variants[0].price}₽`
      ).join('\n');

      const systemPromptText = `
        Ты - "Зернышко", веселый бариста в кофейне "Coffee Lunch".
        МЕНЮ:
        ${menuContext}

        ПРАВИЛА:
        1. Твоя цель - помочь выбрать и продать. Предлагай вкусные сочетания.
        2. ВАЖНО: Когда советуешь конкретный товар, пиши его ID в формате {{ID}}. 
           Пример: "Возьми капучино! {{cappuccino}}"
        3. Не выдумывай цены.
        4. Будь краток и позитивен.
        5. Отвечай на русском языке.
      `;

      // 2. Формируем историю чата для Google API (формат: contents: [{role, parts: [{text}]}])
      // Google требует чередования user/model и не любит пустые сообщения
      const apiContents = newHistory
        .filter(msg => msg.content && !msg.content.includes('Настройки обновлены')) // Фильтруем системные сообщения UI
        .map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

      // 3. Собираем URL и тело запроса
      // Используем generateContent (не stream) чтобы прокси точно отдал ответ
      const endpoint = `${baseUrl}/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
      
      const payload = {
          contents: apiContents,
          systemInstruction: {
            parts: [{ text: systemPromptText }]
          },
          generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 800
          }
      };

      // 4. Отправляем запрос
      const response = await fetch(endpoint, { 
          method: 'POST', 
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          signal: abortController.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
          const errorText = await response.text();
          console.error("Google API Error:", errorText);
          
          if (response.status === 403 || response.status === 400) throw new Error("Ошибка ключа или модели (400/403). Проверьте настройки.");
          if (response.status === 404) throw new Error("Модель не найдена (404) или неверный путь.");
          if (response.status === 500) throw new Error("Ошибка сервера Google (500).");
          
          throw new Error(`Ошибка сети (${response.status})`);
      }

      const data = await response.json();
      
      // Парсим ответ Google
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!aiText) {
          throw new Error("Пришел пустой ответ от нейросети.");
      }

      setMessages(prev => [...prev, { role: 'model', content: aiText }]);

    } catch (error: any) {
      console.error("AI Chat Error:", error);
      const errorMsg = error.name === 'AbortError' ? '⏳ Время ожидания истекло.' : `⚠️ ${error.message}`;
      setMessages(prev => [...prev, { role: 'model', content: errorMsg }]);
      
      if (error.message.includes("403") || error.message.includes("404")) {
          setTimeout(() => setShowSettings(true), 1500);
      }
    } finally {
      setIsLoading(false);
      clearTimeout(timeoutId);
    }
  };

  const renderMessageContent = (text: string) => {
    // Рендер кнопок товаров {{ID}}
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
               <p className="text-[10px] text-brand-muted font-bold uppercase tracking-wider">Online • Google Cloud</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
              <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-full hover:bg-white/10 transition-colors ${!apiKey ? 'text-red-400 animate-pulse' : 'text-brand-muted hover:text-white'}`}>
                <KeyIcon className="w-5 h-5" />
              </button>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-brand-muted hover:text-white transition-colors">
                <XMarkIcon className="w-6 h-6" />
              </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
            
            {/* Settings Overlay */}
            {showSettings && (
                <div className="absolute inset-0 z-20 bg-black/95 backdrop-blur-xl p-6 flex flex-col items-center justify-center animate-fade-in text-center">
                    <div className="w-full max-w-xs space-y-4 overflow-y-auto max-h-full py-2 no-scrollbar">
                        <h3 className="text-xl font-bold text-white">Настройки API</h3>
                        
                        <div className="space-y-1 text-left">
                            <label className="text-xs font-bold text-brand-muted uppercase ml-1">Модель</label>
                            <div className="space-y-1">
                                {AVAILABLE_MODELS.map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => setTempModel(m.id)}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                                            tempModel === m.id 
                                            ? 'bg-brand-yellow text-black border-brand-yellow' 
                                            : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                                        }`}
                                    >
                                        {m.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1 text-left">
                            <label className="text-xs font-bold text-brand-muted uppercase ml-1">Google API Key</label>
                            <input 
                                type="password" 
                                value={tempKey}
                                onChange={(e) => setTempKey(e.target.value)}
                                className="w-full glass-input p-3 rounded-xl text-white outline-none focus:border-brand-yellow/50 font-mono text-xs"
                                placeholder="AIza..."
                            />
                        </div>

                         <div className="space-y-1 text-left">
                            <label className="text-xs font-bold text-brand-muted uppercase ml-1">Proxy URL</label>
                            <input 
                                type="text" 
                                value={tempUrl}
                                onChange={(e) => setTempUrl(e.target.value)}
                                className="w-full glass-input p-3 rounded-xl text-white outline-none focus:border-brand-yellow/50 font-mono text-xs"
                                placeholder="https://..."
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button onClick={() => setShowSettings(false)} className="flex-1 py-3 text-brand-muted font-bold hover:text-white transition-colors">Отмена</button>
                            <button onClick={handleSaveSettings} className="flex-1 py-3 bg-brand-yellow text-black rounded-xl font-bold shadow-lg">Сохранить</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Messages */}
            <div className="absolute inset-0 z-10 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-black/20 to-transparent">
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                    className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                    msg.role === 'user' 
                        ? 'bg-brand-yellow text-black rounded-tr-none font-medium' 
                        : 'bg-white/10 text-white border border-white/5 rounded-tl-none'
                    }`}
                >
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

        {/* Input Area */}
        <div className="p-4 bg-black/40 border-t border-white/10 backdrop-blur-xl safe-area-bottom z-30">
           <div className="flex gap-2">
             <input 
               type="text" 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSend()}
               disabled={showSettings}
               placeholder="Что посоветуешь?" 
               className="flex-1 glass-input text-white p-3 rounded-xl outline-none focus:border-brand-yellow/50 transition-all placeholder:text-brand-muted/50"
             />
             <button 
               onClick={handleSend}
               disabled={isLoading || !input.trim() || showSettings}
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
