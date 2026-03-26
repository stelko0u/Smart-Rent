import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import authbg from '../../public/authbg.jpg';
import Image from 'next/image';
import AuthLayout from '@/components/layouts/AuthLayout';

export default function ForgotPasswordPage() {
  return (
    <main className="relative w-full min-h-screen flex items-center justify-center">
        <AuthLayout />
      <div className="absolute inset-0 -z-10 bg-black overflow-hidden">
        <Image
          src={authbg}
          alt=""
          fill
          priority
          className="object-cover blur-sm scale-105"
        />
        <div className="absolute inset-0 bg-black/25" />
      </div>

      <div className="z-10 w-full max-w-lg p-6">
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
