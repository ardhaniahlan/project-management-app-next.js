import { z } from 'zod';

export const projectSchema = z.object({
  name: z.string()
    .min(3, { message: 'Nama proyek minimal harus 3 karakter' })
    .max(100, { message: 'Nama proyek maksimal 100 karakter' }),
  description: z.string()
    .max(500, { message: 'Deskripsi maksimal 500 karakter' })
    .optional(),
});

export type ProjectInput = z.infer<typeof projectSchema>;