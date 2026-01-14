import React, { useState, useRef, useEffect } from 'react';
import { MENU_ITEMS } from '../constants';
import { Product } from '../types';
import { SendIcon, SparklesIcon, PlusIcon } from './ui/Icons';

interface AIChatModalProps {
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

interface Message {
  role: 'user' | 'assistant'; // GigaChat использует 'assistant' вместо 'model'
  content: string;
  suggestedProducts?: Product[];
}

// Простой генератор UUID для RqUID запросов GigaChat
function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
    (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> (+c / 4)).toString(16)
  );
}

const AIChatModal: React.FC<AIChatModalProps> = ({ onClose, onSelectProduct }) => {
  // 1. Ключ Авторизации GigaChat (Base64)
  const envKey = (process.env as any).GIGACHAT_KEY || (process.env as any).API_KEY; // Поддержка старого названия для удобства
  // 2. Локальный ключ пользователя
  const [userKey, setUserKey] = useState(localStorage.getItem('user_gigachat_key') || '');
  // 3. Токен доступа (живет 30 минут)
  const [accessToken, setAccessToken] = useState<string | null>(null);
  
  const activeKey = envKey && envKey.length > 0 ? envKey : userKey;
  const hasKey = !!activeKey;

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Привет! Я Giga-Бариста ☕️. Подсказать что-нибудь вкусное?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [tempKeyInput, setTempKeyInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveUserKey = () => {
    if (tempKeyInput.trim().length > 10) {
        localStorage.setItem('user_gigachat_key', tempKeyInput.trim());
        setUserKey(tempKeyInput.trim());
    } else {
        alert("Ключ слишком короткий. Нужен Authorization Key (Base64).");
    }
  };

  // --- GIGACHAT API LOGIC ---

  // 1. Получение токена
  const getGigaToken = async (authKey: string) => {
    // ВНИМАНИЕ: Запросы с фронтенда могут блокироваться CORS политикой Sberbank.
    // Если это происходит, нужно использовать прокси.
    try {
        const response = await fetch('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'RqUID': uuidv4(),
                'Authorization': `Basic ${authKey}`
            },
            body: 'scope=GIGACHAT_API_PERS'
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Ошибка авторизации (${response.status}): ${err}`);
        }

        const data = await response.json();
        return data.access_token;
    } catch (e: any) {
        console.error("GigaChat Auth Error:", e);
        throw e;
    }
  };

  // 2. Отправка сообщения
  const sendGigaMessage = async (token: string, history: Message[], userText: string, systemPrompt: string) => {
    const payload = {
        model: "GigaChat", // или GigaChat:latest
        messages: [
            { role: "system", content: systemPrompt },
            ...history.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: userText }
        ],
        temperature: 0.7,
        max_tokens: 1024
    };

    const response = await fetch('https://gigachat.devices.sberbank.ru/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        // Проверяем, не протух ли токен (401)
        if (response.status === 401) {
             throw new Error("TOKEN_EXPIRED");
        }
        const err = await response.text();
        throw new Error(`Ошибка генерации (${response.status}): ${err}`);
    }

    return await response.json();
  };


  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg = inputValue.trim();
    const newMessages = [...messages, { role: 'user', content: userMsg } as Message];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      if (!activeKey) throw new Error("Нет ключа GigaChat.");

      // Логика получения/обновления токена
      let currentToken = accessToken;
      if (!currentToken) {
          try {
             currentToken = await getGigaToken(activeKey);
             setAccessToken(currentToken);
          } catch (e: any) {
             // Если ошибка сети (CORS), выводим понятное сообщение
             if (e.message.includes("Failed to fetch")) {
                 throw new Error("Браузер заблокировал запрос к Сберу (CORS). Это ограничение Telegram WebApp. Попробуйте отключить защиту CORS или использовать сервер-посредник.");
             }
             throw e;
          }
      }

      // Контекст меню
      const menuContext = MENU_ITEMS.map(item => 
        `- ${item.name} (${item.variants[0].price}р). ID: ${item.id}`
      ).join('\n');

      const systemInstruction = `
        Ты — бариста в кофейне "Coffee Lunch".
        МЕНЮ:
        ${menuContext}
        
        ТВОЯ ЗАДАЧА:
        1. Отвечай кратко, дружелюбно, используй эмодзи.
        2. Если советуешь товар из меню, верни JSON в конце ответа (без форматирования Markdown).
        
        ФОРМАТ ОТВЕТА (JSON):
        {"text": "Текст ответа...", "ids": ["id1", "id2"]}
        
        Если JSON не нужен, просто пиши текст, а в конце добавь пустой JSON: {"text": "...", "ids": []}
        Отвечай строго валидным JSON объектом, где поле "text" это твой ответ пользователю.
      `;

      // Попытка отправить сообщение
      let responseData;
      try {
          responseData = await sendGigaMessage(currentToken!, messages, userMsg, systemInstruction);
      } catch (e: any) {
          if (e.message === "TOKEN_EXPIRED") {
              // Пробуем обновить токен один раз
              console.log("Токен протух, обновляем...");
              const newToken = await getGigaToken(activeKey);
              setAccessToken(newToken);
              responseData = await sendGigaMessage(newToken, messages, userMsg, systemInstruction);
          } else {
              throw e;
          }
      }

      const rawContent = responseData.choices[0].message.content;
      console.log("GigaChat Raw:", rawContent);

      // Парсинг JSON ответа от GigaChat
      let finalText = rawContent;
      let suggestedProducts: Product[] = [];

      try {
          // GigaChat иногда добавляет текст до или после JSON, или оборачивает в ```json
          // Попытаемся найти JSON объект в строке
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
              const jsonStr = jsonMatch[0];
              const parsed = JSON.parse(jsonStr);
              if (parsed.text) finalText = parsed.text;
              if (parsed.ids && Array.isArray(parsed.ids)) {
                  suggestedProducts = MENU_ITEMS.filter(item => parsed.ids.includes(item.id));
              }
          }
      } catch (e) {
          console.warn("Ошибка парсинга JSON от GigaChat, выводим как есть.");
      }
      
      // Удаляем сам JSON из текста, если он там остался в явном виде и мы его распарсили
      // (Упрощенно: если распарсили успешно, finalText уже чистый, если нет - выводим всё)

      setMessages(prev => [...prev, { role: 'assistant', content: finalText, suggestedProducts }]);

    } catch (error: any) {
      console.error('GigaChat Error:', error);
      let errorText = `Ошибка: ${error.message}`;
      
      if (error.message.includes('401') || error.message.includes('auth')) {
          errorText = "Ошибка авторизации GigaChat. Проверьте ключ (должен быть Base64).";
          localStorage.removeItem('user_gigachat_key');
          setUserKey('');
          setAccessToken(null);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: errorText }]);
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

        {!hasKey ? (
            // --- NO KEY STATE (Input Form) ---
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                    <SparklesIcon className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Настройка GigaChat</h3>
                <p className="text-brand-muted text-sm mb-6 max-w-[280px]">
                    Введите <b>Authorization Key</b> из консоли GigaChat API (строка Base64).
                </p>
                <input 
                    type="password" 
                    value={tempKeyInput}
                    onChange={(e) => setTempKeyInput(e.target.value)}
                    placeholder="Пример: MTNh...="
                    className="w-full glass-input p-3 rounded-xl text-center text-white mb-3 outline-none focus:border-green-500"
                />
                <button 
                    onClick={saveUserKey}
                    className="w-full bg-green-500 text-black font-bold py-3 rounded-xl active:scale-95 transition-transform"
                >
                    Сохранить и начать
                </button>
                <a href="https://developers.sber.ru/portal/products/gigachat-api" target="_blank" rel="noreferrer" className="mt-4 text-xs text-brand-muted underline opacity-50 hover:opacity-100">
                    Получить ключ (Sber Developers)
                </a>
            </div>
        ) : (
            // --- CHAT STATE ---
            <>
                <div className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-green-500 text-black font-medium rounded-tr-none shadow-green-500/10' : 'glass-panel text-white rounded-tl-none border border-white/10'}`}>
                        {msg.content}
                    </div>
                    
                    {/* Suggestions */}
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
                            <div className="w-8 h-8 rounded-full bg-green-500 text-black flex items-center justify-center shadow-lg transform group-hover:rotate-90 transition-transform"><PlusIcon className="w-5 h-5" /></div>
                            </div>
                        ))}
                        </div>
                    )}
                    </div>
                ))}
                {isLoading && <div className="flex justify-start"><div className="glass-panel px-4 py-3 rounded-2xl rounded-tl-none flex gap-1.5 items-center"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce delay-100"></div><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce delay-200"></div></div></div>}
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
