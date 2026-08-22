"use server";

import { db } from "@/db";
import {
  tasks,
  organizationMembers,
  projects,
  taskAssignees,
  users,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { revalidatePath } from "next/cache";
import { TaskInput } from "../schema/taskSchema";

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

export async function createTask(data: TaskInput) {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) return { error: "Sesi tidak valid. Silakan login kembali." };

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    const userId = payload.userId as number;

    const userOrg = await db
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, userId))
      .limit(1);

    if (userOrg.length === 0) {
      return { error: "Anda tidak memiliki akses." };
    }

    const orgId = userOrg[0].organizationId;

    const projectCheck = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, data.projectId),
          eq(projects.organizationId, orgId),
        ),
      )
      .limit(1);

    if (projectCheck.length === 0) {
      return { error: "Proyek tidak ditemukan atau akses ditolak." };
    }

    const existingTasks = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(eq(tasks.boardId, data.boardId));

    const nextPosition = existingTasks.length + 1;

    const parsedDueDate = data.dueDate ? new Date(data.dueDate) : null;

    const [newTask] = await db
      .insert(tasks)
      .values({
        title: data.title,
        description: data.description || "",
        priority: data.priority,
        dueDate: parsedDueDate,
        projectId: data.projectId,
        boardId: data.boardId,
        position: nextPosition,
      })
      .returning({ id: tasks.id });
    if (data.assigneeIds && data.assigneeIds.length > 0) {
      const assigneesToInsert = data.assigneeIds.map((userId) => ({
        taskId: newTask.id,
        userId: Number(userId),
      }));

      if (assigneesToInsert.length > 0) {
        await db.insert(taskAssignees).values(assigneesToInsert);
      }
    }

    revalidatePath(`/projects/${data.projectId}`);
    return { success: true };
  } catch (err) {
    console.error("Gagal membuat tugas:", err);
    return { error: "Terjadi kesalahan sistem saat membuat tugas." };
  }
}

export async function moveTask(
  taskId: number,
  newBoardId: number,
  projectId: number,
) {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) return { error: "Sesi tidak valid." };

  try {
    await db
      .update(tasks)
      .set({ boardId: newBoardId })
      .where(eq(tasks.id, taskId));

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (err) {
    console.error("Gagal memindah tugas:", err);
    return { error: "Terjadi kesalahan saat menyimpan posisi tugas." };
  }
}

export async function updateTask(
  taskId: number,
  projectId: number,
  data: {
    title?: string;
    description?: string;
    priority?: "low" | "medium" | "high";
    dueDate?: string | null;
    assigneeIds?: number[] | undefined;
  },
) {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) return { error: "Sesi tidak valid." };

  try {
    await jwtVerify(token, SECRET_KEY);

    const parsedDueDate = data.dueDate ? new Date(data.dueDate) : null;

    await db
      .update(tasks)
      .set({
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.priority && { priority: data.priority }),
        ...(data.dueDate !== undefined && { dueDate: parsedDueDate }),
      })
      .where(eq(tasks.id, taskId));

    if (data.assigneeIds !== undefined) {
      await db.delete(taskAssignees).where(eq(taskAssignees.taskId, taskId));

      if (data.assigneeIds.length > 0) {
        const assigneesToInsert = data.assigneeIds.map((userId) => ({
          taskId: taskId,
          userId: userId,
        }));
        await db.insert(taskAssignees).values(assigneesToInsert);
      }
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (err) {
    console.error("Gagal memperbarui tugas:", err);
    return { error: "Terjadi kesalahan saat memperbarui tugas." };
  }
}

export async function deleteTask(taskId: number, projectId: number) {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) return { error: "Sesi tidak valid." };

  try {
    await jwtVerify(token, SECRET_KEY);

    await db.delete(tasks).where(eq(tasks.id, taskId));

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (err) {
    console.error("Gagal menghapus tugas:", err);
    return { error: "Terjadi kesalahan saat menghapus tugas." };
  }
}

export async function getOrganizationMembers(projectId: number) {
  try {
    const project = await db
      .select({ orgId: projects.organizationId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (project.length === 0) return { error: "Proyek tidak ditemukan" };

    const members = await db
      .select({
        userId: organizationMembers.userId,
        role: organizationMembers.role,
        name: users.name,
      })
      .from(organizationMembers)
      .innerJoin(users, eq(organizationMembers.userId, users.id))
      .where(eq(organizationMembers.organizationId, project[0].orgId));

    return { members };
  } catch (err) {
    console.error("Gagal mengambil anggota:", err);
    return { error: "Gagal memuat daftar anggota" };
  }
}
