import type { z } from "zod";
import type { adminReviewSchema, inviteMemberSchema, respondInviteSchema } from "./proposal.schema.js";

export type InviteMemberSchema = z.infer<typeof inviteMemberSchema>;
export type RespondInviteSchema = z.infer<typeof respondInviteSchema>;
export type AdminReviewSchema = z.infer<typeof adminReviewSchema>;
