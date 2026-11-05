import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  Trash2,
  Plus,
  Search,
  Copy,
  Check,
  Download,
  Code2,
  Database,
  Server,
  FileCode,
  Terminal,
  RefreshCw,
  Clock,
  Sparkles,
  BookOpen,
  Filter,
  Layers,
  ChevronRight,
  Info,
  Calendar,
  Hash
} from 'lucide-react';
import { codeFiles, setupGuideSteps, CodeFile } from './data/codeSnippets';

// Model Task mengikut skema Prisma yang diminta
export interface Task {
  id: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  createdAt: string;
}

const INITIAL_TASKS: Task[] = [
  {
    id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    title: 'Konfigurasi Prisma ORM & PostgreSQL Database',
    description: 'Menyediakan fail schema.prisma, menghubungkan sambungan DATABASE_URL ke pangkalan data PostgreSQL, dan menjana Prisma Client.',
    isCompleted: true,
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    title: 'Bina laluan API Next.js (GET & POST) di app/api/tasks/route.ts',
    description: 'Menulis endpoint HTTP GET untuk memuatkan senarai tugasan dan POST untuk menyimpan tugasan baharu dengan pengesahan data.',
    isCompleted: true,
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
    title: 'Bina laluan API Next.js (PUT & DELETE) di app/api/tasks/[id]/route.ts',
    description: 'Endpoint PUT untuk mengemaskini isCompleted atau title mengikut ID, dan DELETE untuk memadam rekod tugasan dari PostgreSQL.',
    isCompleted: true,
    createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
  {
    id: 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a',
    title: 'Bina UI Frontend utama app/page.tsx dengan Tailwind CSS',
    description: 'Antara muka mesra pengguna lengkap dengan borang input, butang toggle status selesai, dan butang padam segera.',
    isCompleted: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b',
    title: 'Ujian Integrasi & Laksana Migration Pangkalan Data',
    description: 'Jalankan npx prisma migrate dev untuk mengesahkan jadual Task dicipta sempurna di PostgreSQL.',
    isCompleted: false,
    createdAt: new Date().toISOString(),
  },
];

export default function App() {
  // Tab kawalan: 'demo' | 'code' | 'guide' | 'schema'
  const [activeTab, setActiveTab] = useState<'demo' | 'code' | 'guide' | 'schema'>('demo');

  // State Tugasan
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('task_tracker_nextjs_tasks');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TASKS;
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // State Code Viewer
  const [selectedFileId, setSelectedFileId] = useState<string>('schema-prisma');
  const [copiedFileId, setCopiedFileId] = useState<string | null>(null);

  // Simpan ke localStorage
  useEffect(() => {
    try {
      localStorage.setItem('task_tracker_nextjs_tasks', JSON.stringify(tasks));
    } catch (e) {
      console.error(e);
    }
  }, [tasks]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fungsi Tambah Tugasan (Meniru Next.js POST /api/tasks)
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Sila masukkan tajuk tugasan!');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      // Jana UUID v4 ringkas
      const newUuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });

      const newTask: Task = {
        id: newUuid,
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
        isCompleted: false,
        createdAt: new Date().toISOString(),
      };

      setTasks((prev) => [newTask, ...prev]);
      setTitle('');
      setDescription('');
      setIsSubmitting(false);
      showToast('Tugasan baharu berjaya dicipta!');
    }, 250);
  };

  // Fungsi Toggle Status Selesai (Meniru Next.js PUT /api/tasks/[id])
  const handleToggleComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = !t.isCompleted;
          showToast(updated ? 'Tugasan ditanda sebagai selesai!' : 'Tugasan dikembalikan ke aktif.');
          return { ...t, isCompleted: updated };
        }
        return t;
      })
    );
  };

  // Fungsi Padam Tugasan (Meniru Next.js DELETE /api/tasks/[id])
  const handleDeleteTask = (id: string) => {
    if (window.confirm('Adakah anda pasti mahu memadam tugasan ini?')) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      showToast('Tugasan berjaya dipadam.');
    }
  };

  // Tetapkan semula data sampel
  const handleResetSampleData = () => {
    setTasks(INITIAL_TASKS);
    showToast('Data sampel telah dimuatkan semula.');
  };

  // Salin Kod ke Papan Keratan (Clipboard)
  const handleCopyCode = (file: CodeFile) => {
    navigator.clipboard.writeText(file.code);
    setCopiedFileId(file.id);
    showToast(`Kod ${file.filename} berjaya disalin!`);
    setTimeout(() => setCopiedFileId(null), 2000);
  };

  // Muat Turun Fail
  const handleDownloadFile = (file: CodeFile) => {
    const blob = new Blob([file.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.filename;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Fail ${file.filename} dimuat turun.`);
  };

  // Muat Turun Semua Fail Sekali Gus
  const handleDownloadAll = () => {
    const allContent = codeFiles
      .map(
        (f) =>
          `/* =========================================================\n * FAIL: ${f.path}\n * KETERANGAN: ${f.description}\n * ========================================================= */\n\n${f.code}\n\n`
      )
      .join('\n');

    const blob = new Blob([allContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'task-tracker-nextjs-prisma-code.txt';
    link.click();
    URL.revokeObjectURL(url);
    showToast('Semua fail kod berjaya dimuat turun dalam satu berkas!');
  };

  // Tapis tugasan
  const filteredTasks = tasks.filter((task) => {
    const matchesFilter =
      filter === 'all' ? true : filter === 'completed' ? task.isCompleted : !task.isCompleted;
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const activeCount = tasks.length - completedCount;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const activeFile = codeFiles.find((f) => f.id === selectedFileId) || codeFiles[0];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-xl border border-indigo-400 flex items-center gap-2 animate-bounce text-sm font-medium">
          <Sparkles className="w-4 h-4 text-indigo-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Task Tracker Next.js
                </h1>
                <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                  Prisma + PostgreSQL
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Sistem Pengurusan Tugasan Lengkap dengan App Router & Tailwind
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs sm:text-sm">
            <button
              onClick={() => setActiveTab('demo')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'demo'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Demo UI</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'code'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Kod Sumber ({codeFiles.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'guide'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span className="hidden md:inline">Panduan</span> Pemasangan
            </button>
            <button
              onClick={() => setActiveTab('schema')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'schema'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span className="hidden md:inline">Struktur</span> Model
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ============================================================== */}
        {/* TAB 1: DEMO APLIKASI (LIVE PREVIEW OF NEXT.JS PAGE)            */}
        {/* ============================================================== */}
        {activeTab === 'demo' && (
          <div className="space-y-6">
            {/* Banner Penerangan */}
            <div className="bg-gradient-to-r from-indigo-950/60 to-slate-800/60 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl mt-0.5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white">
                    Pratonton Langsung UI Frontend (app/page.tsx)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Borang input dan senarai tugasan ini menggunakan reka bentuk Tailwind CSS dan logik kemaskini optimis yang sama seperti fail <code className="text-indigo-300 font-mono">app/page.tsx</code> yang anda perlukan.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => setActiveTab('code')}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  Salin Kod Next.js
                </button>
                <button
                  onClick={handleResetSampleData}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
                  title="Pulihkan tugasan sampel asal"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset Sampel
                </button>
              </div>
            </div>

            {/* Simulated Next.js Container */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
              {/* Window Title Bar */}
              <div className="bg-slate-900/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                  <span className="text-xs font-mono text-slate-400 ml-2">
                    http://localhost:3000 — Next.js Task Tracker
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 bg-slate-800/60 px-2.5 py-1 rounded-md border border-slate-700/50">
                  Prisma v5.x • PostgreSQL 16
                </div>
              </div>

              {/* Next.js Viewport Page */}
              <div className="bg-slate-50 text-slate-800 p-4 sm:p-8 min-h-[600px]">
                <div className="max-w-3xl mx-auto space-y-6">
                  {/* Header Halaman */}
                  <div className="text-center space-y-2">
                    <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider">
                      Next.js App Router • Prisma • PostgreSQL
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      Sistem Pengurusan Tugasan (Task Tracker)
                    </h2>
                    <p className="text-slate-600 text-xs sm:text-sm max-w-lg mx-auto">
                      Tambah tugasan baharu, kemaskini status penyelesaian melalui operasi PUT, dan padam rekod melalui DELETE dengan Prisma ORM.
                    </p>
                  </div>

                  {/* Borang Tambah Tugasan (Form POST) */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-6 transition-all hover:shadow-md">
                    <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                      Tambah Tugasan Baharu (POST /api/tasks)
                    </h3>

                    <form onSubmit={handleAddTask} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Tajuk Tugasan (title) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="cth: Sambungkan pangkalan data PostgreSQL dengan Prisma..."
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          disabled={isSubmitting}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Keterangan Tugasan (description){' '}
                          <span className="text-slate-400 font-normal lowercase">(pilihan)</span>
                        </label>
                        <textarea
                          rows={2}
                          placeholder="cth: Laksanakan arahan npx prisma db push atau migrate dev..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          disabled={isSubmitting}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm transition-all resize-none"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-slate-400">
                          Medan bertanda <span className="text-rose-500">*</span> adalah wajib
                        </span>
                        <button
                          type="submit"
                          disabled={isSubmitting || !title.trim()}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-xs sm:text-sm shadow-sm transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{isSubmitting ? 'Menyimpan...' : 'Tambah Tugasan'}</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Statistik & Kawalan Carian/Filter */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-5 space-y-4">
                    {/* Ringkasan Kemajuan */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Kemajuan Tugasan
                        </span>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-2xl font-black text-slate-900">
                            {progressPercent}%
                          </span>
                          <span className="text-xs text-slate-500">
                            ({completedCount} daripada {tasks.length} selesai)
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full sm:w-48 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Bar Carian & Tab Filter */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Cari tugasan..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Filter Tab */}
                      <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                        <button
                          onClick={() => setFilter('all')}
                          className={`px-3 py-1.5 rounded-lg transition-all ${
                            filter === 'all'
                              ? 'bg-white text-indigo-700 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Semua ({tasks.length})
                        </button>
                        <button
                          onClick={() => setFilter('active')}
                          className={`px-3 py-1.5 rounded-lg transition-all ${
                            filter === 'active'
                              ? 'bg-white text-indigo-700 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Aktif ({activeCount})
                        </button>
                        <button
                          onClick={() => setFilter('completed')}
                          className={`px-3 py-1.5 rounded-lg transition-all ${
                            filter === 'completed'
                              ? 'bg-white text-indigo-700 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Selesai ({completedCount})
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Senarai Tugasan (Tasks List) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Senarai Tugasan ({filteredTasks.length})
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Disusun mengikut <code className="font-mono">createdAt: desc</code>
                      </span>
                    </div>

                    {filteredTasks.length === 0 ? (
                      <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">Tiada tugasan dijumpai</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {searchQuery
                            ? 'Tiada tugasan sepadan dengan carian anda.'
                            : 'Gunakan borang di atas untuk menambah tugasan pertama anda!'}
                        </p>
                      </div>
                    ) : (
                      filteredTasks.map((task) => (
                        <div
                          key={task.id}
                          className={`group bg-white rounded-2xl border p-4 sm:p-5 transition-all duration-200 flex items-start gap-3 sm:gap-4 shadow-xs hover:shadow-md ${
                            task.isCompleted
                              ? 'border-slate-200 bg-slate-50/60'
                              : 'border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          {/* Butang Toggle Status isCompleted (PUT) */}
                          <button
                            type="button"
                            onClick={() => handleToggleComplete(task.id)}
                            className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                              task.isCompleted
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                                : 'border-slate-300 hover:border-indigo-500 bg-white hover:bg-indigo-50 text-transparent'
                            }`}
                            title={task.isCompleted ? 'Tanda sebagai belum selesai' : 'Tanda sebagai selesai'}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </button>

                          {/* Butiran Tugasan */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4
                                className={`text-sm sm:text-base font-semibold break-words ${
                                  task.isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                                }`}
                              >
                                {task.title}
                              </h4>
                              {task.isCompleted ? (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-md">
                                  SELESAI
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-md">
                                  AKTIF
                                </span>
                              )}
                            </div>

                            {task.description && (
                              <p
                                className={`text-xs sm:text-sm mt-1 break-words whitespace-pre-line ${
                                  task.isCompleted ? 'line-through text-slate-400' : 'text-slate-600'
                                }`}
                              >
                                {task.description}
                              </p>
                            )}

                            {/* Metadata: UUID & CreatedAt */}
                            <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                              <span className="flex items-center gap-1 font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200/60">
                                <Hash className="w-3 h-3 text-slate-400" />
                                {task.id.slice(0, 13)}...
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                {new Date(task.createdAt).toLocaleString('ms-MY', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Butang Padam (DELETE /api/tasks/[id]) */}
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task.id)}
                            className="flex-shrink-0 text-slate-300 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition-colors"
                            title="Padam tugasan dari PostgreSQL"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: LIHAT KOD SUMBER LENGKAP (NEXT.JS + PRISMA FILES)        */}
        {/* ============================================================== */}
        {activeTab === 'code' && (
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-indigo-400" />
                  Fail-Fail Kod Sumber Lengkap
                </h2>
                <p className="text-xs text-slate-400">
                  Salin atau muat turun fail-fail ini terus ke dalam projek Next.js anda.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={handleDownloadAll}
                  className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-600 transition-colors"
                >
                  <Download className="w-4 h-4 text-slate-300" />
                  <span>Muat Turun Semua (.txt)</span>
                </button>
                <button
                  onClick={() => handleCopyCode(activeFile)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
                >
                  {copiedFileId === activeFile.id ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Berjaya Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin Fail Ini</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* File Tabs & Code Box */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
              {/* File Selector Tabs */}
              <div className="bg-slate-900 border-b border-slate-800 px-3 pt-3 flex items-center gap-1 overflow-x-auto scrollbar-none">
                {codeFiles.map((file) => {
                  const isActive = file.id === selectedFileId;
                  return (
                    <button
                      key={file.id}
                      onClick={() => setSelectedFileId(file.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-t-xl text-xs font-mono transition-all border-t border-x ${
                        isActive
                          ? 'bg-slate-950 text-indigo-300 border-slate-800 border-b-transparent shadow-xs font-bold'
                          : 'bg-slate-900/60 text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      <FileCode
                        className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}
                      />
                      <span>{file.path}</span>
                    </button>
                  );
                })}
              </div>

              {/* File Info Bar */}
              <div className="px-5 py-3 bg-slate-900/50 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-300 font-mono">{activeFile.path}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">{activeFile.description}</span>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleDownloadFile(activeFile)}
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                    title={`Muat turun ${activeFile.filename}`}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleCopyCode(activeFile)}
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                    title={`Salin ${activeFile.filename}`}
                  >
                    {copiedFileId === activeFile.id ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Code Display Area */}
              <div className="relative p-4 sm:p-6 overflow-x-auto max-h-[650px] bg-slate-950 text-slate-200 font-mono text-xs sm:text-sm leading-relaxed">
                <pre className="selection:bg-indigo-600/40">
                  <code>{activeFile.code}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: PANDUAN PEMASANGAN LANGKAH DEMI LANGKAH                  */}
        {/* ============================================================== */}
        {activeTab === 'guide' && (
          <div className="space-y-6">
            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-400" />
                Panduan Pemasangan & Konfigurasi Penuh
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Ikuti langkah mudah di bawah untuk menjalankan Task Tracker ini secara tempatan di komputer anda menggunakan Next.js, Prisma, dan PostgreSQL.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {setupGuideSteps.map((step) => (
                <div
                  key={step.step}
                  className="bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-3 shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-bold flex items-center justify-center text-xs">
                      {step.step}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-white">{step.title}</h3>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 pl-10">{step.description}</p>

                  <div className="pl-10">
                    <div className="relative bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-xs text-indigo-200 overflow-x-auto">
                      <pre>
                        <code>{step.code}</code>
                      </pre>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(step.code);
                          showToast(`Arahan langkah ${step.step} disalin!`);
                        }}
                        className="absolute right-2 top-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700/50"
                        title="Salin arahan"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tips Pangkalan Data PostgreSQL */}
            <div className="bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Pilihan Pangkalan Data PostgreSQL (Percuma & Mudah)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Jika anda tidak mempunyai PostgreSQL tempatan, anda boleh menggunakan pembekal pelayan PostgreSQL awan percuma seperti:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <span className="font-bold text-white">Neon (Serverless Postgres)</span>
                  <p className="text-slate-400 mt-1">neon.tech — 0.5GB percuma tanpa had masa.</p>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <span className="font-bold text-white">Supabase</span>
                  <p className="text-slate-400 mt-1">supabase.com — 500MB PostgreSQL berserta dashboard.</p>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <span className="font-bold text-white">Docker Tempatan</span>
                  <p className="text-slate-400 mt-1 font-mono text-[11px]">
                    docker run -p 5432:5432 -e POSTGRES_PASSWORD=pass postgres
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: STRUKTUR MODEL TASK & PENERANGAN MEDAN                   */}
        {/* ============================================================== */}
        {activeTab === 'schema' && (
          <div className="space-y-6">
            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                Struktur Model Task (PostgreSQL Table Mapping)
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Jadual di bawah memperincikan jenis data dan kekangan bagi setiap medan dalam jadual <code className="text-indigo-300 font-mono">Task</code> mengikut spesifikasi yang diminta.
              </p>
            </div>

            {/* Table Details */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="px-5 py-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                    model Task
                  </span>
                  <span className="text-xs text-slate-400">Jadual SQL: "Task"</span>
                </div>
                <span className="text-xs text-slate-500 font-mono">PostgreSQL 14+</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-5 py-3">Nama Medan</th>
                      <th className="px-5 py-3">Jenis Prisma</th>
                      <th className="px-5 py-3">Jenis PostgreSQL</th>
                      <th className="px-5 py-3">Kekangan & Default</th>
                      <th className="px-5 py-3">Penerangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300 font-mono">
                    <tr className="hover:bg-slate-900/40">
                      <td className="px-5 py-3.5 font-bold text-indigo-300">id</td>
                      <td className="px-5 py-3.5 text-amber-300">String</td>
                      <td className="px-5 py-3.5 text-slate-400">TEXT / UUID</td>
                      <td className="px-5 py-3.5 text-emerald-400 font-sans text-xs">
                        @id @default(uuid())
                      </td>
                      <td className="px-5 py-3.5 font-sans text-xs text-slate-300">
                        Kunci primer unik dalam format UUID v4
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-900/40">
                      <td className="px-5 py-3.5 font-bold text-indigo-300">title</td>
                      <td className="px-5 py-3.5 text-amber-300">String</td>
                      <td className="px-5 py-3.5 text-slate-400">TEXT</td>
                      <td className="px-5 py-3.5 text-rose-400 font-sans text-xs">Wajib (NOT NULL)</td>
                      <td className="px-5 py-3.5 font-sans text-xs text-slate-300">
                        Tajuk tugasan
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-900/40">
                      <td className="px-5 py-3.5 font-bold text-indigo-300">description</td>
                      <td className="px-5 py-3.5 text-amber-300">String?</td>
                      <td className="px-5 py-3.5 text-slate-400">TEXT</td>
                      <td className="px-5 py-3.5 text-slate-400 font-sans text-xs">Pilihan (NULLABLE)</td>
                      <td className="px-5 py-3.5 font-sans text-xs text-slate-300">
                        Penerangan atau butiran tambahan bagi tugasan
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-900/40">
                      <td className="px-5 py-3.5 font-bold text-indigo-300">isCompleted</td>
                      <td className="px-5 py-3.5 text-amber-300">Boolean</td>
                      <td className="px-5 py-3.5 text-slate-400">BOOLEAN</td>
                      <td className="px-5 py-3.5 text-emerald-400 font-sans text-xs">
                        @default(false)
                      </td>
                      <td className="px-5 py-3.5 font-sans text-xs text-slate-300">
                        Status sama ada tugasan telah selesai atau belum
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-900/40">
                      <td className="px-5 py-3.5 font-bold text-indigo-300">createdAt</td>
                      <td className="px-5 py-3.5 text-amber-300">DateTime</td>
                      <td className="px-5 py-3.5 text-slate-400">TIMESTAMP(3)</td>
                      <td className="px-5 py-3.5 text-emerald-400 font-sans text-xs">
                        @default(now())
                      </td>
                      <td className="px-5 py-3.5 font-sans text-xs text-slate-300">
                        Tarikh dan masa rekod dicipta secara automatik
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Prisma Schema Card Preview */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">prisma/schema.prisma</span>
                <button
                  onClick={() => {
                    const schemaFile = codeFiles.find((f) => f.id === 'schema-prisma')!;
                    handleCopyCode(schemaFile);
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Salin Kod Skema
                </button>
              </div>
              <pre className="p-4 bg-slate-900 rounded-xl text-xs sm:text-sm font-mono text-indigo-200 overflow-x-auto">
{`model Task {
  id          String   @id @default(uuid())
  title       String
  description String?
  isCompleted Boolean  @default(false)
  createdAt   DateTime @default(now())

  @@index([isCompleted])
  @@index([createdAt])
}`}
              </pre>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 mt-12 text-center text-xs text-slate-500">
        <p>Sistem Pengurusan Tugasan (Task Tracker) • Next.js App Router • Prisma ORM • PostgreSQL</p>
      </footer>
    </div>
  );
}
