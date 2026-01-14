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

// 1. Сначала пробуем взять из ENV (GitHub Secrets)
// 2. Если нет, берем жестко прописанный ключ (для локальной работы)
const ENV_KEY = process.env.GIGACHAT_KEY;
const FALLBACK_KEY = 'MDE5YmJlYzUtMDJhYi03NmQ5LTgzYzQtMjA0YWE4OGY5ODZhOjUxOTYwNGFiLTI3MTctNDRiOS1iY2FjLWJkODhlMTcxZmIzYg==';

const INITIAL_KEY = ENV_KEY || FALLBACK_KEY || '';

// Простой генератор UUID для RqUID
function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
    (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> (+c / 4)).toString(16)
  );
}

const AIChatModal: React.FC<AIChatModalProps> = ({ onClose, onSelectProduct }) => {
  // Ключ, который мы используем сейчас (может быть перезаписан пользователем вручную)
  const [activeKey, setActiveKey] = useState<string>(INITIAL_KEY);
  const [showKeyInput, setShowKeyInput] = useState<boolean>(!INITIAL_KEY);
  const [tempKeyInput, setTempKeyInput] = useState('');

  // Токен доступа (временный, полученный от OAuth)
  const [accessToken, setAccessToken] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Привет! Я Giga-Бариста ☕️. Подсказать что-нибудь вкусное?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- GIGACHAT API VIA PROXY ---

  const getGigaToken = async (keyToUse: string) => {
    try {
        if (!keyToUse) {
            throw new Error("Ключ API отсутствует.");
        }

        // Используем прокси, чтобы обойти CORS ограничения браузера
        const targetUrl = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
        const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(targetUrl);

        console.log("Запрашиваем токен...");

        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'RqUID': uuidv4(),
                'Authorization': `Basic ${keyToUse}`
            },
            body: 'scope=GIGACHAT_API_PERS'
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("Ошибка OAuth:", response.status, err);
            // Если 403 или 401 - скорее всего проблема с ключом
            if (response.status === 401 || response.status === 403) {
                 throw new Error("AUTH_ERROR");
            }
            throw new Error(`Ошибка сети (${response.status})`);
        }

        const data = await response.json();
        console.log("Токен получен успешно");
        return data.access_token;
    } catch (e: any) {
        console.error("GigaChat Auth Exception:", e);
        throw e;
    }
  };

  const sendGigaMessage = async (token: string, history: Message[], userText: string, systemPrompt: string) => {
    const payload = {
        model: "GigaChat", 
        messages: [
            { role: "system", content: systemPrompt },
            ...history.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: userText }
        ],
        temperature: 0.7,
        max_tokens: 800 
    };

    const targetUrl = 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions';
    const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(targetUrl);

    const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        if (response.status === 401) throw new Error("TOKEN_EXPIRED");
        const err = await response.text();
        throw new Error(`Chat Error (${response.status}): ${err}`);
    }

    return await response.json();
  };

  const handleManualKeySave = () => {
      if (tempKeyInput.length > 20) {
          setActiveKey(tempKeyInput);
          setShowKeyInput(false);
          // Попытка сбросить состояние ошибки, если оно было
          setMessages([{ role: 'assistant', content: 'Ключ обновлен! Попробуйте написать что-нибудь снова.' }]);
      } else {
          alert("Ключ слишком короткий");
      }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg = inputValue.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInputValue('');
    setIsLoading(true);

    try {
      let currentToken = accessToken;
      
      // Если токена нет, получаем его
      if (!currentToken) {
          try {
             currentToken = await getGigaToken(activeKey);
             setAccessToken(currentToken);
          } catch (e: any) {
             if (e.message === "AUTH_ERROR") {
                 setMessages(prev => [...prev, { role: 'assistant', content: "Ошибка авторизации (403). Проверьте ключ." }]);
                 setShowKeyInput(true); // Показываем поле ввода
                 setIsLoading(false);
                 return;
             }
             throw new Error(e.message || "Не удалось подключиться к GigaChat.");
          }
      }

      const menuContext = MENU_ITEMS.map(item => 
        `- ${item.name} (${item.variants[0].price}р). ID: ${item.id}`
      ).join('\n');

      const systemInstruction = `
        Ты — бариста в "Coffee Lunch". Меню:
        ${menuContext}
        
        Задача:
        1. Отвечай кратко и весело (с эмодзи).
        2. Если советуешь что-то, верни JSON в конце: {"text": "ответ...", "ids": ["id1"]}
        Если просто болтаешь: {"text": "ответ...", "ids": []}
        Отвечай ТОЛЬКО валидным JSON.
      `;

      let responseData;
      try {
          responseData = await sendGigaMessage(currentToken!, messages, userMsg, systemInstruction);
      } catch (e: any) {
          if (e.message === "TOKEN_EXPIRED") {
              // Обновляем токен и пробуем снова
              const newToken = await getGigaToken(activeKey);
              setAccessToken(newToken);
              responseData = await sendGigaMessage(newToken, messages, userMsg, systemInstruction);
          } else {
              throw e;
          }
      }

      const rawContent = responseData.choices[0].message.content;
      
      // Парсинг ответа
      let finalText = rawContent;
      let suggestedProducts: Product[] = [];

      try {
          // Ищем JSON в ответе
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed.text) finalText = parsed.text;
              if (parsed.ids && Array.isArray(parsed.ids)) {
                  suggestedProducts = MENU_ITEMS.filter(item => parsed.ids.includes(item.id));
              }
          }
      } catch (e) {
          console.warn("Не удалось распарсить JSON, показываем как есть.");
      }

      setMessages(prev => [...prev, { role: 'assistant', content: finalText, suggestedProducts }]);

    } catch (error: any) {
      console.error('GigaChat Process Error:', error);
      const errorText = `Ошибка: ${error.message}`;
      setMessages(prev => [...prev, { role: 'assistant', content: errorText }]);
      
      // Если ошибка 403/401, даем возможность ввести ключ заново
      if (error.message.includes('403') || error.message.includes('401')) {
          setShowKeyInput(true);
      }
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
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-black shadow-[0_0_10px_rgba(34,197,94,0.5)]">
              <SparklesIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">GigaChat</h3>
              <p className="text-[10px] text-brand-muted">Sber AI Barista</p>
            </div>
          </div>
          <button onClick={onClose} className="text-brand-muted hover:text-white p-2 text-sm font-bold transition-colors">Закрыть</button>
        </div>

        {/* Экран ввода ключа (если ошибка 403 или ключа нет) */}
        {showKeyInput ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in bg-black/20">
                <SparklesIcon className="w-10 h-10 text-brand-yellow mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Настройка доступа</h3>
                <p className="text-brand-muted text-xs mb-4">
                   Похоже, текущий ключ устарел или неверен. Введите "Авторизационные данные" из GigaChat Studio.
                </p>
                <input 
                    type="password" 
                    value={tempKeyInput}
                    onChange={(e) => setTempKeyInput(e.target.value)}
                    placeholder="Введите ключ (MDE5...)"
                    className="w-full glass-input p-3 rounded-xl text-center text-white mb-3 outline-none focus:border-green-500"
                />
                <button 
                    onClick={handleManualKeySave}
                    className="w-full bg-green-500 text-black font-bold py-3 rounded-xl active:scale-95 transition-transform"
                >
                    Сохранить
                </button>
            </div>
        ) : (
            <>
                <div className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-green-500 text-black font-medium rounded-tr-none shadow-green-500/10' : 'glass-panel text-white rounded-tl-none border border-white/10'}`}>
                            {msg.content}
                        </div>
                        {msg.role === 'assistant' && msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                            <div className="mt-2 flex flex-col gap-2 w-full max-w-[85%] animate-fade-in">
                            <span className="text-[10px] text-brand-muted font-bold uppercase ml-1">Рекомендую:</span>
                            {msg.suggestedProducts.map(product => (
                                <div key={product.id} onClick={() => handleProductClick(product)} className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-green-500/30 active:scale-95 transition-all cursor-pointer group">
                                <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-white truncate group-hover:text-green-500 transition-colors">{product.name}</h4>
                                    <p className="text-xs text-brand-muted">{product.variants[0].price}₽</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-green-500 text-black flex items-center justify-center shadow-lg"><PlusIcon className="w-5 h-5" /></div>
                                </div>
                            ))}
                            </div>
                        )}
                        </div>
                    ))}
                    {isLoading && <div className="flex justify-start"><div className="glass-panel px-4 py-3 rounded-2xl rounded-tl-none flex gap-1.5 items-center"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce delay-100"></div><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce delay-200"></div></div></div>}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-3 border-t border-white/10 bg-black/60 backdrop-blur-xl">
                <div className="relative flex items-center">
                    <input 
                        type="text" 
                        value={inputValue} 
                        onChange={(e) => setInputValue(e.target.value)} 
                        onKeyDown={handleKeyDown} 
                        placeholder="Спроси GigaChat..." 
                        className="w-full glass-input text-white pl-4 pr-12 py-3.5 rounded-2xl outline-none focus:border-green-500/50 transition-all placeholder:text-white/30" 
                    />
                    <button onClick={handleSend} disabled={isLoading || !inputValue.trim()} className="absolute right-2 p-2 bg-green-500 text-black rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-lg"><SendIcon className="w-5 h-5" /></button>
                </div>
                </div>
            </>
        )}
      </div>
    </div>
  );
};

export default AIChatModal;
