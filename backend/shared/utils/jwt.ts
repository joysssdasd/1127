import jwt from 'jsonwebtoken';
import { JwtPayload } from '../domain/user';

export class JwtService {
  constructor(private readonly secret: string, private readonly expiresInSeconds = 60 * 60 * 24 * 30) {}

  issue(payload: Omit<JwtPayload, 'exp'>): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresInSeconds });
  }

  verify(token: string): JwtPayload {
    return jwt.verify(token, this.secret) as JwtPayload;
  }
}
