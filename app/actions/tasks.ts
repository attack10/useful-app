// app/actions/tasks.ts
'use server';

import { prisma } from '@/lib/prisma'; // プロジェクトの Prisma クライアント
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// 1. タスク一覧とユーザー一覧の取得
export async function getTasksData() {
  const [tasks, users] = await Promise.all([
    prisma.task.findMany({
      orderBy: [
        { status: 'asc' }, // 未完了(todo)を上に
        { createdAt: 'desc' },
      ],
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
    }),
  ]);

  return { tasks, users };
}

// タスクの追加
export async function addTask(formData: FormData) {
  const title = formData.get('title') as string;
  const category = (formData.get('category') as string) || 'other';
  const assigneeId = (formData.get('assigneeId') as string) || null;
  const dueDateStr = formData.get('dueDate') as string; // 日付文字列 (YYYY-MM-DD)

  if (!title || title.trim() === '') {
    return;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  await prisma.task.create({
    data: {
      title,
      category,
      assigneeId: assigneeId || null,
      createdById: user?.id || null,
      dueDate: dueDateStr ? new Date(dueDateStr) : null, // 日付オブジェクトに変換
      status: 'todo',
    },
  });

  revalidatePath('/chores');
}

// 3. 完了 / 未完了のトグル
export async function toggleTaskStatus(taskId: string, currentStatus: string) {
  const nextStatus = currentStatus === 'done' ? 'todo' : 'done';

  await prisma.task.update({
    where: { id: taskId },
    data: { status: nextStatus },
  });

  revalidatePath('/chores');
}

// 4. タスクの削除
export async function deleteTask(taskId: string) {
  await prisma.task.delete({
    where: { id: taskId },
  });

  revalidatePath('/chores');
}