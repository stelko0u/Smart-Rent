export type Role = 'user' | 'company' | 'admin' | null;

export type HomeCar = {
  id: number;
  name: string;
  make: string;
  model: string;
  bodyType: string;
  year: number;
  horsepower: number;
  transmission: string;
  fuelType: string;
  location: string;
  pricePerDay: number;
  img: string;
  companyName?: string | null;
};

export type SearchFilters = {
  query: string;
  make: string;
  location: string;
  bodyType: string;
  transmission: string;
  fuelType: string;
  minPrice: string;
  maxPrice: string;
  minHorsepower: string;
  maxHorsepower: string;
  yearFrom: string;
  yearTo: string;
  startDate: string;
  endDate: string;
};
