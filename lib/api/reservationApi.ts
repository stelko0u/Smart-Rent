export interface ReservationData {
  id: number;
  carMake: string;
  carModel: string;
  carImage: string | null;
  startDate: string;
  endDate: string;
  days: number;
  pricePerDay: number;
  totalAmount: number;
  status: string;
  paymentMethod: string | null;
}

type GetReservationResponse = {
  ok?: boolean;
  error?: string;
  reservation?: ReservationData | null;
};

export interface ReservationCar {
  id: number;
  make: string;
  model: string;
  year: number;
  pricePerDay: number;
  images: string[];
}

export interface ReservationPeriod {
  startDate: string | Date;
  endDate: string | Date;
  status: string;
}

export interface ReservationPageDataResponse {
  car: ReservationCar;
  reservations: ReservationPeriod[];
}

export interface CreateReservationPayload {
  carId: number;
  startDate: string;
  endDate: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  paymentMethod: 'CARD' | 'ON_SPOT';
}

export interface CreateReservationResponse {
  reservation?: {
    id: number;
  };
  flow?: {
    nextStep?: string;
  };
  error?: string;
}

export type CreateSimpleReservationPayload = {
  vehicleId: number;
  startDate: string;
  endDate: string;
};

export type CreateSimpleReservationResponse = {
  id: number;
};

export async function fetchReservationById(
  reservationId: number | string,
): Promise<ReservationData> {
  const res = await fetch(`/api/reservations/${reservationId}`, {
    credentials: 'include',
    cache: 'no-store',
  });

  const data: GetReservationResponse = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || 'Failed to load reservation');
  }

  if (!data?.reservation) {
    throw new Error('No reservation data in response');
  }

  return data.reservation;
}

export async function getReservationPageData(
  carId: string | number,
): Promise<ReservationPageDataResponse> {
  const [carRes, reservationsRes] = await Promise.all([
    fetch(`/api/cars/${carId}`, {
      credentials: 'include',
      cache: 'no-store',
    }),
    fetch(`/api/cars/${carId}/reservation`, {
      credentials: 'include',
      cache: 'no-store',
    }),
  ]);

  if (!carRes.ok) {
    throw new Error('Failed to load car');
  }

  if (!reservationsRes.ok) {
    throw new Error('Failed to load reservations');
  }

  const carData = await carRes.json();
  const reservationsData = await reservationsRes.json();

  return {
    car: carData.car,
    reservations: reservationsData.reservations || [],
  };
}

export async function createReservation(
  payload: CreateReservationPayload,
): Promise<CreateReservationResponse> {
  const res = await fetch('/api/reservations', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || 'Failed to create reservation');
  }

  if (!data) {
    throw new Error('Invalid server response');
  }

  return data as CreateReservationResponse;
}

export async function createSimpleReservation(
  payload: CreateSimpleReservationPayload,
): Promise<CreateSimpleReservationResponse> {
  const res = await fetch('/api/reservations', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || 'Failed to create reservation');
  }

  if (!data) {
    throw new Error('Invalid server response');
  }

  return data;
}
