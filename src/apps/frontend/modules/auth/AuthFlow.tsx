import { useState } from 'react';
import { WeChatAuthController } from '../../../../services/auth/wechat.controller';
import { useToast } from '../../hooks/useToast';

const controller = new WeChatAuthController();

export function AuthFlow() {
  const [phone, setPhone] = useState('13800000000');
  const [otp, setOtp] = useState('123456');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const { message, show } = useToast();

  const startWeChat = async () => {
    const deviceId = 'device-' + Date.now();
    controller.issueState('state', 'nonce', deviceId);
    const response = await controller.startWeChatLogin({ state: 'state', nonce: 'nonce', code: 'mock-code', device: { deviceId } });
    controller.issueOtp(phone, otp);
    setSessionToken(response.sessionToken);
    show('授权成功，去绑定手机号');
  };

  const bindPhone = async () => {
    if (!sessionToken) return;
    const tokens = await controller.bindPhone({ sessionToken, phone, otp });
    show(`登录成功，token: ${tokens.accessToken.slice(0, 6)}...`);
  };

  return (
    <div>
      <h3>微信+手机号双因子</h3>
      <div>
        <label>手机号</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div>
        <label>验证码</label>
        <input value={otp} onChange={(e) => setOtp(e.target.value)} />
      </div>
      <button onClick={startWeChat}>1. 微信授权</button>
      <button onClick={bindPhone} disabled={!sessionToken}>
        2. 绑定手机号并登录
      </button>
      {message && <div className="toast">{message}</div>}
    </div>
  );
}
