'use server';

import { db } from '@/db';
import { taskChecklists } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function addChecklist(taskId: number, title: string, projectId: number) {
  try {
    await db.insert(taskChecklists).values({ taskId, title });
    revalidatePath(`/projects/${projectId}`); 
    return { success: true };
  } catch (error) {
    return { error: 'Gagal menambahkan checklist' };
  }
}

export async function toggleChecklist(checklistId: number, isCompleted: boolean, projectId: number) {
  try {
    await db.update(taskChecklists)
      .set({ isCompleted })
      .where(eq(taskChecklists.id, checklistId));
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    return { error: 'Gagal mengubah status checklist' };
  }
}

export async function deleteChecklist(checklistId: number, projectId: number) {
  try {
    await db.delete(taskChecklists).where(eq(taskChecklists.id, checklistId));
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    return { error: 'Gagal menghapus checklist' };
  }
}