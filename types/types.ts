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
  createdAt?: Date;
  updatedAt?: Date;
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

export type TransmissionType =
  | 'MANUAL'
  | 'AUTOMATIC'
  | 'SEMI_AUTOMATIC'
  | 'OTHER';

export type FuelType = 'PETROL' | 'DIESEL' | 'ELECTRICITY';

export interface Company {
  id: number;
  name: string;
  email: string;
  maintenancePercent: number;
  ownerId?: number | null;
  createdAt?: string;
  updatedAt?: string;
  office: Office;
}

export interface Office {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  companyId: number;
}

export interface Reservation {
  id: number;
  userId: number;
  carId: number;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  createdAt: Date;
  updatedAt?: Date;
}

export interface CompanyStats {
  id: string;
  name: string;
  reservationsCount: number;
  revenue: string;
  platformFee: string;
  monthlyRevenue: string;
  monthlyPlatformFee: string;
}

export interface DashboardStats {
  totalCompanies: number;
  totalReservations: number;
  totalRevenue: number;
  platformRevenue: number;
  monthlyRevenue: number;
  monthlyPlatformRevenue: number;
  companiesStats: CompanyStats[];
}

export type CarRow = {
  id: number;
  make: string;
  model: string;
  year?: number;
  pricePerDay?: number;
  companyId?: number;
  companyName?: string;
  images?: string[];
  office: {
    name: string;
    address: string;
  };
  carType?: string;
  transmissionType?: string;
  power?: number;
  fuelType?: string;
};

// export type Company = {
//   id: number;
//   name: string;
// };
