import type { z } from "zod";
import type {
  createProdiSchema,
  listProdiQuerySchema,
  updateProdiSchema,
} from "../prodi.schema.js";

export type CreateProdiDto = z.infer<typeof createProdiSchema>;
export type UpdateProdiDto = z.infer<typeof updateProdiSchema>;
export type ListProdiQueryDto = z.infer<typeof listProdiQuerySchema>;

export interface ProdiResponseDto {
  id: string;
  kode_prodi: string;
  nama_prodi: string;
  jenjang: string;
  createdAt: Date;
  updatedAt: Date;
}
