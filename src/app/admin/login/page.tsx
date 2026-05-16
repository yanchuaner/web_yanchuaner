'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ShieldAlert } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('请输入校验口令');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '口令错误');
      }

      router.push('/admin');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF5FF] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#7C3AED]/10 bg-white/60 p-8 backdrop-blur-xl shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7C3AED]/10">
            <Lock size={28} className="text-[#7C3AED]" />
          </div>
          <h1 className="font-heading text-xl font-bold text-[#4C1D95]">管理员登录</h1>
          <p className="mt-1 text-sm text-[#4C1D95]/60">请输入校验口令以进入后台</p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <ShieldAlert size={16} className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[#4C1D95]">
              校验口令
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入口令"
              className="input w-full"
              autoFocus
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-6 py-2.5 text-sm text-[#7C3AED] transition hover:bg-[#7C3AED]/10 disabled:opacity-50 cursor-pointer font-medium"
          >
            {loading ? '验证中...' : '进入后台'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#4C1D95]/40">
          燕中校友数字母港 · 管理后台
        </p>
        <p className="mt-3 text-center text-xs text-[#4C1D95]/40">
          想要获取口令，请关注校友会微信公众号「燕中校友汇」
        </p>
      </div>
    </div>
  );
}
