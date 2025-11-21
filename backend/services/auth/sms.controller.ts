import bcrypt from 'bcryptjs';
import { createUserRepository, UserRepository } from '../../shared/domain/userRepository';
import type { UserProfile } from '../../shared/domain/user';
import { OtpService } from '../../shared/utils/otp';
import { SlidingWindowRateLimiter } from '../../shared/utils/rateLimiter';
import { JwtService } from '../../shared/utils/jwt';
import { Errors } from '../../shared/utils/errors';
import { sendVerificationCode } from '../../infrastructure/sms/spugClient';

type SmsSender = (phone: string, code: string) => Promise<void>;

const DEFAULT_ADMIN_PHONES = (process.env.ADMIN_PHONES ?? '13011319329,13001220766')
  .split(',')
  .map((p) => p.trim())
  .filter(Boolean);

function normalizePhone(phone: string): string {
  return phone.trim();
}

type LoginPayload = {
  phone: string;
  password?: string;
  code?: string;
  wechat?: string;
};

export class SmsPasswordAuthController {
  private readonly users: UserRepository;
  private readonly otp: OtpService;
  private readonly sendSms: SmsSender;
  private readonly rateLimiter: SlidingWindowRateLimiter;
  private readonly jwt: JwtService;
  private readonly refreshJwt: JwtService;
  private readonly adminPhones: Set<string>;

  constructor(
    options?: {
      repository?: UserRepository;
      smsSender?: SmsSender;
      otpService?: OtpService;
      rateLimiter?: SlidingWindowRateLimiter;
    },
  ) {
    this.users = options?.repository ?? createUserRepository();
    this.otp = options?.otpService ?? new OtpService();
    this.sendSms = options?.smsSender ?? sendVerificationCode;
    this.rateLimiter = options?.rateLimiter ?? new SlidingWindowRateLimiter(5, 60 * 1000);
    this.jwt = new JwtService(process.env.JWT_SECRET ?? 'dev-secret', 60 * 60 * 24 * 30);
    this.refreshJwt = new JwtService(process.env.JWT_REFRESH_SECRET ?? 'dev-refresh', 60 * 60 * 24 * 90);
    this.adminPhones = new Set(DEFAULT_ADMIN_PHONES);
  }

  async sendCode(phone: string): Promise<void> {
    const normalized = normalizePhone(phone);
    if (!this.rateLimiter.allow(normalized)) {
      throw Errors.RateLimited;
    }
    const code = this.generateCode();
    this.otp.issue(normalized, code);
    await this.sendSms(normalized, code);
  }

  async login(input: LoginPayload) {
    const phone = normalizePhone(input.phone);
    const existing = await this.users.findByPhone(phone);
    const isAdminPhone = this.adminPhones.has(phone);

    if (!input.code && isAdminPhone) {
      throw Errors.AdminSmsOnly;
    }

    if (input.code) {
      if (!this.otp.verify(phone, input.code)) {
        throw Errors.OtpInvalid;
      }
      if (!existing) {
        const password = this.requirePassword(input.password);
        const wechat = this.requireWechat(input.wechat);
        const passwordHash = await bcrypt.hash(password, 10);
        let created = await this.users.createWithPhone(phone, passwordHash, wechat);
        created.status = 'active';
        created = await this.users.update(created);
        return this.pack(created);
      }
      if (input.wechat && input.wechat !== existing.wechat) {
        existing.wechat = input.wechat;
      }
      if (input.password && input.password.length >= 6) {
        existing.passwordHash = await bcrypt.hash(input.password, 10);
      }
      existing.status = 'active';
      const updated = await this.users.update(existing);
      return this.pack(updated);
    }

    if (!existing) {
      throw Errors.InvalidCredentials;
    }
    const password = this.requirePassword(input.password);
    await this.ensurePasswordMatches(existing, password);
    if (input.wechat && input.wechat !== existing.wechat) {
      existing.wechat = input.wechat;
      await this.users.update(existing);
    }
    return this.pack(existing);
  }

  private async ensurePasswordMatches(user: UserProfile, password: string): Promise<void> {
    if (!user.passwordHash) {
      const hash = await bcrypt.hash(password, 10);
      user.passwordHash = hash;
      return;
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw Errors.InvalidCredentials;
    }
  }

  private generateCode(): string {
    return (Math.floor(Math.random() * 900000) + 100000).toString();
  }

  private requirePassword(password?: string): string {
    if (!password || password.length < 6) {
      throw Errors.PasswordTooWeak;
    }
    return password;
  }

  private requireWechat(wechat?: string): string {
    if (!wechat || !wechat.trim()) {
      throw Errors.WeChatRequired;
    }
    return wechat.trim();
  }

  private pack(user: UserProfile) {
    const isAdmin = this.adminPhones.has(user.phone ?? '');
    const tokens = this.issueTokens(user, isAdmin);
    return { tokens, user: this.stripSensitive(user), isAdmin };
  }

  private issueTokens(user: UserProfile, isAdmin: boolean) {
    const payload = { sub: user.id, phone: user.phone ?? '', role: isAdmin ? 'admin' : 'user' } as const;
    return {
      accessToken: this.jwt.issue(payload),
      refreshToken: this.refreshJwt.issue(payload),
      expiresIn: 60 * 60 * 24 * 30,
    };
  }

  private stripSensitive(user: UserProfile): UserProfile {
    const cloned: UserProfile = { ...user };
    delete cloned.passwordHash;
    return cloned;
  }
}
