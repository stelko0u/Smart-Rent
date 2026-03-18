import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { PasswordResetTokenRepository } from '@/lib/repositories/PasswordResetTokenRepository';
import { UserRepository } from '@/lib/repositories/userRepository';


export async function POST(req: Request) {
  try {
    const { email, token, password } = await req.json();

    if (!email || !token || !password) {
      return NextResponse.json({ error: 'Липсват данни.' }, { status: 400 });
    }

    // 1️⃣ Намери токена в базата
    const record = await PasswordResetTokenRepository.findByToken(token);

    if (!record) {
      return NextResponse.json(
        { error: 'Невалиден или използван токен.' },
        { status: 400 },
      );
    }

    // 2️⃣ Провери дали е за същия имейл
    if (record.email !== email) {
      return NextResponse.json(
        { error: 'Имейлът не съвпада с токена.' },
        { status: 400 },
      );
    }

    // 3️⃣ Провери дали е изтекъл
    if (record.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Токенът е изтекъл.' },
        { status: 400 },
      );
    }

    // 4️⃣ Намери потребителя по имейл
    const user = await UserRepository.findByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: 'Потребителят не е намерен.' },
        { status: 404 },
      );
    }

    // 5️⃣ Хеширай новата парола
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6️⃣ Запиши новата парола в таблицата с потребители
    await UserRepository.update(user.id, { password: hashedPassword });

    // 7️⃣ Изтрий използвания токен
    await PasswordResetTokenRepository.deleteByToken(token);

    return NextResponse.json({
      success: true,
      message: 'Паролата е сменена успешно.',
    });
  } catch (err: any) {
    console.error('reset-password error:', err);
    return NextResponse.json(
      {
        error: 'Възникна грешка при смяна на паролата. Моля, опитайте отново.',
      },
      { status: 500 },
    );
  }
}
