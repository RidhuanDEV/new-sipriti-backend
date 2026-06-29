import type { TahunAkademik } from "../tahunakademik.model.js";
import type { TahunAkademikResponseDto } from "../dto/tahunakademik.dto.js";

export function formatTahunAkademikLabel(tahunAkademik: {
  semester: string;
  tahunMulai: number;
  tahunSelesai: number;
}): string {
  return `${tahunAkademik.semester} ${tahunAkademik.tahunMulai}/${tahunAkademik.tahunSelesai}`;
}

export function toTahunAkademikResponse(
  tahunAkademik: TahunAkademik,
): TahunAkademikResponseDto {
  return {
    id: tahunAkademik.id,
    tahunMulai: tahunAkademik.tahunMulai,
    tahunSelesai: tahunAkademik.tahunSelesai,
    semester: tahunAkademik.semester,
    label: formatTahunAkademikLabel(tahunAkademik),
    createdAt: tahunAkademik.createdAt,
    updatedAt: tahunAkademik.updatedAt,
  };
}
