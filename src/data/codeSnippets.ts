export interface CodeFile {
  id: string;
  filename: string;
  path: string;
  language: string;
  description: string;
  code: string;
}

export const codeFiles: CodeFile[] = [
  {
    id: 'schema-prisma',
    filename: 'schema.prisma',
    path: 'prisma/schema.prisma',
    language: 'prisma',
    description: 'Skema Prisma ORM untuk model Task dengan pembekal pangkalan data PostgreSQL.',
    code: `// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Task {
  id          String   @id @default(uuid())
  title       String
  description String?
  isCompleted Boolean  @default(false)
  createdAt   DateTime @default(now())

  // Indeks pilihan untuk mempercepatkan carian tugasan mengikut status dan tarikh
  @@index([isCompleted])
  @@index([createdAt])
}
`
  },
  {
    id: 'lib-prisma',
    filename: 'prisma.ts',
    path: 'lib/prisma.ts',
    language: 'typescript',
    description: 'Konfigurasi Prisma Client Singleton bagi mengelakkan sambungan berganda semasa hot-reloading dalam pembangunan Next.js.',
    code: `// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// Mengisytiharkan pembolehubah global untuk menyimpan instance PrismaClient
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Menggunakan instance sedia ada atau membina instance baharu
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
`
  },
  {
    id: 'api-tasks',
    filename: 'route.ts',
    path: 'app/api/tasks/route.ts',
    language: 'typescript',
    description: 'Laluan API untuk GET (senarai semua tugasan) dan POST (tambah tugasan baharu).',
    code: `// app/api/tasks/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 1. GET: Mengambil semua senarai tugasan
export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: {
        createdAt: 'desc', // Tugasan terkini di atas
      },
    });

    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error('Ralat ketika mengambil senarai tugasan:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil senarai tugasan dari pangkalan data.' },
      { status: 500 }
    );
  }
}

// 2. POST: Menambah tugasan baharu
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description } = body;

    // Pengesahan input (Validation)
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'Tajuk tugasan (title) adalah wajib.' },
        { status: 400 }
      );
    }

    const newTask = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description && typeof description === 'string' ? description.trim() : null,
        isCompleted: false,
      },
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error('Ralat ketika mencipta tugasan baharu:', error);
    return NextResponse.json(
      { error: 'Gagal mencipta tugasan baharu.' },
      { status: 500 }
    );
  }
}
`
  },
  {
    id: 'api-task-id',
    filename: 'route.ts (by ID)',
    path: 'app/api/tasks/[id]/route.ts',
    language: 'typescript',
    description: 'Laluan API untuk GET (tugasan tunggal), PUT (kemaskini tugasan), dan DELETE (padam tugasan).',
    code: `// app/api/tasks/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }> | { id: string };
}

// 1. GET: Mengambil satu tugasan mengikut ID
export async function GET(request: Request, props: RouteParams) {
  try {
    const params = await props.params;
    const { id } = params;

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Tugasan tidak dijumpai.' },
        { status: 404 }
      );
    }

    return NextResponse.json(task, { status: 200 });
  } catch (error) {
    console.error('Ralat ketika mencari tugasan:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil maklumat tugasan.' },
      { status: 500 }
    );
  }
}

// 2. PUT: Mengemaskini tugasan (tajuk, keterangan, atau status selesai)
export async function PUT(request: Request, props: RouteParams) {
  try {
    const params = await props.params;
    const { id } = params;
    const body = await request.json();

    const { title, description, isCompleted } = body;

    // Pastikan tugasan wujud terlebih dahulu
    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Tugasan tidak dijumpai untuk dikemaskini.' },
        { status: 404 }
      );
    }

    // Bina objek data yang ingin dikemaskini
    const updateData: {
      title?: string;
      description?: string | null;
      isCompleted?: boolean;
    } = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return NextResponse.json(
          { error: 'Tajuk tugasan tidak boleh kosong.' },
          { status: 400 }
        );
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = typeof description === 'string' ? description.trim() : null;
    }

    if (isCompleted !== undefined) {
      if (typeof isCompleted !== 'boolean') {
        return NextResponse.json(
          { error: 'Status isCompleted mestilah nilai boolean (true/false).' },
          { status: 400 }
        );
      }
      updateData.isCompleted = isCompleted;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    console.error('Ralat ketika mengemaskini tugasan:', error);
    return NextResponse.json(
      { error: 'Gagal mengemaskini tugasan.' },
      { status: 500 }
    );
  }
}

// 3. DELETE: Memadam tugasan mengikut ID
export async function DELETE(request: Request, props: RouteParams) {
  try {
    const params = await props.params;
    const { id } = params;

    // Semak kewujudan tugasan
    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Tugasan tidak dijumpai untuk dipadam.' },
        { status: 404 }
      );
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Tugasan berjaya dipadam.', id },
      { status: 200 }
    );
  } catch (error) {
    console.error('Ralat ketika memadam tugasan:', error);
    return NextResponse.json(
      { error: 'Gagal memadam tugasan.' },
      { status: 500 }
    );
  }
}
`
  },
  {
    id: 'page-tsx',
    filename: 'page.tsx',
    path: 'app/page.tsx',
    language: 'tsx',
    description: 'Komponen Utama UI Frontend dengan borang tambah tugasan, senarai interaktif, status toggle selesai, dan butang padam.',
    code: `'use client';

import React, { useState, useEffect } from 'react';

// Antara muka model Task sepadan dengan Prisma schema
export interface Task {
  id: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  createdAt: string;
}

export default function TaskTrackerPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Ambil data tugasan dari API
  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/tasks');
      if (!res.ok) {
        throw new Error('Gagal memuatkan senarai tugasan.');
      }
      const data = await res.json();
      setTasks(data);
    } catch (err: any) {
      setError(err.message || 'Ralat sambungan pelayan.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Tambah tugasan baharu (POST)
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Sila masukkan tajuk tugasan.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Gagal menambah tugasan.');
      }

      const newTask = await res.json();
      setTasks((prev) => [newTask, ...prev]);
      setTitle('');
      setDescription('');
      showNotification('Tugasan berjaya ditambah!');
    } catch (err: any) {
      setError(err.message || 'Ralat semasa menambah tugasan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tukar status selesai / belum selesai (PUT)
  const handleToggleComplete = async (task: Task) => {
    const updatedStatus = !task.isCompleted;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, isCompleted: updatedStatus } : t))
    );

    try {
      const res = await fetch(\`/api/tasks/\${task.id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: updatedStatus }),
      });

      if (!res.ok) {
        throw new Error('Gagal mengemaskini status tugasan.');
      }
    } catch (err: any) {
      // Undurkan semula jika gagal
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, isCompleted: task.isCompleted } : t))
      );
      setError(err.message || 'Gagal mengubah status tugasan.');
    }
  };

  // Padam tugasan (DELETE)
  const handleDeleteTask = async (id: string) => {
    const confirmed = window.confirm('Adakah anda pasti mahu memadam tugasan ini?');
    if (!confirmed) return;

    // Optimistic delete
    const previousTasks = [...tasks];
    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      const res = await fetch(\`/api/tasks/\${id}\`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Gagal memadam tugasan dari pelayan.');
      }
      showNotification('Tugasan berjaya dipadam.');
    } catch (err: any) {
      setTasks(previousTasks);
      setError(err.message || 'Gagal memadam tugasan.');
    }
  };

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Tapis senarai mengikut tab
  const filteredTasks = tasks.filter((task) => {
    if (filter === 'active') return !task.isCompleted;
    if (filter === 'completed') return task.isCompleted;
    return true;
  });

  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header Utama */}
        <header className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold tracking-wide uppercase">
            Next.js App Router • Prisma ORM • PostgreSQL
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Sistem Pengurusan Tugasan
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Urus tugasan harian anda dengan pantas, teratur, dan selamat.
          </p>
        </header>

        {/* Notifikasi Mesej */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm flex items-center justify-between shadow-xs">
            <span>✓ {successMessage}</span>
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

        {/* Borang Tambah Tugasan Baharu */}
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
                placeholder="cth: Siapkan dokumentasi sistem"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Keterangan <span className="text-slate-400 font-normal lowercase">(pilihan)</span>
              </label>
              <textarea
                id="description"
                rows={3}
                placeholder="cth: Masukkan butiran teknikal dan gambar rajah pangkalan data..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm resize-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="inline-flex items-center justify-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-xl shadow-xs transition-colors duration-150 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    Menyimpan...
                  </span>
                ) : (
                  '+ Tambah Tugasan'
                )}
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
            
            {/* Tab Filter */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={\`px-3 py-1.5 rounded-lg transition-all \${
                  filter === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }\`}
              >
                Semua ({tasks.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('active')}
                className={\`px-3 py-1.5 rounded-lg transition-all \${
                  filter === 'active' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }\`}
              >
                Belum Selesai ({tasks.length - completedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('completed')}
                className={\`px-3 py-1.5 rounded-lg transition-all \${
                  filter === 'completed' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }\`}
              >
                Selesai ({completedCount})
              </button>
            </div>
          </div>

          {/* Bar Kemajuan */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: \`\${progressPercent}%\` }}
            ></div>
          </div>
        </div>

        {/* Senarai Tugasan */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-800 flex items-center justify-between">
            <span>Senarai Tugasan</span>
            <button
              onClick={fetchTasks}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-normal hover:underline"
            >
              Muat semula senarai ⟳
            </button>
          </h2>

          {isLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-500">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mb-2"></div>
              <p className="text-sm">Memuatkan tugasan dari PostgreSQL...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              <p className="text-base font-medium text-slate-700">Tiada tugasan dijumpai</p>
              <p className="text-xs text-slate-400 mt-1">
                {filter !== 'all' ? 'Cuba tukar tab tapisan anda.' : 'Gunakan borang di atas untuk memulakan tugasan pertama.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={\`group bg-white rounded-2xl border transition-all duration-200 p-4 sm:p-5 flex items-start gap-4 shadow-xs hover:shadow-md \${
                    task.isCompleted ? 'border-slate-200 bg-slate-50/50' : 'border-slate-200 hover:border-indigo-200'
                  }\`}
                >
                  {/* Butang Toggle Selesai (Update status) */}
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(task)}
                    className={\`mt-0.5 flex-shrink-0 w-6 h-6 rounded-lg border flex items-center justify-center transition-colors \${
                      task.isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 hover:border-indigo-500 bg-white'
                    }\`}
                    title={task.isCompleted ? 'Tanda sebagai belum selesai' : 'Tanda sebagai selesai'}
                  >
                    {task.isCompleted && (
                      <svg className="w-4 h-4 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* Kandungan Tugasan */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className={\`text-base font-semibold break-words \${
                          task.isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                        }\`}
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
                        className={\`text-sm mt-1 whitespace-pre-line break-words \${
                          task.isCompleted ? 'text-slate-400 line-through' : 'text-slate-600'
                        }\`}
                      >
                        {task.description}
                      </p>
                    )}

                    <div className="mt-2.5 flex items-center gap-3 text-[11px] text-slate-400">
                      <span>Dicipta: {new Date(task.createdAt).toLocaleString('ms-MY', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      <span>•</span>
                      <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                        UUID: {task.id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>

                  {/* Butang Padam (Delete) */}
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(task.id)}
                    className="flex-shrink-0 text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Padam tugasan"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Maklumat */}
        <footer className="text-center text-xs text-slate-400 pt-6 border-t border-slate-200">
          Dibina dengan Next.js App Router, Prisma ORM, PostgreSQL & Tailwind CSS.
        </footer>
      </div>
    </div>
  );
}
`
  },
  {
    id: 'env-setup',
    filename: '.env',
    path: '.env',
    language: 'bash',
    description: 'Pembolehubah persekitaran untuk sambungan ke PostgreSQL.',
    code: `# .env
# Gantikan dengan maklumat pangkalan data PostgreSQL anda:
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public

DATABASE_URL="postgresql://postgres:password123@localhost:5432/task_tracker_db?schema=public"
`
  }
];

