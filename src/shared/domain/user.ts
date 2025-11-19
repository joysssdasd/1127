export type UserStatus = 'pending' | 'active' | 'suspended';

export interface AuthIdentifier {
  openId: string;
  unionId?: string;
}

export interface DeviceFingerprint {
  deviceId: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface UserProfile {
  id: string;
  phone?: string;
  wechat?: AuthIdentifier;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface JwtPayload {
  sub: string;
  openId: string;
  deviceId: string;
  exp: number;
}

