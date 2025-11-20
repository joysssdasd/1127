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

  it('registers via code with wechat contact', async () => {
    const controller = createController();
    await controller.sendCode('13800000000');
    const code = smsMock.mock.calls[0][1];
    const result = await controller.login({ phone: '13800000000', password: 'secret123', code, wechat: 'wx-new' });
    expect(result.user.phone).toBe('13800000000');
    expect(result.user.wechat).toBe('wx-new');
  });

  it('supports password login and rejects invalid password', async () => {
    const controller = createController();
    await controller.sendCode('13800000001');
    const code = smsMock.mock.calls[0][1];
    await controller.login({ phone: '13800000001', password: 'secret123', code, wechat: 'wx-user' });

    await expect(controller.login({ phone: '13800000001', password: 'wrongpw' })).rejects.toThrow('invalid phone or password');
    const success = await controller.login({ phone: '13800000001', password: 'secret123' });
    expect(success.user.wechat).toBe('wx-user');
  });

  it('allows existing users to reset password via code', async () => {
    const controller = createController();
    await controller.sendCode('13800000002');
    const code = smsMock.mock.calls[0][1];
    await controller.login({ phone: '13800000002', password: 'secret123', code, wechat: 'wx-old' });

    await controller.sendCode('13800000002');
    const code2 = smsMock.mock.calls[1][1];
    await controller.login({ phone: '13800000002', password: 'newsecret', code: code2, wechat: 'wx-new' });

    const success = await controller.login({ phone: '13800000002', password: 'newsecret' });
    expect(success.user.wechat).toBe('wx-new');
  });

  it('forces admin phones to login via sms verification', async () => {
    const controller = createController();
    await controller.sendCode('13011319329');
    const code = smsMock.mock.calls[0][1];
    await controller.login({ phone: '13011319329', password: 'secret123', code, wechat: 'wx-admin' });
    await expect(controller.login({ phone: '13011319329', password: 'secret123' })).rejects.toThrow('管理员必须使用短信验证码登录');
  });
});
