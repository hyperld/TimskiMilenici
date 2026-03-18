import React, { useState, useRef, useEffect } from 'react';
import { usePawPal } from '../../context/PawPalContext';
import { pawpalService } from '../../services/pawpalService';
import { ChatMessage } from '../../types';
import styles from './PawPalWidget.module.css';

const PawPalWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const conversationRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { storeContext } = usePawPal();

  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const toggleOpen = () => setIsOpen((prev) => !prev);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const reply = await pawpalService.sendMessage(trimmed, [...messages, userMessage], storeContext);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I had trouble responding. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const greeting = storeContext
    ? `You're browsing ${storeContext.name}. Ask me about their products, services, or anything else!`
    : "Hi there! I'm PawPal, your pet care assistant. Ask me anything about stores, products, services, or pet care!";

  return (
    <div className={styles.chatbotContainer} aria-live="polite">
      <div className={styles.panelWrapper}>
        <div
          className={`${styles.chatPanel} ${isOpen ? styles.chatPanelOpen : ''}`}
          aria-hidden={!isOpen}
        >
          <div className={styles.header}>
            <div className={styles.headerAvatar}>🐾</div>
            <div className={styles.headerInfo}>
              <div className={styles.title}>PawPal</div>
              <div className={styles.subtitle}>
                {storeContext ? `Helping with ${storeContext.name}` : 'Your pet care assistant'}
              </div>
            </div>
            <button
              type="button"
              className={styles.closeButton}
              onClick={toggleOpen}
              aria-label="Close chat"
            >
              &times;
            </button>
          </div>

          <div className={styles.conversationArea} ref={conversationRef}>
            <div className={styles.systemMessage}>{greeting}</div>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={msg.role === 'user' ? styles.userMessage : styles.assistantMessage}
              >
                {msg.content}
              </div>
            ))}
            {isLoading && (
              <div className={styles.assistantMessage}>
                <span className={styles.typingDots}>
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            )}
          </div>

          <form className={styles.inputArea} onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              className={styles.inputField}
              type="text"
              placeholder="Ask PawPal anything..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button
              type="submit"
              className={styles.sendButton}
              disabled={!inputValue.trim() || isLoading}
              aria-label="Send message"
            >
              <svg className={styles.sendIcon} viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      <button
        type="button"
        className={`${styles.chatButton} ${isOpen ? styles.chatButtonOpen : ''}`}
        onClick={toggleOpen}
        aria-label={isOpen ? 'Close PawPal' : 'Chat with PawPal'}
      >
        {!isOpen && <span className={styles.pulse} />}
        <span className={`${styles.chatIcon} ${isOpen ? styles.chatIconClose : ''}`}>
          {isOpen ? '\u2715' : '🐾'}
        </span>
      </button>
    </div>
  );
};

export default PawPalWidget;
