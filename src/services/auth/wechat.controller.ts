import { AuthController, AuthTokens, BindPhoneRequest, WeChatLoginRequest, WeChatLoginResponse } from '../../shared/contracts/auth';
import { createUserRepository, UserRepository } from '../../shared/domain/userRepository';
import { DeviceFingerprint } from '../../shared/domain/user';
import { JwtService } from '../../shared/utils/jwt';
import { AuthStateStore } from './stateStore';
import { EphemeralSessionStore } from '../../shared/utils/sessionStore';
import { BindService } from './bind.service';
import { OtpService } from '../../shared/utils/otp';
import { SlidingWindowRateLimiter } from '../../shared/utils/rateLimiter';
import { DomainError, Errors, assert } from '../../shared/utils/errors';

interface PendingSession {
  userId: string;
  openId: string;
  device: DeviceFingerprint;
}

export class WeChatAuthController implements AuthController {
  private readonly users: UserRepository = createUserRepository();
  private readonly authState = new AuthStateStore();
  private readonly otpService = new OtpService();
  private readonly bindService = new BindService(this.otpService, new SlidingWindowRateLimiter(3, 60 * 1000));
  private readonly sessionStore = new EphemeralSessionStore<PendingSession>(5 * 60 * 1000);
  private readonly jwt = new JwtService(process.env.JWT_SECRET ?? 'dev-secret', 60 * 60 * 24 * 30);
  private readonly refreshJwt = new JwtService(process.env.JWT_REFRESH_SECRET ?? 'dev-refresh', 60 * 60 * 24 * 90);

  issueState(state: string, nonce: string, deviceId: string): void {
    this.authState.issue(state, nonce, deviceId);
  }

  issueOtp(phone: string, otp: string): void {
    this.otpService.issue(phone, otp);
  }

  async startWeChatLogin(payload: WeChatLoginRequest): Promise<WeChatLoginResponse> {
    const deviceId = this.authState.verify(payload.state, payload.nonce);
    assert(deviceId !== null, Errors.InvalidState);
    if (deviceId !== payload.device.deviceId) {
      throw new DomainError('device mismatch', 'DEVICE_MISMATCH', 401);
    }

    const openId = this.resolveOpenId(payload.code);
    let user = await this.users.findByOpenId(openId);
    if (!user) {
      user = await this.users.createWithWeChat({ openId });
    }

    const sessionToken = this.sessionStore.create({ userId: user.id, openId, device: payload.device });
    return { sessionToken, expiresIn: 5 * 60 };
  }

  async bindPhone(payload: BindPhoneRequest): Promise<AuthTokens> {
    const session = this.sessionStore.consume(payload.sessionToken);
    if (!session) {
      throw new DomainError('session expired', 'SESSION_EXPIRED', 401);
    }

    this.bindService.validatePhone(payload.phone);
    this.bindService.ensureOtpAllowance(payload.phone);
    this.bindService.verifyOtp(payload.phone, payload.otp);

    const user = await this.users.findByOpenId(session.openId);
    assert(user, Errors.BindingIncomplete);
    user.phone = payload.phone;
    user.status = 'active';
    await this.users.update(user);

    const tokens = this.issueTokens(session.userId, session.openId, session.device.deviceId);
    return tokens;
  }

  private resolveOpenId(code: string): string {
    return `wx_${Buffer.from(code).toString('hex')}`;
  }

  private issueTokens(userId: string, openId: string, deviceId: string): AuthTokens {
    const payload = { sub: userId, openId, deviceId } as const;
    return {
      accessToken: this.jwt.issue(payload),
      refreshToken: this.refreshJwt.issue(payload),
      expiresIn: 60 * 60 * 24 * 30,
    };
  }
}
