// app/page.tsx
'use client';

import { useState } from 'react';
import { createMealPlan } from '@/app/actions/mealPlan';

const QUICK_INGREDIENTS = ['キャベツ', '玉ねぎ', '豚肉', '鶏肉', '卵', '豆腐', '人参'];

export default function HomePage() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [servings, setServings] = useState(2);
  const [days, setDays] = useState(3);
  const [isPending, setIsPending] = useState(false);

  const addIngredient = (item: string) => {
    const trimmed = item.trim();
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients([...ingredients, trimmed]);
      setInputValue('');
    }
  };

  const removeIngredient = (target: string) => {
    setIngredients(ingredients.filter((item) => item !== target));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addIngredient(inputValue);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            AI 献立ジェネレーター 🍳
          </h1>
          <p className="mt-2 text-slate-600 text-sm">
            あるもの食材を入力するだけ。人数と日数に合わせた最適なレシピをAIが提案します。
          </p>
        </div>

        <form
          action={async (formData) => {
            setIsPending(true);
            await createMealPlan(formData);
          }}
          className="space-y-6"
        >
          {/* 食材入力フォーム */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              手元にある食材
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="例: キャベツ (Enterで追加)"
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
              <button
                type="button"
                onClick={() => addIngredient(inputValue)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700 transition"
              >
                追加
              </button>
            </div>

            {/* クイック選択タグ */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="text-xs text-slate-400 self-center mr-1">よく使う食材:</span>
              {QUICK_INGREDIENTS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => addIngredient(item)}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full transition"
                >
                  + {item}
                </button>
              ))}
            </div>

            {/* 追加された食材タグ一覧 */}
            <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
              {ingredients.length === 0 ? (
                <span className="text-xs text-slate-400 self-center">
                  選択された食材がここに表示されます
                </span>
              ) : (
                ingredients.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => removeIngredient(item)}
                      className="hover:text-emerald-900"
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
            {/* Server Actionに渡す隠しフィールド */}
            <input type="hidden" name="ingredients" value={ingredients.join(',')} />
          </div>

          {/* 人数・日数の設定 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                作る人数
              </label>
              <select
                name="servings"
                value={servings}
                onChange={(e) => setServings(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-emerald-500"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} 人分
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                作る日数
              </label>
              <select
                name="days"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-emerald-500"
              >
                {[1, 2, 3, 4, 5, 7].map((n) => (
                  <option key={n} value={n}>
                    {n} 日分
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={isPending || ingredients.length === 0}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed transition flex justify-center items-center gap-2"
          >
            {isPending ? (
              <>
                <span className="animate-spin">🌀</span> 献立を生成中...
              </>
            ) : (
              'AIで献立を生成する'
            )}
          </button>
        </form>
      </div>
    </main>
  );
}