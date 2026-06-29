import { z } from "zod";
import type { createPengumumanSchema, listPengumumanQuerySchema, updatePengumumanSchema } from "../pengumuman.schema.js";

export type CreatePengumumanDto = z.infer<typeof createPengumumanSchema>;
export type UpdatePengumumanDto = z.infer<typeof updatePengumumanSchema>;
export type ListPengumumanQueryDto = z.infer<typeof listPengumumanQuerySchema>;

export interface PengumumanResponseDto {
  id: string;
  slug: string;
  judul: string;
  isi_pengumuman: string;
  gambar: string | null;
  file_lampiran: string | null;
  tanggal_rilis: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deleted_at: null;
}
