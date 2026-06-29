import type { Skema } from "../skema.model.js";
import type { SkemaOptionDto, SkemaResponseDto } from "../dto/skema.dto.js";

export function toSkemaResponse(skema: Skema): SkemaResponseDto {
  return {
    id: skema.id,
    nama_skema: skema.namaSkema,
    tipe: skema.tipe,
    deskripsi: skema.deskripsi ?? null,
    is_active: skema.isActive,
    createdAt: skema.createdAt,
    updatedAt: skema.updatedAt,
  };
}

export function toSkemaResponseList(
  skemas: ReadonlyArray<Skema>,
): SkemaResponseDto[] {
  return skemas.map((skema) => toSkemaResponse(skema));
}

export function toSkemaOption(skema: Skema): SkemaOptionDto {
  return {
    id: skema.id,
    nama_skema: skema.namaSkema,
    tipe: skema.tipe,
  };
}
