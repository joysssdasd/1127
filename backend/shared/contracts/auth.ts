export interface SendCodeRequest {
  phone: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
  code: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
