import { z } from "zod";

export const jenisLaporanSchema = z.enum(["laporan_kemajuan", "laporan_akhir"]);
export const statusValidasiLaporanSchema = z.enum(["Sesuai", "Revisi"]);

export const laporanListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  proposal_id: z.uuid().optional(),
  haki_proposal_id: z.uuid().optional(),
  jenis_laporan: jenisLaporanSchema.optional(),
  status_laporan: z.enum(["Lengkapi Dokumen", "Pending", "Revisi", "Sesuai"]).optional(),
  tipe_usulan: z.enum(["Penelitian", "Pengabdian"]).optional(),
  tahun_akademik_id: z.string().trim().optional(),
  prodi_pengusul: z.string().trim().optional(),
});

export const createLaporanQuerySchema = z.object({
  jenis_laporan: jenisLaporanSchema,
});

export const createLaporanBodySchema = z.object({
  haki_proposal_id: z.uuid("ID Proposal tidak valid"),
  jenis_laporan: jenisLaporanSchema,
  file_url: z.string().trim().max(500).optional().nullable(),
  nama_file: z.string().trim().max(255).optional().nullable(),
});

export const updateLaporanParamSchema = z.object({
  id: z.uuid("ID Laporan tidak valid"),
});

export const updateLaporanBodySchema = z.object({
  file_url: z.string().trim().max(500).optional().nullable(),
  nama_file: z.string().trim().max(255).optional().nullable(),
});

export const validateLaporanBodySchema = z
  .object({
    status_laporan: statusValidasiLaporanSchema,
    catatan_validator: z.string().trim().max(5000).optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.status_laporan === "Revisi" && !value.catatan_validator) {
      ctx.addIssue({
        code: "custom",
        path: ["catatan_validator"],
        message: "Catatan revisi wajib diisi saat status Revisi",
      });
    }
  });

export type LaporanListQuery = z.infer<typeof laporanListQuerySchema>;
export type CreateLaporanBody = z.infer<typeof createLaporanBodySchema>;
export type UpdateLaporanBody = z.infer<typeof updateLaporanBodySchema>;
export type ValidateLaporanBody = z.infer<typeof validateLaporanBodySchema>;
export type JenisLaporan = z.infer<typeof jenisLaporanSchema>;
