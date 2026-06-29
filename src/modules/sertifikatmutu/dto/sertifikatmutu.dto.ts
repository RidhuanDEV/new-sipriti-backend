import type { z } from "zod";
import type {
  createSertifikatMutuSchema,
  listSertifikatMutuQuerySchema,
  updateSertifikatMutuSchema,
} from "../sertifikatmutu.schema.js";

export type CreateSertifikatMutuDto = z.infer<typeof createSertifikatMutuSchema>;
export type UpdateSertifikatMutuDto = z.infer<typeof updateSertifikatMutuSchema>;
export type ListSertifikatMutuQueryDto = z.infer<typeof listSertifikatMutuQuerySchema>;

export interface SertifikatMutuResponseDto {
  id: number;
  sertifikat_description: string | null;
  createdAt: Date;
  updatedAt: Date;
}
