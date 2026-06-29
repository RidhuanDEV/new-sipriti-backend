import type { z } from "zod";
import type {
  createTahunAkademikSchema,
  listTahunAkademikQuerySchema,
  updateTahunAkademikSchema,
} from "../tahunakademik.schema.js";

export type CreateTahunAkademikDto = z.infer<typeof createTahunAkademikSchema>;
export type UpdateTahunAkademikDto = z.infer<typeof updateTahunAkademikSchema>;
export type ListTahunAkademikQueryDto = z.infer<typeof listTahunAkademikQuerySchema>;

export interface TahunAkademikResponseDto {
  id: string;
  tahunMulai: number;
  tahunSelesai: number;
  semester: string;
  label: string;
  createdAt: Date;
  updatedAt: Date;
}
