import { z } from "zod";

export const reviewTypeSchema = z.enum(["penelitian", "pengabdian", "hki", "all"]);

export const reviewTypeOnlyParamSchema = z.object({
  type: reviewTypeSchema,
});

export const reviewTypeParamSchema = z.object({
  type: reviewTypeSchema,
  id: z.uuid("ID Proposal tidak valid"),
});

export const reviewIdParamSchema = z.object({
  id: z.uuid("ID Proposal tidak valid"),
});

export const approveProposalSchema = z.object({
  catatan: z.string().trim().max(5000).optional().nullable(),
});

export const rejectProposalSchema = z.object({
  catatan: z.string().trim().min(1, "Catatan penolakan tidak boleh kosong"),
});

export const reviewListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(["draft", "pending", "approved", "declined", "all"]).optional(),
  prodi: z.string().trim().optional(),
  tahun_akademik_id: z.string().trim().optional(),
  type: z.enum(["penelitian", "pengabdian", "all"]).optional(),
  tipe: z.enum(["Penelitian", "Pengabdian"]).optional(),
  tipe_usulan: z.enum(["Penelitian", "Pengabdian"]).optional(),
});

export type ReviewType = z.infer<typeof reviewTypeSchema>;
export type ReviewListQuery = z.infer<typeof reviewListQuerySchema>;
export type ApproveProposalBody = z.infer<typeof approveProposalSchema>;
export type RejectProposalBody = z.infer<typeof rejectProposalSchema>;
