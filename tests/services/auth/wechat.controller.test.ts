import { WeChatAuthController } from '../../../backend/services/auth/wechat.controller';

describe('WeChatAuthController', () => {
  const device = { deviceId: 'device-1', userAgent: 'jest', ipAddress: '127.0.0.1' };

  it('completes wechat login and phone binding', async () => {
    const controller = new WeChatAuthController();
    controller.issueState('state-123', 'nonce-abc', device.deviceId);
    const login = await controller.startWeChatLogin({ state: 'state-123', code: 'wx-code', nonce: 'nonce-abc', device });
    controller.issueOtp('13800000000', '123456');
    const tokens = await controller.bindPhone({ sessionToken: login.sessionToken, phone: '13800000000', otp: '123456' });

    expect(tokens.accessToken).toBeTruthy();
    expect(tokens.refreshToken).toBeTruthy();
    expect(tokens.expiresIn).toBeGreaterThan(0);
  });

  it('rejects invalid state', async () => {
    const controller = new WeChatAuthController();
    await expect(
      controller.startWeChatLogin({ state: 'state-bad', code: 'wx-code', nonce: 'nonce-abc', device })
    ).rejects.toThrow('state or nonce invalid');
  });

  it('fails on invalid otp', async () => {
    const controller = new WeChatAuthController();
    controller.issueState('state-otp', 'nonce-otp', device.deviceId);
    const login = await controller.startWeChatLogin({ state: 'state-otp', code: 'wx-code', nonce: 'nonce-otp', device });
    controller.issueOtp('13800000001', '123456');
    await expect(
      controller.bindPhone({ sessionToken: login.sessionToken, phone: '13800000001', otp: '111111' })
    ).rejects.toThrow('invalid or expired otp');
  });
});
