import { z } from "zod";
import type { createBeritaSchema, listBeritaQuerySchema, updateBeritaSchema } from "../berita.schema.js";
import type { BeritaKategori } from "../berita.model.js";

export type CreateBeritaDto = z.infer<typeof createBeritaSchema>;
export type UpdateBeritaDto = z.infer<typeof updateBeritaSchema>;
export type ListBeritaQueryDto = z.infer<typeof listBeritaQuerySchema>;

export interface BeritaResponseDto {
  id: string;
  slug: string;
  judul: string;
  isi_berita: string;
  photo_url: string | null;
  file_url: string | null;
  kategori: BeritaKategori;
  tanggal_rilis: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deleted_at: null;
}
