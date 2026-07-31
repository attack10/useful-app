// app/recipes/[id]/page.tsx
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import TotalIngredientsCard from '@/components/TotalIngredientsCard';
import { TotalIngredient } from '@/lib/geminiSummary';
import EditMealModal from '@/components/EditMealModal';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RecipeResultPage({ params }: Props) {
  const { id } = await params;

  // DBからデータと紐づく全日分のレシピを取得
  const mealPlan = await prisma.mealPlan.findUnique({
    where: { id },
    include: {
      dailyMeals: {
        orderBy: { dayNumber: 'asc' },
      },
    },
  });

  if (!mealPlan) {
    notFound();
  }

  // DBから保存済みの集計データを取得
  const totalIngredients =
    (mealPlan.totalIngredients as unknown as TotalIngredient[]) || [];

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* 1. ヘッダー概要情報 */}
        <div className="mb-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap justify-between items-center gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              AI提案結果
            </span>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              {mealPlan.days}日分の献立プラン ({mealPlan.servings}人前)
            </h1>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-xs text-slate-500">指定した食材:</span>
              {mealPlan.inputIngredients.map((ing) => (
                <span
                  key={ing}
                  className="text-xs font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                >
                  {ing}
                </span>
              ))}
            </div>
          </div>
          <Link
            href="/planning/"
            className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl transition"
          >
            ← 条件を変更して再作成
          </Link>
        </div>

        {/* 2. 全食材の総量（買い物リスト） */}
        {totalIngredients.length > 0 && (
          <TotalIngredientsCard totalIngredients={totalIngredients} />
        )}

        {/* 3. 日ごとのレシピカード一覧（料理名・材料・調理手順・アドバイス） */}
        <div className="space-y-6">
          {mealPlan.dailyMeals.map((meal) => {
            const ingredientsList = meal.ingredients as {
              name: string;
              amount: string;
              isInputItem: boolean;
            }[];

            return (
              <div
                key={meal.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
              >
                {/* DAY ヘッダー */}
                <div className="bg-emerald-600 px-6 py-3 text-white flex justify-between items-center">
                  <span className="font-extrabold text-sm tracking-wide">
                    DAY {meal.dayNumber}
                  </span>
                  {meal.cookingTimeMinutes && (
                    <span className="text-xs bg-emerald-700/80 px-3 py-1 rounded-full font-medium">
                      ⏱ 約 {meal.cookingTimeMinutes} 分
                    </span>
                  )}
                </div>

                <div className="p-6">
                    {/* 料理タイトル & 編集ボタン */}
                    <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                        <h2 className="text-xl font-bold text-slate-900">
                        {meal.title}
                        </h2>
                        {/* 👈 編集モーダルボタンを配置 */}
                        <EditMealModal
                        dailyMealId={meal.id}
                        mealPlanId={mealPlan.id}
                        dayNumber={meal.dayNumber}
                        currentTitle={meal.title}
                        />
                    </div>
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-slate-600 hover:text-slate-800">
                        <span>詳細を見る</span>
                        <span className="text-xs text-slate-400 transition group-open:rotate-180">▼</span>
                      </summary>

                      <div className="mt-4 space-y-6">
                        {meal.description && (
                          <p className="text-sm text-slate-600">{meal.description}</p>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* この日の使用食材 */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                              材料 (DAY {meal.dayNumber})
                            </h3>
                            <ul className="space-y-2 text-sm">
                              {ingredientsList.map((item, idx) => (
                                <li
                                  key={idx}
                                  className="flex justify-between items-center border-b border-slate-200/50 pb-1.5 last:border-none"
                                >
                                  <span
                                    className={
                                      item.isInputItem
                                        ? 'font-bold text-emerald-950'
                                        : 'text-slate-700'
                                    }
                                  >
                                    {item.name}
                                    {item.isInputItem && (
                                      <span className="ml-1.5 text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                                        手持ち
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-slate-500 text-xs font-medium">
                                    {item.amount}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* 調理方法・手順 */}
                          <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                              作り方・調理手順
                            </h3>
                            <ol className="space-y-3 text-sm">
                              {meal.steps.map((step, idx) => (
                                <li key={idx} className="flex gap-2 text-slate-700 leading-relaxed">
                                  <span className="font-bold text-emerald-600 min-w-[20px]">
                                    {idx + 1}.
                                  </span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ol>

                            {/* コツ・保存方法等のアドバイス */}
                            {meal.advice && (
                              <div className="mt-5 p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 leading-relaxed">
                                💡 <strong>ワンポイント:</strong> {meal.advice}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </details>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}