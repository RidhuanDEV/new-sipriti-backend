import type { KategoriPublikasi } from "../kategoripublikasi.model.js";
import type { KategoriPublikasiResponseDto } from "../dto/kategoripublikasi.dto.js";

export function toKategoriPublikasiResponse(row: KategoriPublikasi): KategoriPublikasiResponseDto {
  return {
    id: row.id,
    namaKategori: row.namaKategori,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
