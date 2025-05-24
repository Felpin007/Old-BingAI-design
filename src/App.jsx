import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import bingLogoUrl from './assets/bing logo2.svg';
import compareIconUrl from './assets/compare.png';
import writeIconUrl from './assets/write.png';
import codeIconUrl from './assets/code.png';
import travelIconUrl from './assets/travel.png';
import createIconUrl from './assets/create.png';
import chatIconUrl from './assets/chat.png';
import shoppingIconUrl from './assets/shopping.png';
import './App.css';
function CodeBlock({ node, inline, className = '', children, ...props }) {
  if (inline) {
    return (
      <code
        className={className}
        style={{ background: '#f4f4f4', border: 'none', color: 'inherit', borderRadius: 4, padding: '2px 4px', display: 'inline' }}
        {...props}
      >
        {children}
      </code>
    );
  }
  let codeString = '';
  if (Array.isArray(children)) {
    codeString = children.map(child => typeof child === 'string' ? child : (child?.props?.children ?? '')).join('');
  } else if (typeof children === 'string') {
    codeString = children;
  } else if (children && typeof children === 'object' && children.props && children.props.children) {
    codeString = children.props.children;
  } else {
    codeString = String(children ?? '');
  }
  codeString = codeString.replace(/\n$/, '');
  if (/^[^\n]+$/.test(codeString.trim())) {
    return (
      <code
        className={className}
        style={{ background: '#f4f4f4', border: 'none', color: 'inherit', borderRadius: 4, padding: '2px 4px', display: 'inline' }}
        {...props}
      >
        {children}
      </code>
    );
  }
  const [isCopied, setIsCopied] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button
        className="copy-code-btn"
        onClick={() => {
          if (navigator.clipboard && codeString) {
            navigator.clipboard.writeText(codeString).then(() => {
              setIsCopied(true);
              setTimeout(() => setIsCopied(false), 2000);
            });
          }
        }}
        title="Copiar código"
        aria-label="Copiar código para a área de transferência"
        style={{ position: 'absolute', top: 7, right: 7, zIndex: 2 }}
      >
        {isCopied ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z"/>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path d="M13 0H6a2 2 0 0 0-2 2 2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2 2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm0 13V4a2 2 0 0 0-2-2H5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1zM3 4a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4z"/>
          </svg>
        )}
      </button>
      <pre className={className} {...props}><code>{children}</code></pre>
    </div>
  );
}


