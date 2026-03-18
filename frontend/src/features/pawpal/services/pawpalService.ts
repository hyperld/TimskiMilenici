import { ChatMessage, StoreContext } from '../types';

const API_URL = 'http://localhost:8080/api';

export const pawpalService = {
  sendMessage: async (
    message: string,
    history: ChatMessage[],
    storeContext?: StoreContext | null
  ): Promise<string> => {
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, storeContext: storeContext ?? null }),
    });
    if (!response.ok) throw new Error('Failed to get response');
    const data = await response.json();
    return data.reply;
  },
};
