'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCompanyStripeOnboardingLink } from '@/lib/api/companyApi';

export default function CompanyStripeRefreshPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const url = await getCompanyStripeOnboardingLink();

        if (!mounted) return;

        window.location.href = url;
      } catch (err) {
        if (!mounted) return;

        setError(
          err instanceof Error
            ? err.message
            : 'Failed to redirect to Stripe onboarding',
        );
      }
    }

    load();

    return () => {
      mounted = false;
    };
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

            <Link
              href="/company"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to company panel
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
