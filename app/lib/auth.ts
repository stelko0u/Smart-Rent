import { cookies } from 'next/headers';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { UserRepository } from './repositories';

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? 'token';

export async function getAuthUser() {
  if (!JWT_SECRET) {
    return null;
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const payload = jwt.verify(token, JWT_SECRET) as
      | JwtPayload
      | Record<string, any>;

    const userId = Number((payload as any).userId ?? payload.sub ?? null);
    if (!userId || Number.isNaN(userId)) {
      return null;
    }

    const user = await UserRepository.findById(userId);

    if (!user) {
      return null;
    }

    return user;
  } catch (err) {
    console.error('getAuthUser error:', err);
    return null;
  }
}
