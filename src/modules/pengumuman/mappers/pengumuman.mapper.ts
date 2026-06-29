import type { Pengumuman } from "../pengumuman.model.js";
import type { PengumumanResponseDto } from "../dto/pengumuman.dto.js";

export function toPengumumanResponse(row: Pengumuman): PengumumanResponseDto {
  return {
    id: row.id,
    slug: row.slug,
    judul: row.judul,
    isi_pengumuman: row.isi_pengumuman,
    gambar: row.gambar,
    file_lampiran: row.file_lampiran,
    tanggal_rilis: row.tanggal_rilis,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deleted_at: null,
  };
}
