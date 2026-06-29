import type { z } from "zod";
import type { listPublikasiQuerySchema, upsertPublikasiSchema } from "../publikasi.schema.js";

export type UpsertPublikasiDto = z.infer<typeof upsertPublikasiSchema>;
export type ListPublikasiQueryDto = z.infer<typeof listPublikasiQuerySchema>;

export interface PublikasiColumnDto {
  id: string;
  label: string;
  tahunMulai: number;
  tahunSelesai: number;
}

export interface PublikasiCellDto {
  publikasi_id: string | null;
  tahun_akademik_id: string;
  kategori_publikasi_id: string;
  total_publikasi: number;
}

export interface PublikasiRowDto {
  id: string;
  nama_kategori: string;
  values: PublikasiCellDto[];
}

export interface PublikasiListDataDto {
  columns: PublikasiColumnDto[];
  rows: PublikasiRowDto[];
}

export interface PublikasiListMetaDto {
  filters: {
    tahun_mulai: number | null;
    tahun_selesai: number | null;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PublikasiUpsertResponseDto {
  id: string;
  tahun: {
    id: string;
    label: string;
  } | null;
  kategori: {
    id: string;
    nama: string;
  } | null;
  total: number;
}
