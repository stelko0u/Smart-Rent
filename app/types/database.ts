export interface User {
  id: number;
  email: string;
  password: string;
  name?: string;
  role: 'USER' | 'ADMIN' | 'COMPANY';
  createdAt: Date;
  updatedAt?: Date;
  emailVerified: boolean;
  companyId?: number;
  banned?: boolean;
  bannedAt?: Date;
  banReason?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  dateOfBirth?: Date;
}

export interface Company {
  id: number;
  name?: string;
  email: string;
  maintenancePercent: number;
  ownerId: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  pricePerDay: number;
  ownerId: number;
  images: string[];
  companyId?: number;
  officeId?: number;
  createdAt: Date;
  updatedAt?: Date;
  carType:
    | 'SEDAN'
    | 'HATCHBACK'
    | 'SUV'
    | 'COUPE'
    | 'CONVERTIBLE'
    | 'CABRIO'
    | 'WAGON'
    | 'VAN'
    | 'PICKUP'
    | 'COMBI'
    | 'OTHER';
  transmissionType: 'MANUAL' | 'AUTOMATIC' | 'SEMI_AUTOMATIC' | 'OTHER';
  fuelType: 'PETROL' | 'DIESEL' | 'ELECTRICITY';
  power: number;
  displacement: number;
}

export interface Reservation {
  id: number;
  userId: number;
  carId: number;
  startDate: Date;
  endDate: Date;
  status:
    | 'PENDING'
    | 'CONFIRMED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'RETURNED'
    | 'CANCELLED';

  createdAt: Date;
  updatedAt?: Date;
  totalPrice: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  notes?: string;
  paymentIntentId?: string;
  paymentMethod?: 'CARD' | 'ON_SPOT';
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
}

// export interface Payments {
//   id: number;
//   reservationId: number;
//   companyId: number;
//   amount: number;
//   totalPrice: number;
//   platformFee: number;
//   companyEarnings: number;
//   paymentMethod: 'CARD' | 'ON_SPOT';
//   paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
//   paidAt?: Date;
//   createdAt: Date;
//   updatedAt?: Date;
//   stripePaymentIntentId: string;
//   stripeChargeId: string;
// }
export interface Payments {
  id: number;
  reservationId: number;
  companyId: number;
  amount: number;
  totalPrice: number;
  platformFee: number;
  companyEarnings: number;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod: 'CARD' | 'CASH';
  stripePaymentIntentId: string | null;
  stripeChargeId: string | null;
  paidAt: Date | null;
  refundedAt?: Date | null;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Review {
  id: number;
  userId: number;
  carId: number;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface Office {
  id: number;
  companyId: number;
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface PasswordResetToken {
  id: string;
  email: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface Favorite {
  id: number;
  userId: number;
  carId: number;
  createdAt: Date;
}
