import { getStoredToken } from '../../auth/utils/tokenStorage';
import { ChatMessage, PawPalMode, StoreContext } from '../types';

const API_URL = 'http://localhost:8080/api';

interface SendOptions {
  mode?: PawPalMode;
  storeContext?: StoreContext | null;
}

export const pawpalService = {
  sendMessage: async (
    message: string,
    history: ChatMessage[],
    options: SendOptions = {}
  ): Promise<string> => {
    const mode: PawPalMode = options.mode ?? 'customer';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = getStoredToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const payload: Record<string, unknown> = { message, history, mode };
    if (mode === 'customer') {
      payload.storeContext = options.storeContext ?? null;
    }

    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to get response');
    const data = await response.json();
    return data.reply;
  },
};
