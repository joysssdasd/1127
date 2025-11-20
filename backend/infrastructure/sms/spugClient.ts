const DEFAULT_SMS_URL = process.env.SPUG_SMS_URL ?? 'https://push.spug.cc/send/Xyd9M8AlV5rKbDBk';
const DEFAULT_SMS_NAME = process.env.SPUG_SMS_SENDER ?? 'C2C Info';
const DEFAULT_SMS_USER_ID = process.env.SPUG_SMS_USER_ID ?? '5a73b0f94f134f03a9175c186a0f5fec';
const DEFAULT_SMS_APP_KEY = process.env.SPUG_SMS_APP_KEY ?? 'ak_oYWyP1Dwvzk9qMjwxerBRgQp6E4NeAnb';

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

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (DEFAULT_SMS_USER_ID && DEFAULT_SMS_APP_KEY) {
    headers['x-spug-user'] = DEFAULT_SMS_USER_ID;
    headers['x-spug-app'] = DEFAULT_SMS_APP_KEY;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as SpugResponse;
  if (!response.ok || (payload.code && payload.code !== 200 && payload.code !== 0)) {
    const reason = payload.msg ?? `failed with status ${response.status}`;
    throw new Error(`短信发送失败：${reason}`);
  }
}
