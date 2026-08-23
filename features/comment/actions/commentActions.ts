'use server';

import { db } from '@/db';
import { taskComments, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { revalidatePath } from 'next/cache';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

export async function getCommentsByTaskId(taskId: number) {
  try {
    const comments = await db.select({
      id: taskComments.id,
      body: taskComments.body,
      createdAt: taskComments.createdAt,
      user: {
        id: users.id,
        name: users.name,
      }
    })
    .from(taskComments)
    .innerJoin(users, eq(taskComments.userId, users.id))
    .where(eq(taskComments.taskId, taskId))
    .orderBy(desc(taskComments.createdAt));

    return { success: true, data: comments };
  } catch (error) {
    return { error: 'Gagal mengambil komentar.' };
  }
}

export async function addTaskComment(taskId: number, body: string, projectId: number) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) return { error: 'Sesi tidak valid.' };

    const { payload } = await jwtVerify(token, SECRET_KEY);
    const userId = payload.userId as number;

    await db.insert(taskComments).values({
      taskId,
      userId,
      body,
    });

    revalidatePath(`/projects/${projectId}`); 
    return { success: true };
  } catch (error) {
    return { error: 'Gagal menambahkan komentar.' };
  }
}