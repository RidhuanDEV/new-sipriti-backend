import type { z } from "zod";
import type { createMitraKerjaRisetSchema, listMitraKerjaRisetQuerySchema, updateMitraKerjaRisetSchema } from "../mitrakerjariset.schema.js";

export type CreateMitraKerjaRisetDto = z.infer<typeof createMitraKerjaRisetSchema>;
export type UpdateMitraKerjaRisetDto = z.infer<typeof updateMitraKerjaRisetSchema>;
export type ListMitraKerjaRisetQueryDto = z.infer<typeof listMitraKerjaRisetQuerySchema>;

export interface MitraKerjaRisetResponseDto {
  id: string;
  nama_mitra: string;
  mitra_description: string | null;
  createdAt: Date;
  updatedAt: Date;
}
