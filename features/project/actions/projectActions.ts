'use server';

import { db } from '@/db';
import { projects, boards, organizationMembers, users } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { revalidatePath } from 'next/cache';
import { ProjectInput } from '../schema/projectSchema';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

export async function createProject(data: ProjectInput) {
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
      return { error: 'Anda tidak memiliki akses ke ruang kerja manapun.' };
    }

    const { organizationId, role } = userOrg[0];

    if (role !== 'owner' && role !== 'project_manager') {
      return { error: 'Hanya Pemilik atau Project Manager yang dapat membuat proyek.' };
    }

    const [newProject] = await db.insert(projects).values({
      title: data.name,
      description: data.description || '',
      organizationId: organizationId,
      status: 'active',
    }).returning();

    await db.insert(boards).values([
      { projectId: newProject.id, name: 'To Do', position: 1 },
      { projectId: newProject.id, name: 'In Progress', position: 2 },
      { projectId: newProject.id, name: 'Done', position: 3 },
    ]);

    revalidatePath('/projects');
    return { success: true };

  } catch (err) {
    console.error("Gagal membuat proyek:", err);
    return { error: 'Terjadi kesalahan sistem saat membuat proyek.' };
  }
}