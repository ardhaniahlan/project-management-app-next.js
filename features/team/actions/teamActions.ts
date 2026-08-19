"use server";

import { db } from "@/db";
import { users, organizationMembers } from "@/db/schema";
import { and, eq, ilike, ne, or } from "drizzle-orm";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { revalidatePath } from "next/cache";
import { InviteInput } from "../schema/teamSchema";

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

export async function inviteUserToTeam(data: InviteInput) {
  const email = data.email;
  const role = data.role;

  const token = (await cookies()).get("auth_token")?.value;
  if (!token) return { error: "Sesi tidak valid. Silakan login kembali." };

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    const inviterId = payload.userId as number;

    const inviterOrg = await db
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, inviterId))
      .limit(1);

    if (inviterOrg.length === 0) {
      return { error: "Anda belum memiliki Ruang Kerja." };
    }

    if (inviterOrg[0].role !== "owner") {
      return {
        error: "Hanya Pemilik (Owner) yang dapat mengundang anggota baru.",
      };
    }

    const orgId = inviterOrg[0].organizationId;

    const targetUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (targetUsers.length === 0) {
      return { error: "Tidak ada email yang cocok dengan pengguna terdaftar." };
    }

    const newMembers = targetUsers.map((user) => ({
      organizationId: orgId,
      userId: user.id,
      role: role,
    }));

    try {
      await db
        .insert(organizationMembers)
        .values(newMembers)
        .onConflictDoNothing();

      revalidatePath("/team");
      return { success: true, addedCount: targetUsers.length };
    } catch (err) {
      return { error: "Gagal memasukkan anggota ke dalam tim." };
    }
  } catch (err) {
    console.error("Gagal mengundang anggota:", err);
    return { error: "Terjadi kesalahan sistem saat memproses undangan." };
  }
}

export async function searchUsersForInvite(query: string) {
  if (!query || query.length < 2) return [];

  const token = (await cookies()).get('auth_token')?.value;
  if (!token) return []; 

  let currentUserId: number;

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    currentUserId = payload.userId as number;
  } catch (error) {
    return [];
  }

  try {
    const results = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(
      and(
        ne(users.id, currentUserId),
        or(
          ilike(users.email, `%${query}%`),
          ilike(users.name, `%${query}%`)
        )
      )
    ) 
    .limit(5);

    return results;
  } catch (error) {
    console.error("Gagal mencari user:", error);
    return [];
  }
}
