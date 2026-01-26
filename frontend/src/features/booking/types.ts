import { User } from '../user/types';
import { Business, PetService } from '../business/types';

export interface Booking {
  id: number;
  userId: number;
  businessId: number;
  serviceId: number;
  bookingDate: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  user?: User;
  service?: PetService;
  business?: Business;
}
