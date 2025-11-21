import type { NextApiRequest, NextApiResponse } from 'next';
import { createUserRepository } from '../../../backend/shared/domain/userRepository';
import { OtpService } from '../../../backend/shared/utils/otp';
import bcrypt from 'bcryptjs';
import type { UserProfile } from '../../../backend/shared/domain/user';

interface RegisterRequest {
  phone: string;
  password: string;
  wechat?: string;
  smsCode: string;
  inviteCode?: string;
}

const otpService = new OtpService();
const userRepository = createUserRepository();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { phone, password, wechat, smsCode, inviteCode }: RegisterRequest = req.body;

    // 验证必填字段
    if (!phone || !password || !smsCode) {
      return res.status(400).json({
        error: '手机号、密码和验证码为必填项'
      });
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: '手机号格式不正确' });
    }

    // 验证密码长度
    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度至少6位' });
    }

    // 验证微信号格式
    if (wechat && wechat.trim()) {
      const wechatRegex = /^[a-zA-Z][a-zA-Z0-9_-]{5,20}$/;
      if (!wechatRegex.test(wechat.trim())) {
        return res.status(400).json({ error: '微信号格式不正确' });
      }
    }

    // 验证短信验证码
    const isCodeValid = otpService.verify(phone, smsCode);
    if (!isCodeValid) {
      return res.status(400).json({ error: '验证码错误或已过期' });
    }

    // 检查手机号是否已注册
    const existingUser = await userRepository.findByPhone(phone);
    if (existingUser) {
      return res.status(400).json({ error: '该手机号已注册' });
    }

    // 验证邀请码（如果有）
    let isValidInviteCode = true;
    if (inviteCode) {
      // 这里可以实现邀请码验证逻辑
      // 暂时设置为固定邀请码或验证规则
      const validInviteCodes = ['NEW2024', 'NIUNIU2024', 'BASE2024'];
      isValidInviteCode = validInviteCodes.includes(inviteCode.toUpperCase());

      if (!isValidInviteCode) {
        return res.status(400).json({ error: '邀请码无效' });
      }
    }

    // 创建新用户
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser: UserProfile = {
      id: crypto.randomUUID(),
      phone,
      passwordHash,
      wechat: wechat?.trim() || '',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      points: isValidInviteCode ? 50 : 0, // 有邀请码送50积分
      totalDeals: 0,
    };

    const createdUser = await userRepository.createWithPhone(phone, passwordHash, wechat?.trim());

    // 返回成功响应（不包含敏感信息）
    const safeUser = {
      id: createdUser.id,
      phone: createdUser.phone,
      wechat: createdUser.wechat,
      status: createdUser.status,
      points: createdUser.points,
      totalDeals: createdUser.totalDeals,
      createdAt: createdUser.createdAt,
      updatedAt: createdUser.updatedAt,
    };

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: safeUser,
        bonusPoints: isValidInviteCode ? 50 : 0
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: '注册失败，请稍后重试'
    });
  }
}