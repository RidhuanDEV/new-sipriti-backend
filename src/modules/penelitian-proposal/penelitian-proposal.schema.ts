import { z } from "zod";

export const proposalSectionIdParamSchema = z.object({
  id: z.string().uuid("ID proposal tidak valid"),
});

export const penelitianProposalBodySchema = z.object({
  ringkasan: z.string().nullable().optional(),
  kata_kunci: z.array(z.string()).nullable().optional(),
  pendahuluan: z.string().nullable().optional(),
  metode: z.string().nullable().optional(),
  daftar_pustaka: z.string().nullable().optional(),
});

export type PenelitianProposalBodySchema = z.infer<typeof penelitianProposalBodySchema>;
