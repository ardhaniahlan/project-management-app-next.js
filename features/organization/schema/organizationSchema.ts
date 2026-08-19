import { z } from 'zod';

export const organizationSchema = z.object({
  name: z.string()
    .min(3, { message: 'Nama ruang kerja minimal harus 3 karakter' })
    .max(100, { message: 'Nama ruang kerja maksimal 100 karakter' }),
});

export type OrganizationInput = z.infer<typeof organizationSchema>;