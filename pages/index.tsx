import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import styles from '../styles/Home.module.css';

type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  totalDeals: number;
  remainingViews: number;
  viewLimit: number;
};

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    sellerPhone: '',
    title: '',
    description: '',
    price: '0',
  });
  const [buyer, setBuyer] = useState({ buyerPhone: '', postId: '' });

  const hasEnv = useMemo(() => {
    return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }, []);

  const loadListings = async () => {
    setLoading(true);
    setMessage(null);
    const res = await fetch('/api/listings');
    const body: ApiResponse<Listing[]> = await res.json();
    if (!res.ok || body.error) {
      setMessage(body.error ?? '加载失败');
    } else if (body.data) {
      setListings(body.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadListings();
  }, []);

  const submitListing = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const payload = {
      sellerPhone: form.sellerPhone.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
      price: Number(form.price),
    };
    const res = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body: ApiResponse<Listing> = await res.json();
    if (!res.ok || body.error) {
      setMessage(body.error ?? '发布失败');
    } else {
      setMessage('发布成功');
      setForm({ sellerPhone: '', title: '', description: '', price: '0' });
      loadListings();
    }
  };

  const purchaseContact = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const payload = {
      buyerPhone: buyer.buyerPhone.trim(),
      postId: buyer.postId.trim(),
    };
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body: ApiResponse<{ contactToken: string; confirmDeadline: string }> = await res.json();
    if (!res.ok || body.error) {
      setMessage(body.error ?? '购买失败');
    } else if (body.data) {
      setMessage(`已复制微信号，可用凭证 ${body.data.contactToken}，请在 ${new Date(body.data.confirmDeadline).toLocaleString()} 前确认成交`);
      setBuyer({ buyerPhone: '', postId: '' });
    }
  };

  return (
    <main className={styles.container}>
      <h1>供需信息撮合平台 Demo</h1>
      {!hasEnv && (
        <p className={styles.warning}>尚未设置 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY，无法读取数据。</p>
      )}
      {message && <p className={styles.message}>{message}</p>}

      <section className={styles.card}>
        <h2>发布信息</h2>
        <form onSubmit={submitListing} className={styles.form}>
          <input
            placeholder="卖家手机号"
            value={form.sellerPhone}
            onChange={(e) => setForm({ ...form, sellerPhone: e.target.value })}
            required
          />
          <input
            placeholder="标题"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <textarea
            placeholder="描述"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            required
          />
          <input
            type="number"
            min={0}
            placeholder="价格"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
          <button type="submit">发布</button>
        </form>
      </section>

      <section className={styles.card}>
        <h2>购买联系方式</h2>
        <form onSubmit={purchaseContact} className={styles.form}>
          <input
            placeholder="买家手机号"
            value={buyer.buyerPhone}
            onChange={(e) => setBuyer({ ...buyer, buyerPhone: e.target.value })}
            required
          />
          <input
            placeholder="信息ID"
            value={buyer.postId}
            onChange={(e) => setBuyer({ ...buyer, postId: e.target.value })}
            required
          />
          <button type="submit">付1积分获取微信号</button>
        </form>
      </section>

      <section className={styles.card}>
        <div className={styles.header}>
          <h2>最新信息</h2>
          <button onClick={loadListings} disabled={loading}>
            {loading ? '加载中…' : '刷新'}
          </button>
        </div>
        <ul className={styles.list}>
          {listings.map((item) => (
            <li key={item.id}>
              <div>
                <strong>{item.title}</strong> ¥{item.price} ｜ 成交{item.totalDeals}次 ｜ 剩余{item.remainingViews}/{item.viewLimit}
              </div>
              <small>{item.description}</small>
              <code>ID: {item.id}</code>
            </li>
          ))}
        </ul>
        {listings.length === 0 && <p>暂无数据，试着发布一条吧。</p>}
      </section>
    </main>
  );
}
