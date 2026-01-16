'use client';

import SignInForm from '../components/auth/SignInForm';
import authbg from '../../public/authbg.jpg';

export default function SignInPage() {
  return (
    <main className="relative w-full min-h-screen flex items-center justify-center">
      <div className="absolute inset-0 -z-10 bg-black overflow-hidden">
        <div
          aria-hidden="true"
          style={{
            backgroundImage: `url(${authbg.src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            width: '110%',
            height: '110%',
            transform: 'translate(-5%, -5%) scale(1.05)',
            filter: 'blur(8px) brightness(0.7)',
          }}
          className="absolute top-0 left-0"
        />
        <div className="absolute inset-0 bg-black/25" />
      </div>

      <div className="z-10 w-full max-w-lg p-6">
        <SignInForm />
      </div>
    </main>
  );
}
