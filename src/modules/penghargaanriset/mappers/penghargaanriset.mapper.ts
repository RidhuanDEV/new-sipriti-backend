import type { PenghargaanRiset } from "../penghargaanriset.model.js";
import type { PenghargaanRisetResponseDto } from "../dto/penghargaanriset.dto.js";

export function toPenghargaanRisetResponse(row: PenghargaanRiset): PenghargaanRisetResponseDto {
  return {
    id: row.id,
    penghargaan_description: row.penghargaan_description,
    penghargaan_image: row.penghargaan_image,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
