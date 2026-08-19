'use server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { LoginFormData, RegisterFormData } from '../schema/authSchema';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

export async function registerUser(formData: RegisterFormData) {
  const { name, email, password } = formData;

  if (!name || !email || !password) {
    return { error: 'Semua kolom wajib diisi!' };
  }

  const existingUser = await db.select().from(users).where(eq(users.email, email));
  if (existingUser.length > 0) {
    return { error: 'Email sudah terdaftar!' };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db.insert(users).values({
    name,
    email,
    passwordHash,
  });

  return { success : true };
}

export async function loginUser(formData: LoginFormData) {
  const { email, password } = formData;

  if (!email || !password) {
    return { error: 'Email dan password wajib diisi!' };
  }

  const userRecord = await db.select().from(users).where(eq(users.email, email));
  const user = userRecord[0];

  if (!user) {
    return { error: 'Email tidak ditemukan!' };
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return { error: 'Password salah!' };
  }

  const token = await new SignJWT({ userId: user.id, name: user.name, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(SECRET_KEY);

  (await cookies()).set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  });

  return { success: true };
}

export async function logout() {
  (await cookies()).delete('auth_token');
  return { success : true };
}