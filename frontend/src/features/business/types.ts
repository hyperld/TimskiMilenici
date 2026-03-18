export type BusinessType =
  | 'Supplies'
  | 'Grooming'
  | 'Veterinary'
  | 'Daycare'
  | 'Training'
  | 'Cafe'
  | string;

export interface Business {
  id: number;
  name: string;
  description: string;
  address: string;
  phoneNumber: string;
  mainImageUrl?: string;
  images?: string[];
  ownerId: number;
  services: PetService[];
  products: Product[];
  /**
   * Primary type label used in older parts of the UI.
   * Prefer `types` for new code so a store can belong to multiple types.
   */
  type?: BusinessType;
  /**
   * All types this business belongs to (e.g. ['Grooming', 'Veterinary']).
   */
  types?: BusinessType[];
  /**
   * Raw category string from the backend for backward compatibility.
   */
  category?: BusinessType;
}

export interface PetService {
  id: number;
  name: string;
  description: string;
  price: number;
  duration?: number;
  durationMinutes?: number;
  businessId: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock?: number;
  stockQuantity?: number;
  businessId: number;
}

export interface ProductWithStore extends Product {
  businessName: string;
}

export interface PetServiceWithStore extends PetService {
  businessName: string;
}
