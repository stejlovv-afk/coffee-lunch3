
import React, { useState, useRef, useEffect } from 'react';
import { SparklesIcon, SendIcon, XMarkIcon, KeyIcon } from './ui/Icons';
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

const DEFAULT_KEY = '';
// Используем ваш Cloudflare Worker как прокси по умолчанию для обхода блокировок в РФ
const DEFAULT_BASE_URL = 'https://ancient-wind-bb8b.stejlovv.workers.dev';

const AVAILABLE_MODELS = [
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Fast)' },
  { id: 'google/gemini-2.0-pro-exp-02-05:free', name: 'Gemini 2.0 Pro (Smart)' },
  { id: 'google/gemini-flash-1.5', name: 'Gemini 1.5 Flash (Stable)' },
];

const AIChat: React.FC<AIChatProps> = ({ products, onClose, onAddToCart }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Привет! Я ваш AI-бариста. ☕️\nНе знаете, что выбрать? Расскажите свои предпочтения, и я помогу!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Settings State
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('ai_api_key') || DEFAULT_KEY);
  const [selectedModel, setSelectedModel] = useState<string>(() => localStorage.getItem('ai_model') || AVAILABLE_MODELS[0].id);
  const [baseUrl, setBaseUrl] = useState<string>(() => localStorage.getItem('ai_base_url') || DEFAULT_BASE_URL);
  
  const [showSettings, setShowSettings] = useState(false);
  
  // Temp state
  const [tempKey, setTempKey] = useState(apiKey);
  const [tempModel, setTempModel] = useState(selectedModel);
  const [tempBaseUrl, setTempBaseUrl] = useState(baseUrl);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, showSettings]);

  useEffect(() => {
    if (showSettings) {
        setTempKey(apiKey);
        setTempModel(selectedModel);
        setTempBaseUrl(baseUrl);
    }
  }, [showSettings, apiKey, selectedModel, baseUrl]);

  const handleSaveSettings = () => {
      const cleanedKey = tempKey.trim();
      const cleanedUrl = tempBaseUrl.trim().replace(/\/$/, ''); // remove trailing slash
      
      setApiKey(cleanedKey);
      setSelectedModel(tempModel);
      setBaseUrl(cleanedUrl || DEFAULT_BASE_URL);
      
      localStorage.setItem('ai_api_key', cleanedKey);
      localStorage.setItem('ai_model', tempModel);
      localStorage.setItem('ai_base_url', cleanedUrl || DEFAULT_BASE_URL);
      
      setShowSettings(false);
      setMessages(prev => [...prev, { role: 'assistant', content: '✅ Настройки сохранены.' }]);
  };

  const getGoogleModelId = (orId: string) => {
      if (orId.includes('gemini-2.0-pro')) return 'gemini-2.0-pro-exp-02-05';
      if (orId.includes('gemini-2.0-flash')) return 'gemini-2.0-flash-exp';
      return 'gemini-1.5-flash';
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (!apiKey) {
        setShowSettings(true);
        setMessages(prev => [...prev, { role: 'assistant', content: '🔑 Введите API ключ.' }]);
        return;
    }

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const menuContext = products.map(p => 
        `- ${p.name} (${p.category}): ${p.variants[0].price}₽`
      ).join('\n');

      const systemPromptText = `
        Ты - бариста в кофейне "Coffee Lunch". 
        Твоя цель - помочь клиенту выбрать из меню.
        
        МЕНЮ:
        ${menuContext}

        ПРАВИЛА:
        1. Рекомендуй ТОЛЬКО позиции из меню.
        2. Будь кратким, используй эмодзи.
        3. Предлагай дополнения (сироп, десерт).
        4. Язык: Русский.
      `;

      const isGoogleKey = apiKey.startsWith('AIza');
      let response;

      if (isGoogleKey) {
          // --- DIRECT GOOGLE API (via Proxy if set) ---
          const googleModel = getGoogleModelId(selectedModel);
          // Use the configured Base URL (Proxy or Default)
          const url = `${baseUrl}/v1beta/models/${googleModel}:generateContent?key=${apiKey}`;
          
          const contents = messages.map(m => ({
              role: m.role === 'user' ? 'user' : 'model',
              parts: [{ text: m.content }]
          }));
          contents.push({ role: 'user', parts: [{ text: userMessage }] });

          response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  contents: contents,
                  systemInstruction: { parts: [{ text: systemPromptText }] }
              })
          });

      } else {
          // --- OPENROUTER API ---
          response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://coffee-lunch-app.github.io", 
              "X-Title": "Coffee Lunch App",        
            },
            body: JSON.stringify({
              "model": selectedModel,
              "messages": [
                { "role": "system", "content": systemPromptText },
                ...messages.map(m => ({ role: m.role, content: m.content })),
                { "role": "user", "content": userMessage }
              ]
            })
          });
      }

      if (!response.ok) {
          const errorText = await response.text();
          if (response.status === 401 || response.status === 403) throw new Error("Ошибка доступа (403/401). Проверьте ключ или прокси.");
          if (response.status === 429) throw new Error("Лимит исчерпан (429).");
          if (response.status === 404) throw new Error("Неверный адрес API (404).");
          throw new Error(`Ошибка сети (${response.status})`);
      }

      const data = await response.json();
      let aiResponse = "";

      if (isGoogleKey) {
          if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
              aiResponse = data.candidates[0].content.parts[0].text;
          } else {
              aiResponse = "Ошибка: пустой ответ от Google.";
          }
      } else {
          if (data.choices && data.choices.length > 0) {
            aiResponse = data.choices[0].message.content;
          } else if (data.error) {
             throw new Error(data.error.message);
          } else {
             aiResponse = "Пустой ответ.";
          }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);

    } catch (error: any) {
      console.error("AI Chat Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${error.message}` }]);
      if (error.message.includes("403") || error.message.includes("429")) setShowSettings(true);
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
               <p className="text-[10px] text-brand-muted font-bold uppercase tracking-wider">
                   {apiKey.startsWith('AIza') ? 'Google API (Proxy)' : 'OpenRouter'}
               </p>
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
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1">Настройки</h3>
                            <p className="text-[10px] text-brand-muted">
                                Используйте ключ Google.
                                <br/>Прокси для РФ настроен автоматически.
                            </p>
                            <a 
                                href="https://aistudio.google.com/app/apikey" 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-[10px] text-blue-400 underline block mt-1"
                            >
                                Получить ключ Google (бесплатно)
                            </a>
                        </div>
                        
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
                            <label className="text-xs font-bold text-brand-muted uppercase ml-1">API Ключ (Google)</label>
                            <input 
                                type="password" 
                                value={tempKey}
                                onChange={(e) => setTempKey(e.target.value)}
                                placeholder="AIza..."
                                className="w-full glass-input p-3 rounded-xl text-white outline-none focus:border-brand-yellow/50 font-mono text-xs"
                            />
                        </div>

                        <div className="space-y-1 text-left">
                            <label className="text-xs font-bold text-brand-muted uppercase ml-1 flex items-center justify-between">
                                <span>Прокси URL</span>
                                <span className="text-[9px] opacity-50 text-white">Cloudflare</span>
                            </label>
                            <input 
                                type="text" 
                                value={tempBaseUrl}
                                onChange={(e) => setTempBaseUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full glass-input p-3 rounded-xl text-white outline-none focus:border-brand-yellow/50 font-mono text-xs"
                            />
                            <p className="text-[9px] text-brand-muted pl-1 leading-tight">
                                URL вашего воркера. Уже вставлен по умолчанию.
                            </p>
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
                    {msg.content}
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
               placeholder="Посоветуй десерт..." 
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
