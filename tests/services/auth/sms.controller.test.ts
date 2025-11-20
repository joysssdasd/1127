import { SmsPasswordAuthController } from '../../../backend/services/auth/sms.controller';
import { InMemoryUserRepository } from '../../../backend/shared/domain/userRepository';
import { OtpService } from '../../../backend/shared/utils/otp';
import { SlidingWindowRateLimiter } from '../../../backend/shared/utils/rateLimiter';

describe('SmsPasswordAuthController', () => {
  const smsMock = jest.fn().mockResolvedValue(undefined);

  function createController() {
    return new SmsPasswordAuthController({
      repository: new InMemoryUserRepository(),
      smsSender: smsMock,
      otpService: new OtpService(),
      rateLimiter: new SlidingWindowRateLimiter(10, 60 * 1000),
    });
  }

  beforeEach(() => {
    smsMock.mockClear();
  });

  it('sends verification code and logs in new user', async () => {
    const controller = createController();
    await controller.sendCode('13800000000');
    expect(smsMock).toHaveBeenCalled();
    const code = smsMock.mock.calls[0][1];
    const result = await controller.login({ phone: '13800000000', password: 'secret123', code });
    expect(result.tokens.accessToken).toBeTruthy();
    expect(result.user.phone).toBe('13800000000');
  });

  it('rejects wrong password for existing user', async () => {
    const controller = createController();
    await controller.sendCode('13800000001');
    const code = smsMock.mock.calls[0][1];
    await controller.login({ phone: '13800000001', password: 'secret123', code });
    await controller.sendCode('13800000001');
    const code2 = smsMock.mock.calls[1][1];
    await expect(controller.login({ phone: '13800000001', password: 'wrongpw', code: code2 })).rejects.toThrow('invalid phone or password');
  });
});
