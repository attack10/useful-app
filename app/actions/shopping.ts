// app/actions/shopping.ts
'use server';

import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// 認証チェック用の共通関数
async function checkAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('ログインが必要です');
  }
  return user;
}

// 1. 全ユーザー共通の買い物リストを取得
export async function getShoppingItems() {
  await checkAuth(); // ログインしているか確認

  return await prisma.shoppingItem.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

// 2. 新規追加（誰でも追加可能）
export async function addShoppingItem(data: {
  name: string;
  requiredCount: number;
  currentCount: number;
  amazonUrl?: string;
}) {
  await checkAuth();

  await prisma.shoppingItem.create({
    data: {
      name: data.name,
      requiredCount: data.requiredCount,
      currentCount: data.currentCount,
      amazonUrl: data.amazonUrl || null,
    },
  });

  revalidatePath('/shopping');
}

// 3. 数量の更新
export async function updateItemCounts(
  id: string,
  requiredCount: number,
  currentCount: number
) {
  await checkAuth();

  await prisma.shoppingItem.update({
    where: { id },
    data: { requiredCount, currentCount },
  });

  revalidatePath('/shopping');
}

// 4. 商品情報の更新
export async function updateShoppingItem(
  id: string,
  data: {
    name: string;
    requiredCount: number;
    currentCount: number;
    amazonUrl?: string;
  }
) {
  await checkAuth();

  await prisma.shoppingItem.update({
    where: { id },
    data: {
      name: data.name,
      requiredCount: data.requiredCount,
      currentCount: data.currentCount,
      amazonUrl: data.amazonUrl ?? null,
    },
  });

  revalidatePath('/shopping');
}

// 5. 削除
export async function deleteShoppingItem(id: string) {
  await checkAuth();

  await prisma.shoppingItem.delete({
    where: { id },
  });

  revalidatePath('/shopping');
}