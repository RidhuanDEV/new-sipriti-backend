import { z } from "zod";

const proposalStatusSchema = z.enum(["Draft", "Pending", "Approved", "Declined"]);
const proposalTypeSchema = z.enum(["Penelitian", "Pengabdian"]);
const memberRoleSchema = z.enum(["Ketua", "Anggota"]);
const inviteStatusSchema = z.enum(["pending", "accepted", "rejected"]);

export const proposalMetaSchema = z.object({
  judul: z.string().trim().min(10, "Judul minimal 10 karakter").max(1000, "Judul maksimal 1000 karakter").optional(),
  bidang_fokus: z.string().trim().min(1, "Bidang fokus wajib dipilih").optional(),
  bidang: z.string().trim().optional().nullable(),
  prodi_pengusul: z.string().trim().min(1, "Program studi wajib dipilih").optional(),
  skema: z.string().trim().min(1, "Skema wajib dipilih").optional(),
  sumber_dana: z.string().trim().min(1, "Sumber dana wajib diisi").max(200, "Sumber dana maksimal 200 karakter").optional(),
  jumlah_dana: z.union([z.string(), z.number()]).optional(),
  tahun_pelaksanaan: z.string().trim().optional().nullable(),
  tahun_akademik_id: z.string().uuid("ID tahun akademik tidak valid").optional().nullable(),
  jenis_usulan: z.string().trim().optional().nullable(),
  keterlibatan_lain: z.string().trim().max(5000).optional().nullable(),
  output_penelitian: z.string().trim().max(100).optional().nullable(),
  output_ids: z.array(z.string().uuid("ID Output tidak valid")).optional().nullable(),
  tipe_usulan: proposalTypeSchema.optional(),
});

export const anggotaItemSchema = z.object({
  nama: z.string().trim().max(255).optional().nullable(),
  peran: memberRoleSchema.optional(),
  role: z.enum(["Dosen", "Mahasiswa"]).optional(),
  programStudi: z.string().trim().max(255).optional().nullable(),
  programStudiKode: z.string().trim().max(20).optional().nullable(),
  bidang_tugas: z.string().trim().optional().nullable(),
  noIdentitas: z.string().trim().optional().nullable(),
  institusi: z.string().trim().max(255).optional().nullable(),
});

const metaInputSchema = z.union([proposalMetaSchema, z.string()]);
const anggotaInputSchema = z.union([z.array(anggotaItemSchema), z.string()]);

export const createWorkflowProposalSchema = z.object({
  meta: metaInputSchema,
  anggota: anggotaInputSchema,
  importOptions: z.object({ allowCreatorOutsideTeam: z.boolean().optional() }).optional(),
});

export const updateWorkflowProposalSchema = z.object({
  meta: metaInputSchema.optional(),
  anggota: anggotaInputSchema.optional(),
});

export const proposalCreateMultipartSchema = z.object({
  judul: z.string().trim().min(1, "Judul wajib diisi"),
});

export const proposalIdParamSchema = z.object({
  proposalId: z.string().trim().min(1, "ID proposal wajib diisi"),
});

export const idParamSchema = z.object({
  id: z.string().trim().min(1, "ID wajib diisi"),
});

export const uuidIdParamSchema = z.object({
  id: z.string().uuid("ID tidak valid"),
});

export const inviteMemberSchema = z.object({
  no_identitas: z.string().trim().min(1, "No Identitas wajib diisi"),
  peran: memberRoleSchema.default("Anggota"),
});

export const respondInviteSchema = z.object({
  status_invite: inviteStatusSchema,
});

export const adminReviewSchema = z.object({
  status_usulan: proposalStatusSchema,
});

export const proposalDetailQuerySchema = z.object({
  id: z.string().uuid("ID usulan tidak valid"),
});

export const proposalSearchBodySchema = z.object({
  search: z.string().trim().max(200).optional(),
  status: proposalStatusSchema.optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(100),
});

export const proposalByProdiQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  search: z.string().trim().max(200).optional(),
  status: proposalStatusSchema.optional(),
  tipe: proposalTypeSchema.optional(),
});

export const proposalListQuerySchema = z.object({
  tahun_akademik_id: z.string().optional(),
  tipe: z.union([z.enum(["umum", "hibah_internal"]), z.literal("All")]).optional(),
});

export const publicLandingQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  bidang_fokus: z.string().trim().max(255).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(10),
});

export type CreateWorkflowProposalSchema = z.infer<typeof createWorkflowProposalSchema>;
export type UpdateWorkflowProposalSchema = z.infer<typeof updateWorkflowProposalSchema>;
export type ProposalSearchBodySchema = z.infer<typeof proposalSearchBodySchema>;
export type ProposalByProdiQuerySchema = z.infer<typeof proposalByProdiQuerySchema>;
export type ProposalListQuerySchema = z.infer<typeof proposalListQuerySchema>;
export type PublicLandingQuerySchema = z.infer<typeof publicLandingQuerySchema>;
