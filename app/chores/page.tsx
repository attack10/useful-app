// app/chores/page.tsx
import { getTasksData } from '@/app/actions/tasks';
import TaskListClient from './TaskListClient';

export default async function ChoresPage() {
  const { tasks, users } = await getTasksData();

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">🧹 家族の家事タスク</h1>
          <p className="text-xs text-slate-500 mt-1">
            みんなで共有する家事リストです。気づいた人がやってチェック！
          </p>
        </div>

        <TaskListClient initialTasks={tasks} users={users} />
      </div>
    </main>
  );
}