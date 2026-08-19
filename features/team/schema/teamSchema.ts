import { z } from "zod";

export const inviteSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email wajib diisi" }),
  role: z.enum(["project_manager", "member"], {
    error: "Pilih peran untuk anggota ini",
  }),
});

export type InviteInput = z.infer<typeof inviteSchema>;
