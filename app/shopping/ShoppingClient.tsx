'use client';

import { useState } from 'react';
import {
  getShoppingItems,
  addShoppingItem,
  updateItemCounts,
  deleteShoppingItem,
} from '@/app/actions/shopping';
import { signOut } from '@/app/actions/auth';

type ShoppingItem = {
  id: string;
  name: string;
  requiredCount: number;
  currentCount: number;
  amazonUrl: string | null;
};

type User = {
  id: string;
  name: string | null;
  email: string | null;
};

type ShoppingClientProps = {
  user: User;
  initialItems: ShoppingItem[];
};

export default function ShoppingClient({ user, initialItems }: ShoppingClientProps) {
  const [items, setItems] = useState<ShoppingItem[]>(initialItems);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [requiredCount, setRequiredCount] = useState(1);
  const [currentCount, setCurrentCount] = useState(1);
  const [amazonUrl, setAmazonUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadItems = async () => {
    setIsProcessing(true);
    const data = await getShoppingItems();
    setItems(data);
    setIsProcessing(false);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsProcessing(true);
    try {
      await addShoppingItem({
        name: name.trim(),
        requiredCount: Number(requiredCount),
        currentCount: Number(currentCount),
        amazonUrl: amazonUrl.trim() || undefined,
      });

      setName('');
      setRequiredCount(1);
      setCurrentCount(1);
      setAmazonUrl('');
      setIsFormOpen(false);
      await loadItems();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateCount = async (id: string, delta: number) => {
    const targetItem = items.find((item) => item.id === id);
    if (!targetItem) return;

    const newCount = Math.max(0, targetItem.currentCount + delta);

    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, currentCount: newCount } : item
      )
    );

    setIsProcessing(true);
    try {
      await updateItemCounts(id, targetItem.requiredCount, newCount);
      await loadItems();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));

    setIsProcessing(true);
    try {
      await deleteShoppingItem(id);
      await loadItems();
    } finally {
      setIsProcessing(false);
    }
  };

  const itemCount = items.length;

  return (
    <div className="min-h-screen bg-slate-100 pb-32 pt-safe">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center max-w-lg mx-auto">
        <span className="text-xs font-bold text-slate-600">
          👤 {user.name || user.email} でログイン中
        </span>
        <form action={signOut}>
          <button
            type="submit"
            className="text-xs text-red-600 hover:underline font-bold"
          >
            ログアウト
          </button>
        </form>
      </header>

      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 pt-4 shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛒</span>
            <h1 className="text-lg font-bold text-slate-800">買い物＆在庫リスト</h1>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-200">
            全 {itemCount} 件
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-3">
        {isProcessing && items.length === 0 ? (
          <div className="text-center py-16 text-slate-400 font-medium">
            データを読み込み中...
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-6">
            <p className="text-4xl mb-2">📦</p>
            <p className="text-slate-500 font-medium">登録されている商品がありません</p>
            <p className="text-xs text-slate-400 mt-1">下の＋ボタンから追加してください</p>
          </div>
        ) : (
          items.map((item) => {
            const isShortage = item.currentCount < item.requiredCount;
            const shortageDiff = item.requiredCount - item.currentCount;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all active:scale-[0.99] ${
                  isShortage
                    ? 'bg-red-50/90 border-red-300 shadow-sm'
                    : 'bg-white border-slate-200/80 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="space-y-1">
                    <h2 className="font-bold text-slate-900 text-base leading-snug">
                      {item.name}
                    </h2>
                    {isShortage && (
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white shadow-xs">
                        <span>⚠️ 要買い足し (あと {shortageDiff} 個)</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 active:text-red-600 transition-colors"
                    aria-label="削除"
                    disabled={isProcessing}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100/80 mt-2">
                  <div className="text-xs text-slate-500">
                    現在: <span className="text-lg font-extrabold text-slate-900 mx-0.5">{item.currentCount}</span>
                    <span className="text-slate-400">/ 最低 {item.requiredCount}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.amazonUrl && (
                      <a
                        href={item.amazonUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 px-3 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-amber-950 font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs transition-colors"
                      >
                        <span>📦 Amazon</span>
                        <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}

                    <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateCount(item.id, -1)}
                        className="w-10 h-10 bg-white active:bg-slate-200 rounded-lg shadow-xs flex items-center justify-center text-slate-800 font-bold text-lg transition-colors"
                        disabled={isProcessing}
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateCount(item.id, 1)}
                        className="w-10 h-10 bg-blue-600 active:bg-blue-700 text-white rounded-lg shadow-xs flex items-center justify-center font-bold text-lg transition-colors"
                        disabled={isProcessing}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </main>

      <div className="fixed bottom-6 right-5 z-30">
        <button
          onClick={() => setIsFormOpen((prev) => !prev)}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full shadow-lg flex items-center justify-center text-2xl font-light transition-transform active:scale-95"
          aria-label="追加"
          disabled={isProcessing}
        >
          {isFormOpen ? '✕' : '＋'}
        </button>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs flex items-end">
          <div
            className="w-full max-w-md mx-auto bg-white rounded-t-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base">新しい商品を登録</h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-medium"
              >
                キャンセル
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">商品名 *</label>
                <input
                  type="text"
                  required
                  placeholder="例: トイレットペーパー"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Amazon商品URL (任意)</label>
                <input
                  type="url"
                  placeholder="https://www.amazon.co.jp/dp/..."
                  value={amazonUrl}
                  onChange={(e) => setAmazonUrl(e.target.value)}
                  className="w-full h-11 px-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">最低ストック数</label>
                  <input
                    type="number"
                    min="1"
                    value={requiredCount}
                    onChange={(e) => setRequiredCount(Number(e.target.value))}
                    className="w-full h-11 px-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">現在の在庫数</label>
                  <input
                    type="number"
                    min="0"
                    value={currentCount}
                    onChange={(e) => setCurrentCount(Number(e.target.value))}
                    className="w-full h-11 px-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none text-center"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-base shadow-md transition-colors mt-2"
                disabled={isProcessing}
              >
                リストに追加する
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
