import { z } from "zod";
import { proposalSectionIdParamSchema } from "../penelitian-proposal/penelitian-proposal.schema.js";

export const rabItemSchema = z.object({
  tahun_ke: z.union([z.string(), z.number()]).optional(),
  kelompok: z.string().nullable().optional(),
  komponen: z.string().nullable().optional(),
  item: z.string().optional(),
  satuan: z.string().nullable().optional(),
  biaya_satuan: z.union([z.string(), z.number()]).optional(),
  volume: z.union([z.string(), z.number()]).optional(),
  pajak: z.union([z.string(), z.number()]).optional(),
});

export const rabBodySchema = z.union([
  z.array(rabItemSchema),
  z.object({ items: z.array(rabItemSchema).optional().default([]) }),
]);

export type RabItemSchema = z.infer<typeof rabItemSchema>;
export type RabBodySchema = z.infer<typeof rabBodySchema>;
export { proposalSectionIdParamSchema };
