import type { z } from "zod";
import type {
  createSkemaSchema,
  listSkemaQuerySchema,
  skemaOptionsQuerySchema,
  updateSkemaSchema,
} from "../skema.schema.js";

export type CreateSkemaDto = z.infer<typeof createSkemaSchema>;
export type UpdateSkemaDto = z.infer<typeof updateSkemaSchema>;
export type ListSkemaQueryDto = z.infer<typeof listSkemaQuerySchema>;
export type SkemaOptionsQueryDto = z.infer<typeof skemaOptionsQuerySchema>;

export interface SkemaResponseDto {
  id: string;
  nama_skema: string;
  tipe: string;
  deskripsi: string | null;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SkemaOptionDto {
  id: string;
  nama_skema: string;
  tipe: string;
}
