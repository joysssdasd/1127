export class DomainError extends Error {
  constructor(message: string, public readonly code: string, public readonly status: number = 400) {
    super(message);
  }
}

export const Errors = {
  InvalidState: new DomainError('state or nonce invalid', 'AUTH_STATE_INVALID', 401),
  RateLimited: new DomainError('too many attempts', 'RATE_LIMITED', 429),
  OtpInvalid: new DomainError('invalid or expired otp', 'OTP_INVALID', 400),
  InvalidCredentials: new DomainError('invalid phone or password', 'INVALID_CREDENTIALS', 401),
  PasswordTooWeak: new DomainError('password must be at least 6 characters', 'PASSWORD_WEAK', 400),
  AdminOnly: new DomainError('admin permission required', 'ADMIN_ONLY', 403),
  WeChatRequired: new DomainError('请输入微信号', 'WECHAT_REQUIRED', 400),
  AdminSmsOnly: new DomainError('管理员必须使用短信验证码登录', 'ADMIN_SMS_ONLY', 401),
};

export function assert(condition: unknown, error: DomainError): asserts condition {
  if (!condition) {
    throw error;
  }
}
