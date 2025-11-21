import type { NextApiRequest, NextApiResponse } from 'next';
import { createUserRepository } from '../../../backend/shared/domain/userRepository';
import { OtpService } from '../../../backend/shared/utils/otp';

const otpService = new OtpService();
const userRepository = createUserRepository();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { phone, type = 'register' } = req.body ?? {};

  if (!phone) {
    return res.status(400).json({ error: '手机号不能为空' });
  }

  // 验证手机号格式
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ error: '手机号格式不正确' });
  }

  try {
    // 检查是否为注册类型，如果是注册则检查手机号是否已存在
    if (type === 'register') {
      const existingUser = await userRepository.findByPhone(phone);
      if (existingUser) {
        return res.status(400).json({ error: '该手机号已注册' });
      }
    }

    // 生成6位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 存储验证码
    otpService.issue(phone, code);

    // TODO: 这里应该集成实际的短信服务发送验证码
    // 目前只是模拟发送成功
    console.log(`验证码发送到 ${phone}: ${code}`);

    res.status(200).json({
      success: true,
      message: '验证码已发送',
      expiresIn: 300 // 5分钟
    });
  } catch (error) {
    console.error('Send code error:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误，请稍后重试'
    });
  }
}
