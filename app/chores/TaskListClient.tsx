// app/chores/TaskListClient.tsx
'use client';

import { useState, useTransition } from 'react';
import { addTask, toggleTaskStatus, deleteTask } from '@/app/actions/tasks';

type User = {
  id: string;
  name: string | null;
  email: string;
};

type Task = {
  id: string;
  title: string;
  category: string;
  status: string;
  dueDate: Date | null; // 期限日を追加
  assignee: User | null;
  createdAt: Date;
};

const CATEGORIES: Record<string, { label: string; icon: string }> = {
  trash: { label: 'ゴミ出し', icon: '🗑️' },
  cleaning: { label: '掃除', icon: '🧹' },
  laundry: { label: '洗濯', icon: '🧺' },
  other: { label: 'その他', icon: '📌' },
};

export default function TaskListClient({
  initialTasks,
  users,
}: {
  initialTasks: Task[];
  users: User[];
}) {
  const [isPending, startTransition] = useTransition();
  const [selectedCategory, setSelectedCategory] = useState('trash');

  // 期限日の表示フォーマット＆警告判定ヘルパー
  const getDueDateLabel = (dueDate: Date | null) => {
    if (!dueDate) return null;
    
    const target = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    const month = target.getMonth() + 1;
    const day = target.getDate();
    const formatted = `${month}/${day}`;

    if (diffDays < 0) {
      return { text: `期限切れ (${formatted})`, isOverdue: true };
    } else if (diffDays === 0) {
      return { text: '今日が期限', isToday: true };
    } else if (diffDays === 1) {
      return { text: '明日が期限', isUpcoming: true };
    }
    return { text: `${formatted} まで`, isNormal: true };
  };

  return (
    <div className="space-y-6">
      {/* 1. タスク追加フォーム */}
      <form
        action={async (formData) => {
          startTransition(async () => {
            await addTask(formData);
          });
        }}
        className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3"
      >
        <div className="flex gap-2">
          <input
            type="text"
            name="title"
            placeholder="新しい家事を追加... (例: お風呂掃除)"
            required
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition disabled:opacity-50"
          >
            追加
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* カテゴリ選択 */}
          <input type="hidden" name="category" value={selectedCategory} />
          <div className="flex gap-1">
            {Object.entries(CATEGORIES).map(([key, item]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedCategory(key)}
                className={`px-2.5 py-1 rounded-full border transition ${
                  selectedCategory === key
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-bold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* カレンダーで期限日を選択 */}
            <input
              type="date"
              name="dueDate"
              className="bg-slate-50 border border-slate-200 text-slate-600 rounded-lg px-2 py-1 text-xs focus:outline-none"
            />

            {/* 担当者選択 */}
            <select
              name="assigneeId"
              className="bg-slate-50 border border-slate-200 text-slate-600 rounded-lg px-2 py-1 text-xs"
            >
              <option value="">担当なし (誰でも)</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  👤 {u.name || u.email.split('@')[0]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>

      {/* 2. タスク一覧表示 */}
      <div className="space-y-2">
        {initialTasks.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400 text-sm">
            残っている家事はありません 🎉
          </div>
        ) : (
          initialTasks.map((task) => {
            const isDone = task.status === 'done';
            const catInfo = CATEGORIES[task.category] || CATEGORIES.other;
            const dueDateInfo = getDueDateLabel(task.dueDate);

            return (
              <div
                key={task.id}
                className={`flex items-center justify-between p-3.5 bg-white rounded-xl border transition shadow-sm ${
                  isDone
                    ? 'border-slate-200 bg-slate-50/60 opacity-60'
                    : 'border-slate-200 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => {
                      startTransition(() => {
                        toggleTaskStatus(task.id, task.status);
                      });
                    }}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center border transition ${
                      isDone
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 bg-white hover:border-emerald-500'
                    }`}
                  >
                    {isDone && <span className="text-xs font-bold">✓</span>}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        isDone ? 'line-through text-slate-400' : 'text-slate-800'
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      <span>
                        {catInfo.icon} {catInfo.label}
                      </span>
                      {task.assignee && (
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          👤 {task.assignee.name || task.assignee.email.split('@')[0]}
                        </span>
                      )}

                      {/* 📅 期限バッジの表示 */}
                      {dueDateInfo && !isDone && (
                        <span
                          className={`px-1.5 py-0.5 rounded font-bold ${
                            dueDateInfo.isOverdue
                              ? 'bg-rose-100 text-rose-600'
                              : dueDateInfo.isToday
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          📅 {dueDateInfo.text}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (confirm('この家事を削除しますか？')) {
                      startTransition(() => {
                        deleteTask(task.id);
                      });
                    }
                  }}
                  className="text-slate-300 hover:text-rose-500 p-1 text-xs transition ml-2"
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}