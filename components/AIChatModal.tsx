import React, { useState, useRef, useEffect } from 'react';
import { MENU_ITEMS } from '../constants';
import { Product } from '../types';
import { SendIcon, SparklesIcon, PlusIcon } from './ui/Icons';

interface AIChatModalProps {
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  suggestedProducts?: Product[];
}

type AIProvider = 'demo' | 'pollinations' | 'deepseek' | 'gigachat';

// --- CONFIG ---
const ENV_KEY_GIGA = process.env.GIGACHAT_KEY || '';
const ENV_KEY_DEEP = process.env.DEEPSEEK_KEY || '';

// --- UUID for GigaChat ---
function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
    (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> (+c / 4)).toString(16)
  );
}

const AIChatModal: React.FC<AIChatModalProps> = ({ onClose, onSelectProduct }) => {
  // State
  const [provider, setProvider] = useState<AIProvider>('demo');
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Привет! Я ваш ИИ-бариста. Что хотите заказать? ☕️' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // GigaChat Token Cache
  const [gigaToken, setGigaToken] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- API PROVIDERS ---

  // 1. SMART DEMO MODE (Local Search Logic)
  const callDemoAPI = async (text: string) => {
    await new Promise(r => setTimeout(r, 600)); // Fake realistic delay
    const lower = text.toLowerCase();
    
    let responseText = "Извините, я не совсем понял. Попробуйте спросить про кофе, чай или десерты!";
    let foundIds: string[] = [];

    // 1. Поиск по точному совпадению в названии или категории
    const matchedItems = MENU_ITEMS.filter(item => {
        const nameMatch = item.name.toLowerCase().includes(lower);
        const catMatch = translateCategory(item.category).toLowerCase().includes(lower);
        const descMatch = item.description?.toLowerCase().includes(lower);
        
        // Особые кейсы
        if (lower.includes('поесть') && (item.category === 'food' || item.category === 'salads')) return true;
        if (lower.includes('пить') && item.isDrink) return true;
        if (lower.includes('слад') && item.category === 'sweets') return true;
        
        return nameMatch || catMatch || descMatch;
    });

    if (matchedItems.length > 0) {
        // Берем топ-3
        const top3 = matchedItems.slice(0, 3);
        foundIds = top3.map(i => i.id);
        const names = top3.map(i => i.name).join(', ');
        
        const phrases = [
            `Как насчет: ${names}? Выглядит аппетитно! 😋`,
            `Я нашел кое-что вкусное для вас: ${names}.`,
            `Отличный выбор! Могу предложить: ${names}.`,
            `Вот что у нас есть по вашему запросу: ${names}.`
        ];
        responseText = phrases[Math.floor(Math.random() * phrases.length)];
    } else {
        // Если ничего не найдено, проверяем общие фразы
        if (lower.includes('привет') || lower.includes('здравствуй')) {
            responseText = "Привет-привет! 👋 Готов принять заказ. Что будете?";
        } else if (lower.includes('спасибо')) {
            responseText = "Всегда пожалуйста! Обращайтесь 💛";
        } else if (lower.includes('пока')) {
            responseText = "До встречи! Заходите еще ☕️";
        }
    }

    return { text: responseText, ids: foundIds };
  };

  const translateCategory = (cat: string) => {
      const map: Record<string, string> = {
          coffee: 'кофе', tea: 'чай', seasonal: 'сезонное', punch: 'пунш',
          sweets: 'сладости десерт', soda: 'напитки вода лимонад', salads: 'салаты', food: 'еда перекус'
      };
      return map[cat] || '';
  };

  // 2. POLLINATIONS AI (Free, No Key)
  const callPollinationsAPI = async (text: string, history: Message[]) => {
    // Формируем контекст меню компактно
    const menuContext = MENU_ITEMS.map(i => `${i.name} (ID:${i.id}, ${i.variants[0].price}р)`).join('; ');
    
    const systemPrompt = `Ты бариста в кофейне Coffee Lunch.
Твоя цель: продавать товары из меню и вежливо общаться.
Меню: [ ${menuContext} ].
Правила:
1. Отвечай кратко, дружелюбно и весело (до 2 предложений).
2. Если ты рекомендуешь конкретный товар из меню, ты ОБЯЗАН в конце ответа добавить JSON строку: {"ids": ["id_товара"]}.
Пример: "Попробуйте наш Капучино, он отличный! {"ids": ["cappuccino"]}"
3. Не выдумывай товары, которых нет в меню.
4. Если клиент просто здоровается, просто поздоровайся и предложи меню.`;

    // Берем последние 4 сообщения для контекста, чтобы не перегружать URL
    const recentHistory = history.slice(-4).map(m => `${m.role === 'user' ? 'Клиент' : 'Бариста'}: ${m.content}`).join('\n');
    const fullPrompt = `${systemPrompt}\n\nДиалог:\n${recentHistory}\nКлиент: ${text}\nБариста:`;

    // Pollinations работает через GET запрос, кодируем промпт
    const url = `https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Pollinations API Error: ${response.status}`);
    
    const textData = await response.text();
    return parseAIResponse(textData);
  };

  // 3. DEEPSEEK API (Key Required)
  const callDeepSeekAPI = async (text: string, history: Message[], key: string) => {
    const menuContext = MENU_ITEMS.map(i => `${i.name} (${i.variants[0].price}р) ID:${i.id}`).join(', ');
    
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { 
            role: "system", 
            content: `Ты бариста. Меню: ${menuContext}. Отвечай кратко. Если советуешь товар, в конце добавь JSON: {"ids": ["id_товара"]}.` 
          },
          ...history.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
          { role: "user", content: text }
        ],
        stream: false
      })
    });

    if (!response.ok) {
        if (response.status === 402) {
            throw new Error("Нет средств (402). Переключитесь на Free AI (Pollinations).");
        }
        throw new Error(`DeepSeek Error: ${response.status}`);
    }
    const data = await response.json();
    const content = data.choices[0].message.content;
    return parseAIResponse(content);
  };

  // 4. GIGACHAT API (Via Proxy)
  const getGigaToken = async (key: string) => {
    // Try standard auth flow
    const proxyUrl = 'https://thingproxy.freeboard.io/fetch/https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
    const body = new URLSearchParams();
    body.append('scope', 'GIGACHAT_API_PERS');

    const res = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'RqUID': uuidv4(),
            'Authorization': `Basic ${key}`
        },
        body: body
    });
    
    if (!res.ok) throw new Error(`Auth Error ${res.status}`);
    const data = await res.json();
    return data.access_token;
  };

  const callGigaChatAPI = async (text: string, history: Message[], key: string) => {
    let token = gigaToken;
    if (!token) {
        token = await getGigaToken(key);
        setGigaToken(token);
    }

    const menuContext = MENU_ITEMS.map(i => `${i.name} (${i.variants[0].price}р) ID:${i.id}`).join(', ');
    const proxyUrl = 'https://thingproxy.freeboard.io/fetch/https://gigachat.devices.sberbank.ru/api/v1/chat/completions';

    const res = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            model: "GigaChat",
            messages: [
                { role: "system", content: `Ты бариста. Меню: ${menuContext}. Если советуешь, в конце JSON: {"ids": ["id"]}.` },
                ...history.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
                { role: "user", content: text }
            ]
        })
    });

    if (res.status === 401) {
        setGigaToken(null); // Clear token
        throw new Error("Token expired, retry");
    }
    
    if (!res.ok) throw new Error(`Giga Error ${res.status}`);
    const data = await res.json();
    return parseAIResponse(data.choices[0].message.content);
  };

  // Helper: Parse JSON from AI text
  const parseAIResponse = (raw: string) => {
    let text = raw;
    let ids: string[] = [];
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const json = JSON.parse(jsonMatch[0]);
        if (json.ids) ids = json.ids;
        text = raw.replace(jsonMatch[0], '').trim(); // Remove JSON from text
      }
    } catch (e) {}
    return { text, ids };
  };

  // --- HANDLERS ---

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    const userText = inputValue.trim();
    
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setInputValue('');
    setIsLoading(true);

    try {
      let result;
      if (provider === 'demo') {
          result = await callDemoAPI(userText);
      } else if (provider === 'pollinations') {
          result = await callPollinationsAPI(userText, messages);
      } else if (provider === 'deepseek') {
          result = await callDeepSeekAPI(userText, messages, apiKey || ENV_KEY_DEEP);
      } else if (provider === 'gigachat') {
          result = await callGigaChatAPI(userText, messages, apiKey || ENV_KEY_GIGA);
      }

      if (result) {
          const products = MENU_ITEMS.filter(i => result.ids.includes(i.id));
          setMessages(prev => [...prev, { role: 'assistant', content: result.text, suggestedProducts: products }]);
      }
    } catch (e: any) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'assistant', content: `Ошибка (${provider}): ${e.message}` }]);
      if (e.message.includes('401') || e.message.includes('402') || e.message.includes('403') || !apiKey) {
          setShowSettings(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose} />
      
      <div className="glass-modal w-full max-w-md h-[85vh] rounded-3xl relative z-10 animate-slide-up pointer-events-auto shadow-2xl flex flex-col overflow-hidden bg-[#09090b]">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-md">
          <div className="flex items-center gap-2" onClick={() => setShowSettings(!showSettings)}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-black shadow-lg cursor-pointer transition-colors ${
                 provider === 'demo' ? 'bg-gray-500' :
                 provider === 'pollinations' ? 'bg-blue-500' :
                 provider === 'deepseek' ? 'bg-brand-yellow' : 'bg-green-500'
            }`}>
              <SparklesIcon className="w-5 h-5" />
            </div>
            <div className="cursor-pointer">
              <h3 className="font-bold text-white text-sm">AI Бариста</h3>
              <p className="text-[10px] text-brand-muted uppercase tracking-wider">
                {provider === 'demo' && 'Smart Demo'}
                {provider === 'pollinations' && 'Free AI'}
                {provider === 'deepseek' && 'DeepSeek'}
                {provider === 'gigachat' && 'GigaChat'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-brand-muted hover:text-white p-2 text-sm font-bold">Закрыть</button>
        </div>

        {/* Settings Screen */}
        {showSettings ? (
             <div className="flex-1 p-6 flex flex-col animate-fade-in bg-black/40 overflow-y-auto no-scrollbar">
                <h3 className="text-white font-bold mb-4 text-lg">Настройки ИИ</h3>
                
                <label className="text-xs text-brand-muted mb-2 font-bold uppercase">Выберите мозг</label>
                <div className="flex flex-col gap-2 mb-6">
                    {/* Demo */}
                    <button 
                        onClick={() => { setProvider('demo'); setShowSettings(false); }}
                        className={`p-4 rounded-xl text-left border transition-all ${provider === 'demo' ? 'bg-white/10 border-gray-500 text-gray-200' : 'bg-black/20 border-white/10 text-brand-muted'}`}
                    >
                        <div className="font-bold flex items-center gap-2">🤖 Smart Demo (Оффлайн)</div>
                        <div className="text-[10px] opacity-70">Работает всегда. Простой поиск по меню.</div>
                    </button>

                    {/* Pollinations */}
                    <button 
                        onClick={() => { setProvider('pollinations'); setShowSettings(false); }}
                        className={`p-4 rounded-xl text-left border transition-all ${provider === 'pollinations' ? 'bg-white/10 border-blue-500 text-blue-400' : 'bg-black/20 border-white/10 text-brand-muted'}`}
                    >
                        <div className="font-bold flex items-center gap-2">🌐 Free AI (Pollinations)</div>
                        <div className="text-[10px] opacity-70">Бесплатно. Без ключей. Умный как ChatGPT.</div>
                    </button>

                    {/* DeepSeek */}
                    <button 
                        onClick={() => setProvider('deepseek')}
                        className={`p-4 rounded-xl text-left border transition-all ${provider === 'deepseek' ? 'bg-white/10 border-brand-yellow text-brand-yellow' : 'bg-black/20 border-white/10 text-brand-muted'}`}
                    >
                        <div className="font-bold">🐳 DeepSeek (Нужен ключ)</div>
                        <div className="text-[10px] opacity-70">Дешево, но нужен платный аккаунт.</div>
                    </button>

                    {/* GigaChat */}
                    <button 
                        onClick={() => setProvider('gigachat')}
                        className={`p-4 rounded-xl text-left border transition-all ${provider === 'gigachat' ? 'bg-white/10 border-green-500 text-green-400' : 'bg-black/20 border-white/10 text-brand-muted'}`}
                    >
                        <div className="font-bold">🟢 GigaChat</div>
                        <div className="text-[10px] opacity-70">Нужен прокси. Нестабильно в браузере.</div>
                    </button>
                </div>

                {(provider === 'deepseek' || provider === 'gigachat') && (
                    <>
                        <label className="text-xs text-brand-muted mb-2 font-bold uppercase">API Ключ ({provider})</label>
                        <input 
                            type="password" 
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder={provider === 'gigachat' ? "MDE..." : "sk-..."}
                            className="w-full glass-input p-3 rounded-xl text-white mb-4 outline-none focus:border-brand-yellow"
                        />
                        {provider === 'deepseek' && (
                            <p className="text-[10px] text-red-400 mb-2">
                                Ошибка 402 означает, что на балансе ключа нет денег. Пополните счет или используйте <b>Free AI</b>.
                            </p>
                        )}
                    </>
                )}

                <button onClick={() => setShowSettings(false)} className="mt-auto w-full bg-brand-yellow text-black font-bold py-3 rounded-xl">Готово</button>
             </div>
        ) : (
            <>
                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-brand-yellow text-black font-medium rounded-tr-none' : 'glass-panel text-white rounded-tl-none'}`}>
                            {msg.content}
                        </div>
                        {msg.role === 'assistant' && msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                            <div className="mt-2 flex flex-col gap-2 w-full max-w-[85%] animate-fade-in">
                            <span className="text-[10px] text-brand-muted font-bold uppercase ml-1">Найдено в меню:</span>
                            {msg.suggestedProducts.map(product => (
                                <div key={product.id} onClick={() => onSelectProduct(product)} className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all cursor-pointer group">
                                <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-white truncate group-hover:text-brand-yellow">{product.name}</h4>
                                    <p className="text-xs text-brand-muted">{product.variants[0].price}₽</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-brand-yellow text-black flex items-center justify-center"><PlusIcon className="w-5 h-5" /></div>
                                </div>
                            ))}
                            </div>
                        )}
                        </div>
                    ))}
                    {isLoading && <div className="flex justify-start"><div className="glass-panel px-4 py-3 rounded-2xl rounded-tl-none flex gap-1.5 animate-pulse"><div className="w-1.5 h-1.5 bg-brand-yellow rounded-full"></div><div className="w-1.5 h-1.5 bg-brand-yellow rounded-full delay-100"></div><div className="w-1.5 h-1.5 bg-brand-yellow rounded-full delay-200"></div></div></div>}
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
                        placeholder={
                            provider === 'demo' ? "Поиск по меню (Smart Demo)..." : 
                            provider === 'pollinations' ? "Спроси Free AI..." : "Спроси баристу..."
                        }
                        className="w-full glass-input text-white pl-4 pr-12 py-3.5 rounded-2xl outline-none focus:border-brand-yellow/50 transition-all placeholder:text-white/30" 
                    />
                    <button onClick={handleSend} disabled={isLoading || !inputValue.trim()} className="absolute right-2 p-2 bg-brand-yellow text-black rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"><SendIcon className="w-5 h-5" /></button>
                </div>
                </div>
            </>
        )}
      </div>
    </div>
  );
};

export default AIChatModal;
