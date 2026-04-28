export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export type PawPalMode = 'customer' | 'owner';

export interface StoreContext {
  id: number;
  name: string;
  description: string;
  address: string;
  categories: string[];
  /** Services offered by the store. `currentPrice` is what is actually charged. */
  services: { name: string; currentPrice: number; originalPrice?: number; durationMinutes?: number }[];
  /** Products offered by the store. `currentPrice` is what is actually charged. */
  products: { name: string; currentPrice: number; originalPrice?: number; stock?: number }[];
}
