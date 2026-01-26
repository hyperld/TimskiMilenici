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
}

export interface PetService {
  id: number;
  name: string;
  description: string;
  price: number;
  duration?: number;
  businessId: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock?: number;
  businessId: number;
}
