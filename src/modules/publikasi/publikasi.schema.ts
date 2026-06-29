import { z } from "zod";

export const upsertPublikasiSchema = z.object({
  tahun_akademik_id: z.string().trim().min(1, "Tahun Akademik wajib diisi"),
  kategori_publikasi_id: z.string().trim().min(1, "Kategori Publikasi wajib diisi"),
  total_publikasi: z.coerce.number().int("Total Publikasi harus berupa bilangan bulat").min(0, "Total publikasi tidak boleh negatif"),
});

export const listPublikasiQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(5000).default(10),
  q: z.string().optional(),
  search: z.string().optional(),
  tahun_mulai: z.coerce.number().int().optional(),
  tahun_selesai: z.coerce.number().int().optional(),
});
