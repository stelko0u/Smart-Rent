import { Toaster } from 'react-hot-toast';
import './globals.css';
import { LanguageProvider } from '@/providers/LanguageProvider';
import { AlertProvider } from '@/providers/AlertProvider';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Smart Rent',
    template: '%s | Smart Rent',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bg">
      <body>
        <LanguageProvider initialLocale="bg">
          <AlertProvider>
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 2500,
                  iconTheme: {
                    primary: '#4ade80',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 4000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </AlertProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
