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
  }, []);

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

  const handleExampleClick = (text) => {
    setInput(text);
    inputRef.current?.focus();
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
            <textarea
              ref={inputRef}
              className="message-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message InfoAgent..."
              rows={1}
              disabled={loading}
            />
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