export const setupGuideSteps = [
  {
    step: '1',
    title: 'Cipta Projek Next.js Baharu',
    description: 'Mulakan projek Next.js menggunakan TypeScript, Tailwind CSS, dan App Router:',
    code: `npx create-next-app@latest task-tracker --typescript --tailwind --app --eslint`
  },
  {
    step: '2',
    title: 'Pasang Prisma CLI & Prisma Client',
    description: 'Pasang pakej Prisma sebagai kebergantungan pembangunan (devDependencies) dan @prisma/client:',
    code: `npm install @prisma/client\nnpm install -D prisma`
  },
  {
    step: '3',
    title: 'Inisialisasi Prisma dengan PostgreSQL',
    description: 'Jalankan arahan ini untuk menghasilkan folder prisma/ dan fail .env:',
    code: `npx prisma init --datasource-provider postgresql`
  },
  {
    step: '4',
    title: 'Salin Kod schema.prisma & Lakukan Migration',
    description: 'Gantikan kandungan fail prisma/schema.prisma dengan model Task, kemudian laksanakan migration untuk mencipta jadual di PostgreSQL:',
    code: `npx prisma migrate dev --name init_task_table\nnpx prisma generate`
  },
  {
    step: '5',
    title: 'Cipta Fail Pembantu Prisma & Laluan API',
    description: 'Letakkan fail lib/prisma.ts, app/api/tasks/route.ts, dan app/api/tasks/[id]/route.ts seperti yang disediakan.',
    code: `# Struktur folder yang diperlukan:
# ├── app/
# │   ├── api/
# │   │   └── tasks/
# │   │       ├── route.ts
# │   │       └── [id]/
# │   │           └── route.ts
# │   ├── page.tsx
# │   └── layout.tsx
# ├── lib/
# │   └── prisma.ts
# ├── prisma/
# │   └── schema.prisma
# └── .env`
  },
  {
    step: '6',
    title: 'Jalankan Pelayan Pembangunan (Dev Server)',
    description: 'Mulakan aplikasi anda dan layari di http://localhost:3000:',
    code: `npm run dev`
  }
];
