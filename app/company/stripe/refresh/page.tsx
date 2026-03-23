'use client';

import { useEffect, useState } from 'react';

export default function CompanyStripeRefreshPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/company/stripe/onboarding-link', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        const data = await res.json();

        if (!res.ok || !data?.ok || !data?.url) {
          throw new Error(data?.error || 'Failed to generate onboarding link');
        }

        window.location.href = data.url;
      } catch (err: any) {
        setError(err?.message || 'Failed to redirect to Stripe onboarding');
      }
    };

    load();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {!error ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">
              Redirecting to Stripe...
            </h1>
            <p className="text-gray-600">
              Please wait while we generate a new onboarding link.
            </p>
          </>
        ) : (
          <>
            <div className="text-red-500 text-5xl mb-4">✗</div>
            <h1 className="text-2xl font-semibold text-red-600 mb-2">
              Stripe redirect failed
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <a
              href="/company"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to company panel
            </a>
          </>
        )}
      </div>
    </div>
  );
}
