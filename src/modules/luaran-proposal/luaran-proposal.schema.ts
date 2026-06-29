import { z } from "zod";
import { proposalSectionIdParamSchema } from "../penelitian-proposal/penelitian-proposal.schema.js";

export const luaranItemSchema = z.object({
  luaran: z.string().trim().min(1).optional(),
  target_capaian: z.string().nullable().optional(),
  iku_terkait: z.string().nullable().optional(),
  target_iku: z.string().nullable().optional(),
});

export const luaranBodySchema = z.union([
  z.array(luaranItemSchema),
  z.object({ items: z.array(luaranItemSchema).optional().default([]) }),
]);

export type LuaranItemSchema = z.infer<typeof luaranItemSchema>;
export type LuaranBodySchema = z.infer<typeof luaranBodySchema>;
export { proposalSectionIdParamSchema };
