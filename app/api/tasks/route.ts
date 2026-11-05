// app/api/tasks/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

// 1. GET: Mengambil semua senarai tugasan dari PostgreSQL
export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(tasks, { status: 200 });
  } catch (error: any) {
    console.error('Ralat ketika memuatkan senarai tugasan:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil senarai tugasan dari pangkalan data PostgreSQL.' },
      { status: 500 }
    );
  }
}

// 2. POST: Menambah tugasan baharu ke PostgreSQL
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
  } catch (error: any) {
    console.error('Ralat ketika mencipta tugasan baharu:', error);
    return NextResponse.json(
      { error: 'Gagal mencipta tugasan baharu dalam pangkalan data.' },
      { status: 500 }
    );
  }
}
