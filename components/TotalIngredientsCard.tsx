// components/TotalIngredientsCard.tsx
'use client';

import { useState } from 'react';
import { TotalIngredient } from '@/lib/geminiSummary';

interface Props {
  totalIngredients: TotalIngredient[];
}

export default function TotalIngredientsCard({ totalIngredients }: Props) {
  const [isOpen, setIsOpen] = useState(true);

  // カテゴリごとにグループ化
  const grouped = totalIngredients.reduce((acc, item) => {
    const cat = item.category || 'その他';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, TotalIngredient[]>);

  return (
    <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-6 mb-8 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛒</span>
          <h2 className="text-lg font-bold text-emerald-950">
            全日程で使用する食材の総量（買い物リスト）
          </h2>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-white px-3 py-1.5 rounded-lg border border-emerald-200 shadow-xs"
        >
          {isOpen ? '折りたたむ ▲' : '展開する ▼'}
        </button>
      </div>

      {isOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="bg-white p-4 rounded-xl border border-emerald-100/80 shadow-xs">
              <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">
                {category}
              </h3>
              <ul className="space-y-1.5 text-sm">
                {items.map((item, i) => (
                  <li key={i} className="flex justify-between items-center">
                    <span className="text-slate-800 font-medium">
                      {item.name}
                      {item.isInputItem && (
                        <span className="ml-1 text-[10px] bg-emerald-100 text-emerald-800 px-1 rounded">
                          手持ち
                        </span>
                      )}
                    </span>
                    <span className="text-slate-500 font-bold text-xs">
                      {item.totalAmount}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}