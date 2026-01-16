export interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  pricePerDay: number;
  images?: string[];
  officeId?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CarFormValues {
  id: number;
  make: string;
  model: string;
  year: number;
  pricePerDay: number;
  officeId?: number | null | string;
  images?: string[];
}

export type CarType =
  | 'SEDAN'
  | 'SUV'
  | 'HATCHBACK'
  | 'CONVERTIBLE'
  | 'COUPE'
  | 'WAGON'
  | 'VAN'
  | 'PICKUP'
  | 'OTHER';

export type TransmissionType = 'MANUAL' | 'AUTOMATIC' | 'OTHER';
