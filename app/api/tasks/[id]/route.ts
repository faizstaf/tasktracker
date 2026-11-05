// app/api/tasks/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export const dynamic = 'force-dynamic';

// 1. GET: Mengambil satu tugasan mengikut ID
export async function GET(request: Request, props: RouteParams) {
  try {
    const { id } = await props.params;

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
  } catch (error: any) {
    console.error('Ralat ketika mencari tugasan:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil maklumat tugasan.' },
      { status: 500 }
    );
  }
}

// 2. PUT: Mengemaskini tugasan (title, description, isCompleted)
export async function PUT(request: Request, props: RouteParams) {
  try {
    const { id } = await props.params;
    const body = await request.json();
    const { title, description, isCompleted } = body;

    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Tugasan tidak dijumpai untuk dikemaskini.' },
        { status: 404 }
      );
    }

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
          { error: 'Status isCompleted mestilah boolean (true/false).' },
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
  } catch (error: any) {
    console.error('Ralat ketika mengemaskini tugasan:', error);
    return NextResponse.json(
      { error: 'Gagal mengemaskini tugasan dalam pangkalan data.' },
      { status: 500 }
    );
  }
}

// 3. DELETE: Memadam tugasan mengikut ID
export async function DELETE(request: Request, props: RouteParams) {
  try {
    const { id } = await props.params;

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
  } catch (error: any) {
    console.error('Ralat ketika memadam tugasan:', error);
    return NextResponse.json(
      { error: 'Gagal memadam tugasan dari pangkalan data.' },
      { status: 500 }
    );
  }
}