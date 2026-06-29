import type { Panduan } from "../panduan.model.js";
import type { PanduanResponseDto } from "../dto/panduan.dto.js";

export function toPanduanResponse(row: Panduan): PanduanResponseDto {
  return {
    id: row.id,
    judul: row.judul,
    isi_panduan: row.isi_panduan,
    thumbnail: row.thumbnail,
    file_url: row.file_url,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deleted_at: null,
  };
}
