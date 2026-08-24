"use server";
import { db } from "@/db";
import { activityLogs } from "@/db/schema";

export async function logActivity(
  organizationId: number,
  userId: number,
  action: string, 
  projectId?: number
) {
  try {
    await db.insert(activityLogs).values({
      organizationId,
      userId,
      action,
      projectId
    });
  } catch (error) {
    console.error('Gagal mencatat log aktivitas:', error);
  }
}