export type UserStatus = 'pending' | 'active' | 'suspended';

export interface UserProfile {
  id: string;
  phone?: string;
  wechat?: string;
  passwordHash?: string;
  status: UserStatus;
  points?: number;
  totalDeals?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface JwtPayload {
  sub: string;
  phone: string;
  role?: 'admin' | 'user';
  exp: number;
}

