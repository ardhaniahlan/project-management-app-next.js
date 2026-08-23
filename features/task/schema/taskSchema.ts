import { z } from 'zod';

export const taskSchema = z.object({
  title: z.string()
    .min(3, { message: 'Judul tugas minimal 3 karakter' })
    .max(255, { message: 'Judul tugas maksimal 255 karakter' }),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high'], {
    error: 'Silakan pilih prioritas',
  }),
  dueDate: z.string().optional(),
  
  projectId: z.number(),
  boardId: z.number(),

  assigneeIds: z.array(z.string()).optional(),
  checklists: z.array(z.string()).optional(),
});

export type TaskInput = z.infer<typeof taskSchema>;