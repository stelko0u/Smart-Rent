import { UserRepository } from '../repository/UserRepository';
import { getTokenFromRequest } from './getTokenFromRequest';
import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function getUserFromRequest(req: Request) {
  if (!JWT_SECRET) return null;

  const token = getTokenFromRequest(req);
  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = Number(payload.userId ?? payload.sub);

    if (!userId || Number.isNaN(userId)) return null;

    return UserRepository.findById(userId);
  } catch {
    return null;
  }
}
