export class DomainError extends Error {
  constructor(message: string, public readonly code: string, public readonly status: number = 400) {
    super(message);
  }
}

export const Errors = {
  InvalidState: new DomainError('state or nonce invalid', 'AUTH_STATE_INVALID', 401),
  RateLimited: new DomainError('too many attempts', 'RATE_LIMITED', 429),
  OtpInvalid: new DomainError('invalid or expired otp', 'OTP_INVALID', 400),
  BindingIncomplete: new DomainError('wechat or phone missing', 'BIND_REQUIRED', 403),
};

export function assert(condition: unknown, error: DomainError): asserts condition {
  if (!condition) {
    throw error;
  }
}
