import { DeviceFingerprint } from '../domain/user';

export interface WeChatLoginRequest {
  state: string;
  code: string;
  nonce: string;
  device: DeviceFingerprint;
}

export interface WeChatLoginResponse {
  sessionToken: string;
  expiresIn: number;
}

export interface BindPhoneRequest {
  sessionToken: string;
  phone: string;
  otp: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthController {
  startWeChatLogin(payload: WeChatLoginRequest): Promise<WeChatLoginResponse>;
  bindPhone(payload: BindPhoneRequest): Promise<AuthTokens>;
}
