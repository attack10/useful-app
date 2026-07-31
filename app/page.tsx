import Link from 'next/link';

const featureCards = [
  {
    title: '献立を作る',
    description: '食材や人数を入れて、AIが1日〜数日分の献立を提案します。',
    href: '/planning',
    emoji: '🍽️',
  },
  {
    title: '買い物リストを見る',
    description: '必要な食材をまとめて確認し、在庫とのバランスもすぐ把握できます。',
    href: '/shopping',
    emoji: '🛒',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm sm:p-10 lg:p-12">
          <div className="max-w-2xl space-y-5">
            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
              食卓を、もっと楽に。
            </span>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
              献立作成から買い物まで、ひとつの流れで管理できます。
            </h1>
            <p className="text-lg leading-8 text-slate-600">
              使いたい食材と人数を入れるだけで、AIが献立案を提案。必要な食材は買い物リストとしてまとめて確認できます。
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/planning"
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                献立を作る
              </Link>
              <Link
                href="/shopping"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                買い物リストを見る
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {featureCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-3 text-3xl">{card.emoji}</div>
              <h2 className="text-xl font-semibold text-slate-900">{card.title}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">{card.description}</p>
              <div className="mt-4 text-sm font-semibold text-emerald-600">→ 使ってみる</div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
