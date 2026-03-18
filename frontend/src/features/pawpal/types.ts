export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StoreContext {
  id: number;
  name: string;
  description: string;
  address: string;
  categories: string[];
  services: { name: string; price: number; durationMinutes?: number }[];
  products: { name: string; price: number; stock?: number }[];
}
