'use client';

import Link from 'next/link';

export default function CompanyStripeReturnPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-green-500 text-6xl mb-4">✓</div>
        <h1 className="text-2xl font-bold text-green-600 mb-2">
          Stripe onboarding completed
        </h1>
        <p className="text-gray-600 mb-6">
          Your Stripe information was submitted successfully. If Stripe needs
          additional verification, some capabilities may still remain pending
          for a short time.
        </p>

        <div className="space-y-3">
          <Link
            href="/company?tab=payments"
            className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to payments
          </Link>

          <Link
            href="/company"
            className="block w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to company panel
          </Link>
        </div>
      </div>
    </div>
  );
}
