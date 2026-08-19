import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string()
    .min(3, { message: 'Nama minimal harus 3 karakter' })
    .max(255, { message: 'Nama maksimal 255 karakter' }),
  
  email: z.string()
    .min(1, { message: 'Email wajib diisi' })
    .email({ message: 'Format email tidak valid' }),
  
  password: z.string()
    .min(8, { message: 'Password minimal harus 8 karakter' }),
  
  confirmPassword: z.string()
    .min(1, { message: 'Konfirmasi password wajib diisi' })
})
.refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid' }),
  password: z.string().min(1, { message: 'Password wajib diisi' }),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;