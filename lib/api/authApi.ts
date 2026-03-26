export type MeResponse = {
  ok?: boolean;
  user?: {
    id: number;
    banned?: boolean;
    banReason?: string | null;
    bannedAt?: string | null;
  } | null;
};

export async function getCurrentUser(): Promise<MeResponse> {
  const res = await fetch('/api/auth/me', {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch current user');
  }

  return res.json();
}

export async function signOutUser(): Promise<void> {
  const res = await fetch('/api/auth/signout', {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to sign out');
  }
}

export type CompleteOnboardingPayload = {
  userId: string;
  password: string;
};

export type CompleteOnboardingResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
};

export async function completeOnboarding(
  payload: CompleteOnboardingPayload,
): Promise<CompleteOnboardingResponse> {
  const res = await fetch('/api/auth/complete-onboarding', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || 'Error changing password.');
  }

  return data;
}
