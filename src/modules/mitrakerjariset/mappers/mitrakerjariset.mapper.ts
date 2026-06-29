import type { MitraKerjaRiset } from "../mitrakerjariset.model.js";
import type { MitraKerjaRisetResponseDto } from "../dto/mitrakerjariset.dto.js";

export function toMitraKerjaRisetResponse(row: MitraKerjaRiset): MitraKerjaRisetResponseDto {
  return {
    id: row.id,
    nama_mitra: row.nama_mitra,
    mitra_description: row.mitra_description,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
