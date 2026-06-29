import { z } from "zod";

export const templateAnggotaItemSchema = z.object({
  noIdentitas: z.union([z.string().trim().min(1, "No identitas anggota wajib diisi").max(100), z.number()]),
  peran: z.enum(["Ketua", "Anggota"]),
});

export const downloadTemplateBodySchema = z.object({
  anggota: z.array(templateAnggotaItemSchema).min(1, "Pilih minimal 1 anggota sebelum mengunduh template").max(200, "Jumlah anggota maksimal 200 orang per template"),
});

export type DownloadTemplateBody = z.infer<typeof downloadTemplateBodySchema>;
export type TemplateAnggotaItem = z.infer<typeof templateAnggotaItemSchema>;
