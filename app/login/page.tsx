// app/login/page.tsx
'use client';

import { useState } from 'react';
import { signIn, signUp } from '@/app/actions/auth';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const action = isSignUp ? signUp : signIn;
    const res = await action(formData);

    if (res?.error) {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800">
            {isSignUp ? '新規アカウント登録' : 'ログイン'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">買い物＆在庫リストアプリ</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">お名前</label>
              <input
                type="text"
                name="name"
                required
                placeholder="山田 太郎"
                className="w-full h-11 px-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">メールアドレス</label>
            <input
              type="email"
              name="email"
              required
              placeholder="example@email.com"
              className="w-full h-11 px-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">パスワード</label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full h-11 px-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-base shadow-md transition-colors"
          >
            {isSignUp ? '登録する' : 'ログイン'}
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-xs text-blue-600 hover:underline font-semibold"
          >
            {isSignUp
              ? 'すでにアカウントをお持ちですか？ ログイン'
              : 'アカウントをお持ちでないですか？ 新規登録'}
          </button>
        </div>

      </div>
    </div>
  );
}
