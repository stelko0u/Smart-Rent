export interface VerifyResetTokenPayload {
  email: string;
  token: string;
}

export interface VerifyResetTokenResponse {
  valid: boolean;
  reason?: string;
}

export interface ResetPasswordPayload {
  email: string;
  token: string;
  password: string;
}

export interface ResetPasswordResponse {
  ok?: boolean;
  error?: string;
  message?: string;
}

type SignInPayload = {
  email: string;
  password: string;
  remember: boolean;
};

export type SignInResponse = {
  success?: boolean;
  redirectTo?: string;
  mustChangePassword?: boolean;
  error?: string;
};

export type SignUpPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  dateOfBirth: string;
};

export type SignUpResponse = {
  message?: string;
  error?: string;
  success?: boolean;
};

export type FavoriteCar = {
  id: number;
  make: string;
  model: string;
  year: number;
  pricePerDay: number;
  images: string[];
  carType: string;
  transmissionType: string;
};

export type UpdateUserProfilePayload = {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  dateOfBirth?: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

type ApiMessageResponse = {
  success?: boolean;
  message?: string;
  error?: string;
};

type GetFavoriteCarsResponse = {
  favorites?: FavoriteCar[];
};

export type UserReview = {
  id: number;
  carId: number;
  rating: number;
  comment?: string;
  createdAt: string;
  car?: {
    id: number;
    make: string;
    model: string;
    year: number;
    images: string[];
  };
};

type GetUserReviewsResponse = {
  reviews?: UserReview[];
};

export async function getLoggedInUser(): Promise<any | null> {
  try {
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      if (res.status === 401) {
        return null;
      }
      const error = await res.json();
      throw new Error(error?.message || `Failed (${res.status})`);
    }

    const user = await res.json();
    return user;
  } catch (error) {
    console.error('Error fetching logged-in user:', error);
    return null;
  }
}

export async function verifyResetToken(
  payload: VerifyResetTokenPayload,
): Promise<VerifyResetTokenResponse> {
  const res = await fetch('/api/verify-reset-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  return data;
}

export async function resetPassword(
  payload: ResetPasswordPayload,
): Promise<ResetPasswordResponse> {
  const res = await fetch('/api/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || 'Error resetting password.');
  }

  return data;
}

export async function requestPasswordReset(email: string): Promise<{
  success: boolean;
  message: string;
}> {
  const res = await fetch('/api/forgot-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      data?.error || 'An error occurred. Please try again later.',
    );
  }

  return {
    success: Boolean(data?.success),
    message:
      data?.message ||
      'If there is an account with this email, you will receive instructions.',
  };
}

export async function signInUser(
  payload: SignInPayload,
): Promise<SignInResponse> {
  const res = await fetch('/api/auth/signin', {
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
    if (data?.mustChangePassword && data?.redirectTo) {
      return data as SignInResponse;
    }

    if (
      res.status === 403 &&
      typeof data?.error === 'string' &&
      data.error.toLowerCase().includes('not verified')
    ) {
      throw new Error('EMAIL_NOT_VERIFIED');
    }

    throw new Error(data?.error || 'Sign in failed');
  }

  return (data || {}) as SignInResponse;
}

export async function resendVerificationEmail(
  email: string,
): Promise<{ success?: boolean; message?: string }> {
  const res = await fetch('/api/auth/resend-verification', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || 'Failed to resend verification email.');
  }

  return {
    success: Boolean(data?.success),
    message: data?.message,
  };
}

export async function signOutUser(): Promise<void> {
  const res = await fetch('/api/auth/signout', {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Logout failed');
  }
}

export async function signUpUser(
  payload: SignUpPayload,
): Promise<SignUpResponse> {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || data?.error || 'Registration failed');
  }

  return (data || {}) as SignUpResponse;
}

export async function getFavoriteCars(): Promise<FavoriteCar[]> {
  const res = await fetch('/api/user/favorites', {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });

  const data = (await res
    .json()
    .catch(() => null)) as GetFavoriteCarsResponse | null;

  if (!res.ok) {
    throw new Error('Failed to load favorites');
  }

  return data?.favorites ?? [];
}

export async function removeFavoriteCar(carId: number): Promise<void> {
  const res = await fetch(`/api/user/favorites/${carId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || 'Failed to remove favorite');
  }
}

export async function updateUserProfile(
  payload: UpdateUserProfilePayload,
): Promise<ApiMessageResponse> {
  const res = await fetch('/api/user/profile', {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = (await res
    .json()
    .catch(() => null)) as ApiMessageResponse | null;

  if (!res.ok) {
    throw new Error(data?.error || 'Failed to update profile');
  }

  return data || {};
}

export async function changeUserPassword(
  payload: ChangePasswordPayload,
): Promise<ApiMessageResponse> {
  const res = await fetch('/api/user/change-password', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = (await res
    .json()
    .catch(() => null)) as ApiMessageResponse | null;

  if (!res.ok) {
    throw new Error(data?.error || 'Failed to change password');
  }

  return data || {};
}

export async function getUserReviews(): Promise<UserReview[]> {
  const res = await fetch('/api/user/reviews', {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });

  const data = (await res
    .json()
    .catch(() => null)) as GetUserReviewsResponse | null;

  if (!res.ok) {
    throw new Error('Failed to load reviews');
  }

  return data?.reviews ?? [];
}
