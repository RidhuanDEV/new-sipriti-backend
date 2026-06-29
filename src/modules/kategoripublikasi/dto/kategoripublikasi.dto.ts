import type { z } from "zod";
import type { createKategoriPublikasiSchema, listKategoriPublikasiQuerySchema, updateKategoriPublikasiSchema } from "../kategoripublikasi.schema.js";

export type CreateKategoriPublikasiDto = z.infer<typeof createKategoriPublikasiSchema>;
export type UpdateKategoriPublikasiDto = z.infer<typeof updateKategoriPublikasiSchema>;
export type ListKategoriPublikasiQueryDto = z.infer<typeof listKategoriPublikasiQuerySchema>;

export interface KategoriPublikasiResponseDto {
  id: string;
  namaKategori: string;
  createdAt: Date;
  updatedAt: Date;
}
