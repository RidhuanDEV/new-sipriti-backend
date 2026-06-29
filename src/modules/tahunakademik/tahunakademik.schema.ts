import { z } from "zod";

export const semesterSchema = z.enum(["Ganjil", "Genap"]);

export const createTahunAkademikSchema = z.object({
  tahun_mulai: z.coerce.number().int().min(0, "Tahun mulai harus berupa angka positif"),
  tahun_selesai: z.coerce.number().int().min(0, "Tahun selesai harus berupa angka positif"),
  semester: semesterSchema.optional(),
});

export const updateTahunAkademikSchema = z.object({
  tahun_mulai: z.coerce.number().int().min(0, "Tahun mulai harus berupa angka positif").optional(),
  tahun_selesai: z.coerce.number().int().min(0, "Tahun selesai harus berupa angka positif").optional(),
  semester: semesterSchema.optional(),
});

export const tahunAkademikIdParamSchema = z.object({
  id: z.uuid("Format ID Tahun Akademik tidak valid"),
});

export const listTahunAkademikQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(10),
  tahun_mulai: z.coerce.number().int().optional(),
  tahun_selesai: z.coerce.number().int().optional(),
});
