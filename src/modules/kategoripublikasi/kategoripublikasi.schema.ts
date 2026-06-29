import { z } from "zod";

export const createKategoriPublikasiSchema = z.object({
  nama_kategori: z.string().trim().min(1, "Nama kategori tidak boleh kosong"),
});

export const updateKategoriPublikasiSchema = z.object({
  nama_kategori: z.string().trim().min(1, "Nama kategori tidak boleh kosong").optional(),
});

export const listKategoriPublikasiQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(10),
  q: z.string().optional(),
  search: z.string().optional(),
});

export const kategoriPublikasiIdParamSchema = z.object({
  id: z.string().uuid("Format ID Kategori Publikasi tidak valid"),
});
