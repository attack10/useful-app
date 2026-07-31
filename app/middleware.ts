// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Supabase クライアントの作成（Cookieの読み書き）
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 1. セッション（ログイン状態）を取得
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 2. 未ログインユーザーが保護ルート（/shopping など）にアクセスした場合 -> /login へ飛ばす
  if (!user && pathname.startsWith('/shopping')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 3. ログイン済みユーザーが /login にアクセスした場合 -> /shopping へ飛ばす
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/shopping';
    return NextResponse.redirect(url);
  }

  return response;
}

// Middlewareを適用するパスを設定
export const config = {
  matcher: [
    /*
     * 以下のパス以外のすべてのリクエストでMiddlewareを実行:
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化ファイル)
     * - favicon.ico (ファビコン)
     * - 画像などの静的アセット (.png, .jpg, .svg など)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};