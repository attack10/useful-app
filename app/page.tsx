import Link from 'next/link';
import { getCurrentUser, signOut } from '@/app/actions/auth';

const featureCards = [
  {
    title: '献立を作る',
    description: '食材や人数を入れて、AIが1日〜数日分の献立を提案します。',
    href: '/planning',
    emoji: '🍽️',
  },
  {
    title: '買い物リストを見る',
    description: '日用品や食材のストック数を把握し、不足分をまとめて確認できます。',
    href: '/shopping',
    emoji: '🛒',
  },
  {
    title: '家事タスクを共有する',
    description: 'ゴミ出しや掃除などの家事を家族で分担し、期限日付きでチェックできます。',
    href: '/chores',
    emoji: '🧹',
  },
];

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        {user && (
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-sm">
                👤
              </span>
              <div className="text-xs sm:text-sm">
                <span className="font-bold text-slate-800">
                  {user.name || user.email}
                </span>
                <span className="text-slate-500 ml-1.5 hidden sm:inline">でログイン中</span>
              </div>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 hover:border-rose-200 active:scale-95"
              >
                ログアウト
              </button>
            </form>
          </div>
        )}
        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm sm:p-10 lg:p-12">
          <div className="max-w-2xl space-y-5">
            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
              暮らしを、もっとスムーズに。
            </span>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
              献立作成から買い物、日々の家事までまとめて管理
            </h1>
            <p className="text-lg leading-8 text-slate-600">
              あるもの食材からAIが献立を提案。日用品の在庫管理や家族での家事タスク分担まで、家庭のタスクをひとつのアプリでシンプルに。
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/planning"
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                🍽️ 献立を作る
              </Link>
              <Link
                href="/shopping"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                🛒 買い物リスト
              </Link>
              <Link
                href="/chores"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                🧹 家事タスク
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {featureCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="mb-3 text-3xl">{card.emoji}</div>
                <h2 className="text-xl font-semibold text-slate-900">{card.title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">{card.description}</p>
              </div>
              <div className="mt-4 text-sm font-semibold text-emerald-600">→ 使ってみる</div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
