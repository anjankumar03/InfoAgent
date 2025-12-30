import React, { useState, useEffect, useRef } from "react";
import { sendMessage } from "./api";
import { formatTextContent } from "./utils/formatResponse";
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-sql';
import "./index.css";

export default function Chat() {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedStates, setCopiedStates] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Component to render formatted bot responses
  const FormattedResponse = ({ text }) => {
    // Enhanced parsing for ChatGPT-like formatting
    const parseResponse = (text) => {
      const lines = text.split('\n');
      const parts = [];
      let currentPart = { type: 'paragraph', content: '' };
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines
        if (!line) {
          if (currentPart.content) {
            parts.push({ ...currentPart, key: parts.length });
            currentPart = { type: 'paragraph', content: '' };
          }
          continue;
        }
        
        // Main headings (# or ##)
        if (line.match(/^#{1,2}\s/)) {
          if (currentPart.content) {
            parts.push({ ...currentPart, key: parts.length });
          }
          const level = line.match(/^#+/)[0].length;
          parts.push({
            type: 'heading',
            level: level,
            content: line.replace(/^#+\s/, ''),
            key: parts.length
          });
          currentPart = { type: 'paragraph', content: '' };
          continue;
        }
        
        // Code blocks
        if (line.startsWith('```')) {
          if (currentPart.content) {
            parts.push({ ...currentPart, key: parts.length });
          }
          
          // Find the end of code block
          let codeContent = '';
          i++; // Skip the opening ```
          while (i < lines.length && !lines[i].trim().startsWith('```')) {
            codeContent += lines[i] + '\n';
            i++;
          }
          
          parts.push({
            type: 'code',
            content: codeContent.trim(),
            key: parts.length
          });
          currentPart = { type: 'paragraph', content: '' };
          continue;
        }
        
        // List items
        if (line.match(/^[-*•]\s/) || line.match(/^\d+\.\s/)) {
          if (currentPart.type !== 'list') {
            if (currentPart.content) {
              parts.push({ ...currentPart, key: parts.length });
            }
            currentPart = { type: 'list', content: '' };
          }
          parts.push({
            type: 'list-item',
            content: line,
            key: parts.length
          });
          continue;
        }
        
        // Regular paragraph content
        if (currentPart.type === 'list' && line) {
          parts.push({ ...currentPart, key: parts.length });
          currentPart = { type: 'paragraph', content: line };
        } else {
          currentPart.content += (currentPart.content ? ' ' : '') + line;
        }
      }
      
      // Add the last part
      if (currentPart.content) {
        parts.push({ ...currentPart, key: parts.length });
      }
      
      return parts;
    };
    
    const formattedParts = parseResponse(text);
    
    return (
      <div className="formatted-response">
        {formattedParts.map((part) => {
          switch (part.type) {
            case 'heading':
              const isMainHeading = part.level === 1;
              return (
                <div key={part.key} className={`response-heading ${isMainHeading ? 'main-heading' : 'sub-heading'}`}>
                  {isMainHeading ? (
                    <h2 className="main-response-title">{part.content}</h2>
                  ) : (
                    <h3 className="sub-response-title">{part.content}</h3>
                  )}
                </div>
              );
            case 'list-item':
              return (
                <div key={part.key} className="response-list-item">
                  <span className="list-bullet">•</span>
                  <span className="list-content" dangerouslySetInnerHTML={{ 
                    __html: formatTextContent(part.content.replace(/^[-*•]\s|^\d+\.\s/, '')) 
                  }} />
                </div>
              );
            case 'code':
              const codeContent = part.content;
              const copied = copiedStates[part.key] || false;
              
              const handleCopy = async () => {
                await navigator.clipboard.writeText(codeContent);
                setCopiedStates(prev => ({ ...prev, [part.key]: true }));
                setTimeout(() => {
                  setCopiedStates(prev => ({ ...prev, [part.key]: false }));
                }, 2000);
              };
              
              const detectLanguage = (code) => {
                if (/\b(import numpy|import pandas|def |print\(|plt\.|np\.|pd\.)/.test(code)) return 'python';
                if (/\b(public|class|static|void|int|String)\b/.test(code)) return 'java';
                if (/\b(function|const|let|var|=>)\b/.test(code)) return 'javascript';
                if (/\b(SELECT|FROM|WHERE|INSERT)\b/i.test(code)) return 'sql';
                if (/[{}]/.test(code) && /[":]/.test(code)) return 'json';
                return 'python';
              };
              
              const highlightCode = (code) => {
                const language = detectLanguage(code);
                try {
                  return Prism.highlight(code, Prism.languages[language] || Prism.languages.javascript, language);
                } catch (e) {
                  return code;
                }
              };
              
              return (
                <div key={part.key} className="response-code-container">
                  <div className="code-header">
                    <span className="code-language">{detectLanguage(codeContent).toUpperCase()}</span>
                    <button 
                      className="copy-button"
                      onClick={handleCopy}
                      title={copied ? "Copied!" : "Copy code"}
                    >
                      {copied ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      )}
                    </button>
                  </div>
                  <pre className="response-code">
                    <code dangerouslySetInnerHTML={{ __html: highlightCode(codeContent) }}></code>
                  </pre>
                </div>
              );
            case 'paragraph':
            default:
              return (
                <div key={part.key} className="response-paragraph">
                  <p dangerouslySetInnerHTML={{ __html: formatTextContent(part.content) }} />
                </div>
              );
          }
        })}
      </div>
    );
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    inputRef.current?.focus();
    
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + transcript);
        setIsRecording(false);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };
      
      recognitionInstance.onend = () => {
        setIsRecording(false);
      };
      
      setRecognition(recognitionInstance);
    }

    // Close plus menu when clicking outside
    const handleClickOutside = (event) => {
      if (showPlusMenu && !event.target.closest('.plus-menu, .plus-button')) {
        setShowPlusMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showPlusMenu]);

  useEffect(scrollToBottom, [chat, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = { role: "user", text: input.trim() };
    setChat(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await sendMessage(userMsg.text);
      const botMsg = { role: "assistant", text: res.response };
      setChat(prev => [...prev, botMsg]);
    } catch (err) {
      setChat(prev => [...prev, { 
        role: "assistant", 
        text: "I'm sorry, I'm having trouble connecting to my services right now. Please try again later." 
      }]);
    }

    setLoading(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  };

  const handleExampleClick = (text) => {
    setInput(text);
    inputRef.current?.focus();
  };

  const handleVoiceRecord = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
    }
  };

  const handlePlusClick = () => {
    setShowPlusMenu(!showPlusMenu);
  };

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        console.log('File selected:', file.name);
        // Handle file upload logic here
      }
    };
    input.click();
    setShowPlusMenu(false);
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        console.log('Image selected:', file.name);
        // Handle image upload logic here
      }
    };
    input.click();
    setShowPlusMenu(false);
  };

  const handleCreateImage = () => {
    console.log('Create image clicked');
    setShowPlusMenu(false);
  };

  const handleThinking = () => {
    console.log('Thinking mode clicked');
    setShowPlusMenu(false);
  };

  const handleDeepResearch = () => {
    console.log('Deep research clicked');
    setShowPlusMenu(false);
  };

  const handleMoreOptions = () => {
    // Remove click handler since we're using hover
  };

  const handleStudyLearn = () => {
    console.log('Study and learn clicked');
    setShowMoreMenu(false);
    setShowPlusMenu(false);
  };

  const handleWebSearch = () => {
    console.log('Web search clicked');
    setShowMoreMenu(false);
    setShowPlusMenu(false);
  };

  return (
    <div className="main-content">
      {chat.length > 0 && (
        <div className="chat-header">
          <h1 className="chat-title">InfoAgent</h1>
        </div>
      )}

      <div className="chat-messages">
        {chat.length === 0 ? (
          <div className="welcome-screen">
            <h1 className="welcome-title">InfoAgent</h1>
            <p className="welcome-subtitle">
              I'm your InfoAgent, ready to assist you with information and answer your questions. 
              How can I help you today?
            </p>
            <div className="example-grid">
              <div 
                className="example-card" 
                onClick={() => handleExampleClick("What's the weather like in New York?")}
              >
                <h3>🌤️ Weather Information</h3>
                <p>Get current weather conditions and forecasts for any city around the world</p>
              </div>
              <div 
                className="example-card" 
                onClick={() => handleExampleClick("Tell me about artificial intelligence")}
              >
                <h3>💡 General Knowledge</h3>
                <p>Ask questions about science, technology, history, and various topics</p>
              </div>
              <div 
                className="example-card" 
                onClick={() => handleExampleClick("How can you help me today?")}
              >
                <h3>🤖 Assistant Capabilities</h3>
                <p>Learn about my features and how I can assist you with different tasks</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {chat.map((message, index) => (
              <div key={index} className={`message ${message.role}`}>
                <div className="message-content">
                  {message.role === "assistant" ? (
                    <FormattedResponse text={message.text} />
                  ) : (
                    message.text
                  )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="typing-indicator">
                <div className="typing-dots">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={chatEndRef}></div>
      </div>

      <div className="input-area">
        <div className="input-container">
          <div className="input-wrapper">
            <button 
              className="plus-button"
              onClick={handlePlusClick}
              disabled={loading}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </button>
            {showPlusMenu && (
              <div className="plus-menu">
                <div className="plus-menu-item" onClick={handleFileUpload}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                  <span>Upload file</span>
                </div>
                <div className="plus-menu-item" onClick={handleImageUpload}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z"/>
                  </svg>
                  <span>Upload photo</span>
                </div>
                <div className="plus-menu-item" onClick={handleCreateImage}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2A2,2 0 0,1 14,4V8L17,11H20A2,2 0 0,1 22,13V20A2,2 0 0,1 20,22H4A2,2 0 0,1 2,20V13A2,2 0 0,1 4,11H7L10,8V4A2,2 0 0,1 12,2M12,4V8.5L8.5,12H4V20H20V13H15.5L12,9.5V4M12,13.5A3.5,3.5 0 0,1 15.5,17A3.5,3.5 0 0,1 12,20.5A3.5,3.5 0 0,1 8.5,17A3.5,3.5 0 0,1 12,13.5M12,15.5A1.5,1.5 0 0,0 10.5,17A1.5,1.5 0 0,0 12,18.5A1.5,1.5 0 0,0 13.5,17A1.5,1.5 0 0,0 12,15.5Z"/>
                  </svg>
                  <span>Create image</span>
                </div>
                <div className="plus-menu-item" onClick={handleThinking}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2A7,7 0 0,1 19,9C19,11.38 17.81,13.47 16,14.74V17A1,1 0 0,1 15,18H9A1,1 0 0,1 8,17V14.74C6.19,13.47 5,11.38 5,9A7,7 0 0,1 12,2M9,21V20H15V21A1,1 0 0,1 14,22H10A1,1 0 0,1 9,21M12,4A5,5 0 0,0 7,9C7,11 8.57,12.64 10.57,12.92L11,13V16H13V13L13.43,12.92C15.43,12.64 17,11 17,9A5,5 0 0,0 12,4Z"/>
                  </svg>
                  <span>Thinking</span>
                </div>
                <div className="plus-menu-item" onClick={handleDeepResearch}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
                  </svg>
                  <span>Deep research</span>
                </div>
                <div className="plus-menu-item plus-menu-more">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16,12A2,2 0 0,1 18,10A2,2 0 0,1 20,12A2,2 0 0,1 18,14A2,2 0 0,1 16,12M10,12A2,2 0 0,1 12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12M4,12A2,2 0 0,1 6,10A2,2 0 0,1 8,12A2,2 0 0,1 6,14A2,2 0 0,1 4,12Z"/>
                  </svg>
                  <span>More</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="arrow-icon">
                    <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/>
                  </svg>
                  <div className="more-submenu">
                    <div className="plus-menu-item" onClick={handleStudyLearn}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,3L1,9L12,15L21,10.09V17H23V9M5,13.18V17.18L12,21L19,17.18V13.18L12,17L5,13.18Z"/>
                      </svg>
                      <span>Study and learn</span>
                    </div>
                    <div className="plus-menu-item" onClick={handleWebSearch}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16.36,14C16.44,13.34 16.5,12.68 16.5,12C16.5,11.32 16.44,10.66 16.36,10H19.74C19.9,10.64 20,11.31 20,12C20,12.69 19.9,13.36 19.74,14M14.59,19.56C15.19,18.45 15.65,17.25 15.97,16H18.92C17.96,17.65 16.43,18.93 14.59,19.56M14.34,14H9.66C9.56,13.34 9.5,12.68 9.5,12C9.5,11.32 9.56,10.65 9.66,10H14.34C14.43,10.65 14.5,11.32 14.5,12C14.5,12.68 14.43,13.34 14.34,14M12,19.96C11.17,18.76 10.5,17.43 10.09,16H13.91C13.5,17.43 12.83,18.76 12,19.96M8,8H5.08C6.03,6.34 7.57,5.06 9.4,4.44C8.8,5.55 8.35,6.75 8,8M5.08,16H8C8.35,17.25 8.8,18.45 9.4,19.56C7.57,18.93 6.03,17.65 5.08,16M4.26,14C4.1,13.36 4,12.69 4,12C4,11.31 4.1,10.64 4.26,10H7.64C7.56,10.66 7.5,11.32 7.5,12C7.5,12.68 7.56,13.34 7.64,14M12,4.03C12.83,5.23 13.5,6.57 13.91,8H10.09C10.5,6.57 11.17,5.23 12,4.03M18.92,8H15.97C15.65,6.75 15.19,5.55 14.59,4.44C16.43,5.07 17.96,6.34 18.92,8M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                      </svg>
                      <span>Web search</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <textarea
              ref={inputRef}
              className="message-input"
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Message InfoAgent..."
              rows={1}
              disabled={loading}
            />
            <button 
              className={`voice-button ${isRecording ? 'recording' : ''}`}
              onClick={handleVoiceRecord}
              disabled={loading}
            >
              {isRecording ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                  <path d="M19 10v1a7 7 0 0 1-14 0v-1a1 1 0 0 1 2 0v1a5 5 0 0 0 10 0v-1a1 1 0 1 1 2 0Z"/>
                  <path d="M12 18.989a1 1 0 0 1-1-1V17a1 1 0 0 1 2 0v.989a1 1 0 0 1-1 1Z"/>
                  <path d="M9 21h6a1 1 0 0 1 0 2H9a1 1 0 0 1 0-2Z"/>
                </svg>
              )}
            </button>
            <button 
              className="send-button" 
              onClick={handleSend}
              disabled={loading || !input.trim()}
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}