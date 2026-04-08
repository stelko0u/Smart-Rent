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

export interface UserReservation {
  id: number;
  carId: number;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  car?: {
    id: number;
    make: string;
    model: string;
    year: number;
    images: string[];
  } | null;
}

export interface UserReservationsPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedUserReservationsResponse {
  reservations: UserReservation[];
  pagination: UserReservationsPagination;
}

interface GetUserReservationsParams {
  page?: number;
  limit?: number;
}

type GetUserReservationsResponse = {
  ok?: boolean;
  error?: string;
  reservations?: UserReservation[];
  pagination?: UserReservationsPagination;
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

export async function getUserReservations(
  params?: GetUserReservationsParams,
): Promise<PaginatedUserReservationsResponse> {
  const searchParams = new URLSearchParams();

  if (params?.page) {
    searchParams.set('page', String(params.page));
  }

  if (params?.limit) {
    searchParams.set('limit', String(params.limit));
  }

  const queryString = searchParams.toString();
  const url = queryString
    ? `/api/user/reservations?${queryString}`
    : '/api/user/reservations';

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  const data = (await res
    .json()
    .catch(() => null)) as GetUserReservationsResponse | null;

  if (!res.ok) {
    throw new Error(data?.error || 'Failed to load reservations');
  }

  return {
    reservations: data?.reservations ?? [],
    pagination: data?.pagination ?? {
      page: 1,
      limit: params?.limit ?? 5,
      totalItems: 0,
      totalPages: 1,
    },
  };
}
