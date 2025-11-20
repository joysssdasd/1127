const DEFAULT_SMS_URL = process.env.SPUG_SMS_URL ?? 'https://push.spug.cc/send/Xyd9M8AlV5rKbDBk';
const DEFAULT_SMS_NAME = process.env.SPUG_SMS_SENDER ?? 'C2C Info';

interface SpugResponse {
  code?: number;
  msg?: string;
}

export async function sendVerificationCode(phone: string, code: string): Promise<void> {
  const url = DEFAULT_SMS_URL;
  if (!url) {
    throw new Error('SPUG_SMS_URL is not configured');
  }
  const body = {
    name: DEFAULT_SMS_NAME,
    code,
    targets: phone,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as SpugResponse;
  if (!response.ok || (payload.code && payload.code !== 200 && payload.code !== 0)) {
    const reason = payload.msg ?? `failed with status ${response.status}`;
    throw new Error(`短信发送失败：${reason}`);
  }
}
