 import React, { useState } from 'react';
 import styles from './ChatbotWidget.module.css';
 
 const ChatbotWidget: React.FC = () => {
   const [isOpen, setIsOpen] = useState(false);
   const [inputValue, setInputValue] = useState('');
 
   const toggleOpen = () => {
     setIsOpen((prev) => !prev);
   };
 
   const handleSubmit = (event: React.FormEvent) => {
     event.preventDefault();
     // Placeholder: integrate AI conversation handler here
     setInputValue('');
   };
 
   return (
     <div className={styles.chatbotContainer} aria-live="polite">
       <div className={styles.panelWrapper}>
         <div
           className={`${styles.chatPanel} ${isOpen ? styles.chatPanelOpen : ''}`}
           aria-hidden={!isOpen}
         >
           <div className={styles.header}>
             <span className={styles.title}>Virtual Assistant</span>
             <button
               type="button"
               className={styles.closeButton}
               onClick={toggleOpen}
               aria-label="Close chat"
             >
               ×
             </button>
           </div>
           <div className={styles.conversationArea}>
             <div className={styles.systemMessage}>
               Hi! I&apos;m your assistant. Ask me anything about the app or your bookings.
             </div>
             {/* Future: render conversation messages here */}
           </div>
           <form className={styles.inputArea} onSubmit={handleSubmit}>
             <input
               className={styles.inputField}
               type="text"
               placeholder="Type your message..."
               value={inputValue}
               onChange={(e) => setInputValue(e.target.value)}
             />
             <button
               type="submit"
               className={styles.sendButton}
               disabled={!inputValue.trim()}
             >
               Send
             </button>
           </form>
         </div>
       </div>
       <button
         type="button"
         className={styles.chatButton}
         onClick={toggleOpen}
         aria-label={isOpen ? 'Hide chat assistant' : 'Open chat assistant'}
       >
         <span className={styles.chatIcon}>💬</span>
       </button>
     </div>
   );
 };
 
 export default ChatbotWidget;
 
