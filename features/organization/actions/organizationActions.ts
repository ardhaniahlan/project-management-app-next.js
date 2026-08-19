'use server';

import { db } from '@/db';
import { organizations, organizationMembers } from '@/db/schema';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { redirect } from 'next/navigation';
import { OrganizationInput } from '../schema/organizationSchema';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

export async function createOrganization(data: OrganizationInput) {
  const name = data.name;

  if (!name || name.length < 3) {
    return { error: 'Nama ruang kerja tidak valid.' };
  }

  const token = (await cookies()).get('auth_token')?.value;
  if (!token) {
    redirect('/login');
  }

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    const userId = payload.userId as number; 

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();

    const [newOrg] = await db.insert(organizations).values({
      name,
      slug,
    }).returning(); 
    await db.insert(organizationMembers).values({
      organizationId: newOrg.id,
      userId: userId,
      role: 'owner',
    });

  } catch (error) {
    console.error("Gagal membuat organisasi:", error);
    return { error: 'Terjadi kesalahan sistem saat membuat ruang kerja.' };
  }

  return { success: true };
}