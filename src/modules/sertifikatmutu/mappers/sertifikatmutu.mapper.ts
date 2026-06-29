import type { SertifikatMutu } from "../sertifikatmutu.model.js";
import type { SertifikatMutuResponseDto } from "../dto/sertifikatmutu.dto.js";

export function toSertifikatMutuResponse(
  sertifikatMutu: SertifikatMutu,
): SertifikatMutuResponseDto {
  return {
    id: sertifikatMutu.id,
    sertifikat_description: sertifikatMutu.sertifikatDescription ?? null,
    createdAt: sertifikatMutu.createdAt,
    updatedAt: sertifikatMutu.updatedAt,
  };
}
