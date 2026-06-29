import { z } from "zod";

export const finalProposalPdfParamSchema = z.object({
  id: z.uuid("ID Proposal tidak valid"),
});
