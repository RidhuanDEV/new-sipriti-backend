import { z } from "zod";

export const pengabdianProposalBodySchema = z.object({
  tingkat: z.enum(["Lokal", "Nasional", "Internasional"]).nullable().optional(),
  ringkasan: z.string().nullable().optional(),
  kata_kunci: z.array(z.string()).nullable().optional(),
  pendahuluan: z.string().nullable().optional(),
  permasalahan_dan_solusi: z.string().nullable().optional(),
  metode: z.string().nullable().optional(),
  gambaran_ipteks: z.string().nullable().optional(),
  peta_lokasi_mitra_url: z.string().nullable().optional(),
  daftar_pustaka: z.string().nullable().optional(),
});

export type PengabdianProposalBodySchema = z.infer<typeof pengabdianProposalBodySchema>;
export { proposalSectionIdParamSchema } from "../penelitian-proposal/penelitian-proposal.schema.js";
