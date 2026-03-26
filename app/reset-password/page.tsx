import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import authbg from '../../public/authbg.jpg';
import Image from 'next/image';
import AuthLayout from '@/components/layouts/AuthLayout';

export default function ResetPasswordPage() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      <Image
        src={authbg}
        alt=""
        fill
        priority
        className="object-cover blur-sm scale-105"
      />

      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <ResetPasswordForm />
      </div>
    </main>
  );
}
