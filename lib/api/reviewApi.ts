export type ReviewPageData = {
  reservation: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  car: {
    id: number;
    make: string;
    model: string;
    year: number;
    imageUrl?: string | null;
  };
  alreadyReviewed: boolean;
  canReview: boolean;
};

type ReviewLinkResponse = ReviewPageData & {
  ok?: boolean;
  error?: string;
};

type SubmitReviewPayload = {
  rating: number;
  comment: string;
};

export async function fetchReviewsByCarId(carId: number | string) {
  const res = await fetch(`/api/reviews?carId=${carId}`, {
    credentials: 'include',
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || 'Failed to load reviews');
  }

  return data.reviews || [];
}

export async function checkReviewEligibility(carId: number | string) {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  if (!token) {
    return {
      canAddReview: false,
      reservationId: null,
    };
  }

  const res = await fetch(`/api/reviews/check-eligibility?carId=${carId}`, {
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || 'Failed to check review eligibility');
  }

  return {
    canAddReview: Boolean(data.canAddReview),
    reservationId: data.reservationId ?? null,
  };
}

export async function submitReview(payload: {
  carId: number;
  rating: number;
  comment: string;
  reservationId: number;
}) {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  if (!token) {
    throw new Error('Please sign in to submit a review');
  }

  const res = await fetch('/api/reviews', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || 'Failed to submit review');
  }

  return data;
}

export async function getReviewPageData(
  token: string,
): Promise<ReviewPageData> {
  const res = await fetch(`/api/review-link/${encodeURIComponent(token)}`, {
    cache: 'no-store',
  });

  const payload: ReviewLinkResponse = await res.json();

  if (!res.ok || !payload.ok) {
    throw new Error(payload.error || 'Invalid review link');
  }

  return payload;
}

export async function submitReviewFromLink(
  token: string,
  payload: SubmitReviewPayload,
): Promise<void> {
  const res = await fetch(`/api/review-link/${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'Failed to submit review');
  }
}
