'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'ホーム', icon: '🏠' },
  { href: '/planning', label: '献立', icon: '🍽️' },
  { href: '/shopping', label: '買い物', icon: '🛒' },
  { href: '/chores', label: '家事', icon: '🧹' },
];

export default function Navigation() {
  const pathname = usePathname();

  if (pathname === '/login' || pathname === '/signup') {
    return null;
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* デスクトップ用トップヘッダー */}
      <header className="sticky top-0 z-40 hidden w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md sm:block">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 transition hover:opacity-80">
            <span className="text-xl">✨</span>
            <span className="text-base tracking-tight font-extrabold text-slate-800">Useful App</span>
          </Link>
          <nav className="flex items-center gap-1.5">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/60'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* モバイル用ボトムバー */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md sm:hidden">
        <div className="grid grid-cols-4 py-1.5">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1 text-xs transition ${
                  active ? 'font-bold text-emerald-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="mt-0.5 scale-90">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
