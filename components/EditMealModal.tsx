// components/EditMealModal.tsx
'use client';

import { useState, useTransition } from 'react';
import { regenerateMealAction } from '@/app/actions/mealPlan';

interface Props {
  dailyMealId: string;
  mealPlanId: string;
  dayNumber: number;
  currentTitle: string;
}

export default function EditMealModal({
  dailyMealId,
  mealPlanId,
  dayNumber,
  currentTitle,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [requestText, setRequestText] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestText.trim()) return;

    startTransition(async () => {
      try {
        await regenerateMealAction(dailyMealId, mealPlanId, requestText);
        setIsOpen(false);
        setRequestText('');
      } catch (error) {
        alert('料理の修正に失敗しました。もう一度お試しください。');
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition flex items-center gap-1"
      >
        ✏️ この料理を変更する
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                DAY {dayNumber} の料理を変更
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              現在の料理: <strong className="text-slate-800">{currentTitle}</strong>
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  どのような料理に変更したいですか？
                </label>
                <textarea
                  value={requestText}
                  onChange={(e) => setRequestText(e.target.value)}
                  placeholder="例: フライパンひとつで短時間で作れるものにして / 子供が喜ぶマイルドな味付けにして / キャベツをもっと使う料理にして"
                  rows={3}
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isPending || !requestText.trim()}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg shadow-xs transition flex items-center gap-1.5"
                >
                  {isPending ? (
                    <>
                      <span className="animate-spin">🌀</span> 再提案中...
                    </>
                  ) : (
                    '要望を反映して変更する'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}