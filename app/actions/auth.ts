// app/actions/auth.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { debug } from 'console';

// 新規会員登録
export async function signUp(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;

  const supabase = await createClient();

  // 1. Supabase Auth にユーザーを作成
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  console.log(email)
  console.log(password)

  if (error || !data.user) {
    return { error: error?.message || '登録に失敗しました' };
  }

  // 2. Prisma を経由して自前の users テーブルにレコードを作成
  try {
    await prisma.user.create({
      data: {
        id: data.user.id, // Supabase Auth と同じ UUID
        email: email,
        name: name || null,
      },
    });
  } catch (dbError) {
    console.error('Prisma User Creation Failed:', dbError);
  }

  revalidatePath('/', 'layout');
  redirect('/shopping');
}

// ログイン
export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  console.log(email)
  console.log(password)

  if (error) {
    return { error: 'メールアドレスまたはパスワードが正しくありません' };
  }

  revalidatePath('/', 'layout');
  redirect('/shopping');
}

// ログアウト
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

// 現在ログイン中のユーザー情報を取得（Prisma経由）
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Prisma からユーザー情報を取得
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  return dbUser;
}