import { Berita } from "../berita/berita.model.js";
import { Pengumuman } from "../pengumuman/pengumuman.model.js";
import { Panduan } from "../panduan/panduan.model.js";
import { buildSimpleMeta, normalizeSimplePagination } from "../../core/content/legacy-content.js";
import { HttpError } from "../../core/errors/http-error.js";
import type { SimplePaginationMeta } from "../../core/master-data/pagination.js";
import type { publicPageListQuerySchema } from "./publicpage.schema.js";
import type { z } from "zod";

type PublicPageListQuery = z.infer<typeof publicPageListQuerySchema>;

/**
 * Public page responses intentionally omit `deleted_at` to match the legacy
 * publicpage serializer contract, which never exposed soft-delete metadata.
 */
interface PublicBeritaResponse {
  id: string;
  slug: string;
  judul: string;
  isi_berita: string;
  photo_url: string | null;
  file_url: string | null;
  kategori: string;
  tanggal_rilis: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PublicPengumumanResponse {
  id: string;
  slug: string;
  judul: string;
  isi_pengumuman: string;
  gambar: string | null;
  file_lampiran: string | null;
  tanggal_rilis: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PublicPanduanResponse {
  id: string;
  judul: string;
  isi_panduan: string;
  thumbnail: string | null;
  file_url: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function toPublicBerita(row: Berita): PublicBeritaResponse {
  return {
    id: row.id,
    slug: row.slug,
    judul: row.judul,
    isi_berita: row.isi_berita,
    photo_url: row.photo_url,
    file_url: row.file_url,
    kategori: row.kategori,
    tanggal_rilis: row.tanggal_rilis,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toPublicPengumuman(row: Pengumuman): PublicPengumumanResponse {
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
  };
}

function toPublicPanduan(row: Panduan): PublicPanduanResponse {
  return {
    id: row.id,
    judul: row.judul,
    isi_panduan: row.isi_panduan,
    thumbnail: row.thumbnail,
    file_url: row.file_url,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PublicpageService {
  async listBerita(
    query: PublicPageListQuery,
  ): Promise<{ rows: PublicBeritaResponse[]; meta: SimplePaginationMeta }> {
    const pagination = normalizeSimplePagination(query, 10, 50);
    const where =
      query.kategori && query.kategori !== "Semua" ? { kategori: query.kategori } : {};
    const { count, rows } = await Berita.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: pagination.limit,
      offset: pagination.offset,
    });

    return {
      rows: rows.map((row) => toPublicBerita(row)),
      meta: buildSimpleMeta(pagination.page, pagination.limit, count),
    };
  }

  async getBeritaBySlug(slug: string): Promise<PublicBeritaResponse> {
    const berita = await Berita.findOne({ where: { slug } });
    if (!berita) throw HttpError.notFound("Berita tidak ditemukan");
    return toPublicBerita(berita);
  }

  async listPengumuman(
    query: PublicPageListQuery,
  ): Promise<{ rows: PublicPengumumanResponse[]; meta: SimplePaginationMeta }> {
    const pagination = normalizeSimplePagination(query, 10, 50);
    const { count, rows } = await Pengumuman.findAndCountAll({
      order: [["createdAt", "DESC"]],
      limit: pagination.limit,
      offset: pagination.offset,
    });

    return {
      rows: rows.map((row) => toPublicPengumuman(row)),
      meta: buildSimpleMeta(pagination.page, pagination.limit, count),
    };
  }

  async getPengumumanBySlug(slug: string): Promise<PublicPengumumanResponse> {
    const pengumuman = await Pengumuman.findOne({ where: { slug } });
    if (!pengumuman) throw HttpError.notFound("Pengumuman tidak ditemukan");
    return toPublicPengumuman(pengumuman);
  }

  async listPanduan(
    query: PublicPageListQuery,
  ): Promise<{ rows: PublicPanduanResponse[]; meta: SimplePaginationMeta }> {
    const pagination = normalizeSimplePagination(query, 10, 50);
    const { count, rows } = await Panduan.findAndCountAll({
      order: [["createdAt", "DESC"]],
      limit: pagination.limit,
      offset: pagination.offset,
    });

    return {
      rows: rows.map((row) => toPublicPanduan(row)),
      meta: buildSimpleMeta(pagination.page, pagination.limit, count),
    };
  }

  async getPanduanById(id: string): Promise<PublicPanduanResponse> {
    const panduan = await Panduan.findByPk(id);
    if (!panduan) throw HttpError.notFound("Panduan tidak ditemukan");
    return toPublicPanduan(panduan);
  }
}

