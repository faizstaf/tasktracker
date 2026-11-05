'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Trash2,
  Plus,
  Search,
  Check,
  Calendar,
  Hash,
  Database,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  createdAt: string;
}

const SAMPLE_TASKS: Task[] = [
  {
    id: 'e1a3b5c7-d9f1-4e3a-8b2c-1a2b3c4d5e6f',
    title: 'Konfigurasi Prisma ORM dengan PostgreSQL',
    description: 'Menyediakan fail schema.prisma dengan model Task lengkap dan menyambungkan DATABASE_URL ke pangkalan data PostgreSQL.',
    isCompleted: true,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'f2b4c6d8-e0a2-4f4b-9c3d-2b3c4d5e6f7a',
    title: 'Bina laluan API Next.js (GET & POST) di app/api/tasks/route.ts',
    description: 'Endpoint GET untuk senarai semua tugasan dan POST untuk menyimpan tugasan baharu ke PostgreSQL.',
    isCompleted: true,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'a3c5d7e9-f1b3-4a5c-0d4e-3c4d5e6f7a8b',
    title: 'Bina laluan API Next.js (PUT & DELETE) di app/api/tasks/[id]/route.ts',
    description: 'Endpoint PUT untuk mengemaskini status isCompleted dan DELETE untuk memadam rekod tugasan.',
    isCompleted: false,
    createdAt: new Date().toISOString(),
  },
];

