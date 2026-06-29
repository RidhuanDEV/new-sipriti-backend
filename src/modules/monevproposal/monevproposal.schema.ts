import { z } from "zod";

export const proposalIdParamSchema = z.object({
  proposalId: z.uuid("ID Proposal tidak valid"),
});

export const addMemberSchema = z.object({
  userId: z.uuid("ID User tidak valid"),
  peran: z.string().trim().optional().nullable(),
});

const positiveNumber = z.coerce.number().positive();

export const addRABSchema = z.object({
  tahun_ke: z.coerce.number().int().positive("Tahun ke harus bilangan positif"),
  kelompok: z.string().trim().min(1, "Kelompok wajib diisi"),
  komponen: z.string().trim().min(1, "Komponen wajib diisi"),
  item: z.string().trim().min(1, "Item wajib diisi"),
  satuan: z.string().trim().min(1, "Satuan wajib diisi"),
  harga_satuan: positiveNumber.optional(),
  biaya_satuan: positiveNumber.optional(),
  volume: positiveNumber,
  total: positiveNumber.optional(),
  total_biaya: positiveNumber.optional(),
}).superRefine((value, ctx) => {
  if (value.harga_satuan === undefined && value.biaya_satuan === undefined) {
    ctx.addIssue({ code: "custom", path: ["harga_satuan"], message: "Harga satuan wajib diisi" });
  }
  if (value.total === undefined && value.total_biaya === undefined) {
    ctx.addIssue({ code: "custom", path: ["total"], message: "Total wajib diisi" });
  }
});

export type AddMemberBody = z.infer<typeof addMemberSchema>;
export type AddRABBody = z.infer<typeof addRABSchema>;
