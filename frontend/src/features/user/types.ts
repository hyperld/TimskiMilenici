export interface User {
  id?: number;
  userId?: number;
  fullName: string;
  email: string;
  role: 'USER' | 'OWNER' | 'ADMIN' | 'BUSINESS_OWNER';
  phoneNumber?: string;
  address?: string;
  profileImageUrl?: string;
}
