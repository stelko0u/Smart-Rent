import jwt from 'jsonwebtoken';

const SECRET =
  process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'please-change-me';

export function signJwt(
  payload: Record<string, any>,
  options?: jwt.SignOptions
) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d', ...options });
}

export function verifyJwt<T = any>(token: string): T | null {
  try {
    return jwt.verify(token, SECRET) as T;
  } catch {
    return null;
  }
}

