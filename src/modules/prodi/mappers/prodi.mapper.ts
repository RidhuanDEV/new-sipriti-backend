import type { Prodi } from "../prodi.model.js";
import type { ProdiResponseDto } from "../dto/prodi.dto.js";

export function toProdiResponse(prodi: Prodi): ProdiResponseDto {
  return {
    id: prodi.id,
    kode_prodi: prodi.kodeProdi,
    nama_prodi: prodi.namaProdi,
    jenjang: prodi.jenjang,
    createdAt: prodi.createdAt,
    updatedAt: prodi.updatedAt,
  };
}

export function toProdiResponseList(
  prodis: ReadonlyArray<Prodi>,
): ProdiResponseDto[] {
  return prodis.map((prodi) => toProdiResponse(prodi));
}
