'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeftFromBracket } from '@/components/icons';
import { useTranslation } from '@/providers/LanguageProvider';

export default function AuthLayout() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="absolute top-0 left-0 p-4">
      <Link href="/" className="flex items-center justify-center gap-2">
        <ArrowLeftFromBracket />
        {mounted ? t('common.backHome') : ''}
      </Link>
    </div>
  );
}