function App() {
  const [activeStyle, setActiveStyle] = useState('creative');
  const [inputValue, setInputValue] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const maxChars = 4000;
  const currentLength = inputValue.length;
  const chatSessionRef = useRef(null);
  const mainContentRef = useRef(null);
  const [aiResponseCountInTopic, setAiResponseCountInTopic] = useState(0);  const GEMINI_MODELS = [
    {
      id: 'gemini-2.5-pro-exp-03-25',
      label: 'Gemini 2.5 Pro',
      description: 'Pensamento e raciocínio aprimorados, compreensão multimodal, programação avançada e muito mais',
    },
    {
      id: 'gemini-2.5-flash-preview',
      label: 'Gemini 2.5 Flash',
      description: 'Pensamento e raciocínio aprimorados, compreensão multimodal, programação avançada e muito mais',
    },
    {
      id: 'gemini-2.0-flash',
      label: 'Gemini 2.0 Flash',
      description: 'Recursos, velocidade, pensamento, streaming em tempo real e geração multimodais de última geração',
    },
    {
      id: 'gemini-2.0-flash-lite',
      label: 'Gemini 2.0 Flash-Lite',
      description: 'Eficiência de custos e baixa latência',
    },
    {
      id: 'gemini-1.5-flash',
      label: 'Gemini 1.5 Flash',
      description: 'Desempenho rápido e versátil em várias tarefas',
    },
    {
      id: 'gemini-1.5-flash-8b',
      label: 'Gemini 1.5 Flash-8B',
      description: 'Tarefas de alto volume e baixa inteligência',
    },
    {
      id: 'gemini-1.5-pro',
      label: 'Gemini 1.5 Pro',
      description: 'Tarefas de raciocínio complexas que exigem mais inteligência',
    },
  ];
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('geminiModel') || 'gemini-2.0-flash');    useEffect(() => {
      const body = document.body;
      body.classList.remove('theme-creative', 'theme-balanced', 'theme-precise');
      body.classList.add(`theme-${activeStyle}`);
    }, [activeStyle]);

    useEffect(() => {
      const savedApiKey = localStorage.getItem('geminiApiKey');
      if (savedApiKey) {
        setApiKey(savedApiKey);
      }
    }, []);
  useEffect(() => {
    const savedModel = localStorage.getItem('geminiModel');
    if (savedModel) setSelectedModel(savedModel);
  }, []);
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = mainContentRef.current.scrollHeight;
    }
  }, [messages]);


  const handleSendMessage = async () => {
    if (!inputValue.trim() || !apiKey) {
      if (!apiKey) {
        console.error("API Key is missing. Please add it in settings.");
        setMessages(prev => [...prev, { text: 'Por favor, insira sua chave API do Gemini nas configurações.', sender: 'ai' }]);
      }
      return;
    }

    const userMessage = { text: inputValue, sender: 'user' };
    const currentInput = inputValue;
    const currentMessages = [...messages, userMessage];

    const nextSequenceNumber = aiResponseCountInTopic + 1;
    const aiPlaceholderMessage = {
      text: '',
      sender: 'ai',
      sequenceNumber: nextSequenceNumber
    };
    setMessages([...currentMessages, aiPlaceholderMessage]);
    setAiResponseCountInTopic(nextSequenceNumber); 
    setInputValue('');
    setIsLoading(true);

    try {
      const genAI = new GoogleGenAI({ apiKey: apiKey });
      const model = selectedModel;
      let temperature;
      switch (activeStyle) {
        case 'creative':
          temperature = 0.9;
          break;
        case 'balanced':
          temperature = 0.5;
          break;
        case 'precise':
          temperature = 0.1;
          break;
        default:
          temperature = 0.5;
      }

      if (!chatSessionRef.current) {
        const history = messages
          .filter(msg => msg.sender === 'user' || msg.sender === 'ai')
          .map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          }));

        chatSessionRef.current = genAI.chats.create({
          model: model,
          history: history,
        });
      }
      const stream = await chatSessionRef.current.sendMessageStream({
        message: currentInput,
        generationConfig: {
          temperature: temperature,
        },
      });
      let accumulatedText = '';

      for await (const chunk of stream) {
        const chunkText = chunk.text;
        accumulatedText += chunkText;
        setMessages(prevMessages => {
          const updatedMessages = [...prevMessages];
          const lastMessageIndex = updatedMessages.length - 1;
          if (lastMessageIndex >= 0 && updatedMessages[lastMessageIndex].sender === 'ai') {
            updatedMessages[lastMessageIndex] = {
              ...updatedMessages[lastMessageIndex],
              text: updatedMessages[lastMessageIndex].text + chunkText
            };
          }
          return updatedMessages;
        });
      }

    } catch (error) {
      console.error("Error calling Gemini API:", error);
      let errorMessage = 'Erro ao conectar com a API do Gemini.';
      if (error.response && error.response.promptFeedback) {
          errorMessage += ` Feedback: ${JSON.stringify(error.response.promptFeedback)}`;
      } else if (error.message.includes('API key not valid')) {
          errorMessage = 'Chave API inválida. Verifique nas configurações.';
      } else if (error.message.includes('Quota exceeded')) {
          errorMessage = 'Cota da API excedida. Tente novamente mais tarde.';
      } else if (error.message.includes('history is required')) {
          errorMessage = 'Erro de histórico. Tente iniciar um novo tópico.';
          chatSessionRef.current = null;
      }          setMessages(prevMessages => {
              const updatedMessages = [...prevMessages];
              const lastMessageIndex = updatedMessages.length - 1;
              if (lastMessageIndex >= 0 && updatedMessages[lastMessageIndex].sender === 'ai' && updatedMessages[lastMessageIndex].text === '') {
                 updatedMessages[lastMessageIndex] = {
                   ...updatedMessages[lastMessageIndex],
                   text: errorMessage
                 };
              } else {
                  const errorSequence = aiResponseCountInTopic + 1;
                  updatedMessages.push({ text: errorMessage, sender: 'ai', sequenceNumber: errorSequence });
                  setAiResponseCountInTopic(errorSequence);
              }
              return updatedMessages;
            });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="app-container" className={isSidebarOpen ? 'sidebar-open' : ''}> {/* Removed theme class, only sidebar class */}
      <header className="header">
        <div className="header-logo">
          <svg viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h9.5v9.5H0z" fill="#7fba00"/><path d="M11.5 0H21v9.5H11.5z" fill="#f25022"/><path d="M0 11.5h9.5V21H0z" fill="#ffb900"/><path d="M11.5 11.5H21V21H11.5z" fill="#00a4ef"/></svg>
          Macrosoft Bingo
        </div>
        <nav className="header-nav">
          <a href="#">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-search" viewBox="0 0 16 16">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
            </svg>
            <span className="mobile-hidden-text">Search</span>
          </a>
          <a href="#" className="active">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chat-dots-fill" viewBox="0 0 16 16">
              <path d="M16 8c0 3.866-3.582 7-8 7a9.06 9.06 0 0 1-2.347-.306c-.584.296-1.925.864-4.181 1.234-.2.032-.352-.176-.273-.362.354-.836.674-1.95.77-2.966C.744 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7zM5 8a1 1 0 1 0-2 0 1 1 0 0 0 2 0zm4 0a1 1 0 1 0-2 0 1 1 0 0 0 2 0zm3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
            </svg>
            <span className="mobile-hidden-text">Chat</span>
          </a>
        </nav>
        <div className="header-controls">
          <button className="settings-gear" onClick={() => setShowSettingsModal(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
              <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
            </svg>
          </button>
          <button className="hamburger-menu" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zM2.5 4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
            </svg>
          </button>
        </div>
      </header>

      <div className="app-body"> {/* Added wrapper */}
        <main className="main-content" ref={mainContentRef}>
        <img src={bingLogoUrl} className="bing-logo-main" alt="Bing Logo" />


        <h1 className="main-headline">Bingo is your AI-powered copilot for the web</h1>

        {/* Wrap cards in row containers */}
        <div className="suggestions-grid-container">
          <div className="suggestions-grid suggestions-grid-row1">
            <div className="suggestion-card" data-category="Compare">
              <div className="card-header">
                <img src={compareIconUrl} alt="Compare icon" className="card-icon" />
                <span className="card-category">Compare</span>
              </div>
              <p className="card-prompt">I'm thinking of making a career change. Can you help me go through pros and cons?</p>
            </div>
            <div className="suggestion-card" data-category="Write">
              <div className="card-header">
                <img src={writeIconUrl} alt="Write icon" className="card-icon" />
                <span className="card-category">Write</span>
              </div>
              <p className="card-prompt">Write the outline of a book report to help me get started</p>
            </div>
            <div className="suggestion-card mobile-hidden-card" data-category="Code">
              <div className="card-header">
                <img src={codeIconUrl} alt="Code icon" className="card-icon" />
                <span className="card-category">Code</span>
              </div>
              <p className="card-prompt">Write a Python script to perform Binary search</p>
            </div>
            <div className="suggestion-card mobile-hidden-card" data-category="Travel">
              <div className="card-header">
                <img src={travelIconUrl} alt="Travel icon" className="card-icon" />
                <span className="card-category">Travel</span>
              </div>
              <p className="card-prompt">Where should I travel if I have pollen allergies?</p>
            </div>
          </div>
          <div className="suggestions-grid suggestions-grid-row2">
            <div className="suggestion-card mobile-hidden-card" data-category="Create">
              <div className="card-header">
                <img src={createIconUrl} alt="Create icon" className="card-icon" />
                <span className="card-category">Create</span>
              </div>
              <p className="card-prompt">Write a short essay that analyzes the merits of universal basic income</p>
            </div>
            <div className="suggestion-card mobile-hidden-card" data-category="Design">
              <div className="card-header">
                <img src={chatIconUrl} alt="Design icon" className="card-icon" />
                <span className="card-category">Design</span>
              </div>
              <p className="card-prompt">Create a renaissance-era painting of a farmhouse at dawn</p>
            </div>
          <div className="suggestion-card mobile-hidden-card" data-category="Summarize">
            <div className="card-header">
               <img src={shoppingIconUrl} alt="Summarize icon" className="card-icon" />
              <span className="card-category">Summarize</span>
            </div>
            <p className="card-prompt">Summarize the main points of the latest tech news article I missed.</p>
          </div>
         </div>
        </div>

        <div className="preview-disclaimer">
          <span className="preview-tag">Preview</span>
          Bing is powered by AI, so surprises and mistakes are possible. Please share feedback so we can improve!
          <a href="#">Terms</a> | <a href="#">Privacy</a>
        </div>

        <div className="style-selector">
          <div className="style-selector-label">Choose a conversation style</div>
          <div className="style-buttons">
            {['creative', 'balanced', 'precise'].map(style => (
              <button
                key={style}
                className={`style-button ${activeStyle === style ? 'active' : ''}`}
                data-style={style}
                onClick={() => setActiveStyle(style)}
              >
                <span className="style-label">More</span>{style.charAt(0).toUpperCase() + style.slice(1)}
              </button>
            ))}
          </div>
        </div>
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            {message.sender === 'user' ? (
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeHighlight, rehypeKatex]}>
                {message.text}
              </ReactMarkdown>
            ) : (
              <div className="ai-message-wrapper">
                <div className="ai-message-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeHighlight, rehypeKatex]}
                    components={{
                      code: CodeBlock,
                      pre: ({node, ...props}) => <>{props.children}</>
                    }}
                  >
                    {message.text}
                  </ReactMarkdown>
                </div>
                {/* Render footer only if there's text or it's loading (to show structure during stream) */}
                {(message.text || isLoading) && (
                  <div className="ai-message-footer-container">
                    <hr className="ai-message-separator" />
                    <div className="ai-message-footer">
                      <span className="ai-message-counter">{message.sequenceNumber || 1} of ∞</span>
                      <span className="ai-message-indicator"></span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {/* Loading indicator removed as response streams directly */}
      </div>
        {/* Input area container is MOVED INSIDE main-content */}
        <div className="input-area-container">
        <button
              className="new-topic-button"              onClick={() => {
                setInputValue('');
                setMessages([]);
                chatSessionRef.current = null;
                setAiResponseCountInTopic(0);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="bi bi-plus-lg" viewBox="0 0 16 16"> <path fillRule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/> </svg>
              <span className="mobile-hidden-text">New topic</span>
            </button>
          <div className="input-area">

            <div className="input-wrapper">
              <input
                type="text"
                className="main-input"
                id="main-input"
                placeholder="Ask me anything..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                maxLength={maxChars}
                disabled={!apiKey || isLoading}
              />
              <div className="input-icons-bottom">
                <div className="input-controls-right">
                  <span className="char-counter" id="char-counter">{currentLength}/{maxChars}</span>
                  <div className="mic-send-stack">
                    <button
                      className="send-button"
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || !apiKey || isLoading}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-arrow-up-circle-fill" viewBox="0 0 16 16"> <path d="M16 8A8 8 0 1 0 0 8a8 8 0 0 0 16 0zm-7.5 3.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11.5z"/> </svg>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

      </main>

{/* Sidebar is now inside app-body, sibling to main */}
<div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
  <h2>Recent activity</h2>
  <div className="chat-placeholder">
  </div>
  {/* Add more chat history items here later */}
</div>
  {/* This block was moved up into main-content */}
  {/* This block was moved up */}

    </div>

    {showSettingsModal && (
      <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <h3>Configurações do Gemini</h3>
          <div className="modal-input-group">
            <label htmlFor="api-key">Chave API do Gemini:</label>
            <input
              type="text"
              id="api-key"
              placeholder="Cole sua chave API aqui"
              className="modal-input"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          <div className="modal-input-group">
            <label htmlFor="gemini-model">Modelo do Gemini:</label>
            <select
              id="gemini-model"
              className="modal-input"
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
            >
              {GEMINI_MODELS.map(model => (
                <option key={model.id} value={model.id}>
                  {model.label} - {model.id}
                </option>
              ))}
            </select>
            <small style={{color:'#666',fontSize:'12px',display:'block',marginTop:'4px'}}>
              {GEMINI_MODELS.find(m => m.id === selectedModel)?.description}
            </small>
          </div>
          <div className="modal-buttons">
            <button
              className="modal-close-button"
              onClick={() => setShowSettingsModal(false)}
            >
              Fechar
            </button>
            <button
              className="modal-save-button"
              onClick={() => {
                if (apiKey) {
                  localStorage.setItem('geminiApiKey', apiKey);
                  localStorage.setItem('geminiModel', selectedModel);                  setShowSettingsModal(false);
                }
              }}
              disabled={!apiKey}
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
  );
}

export default App;
