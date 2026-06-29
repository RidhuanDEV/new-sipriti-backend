import type { z } from "zod";
import type { capaianRangeQuerySchema, sectionKeySchema, upsertDeskripsiSchema } from "../capaian.schema.js";

export type DeskripsiCapaianSectionKeyDto = z.infer<typeof sectionKeySchema>;
export type CapaianRangeQueryDto = z.infer<typeof capaianRangeQuerySchema>;
export type UpsertDeskripsiDto = z.infer<typeof upsertDeskripsiSchema>;

export interface PublikasiPivotRowDto {
  kategori: string;
  skor_per_tahun: Record<string, number>;
}

export interface PublikasiPivotDto {
  headerTahun: string[];
  dataTabel: PublikasiPivotRowDto[];
}

export interface CapaianStatsDto {
  total_dana_hibah: number;
  total_dana_hibah_formatted: string;
  total_mitra_riset: number;
  total_hki: number;
  total_publikasi: number;
  total_hibah: number;
}

export interface TotalDanaHibahDto {
  total_dana: number;
  total_dana_formatted: string;
  total_count: number;
}

export interface TotalCountDto {
  total: number;
}

export interface TotalHkiDto {
  total: number;
  by_status: Array<{ status: string; count: number }>;
}

export interface TotalPublikasiDto {
  total: number;
  breakdown: Array<{ namaKategori: string | null; totalPublikasi: number }>;
}

export interface StaticContentSectionDto {
  description: string;
}

export interface StaticContentDto {
  banner_carousel: string[];
  tentang_prpm: StaticContentSectionDto;
  publikasi_ilmiah: StaticContentSectionDto;
  hki_paten: StaticContentSectionDto & { list: string[] };
  pengalaman_riset: StaticContentSectionDto;
  penghargaan_riset: StaticContentSectionDto & { image: string };
  produk_riset: StaticContentSectionDto & { list: string[] };
  sertifikasi_mutu: StaticContentSectionDto;
}

export interface DeskripsiCapaianDto {
  id: number | null;
  section_key: DeskripsiCapaianSectionKeyDto;
  content: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
