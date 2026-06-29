import type { Berita } from "../berita.model.js";
import type { BeritaResponseDto } from "../dto/berita.dto.js";

export function toBeritaResponse(row: Berita): BeritaResponseDto {
  return {
    id: row.id,
    slug: row.slug,
    judul: row.judul,
    isi_berita: row.isi_berita,
    photo_url: row.photo_url,
    file_url: row.file_url,
    kategori: row.kategori,
    tanggal_rilis: row.tanggal_rilis,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deleted_at: null,
  };
}
