import { OtpService } from '../../shared/utils/otp';
import { SlidingWindowRateLimiter } from '../../shared/utils/rateLimiter';
import { DomainError, Errors } from '../../shared/utils/errors';

const PHONE_REGEX = /^1[3-9]\d{9}$/;

export class BindService {
  constructor(private readonly otpService: OtpService, private readonly limiter: SlidingWindowRateLimiter) {}

  validatePhone(phone: string): void {
    if (!PHONE_REGEX.test(phone)) {
      throw new DomainError('invalid phone', 'PHONE_INVALID', 400);
    }
  }

  ensureOtpAllowance(phone: string): void {
    if (!this.limiter.allow(`otp:${phone}`)) {
      throw Errors.RateLimited;
    }
  }

  verifyOtp(phone: string, otp: string): void {
    if (!this.otpService.verify(phone, otp)) {
      throw Errors.OtpInvalid;
    }
  }
}
