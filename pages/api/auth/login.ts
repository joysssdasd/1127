import type { NextApiRequest, NextApiResponse } from 'next';
import { createUserRepository } from '../../../backend/shared/domain/userRepository';
import { JwtService } from '../../../backend/shared/utils/jwt';
import type { UserProfile } from '../../../backend/shared/domain/user';
import { Errors } from '../../../backend/shared/utils/errors';
import bcrypt from 'bcryptjs';
import { OtpService } from '../../../backend/shared/utils/otp';

// JWT 服务实例
const accessJwt = new JwtService(process.env.JWT_SECRET ?? 'newnew-secret', 60 * 60 * 24 * 30); // 30天
const refreshJwt = new JwtService(process.env.JWT_REFRESH_SECRET ?? 'newnew-refresh', 60 * 60 * 24 * 90); // 90天

// 短信服务
const otpService = new OtpService();
const userRepository = createUserRepository();

interface LoginRequest {
  phone: string;
  password?: string;
  smsCode?: string;
}

interface LoginResponse {
  user: Omit<UserProfile, 'passwordHash'>;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  loginType: 'password' | 'sms';
}

async function handlePasswordLogin(phone: string, password: string): Promise<LoginResponse> {
  const user = await userRepository.findByPhone(phone);
  if (!user || !user.passwordHash) {
    throw new Error('手机号或密码错误');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new Error('手机号或密码错误');
  }

  const tokens = generateTokens(user);
  const safeUser = stripSensitive(user);

  return {
    user: safeUser,
    tokens,
    loginType: 'password' as const,
  };
}

async function handleSmsLogin(phone: string, smsCode: string): Promise<LoginResponse> {
  // 验证短信验证码
  const isValid = otpService.verify(phone, smsCode);
  if (!isValid) {
    throw new Error('验证码错误或已过期');
  }

  const user = await userRepository.findByPhone(phone);
  if (!user) {
    throw new Error('手机号未注册，请先注册');
  }

  // 更新用户状态为活跃
  if (user.status === 'pending') {
    user.status = 'active';
    await userRepository.update(user);
  }

  const tokens = generateTokens(user);
  const safeUser = stripSensitive(user);

  return {
    user: safeUser,
    tokens,
    loginType: 'sms' as const,
  };
}

function generateTokens(user: UserProfile) {
  const payload = {
    sub: user.id,
    phone: user.phone,
    role: 'user',
  };

  return {
    accessToken: accessJwt.sign(payload),
    refreshToken: refreshJwt.sign(payload),
    expiresIn: 60 * 60 * 24 * 30, // 30天
  };
}

function stripSensitive(user: UserProfile): Omit<UserProfile, 'passwordHash'> {
  const safe = { ...user };
  delete safe.passwordHash;
  return safe;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { phone, password, smsCode }: LoginRequest = req.body;

    if (!phone) {
      return res.status(400).json({ error: '手机号不能为空' });
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: '手机号格式不正确' });
    }

    let response: LoginResponse;

    // 优先使用密码登录
    if (password) {
      response = await handlePasswordLogin(phone, password);
    } else if (smsCode) {
      response = await handleSmsLogin(phone, smsCode);
    } else {
      return res.status(400).json({
        error: '请提供密码或验证码'
      });
    }

    res.status(200).json({
      success: true,
      message: '登录成功',
      data: response,
    });
  } catch (error) {
    console.error('Login error:', error);

    const message = (error as Error).message;
    res.status(400).json({
      success: false,
      error: message,
      code: message.includes('验证码') ? 'INVALID_CODE' : 'INVALID_CREDENTIALS',
    });
  }
}
