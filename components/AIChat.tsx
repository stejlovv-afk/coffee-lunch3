
import React, { useState, useRef, useEffect } from 'react';
import { SparklesIcon, SendIcon, XMarkIcon, KeyIcon, PlusIcon } from './ui/Icons';
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

// Новый ключ API
const DEFAULT_KEY = 'AIzaSyCgAd7WzVgafJSYguKsch0JACo1MEPXauE';
// Ваш прокси
const DEFAULT_BASE_URL = 'https://ancient-wind-bb8b.stejlovv.workers.dev';

// Вернул 3 версии для теста стабильности
const AVAILABLE_MODELS = [
  { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite (Быстрая ⚡️)' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash (Баланс 🔥)' },
  { id: 'google/gemini-3-flash', name: 'Gemini 3 / Pro (Умная 🧠)' },
];

const AIChat: React.FC<AIChatProps> = ({ products, onClose, onAddToCart }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Привет! Я Зернышко ☕️\nСпроси меня, что сегодня вкусного, и я помогу выбрать!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Settings State
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('ai_api_key') || DEFAULT_KEY);
  const [selectedModel, setSelectedModel] = useState<string>(() => localStorage.getItem('ai_model') || AVAILABLE_MODELS[0].id);
  const [baseUrl, setBaseUrl] = useState<string>(() => localStorage.getItem('ai_base_url') || DEFAULT_BASE_URL);
  
  const [showSettings, setShowSettings] = useState(false);
  
  // Temp state for settings
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
      const cleanedUrl = tempBaseUrl.trim().replace(/\/$/, '');
      
      setApiKey(cleanedKey);
      setSelectedModel(tempModel);
      setBaseUrl(cleanedUrl || DEFAULT_BASE_URL);
      
      localStorage.setItem('ai_api_key', cleanedKey);
      localStorage.setItem('ai_model', tempModel);
      localStorage.setItem('ai_base_url', cleanedUrl || DEFAULT_BASE_URL);
      
      setShowSettings(false);
      setMessages(prev => [...prev, { role: 'assistant', content: '✅ Настройки сохранены. Попробуйте отправить сообщение.' }]);
  };

  // Маппинг названий моделей
  const getGoogleModelId = (orId: string) => {
      if (orId.includes('gemini-2.5-flash-lite')) return 'gemini-2.0-flash-lite-preview-02-05';
      if (orId.includes('gemini-2.5-flash')) return 'gemini-2.0-flash';
      if (orId.includes('gemini-3-flash')) return 'gemini-2.0-pro-exp-02-05'; 
      return 'gemini-2.0-flash-lite-preview-02-05';
  };

  const readStream = async (response: Response, onChunk: (text: string) => void) => {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      let buffer = '';
      
      while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data: ')) continue;
              
              const dataStr = trimmed.slice(6);
              if (dataStr === '[DONE]') continue;

              try {
                  const data = JSON.parse(dataStr);
                  if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                      onChunk(data.candidates[0].content.parts[0].text);
                  } else if (data.choices?.[0]?.delta?.content) {
                      onChunk(data.choices[0].delta.content);
                  }
              } catch (e) { 
                  // Игнорируем ошибки парсинга неполных JSON
              }
          }
      }
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
    const newHistory: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newHistory);
    setIsLoading(true);

    // Placeholder для ответа
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 40000); // 40 сек таймаут

    try {
      const menuContext = products.map(p => 
        `- ${p.name} (${p.category}) ID:${p.id} : ${p.variants[0].price}₽`
      ).join('\n');

      const systemPromptText = `
        Ты - "Зернышко", веселый бариста в кофейне "Coffee Lunch".
        МЕНЮ:
        ${menuContext}

        ПРАВИЛА:
        1. Вкусно опиши и продай товар.
        2. Советуя товар, пиши его ID в конце предложения: {{ID_ТОВАРА}}.
           Пример: "Возьми капучино! {{cappuccino}}".
        3. Будь краток и весел. Используй эмодзи.
        4. Язык: Русский.
      `;

      const isGoogleKey = apiKey.startsWith('AIza');
      let url = '';
      let body: any = {};
      let headers: any = { 'Content-Type': 'application/json' };

      if (isGoogleKey) {
          const googleModel = getGoogleModelId(selectedModel);
          // Добавляем streamGenerateContent
          url = `${baseUrl}/v1beta/models/${googleModel}:streamGenerateContent?alt=sse&key=${apiKey}`;
          
          const validHistory = newHistory.filter(m => m.content.trim() !== '' && !m.content.includes('✅ Настройки'));
          const contents = validHistory.map(m => ({
              role: m.role === 'user' ? 'user' : 'model',
              parts: [{ text: m.content }]
          }));

          body = {
              contents: contents,
              systemInstruction: { parts: [{ text: systemPromptText }] },
              generationConfig: { temperature: 0.7 }
          };

      } else {
          // Fallback для OpenRouter
          url = "https://openrouter.ai/api/v1/chat/completions";
          headers['Authorization'] = `Bearer ${apiKey}`;
          headers['HTTP-Referer'] = "https://coffee-lunch-app.github.io";
          headers['X-Title'] = "Coffee Lunch App";
          
          body = {
              model: selectedModel,
              stream: true,
              messages: [
                { role: "system", content: systemPromptText },
                ...newHistory.map(m => ({ role: m.role, content: m.content }))
              ]
          };
      }

      const response = await fetch(url, { 
          method: 'POST', 
          headers, 
          body: JSON.stringify(body),
          signal: abortController.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error Response:", errorText);
          if (response.status === 401 || response.status === 403) throw new Error("Ошибка ключа (403). Проверьте настройки.");
          if (response.status === 404) throw new Error("Модель не найдена (404). Выберите другую версию.");
          if (response.status === 429) throw new Error("Лимит исчерпан (429).");
          if (response.status === 500) throw new Error("Ошибка сервера AI (500). Попробуйте позже.");
          throw new Error(`Ошибка сети (${response.status})`);
      }

      let fullText = '';
      await readStream(response, (chunk) => {
          fullText += chunk;
          setMessages(prev => {
              const newMsgs = [...prev];
              const lastIdx = newMsgs.length - 1;
              if (lastIdx >= 0 && newMsgs[lastIdx].role === 'assistant') {
                  newMsgs[lastIdx] = { ...newMsgs[lastIdx], content: fullText };
              }
              return newMsgs;
          });
      });

      // Если после стрима текст пустой (иногда бывает при ошибках прокси, которые отдают 200 OK но без данных)
      if (!fullText) {
           throw new Error("Пустой ответ от сервера.");
      }

    } catch (error: any) {
      console.error("AI Chat Error:", error);
      setMessages(prev => {
          const newMsgs = [...prev];
          const lastIdx = newMsgs.length - 1;
          if (lastIdx >= 0 && newMsgs[lastIdx].role === 'assistant') {
               const currentContent = newMsgs[lastIdx].content;
               // Если есть контент, не затираем его ошибкой, а добавляем
               const errorMsg = error.name === 'AbortError' ? '⏳ Слишком долгое ожидание.' : `⚠️ ${error.message}`;
               
               // Если контента еще не было, показываем ошибку
               if (!currentContent) {
                   newMsgs[lastIdx] = { ...newMsgs[lastIdx], content: errorMsg };
               } else {
                   // Если контент был (обрыв стрима), добавляем пометку
                   newMsgs[lastIdx] = { ...newMsgs[lastIdx], content: currentContent + `\n\n[${errorMsg}]` };
               }
          }
          return newMsgs;
      });
      
      // Показываем настройки при критических ошибках
      if (error.message.includes("403") || error.message.includes("429") || error.message.includes("404")) {
          setTimeout(() => setShowSettings(true), 1500);
      }
    } finally {
      setIsLoading(false);
      clearTimeout(timeoutId);
    }
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
               <p className="text-[10px] text-brand-muted font-bold uppercase tracking-wider">Online</p>
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
                        <h3 className="text-xl font-bold text-white">Настройки</h3>
                        
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
                            <label className="text-xs font-bold text-brand-muted uppercase ml-1">API Ключ</label>
                            <input 
                                type="password" 
                                value={tempKey}
                                onChange={(e) => setTempKey(e.target.value)}
                                className="w-full glass-input p-3 rounded-xl text-white outline-none focus:border-brand-yellow/50 font-mono text-xs"
                            />
                        </div>

                        <div className="space-y-1 text-left">
                            <label className="text-xs font-bold text-brand-muted uppercase ml-1">Прокси URL</label>
                            <input 
                                type="text" 
                                value={tempBaseUrl}
                                onChange={(e) => setTempBaseUrl(e.target.value)}
                                className="w-full glass-input p-3 rounded-xl text-white outline-none focus:border-brand-yellow/50 font-mono text-xs"
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
            {isLoading && !messages[messages.length - 1]?.content && (
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
