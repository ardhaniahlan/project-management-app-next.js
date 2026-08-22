'use server';

import { db } from '@/db';
import { tasks, organizationMembers, projects } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { revalidatePath } from 'next/cache';
import { TaskInput } from '../schema/taskSchema';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

export async function createTask(data: TaskInput) {
  const token = (await cookies()).get('auth_token')?.value;
  if (!token) return { error: 'Sesi tidak valid. Silakan login kembali.' };

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    const userId = payload.userId as number;

    const userOrg = await db.select()
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, userId))
      .limit(1);

    if (userOrg.length === 0) {
      return { error: 'Anda tidak memiliki akses.' };
    }

    const orgId = userOrg[0].organizationId;

    const projectCheck = await db.select()
      .from(projects)
      .where(
        and(
          eq(projects.id, data.projectId),
          eq(projects.organizationId, orgId)
        )
      )
      .limit(1);

    if (projectCheck.length === 0) {
      return { error: 'Proyek tidak ditemukan atau akses ditolak.' };
    }

    const existingTasks = await db.select({ id: tasks.id })
      .from(tasks)
      .where(eq(tasks.boardId, data.boardId));
    
    const nextPosition = existingTasks.length + 1;

    const parsedDueDate = data.dueDate ? new Date(data.dueDate) : null;

    await db.insert(tasks).values({
      title: data.title,
      description: data.description || '',
      priority: data.priority,
      dueDate: parsedDueDate,
      projectId: data.projectId,
      boardId: data.boardId,
      position: nextPosition, 
    });

    revalidatePath(`/projects/${data.projectId}`);
    return { success: true };

  } catch (err) {
    console.error("Gagal membuat tugas:", err);
    return { error: 'Terjadi kesalahan sistem saat membuat tugas.' };
  }
}