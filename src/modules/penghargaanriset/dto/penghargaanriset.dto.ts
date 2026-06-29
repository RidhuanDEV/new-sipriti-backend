import type { z } from "zod";
import type { createPenghargaanRisetSchema, listPenghargaanRisetQuerySchema, updatePenghargaanRisetSchema } from "../penghargaanriset.schema.js";

export type CreatePenghargaanRisetDto = z.infer<typeof createPenghargaanRisetSchema>;
export type UpdatePenghargaanRisetDto = z.infer<typeof updatePenghargaanRisetSchema>;
export type ListPenghargaanRisetQueryDto = z.infer<typeof listPenghargaanRisetQuerySchema>;

export interface PenghargaanRisetResponseDto {
  id: number;
  penghargaan_description: string | null;
  penghargaan_image: string | null;
  createdAt: Date;
  updatedAt: Date;
}
