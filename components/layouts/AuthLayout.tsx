import Link from 'next/link';
import { ArrowLeftFromBracket } from '../icons';
import { useTranslation } from '@/providers/LanguageProvider';

export default function AuthLayout() {
  const { t } = useTranslation();
  return (
    <div className="absolute top-0 left-0 p-4 ">
      <Link href="/" className="flex justify-center items-center gap-2">
        <ArrowLeftFromBracket /> {t('common.backHome')}
      </Link>
    </div>
  );
}
