import { NextResponse } from 'next/server';

export function handleResetPasswordError(err: unknown) {
  console.error('reset-password error:', err);

  if (err instanceof Error) {
    if (err.message === 'MISSING_FIELDS') {
      return NextResponse.json({ error: 'Липсват данни.' }, { status: 400 });
    }

    if (err.message === 'WEAK_PASSWORD') {
      return NextResponse.json(
        { error: 'Паролата трябва да е поне 6 символа.' },
        { status: 400 },
      );
    }

    if (err.message === 'INVALID_OR_USED_TOKEN') {
      return NextResponse.json(
        { error: 'Невалиден или използван токен.' },
        { status: 400 },
      );
    }

    if (err.message === 'EMAIL_TOKEN_MISMATCH') {
      return NextResponse.json(
        { error: 'Имейлът не съвпада с токена.' },
        { status: 400 },
      );
    }

    if (err.message === 'TOKEN_EXPIRED') {
      return NextResponse.json(
        { error: 'Токенът е изтекъл.' },
        { status: 400 },
      );
    }

    if (err.message === 'USER_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Потребителят не е намерен.' },
        { status: 404 },
      );
    }
  }

  return NextResponse.json(
    {
      error: 'Възникна грешка при смяна на паролата. Моля, опитайте отново.',
    },
    { status: 500 },
  );
}
