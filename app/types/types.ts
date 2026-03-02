export interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  pricePerDay: number;
  images?: string[];
  officeId?: number;
  companyId?: number;
  ownerId?: number;
  carType?: CarType;
  transmissionType?: TransmissionType;
  fuelType?: FuelType;
  createdAt?: string;
  updatedAt?: string;
  company?: Company;
  office?: Office;
  power: number;
  displacement: number;
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
  | 'CABRIO'
  | 'COMBI'
  | 'OTHER';

export type TransmissionType = 'MANUAL' | 'AUTOMATIC' | 'SEMI_AUTOMATIC' | 'OTHER';

export type FuelType = 'PETROL' | 'DIESEL' | 'ELECTRICITY';

// types/index.ts
export interface Company {
  id: number;
  name: string;
  email: string;
}

export interface Office {
  id: number;
  name: string;
  address: string;
}

export interface Reservation {
  id: number;
  start_date: string;
  end_date: string;
}
