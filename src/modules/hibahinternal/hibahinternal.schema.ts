import { z } from "zod";

const teamInputSchema = z.union([
  z.string(),
  z.array(z.string().trim().min(1, "Nama anggota tim tidak boleh kosong")),
]);

export const createHibahInternalSchema = z.object({
  tipe_hibah: z.string().trim().min(1, "Tipe hibah tidak boleh kosong"),
  judul_hibah: z.string().trim().min(1, "Judul hibah tidak boleh kosong"),
  susunan_tim_hibah: teamInputSchema,
  tahun_hibah: z.union([z.string(), z.number()]),
  dana_hibah: z.coerce.number().gt(0, "Dana hibah harus lebih dari 0"),
  pengalaman_riset_description: z.string().trim().optional().nullable(),
});

export const updateHibahInternalSchema = z.object({
  tipe_hibah: z.string().trim().min(1, "Tipe hibah tidak boleh kosong").optional(),
  judul_hibah: z.string().trim().min(1, "Judul hibah tidak boleh kosong").optional(),
  susunan_tim_hibah: teamInputSchema.optional(),
  tahun_hibah: z.union([z.string(), z.number()]).optional(),
  dana_hibah: z.coerce.number().gt(0, "Dana hibah harus lebih dari 0").optional(),
  pengalaman_riset_description: z.string().trim().optional().nullable(),
});

export const listHibahInternalQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(10),
  search: z.string().optional(),
  q: z.string().optional(),
});

export const hibahInternalIdParamSchema = z.object({
  id: z.string().uuid("Format ID Hibah Internal tidak valid"),
});