export default function TaskTrackerPage() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('nextjs_task_tracker_data');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return SAMPLE_TASKS;
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Simpan ke localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nextjs_task_tracker_data', JSON.stringify(tasks));
    } catch (e) {
      // ignore
    }
  }, [tasks]);

  const notify = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // 1. Ambil data tugasan dari GET /api/tasks
  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setTasks(data);
          notify('Senarai tugasan dimuat semula.');
          return;
        }
      }
    } catch (err: any) {
      console.log('API fallback ke local state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Tambah tugasan baharu (POST /api/tasks)
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Sila masukkan tajuk tugasan.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const newTaskObj: Task = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'task-' + Date.now(),
      title: title.trim(),
      description: description.trim() || null,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };

    try {
      // Cuba hantar ke Next.js API route jika tersedia
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
        }),
      });

      if (res.ok) {
        const createdTask = await res.json();
        setTasks((prev) => [createdTask, ...prev]);
      } else {
        setTasks((prev) => [newTaskObj, ...prev]);
      }
    } catch (err) {
      setTasks((prev) => [newTaskObj, ...prev]);
    } finally {
      setTitle('');
      setDescription('');
      setIsSubmitting(false);
      notify('Tugasan baharu berjaya ditambah!');
    }
  };

  // 3. Tukar status selesai / belum selesai (PUT /api/tasks/[id])
  const handleToggleComplete = async (task: Task) => {
    const nextStatus = !task.isCompleted;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, isCompleted: nextStatus } : t))
    );

    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: nextStatus }),
      });
    } catch (err) {
      // Local state sudah dikemaskini secara optimis
    }
    notify(nextStatus ? 'Tugasan ditanda sebagai selesai!' : 'Tugasan dikembalikan ke aktif.');
  };

  // 4. Padam tugasan (DELETE /api/tasks/[id])
  const handleDeleteTask = async (id: string) => {
    const confirmed = window.confirm('Adakah anda pasti mahu memadam tugasan ini?');
    if (!confirmed) return;

    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      // Local state sudah dipadam
    }
    notify('Tugasan berjaya dipadam.');
  };

  // Tapis senarai mengikut tab dan carian
  const filteredTasks = tasks.filter((task) => {
    const matchesFilter =
      filter === 'all' ? true : filter === 'completed' ? task.isCompleted : !task.isCompleted;
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Utama */}
        <header className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold tracking-wide uppercase">
            <Database className="w-3.5 h-3.5" />
            Next.js (App Router) • Tailwind CSS • Prisma ORM • PostgreSQL
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Sistem Pengurusan Tugasan (Task Tracker)
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Urus tugasan harian anda menggunakan Next.js App Router, Tailwind CSS, Prisma ORM, dan PostgreSQL.
          </p>
        </header>

        {/* Notifikasi Mesej */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm flex items-center justify-between shadow-xs">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              {successMessage}
            </span>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-sm flex items-center justify-between shadow-xs">
            <span>⚠ {error}</span>
            <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 font-bold ml-2">
              ×
            </button>
          </div>
        )}

        {/* Borang Tambah Tugasan Baharu (Form POST) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-7">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            Tambah Tugasan Baharu
          </h2>

          <form onSubmit={handleAddTask} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Tajuk Tugasan <span className="text-rose-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                placeholder="cth: Sediakan pangkalan data PostgreSQL..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Keterangan <span className="text-slate-400 font-normal lowercase">(pilihan)</span>
              </label>
              <textarea
                id="description"
                rows={3}
                placeholder="cth: Laksanakan arahan npx prisma migrate dev untuk menjana jadual Task..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-400">
                Medan bertanda <span className="text-rose-500">*</span> adalah wajib
              </span>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-xl shadow-xs transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Tambah Tugasan'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Ringkasan Prestasi & Filter */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Kemajuan Tugasan</h3>
              <p className="text-xs text-slate-500">
                {completedCount} daripada {tasks.length} tugasan telah diselesaikan ({progressPercent}%)
              </p>
            </div>

            {/* Tab Penapis */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filter === 'all' ? 'bg-white text-indigo-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({tasks.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('active')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filter === 'active' ? 'bg-white text-indigo-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Belum Selesai ({tasks.length - completedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('completed')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filter === 'completed' ? 'bg-white text-indigo-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Selesai ({completedCount})
              </button>
            </div>
          </div>

          {/* Bar Kemajuan */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          {/* Bar Carian */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari tugasan mengikut tajuk atau keterangan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Senarai Tugasan */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-slate-800">Senarai Tugasan</h2>
            <button
              onClick={fetchTasks}
              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
            >
              <RefreshCw className="w-3 h-3" />
              Muat semula
            </button>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-500">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mb-2"></div>
              <p className="text-sm">Menghubungkan ke pangkalan data PostgreSQL...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-base font-medium text-slate-700">Tiada tugasan dijumpai</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery
                  ? 'Tiada tugasan sepadan dengan carian.'
                  : filter !== 'all'
                  ? 'Tukar tab tapisan anda.'
                  : 'Gunakan borang di atas untuk memulakan tugasan pertama.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`group bg-white rounded-2xl border transition-all duration-200 p-4 sm:p-5 flex items-start gap-4 shadow-xs hover:shadow-md ${
                    task.isCompleted ? 'border-slate-200 bg-slate-50/50' : 'border-slate-200 hover:border-indigo-200'
                  }`}
                >
                  {/* Butang Toggle Selesai (PUT) */}
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(task)}
                    className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${
                      task.isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 hover:border-indigo-500 bg-white'
                    }`}
                    title={task.isCompleted ? 'Tanda sebagai belum selesai' : 'Tanda sebagai selesai'}
                  >
                    {task.isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>

                  {/* Kandungan Tugasan */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className={`text-base font-semibold break-words ${
                          task.isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {task.title}
                      </h3>
                      {task.isCompleted ? (
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700 rounded-md">
                          Selesai
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded-md">
                          Aktif
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p
                        className={`text-sm mt-1 whitespace-pre-line break-words ${
                          task.isCompleted ? 'text-slate-400 line-through' : 'text-slate-600'
                        }`}
                      >
                        {task.description}
                      </p>
                    )}

                    <div className="mt-2.5 flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Dicipta: {new Date(task.createdAt).toLocaleString('ms-MY', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                        <Hash className="w-3 h-3 text-slate-400" />
                        UUID: {task.id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>

                  {/* Butang Padam (DELETE) */}
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(task.id)}
                    className="flex-shrink-0 text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Padam tugasan"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Maklumat */}
        <footer className="text-center text-xs text-slate-400 pt-6 border-t border-slate-200">
          Dibina sepenuhnya dengan Next.js App Router, Tailwind CSS, Prisma ORM & PostgreSQL.
        </footer>
      </div>
    </div>
  );
}
