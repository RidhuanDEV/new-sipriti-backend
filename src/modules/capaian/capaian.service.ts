import { QueryTypes, Sequelize } from "sequelize";
import { sequelize } from "../../config/database.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { CAPAIAN_MODULE } from "../../constants/modules.constants.js";
import { auditService } from "../../core/audit/audit.service.js";
import { HttpError } from "../../core/errors/http-error.js";
import { DeskripsiCapaian, DESKRIPSI_CAPAIAN_SECTION_KEYS } from "./deskripsicapaian.model.js";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type { CapaianRangeQueryDto, CapaianStatsDto, DeskripsiCapaianDto, DeskripsiCapaianSectionKeyDto, PublikasiPivotDto, StaticContentDto, StaticContentSectionDto, TotalCountDto, TotalDanaHibahDto, TotalHkiDto, TotalPublikasiDto, UpsertDeskripsiDto } from "./dto/capaian.dto.js";
import { HKI } from "../hki/hki.model.js";

interface TahunRow {
  id: string;
  tahunMulai: number;
  tahunSelesai: number;
}

interface PublikasiRow {
  tahunAkademikId: string;
  totalPublikasi: number;
  namaKategori: string | null;
}

interface SumCountRow {
  totalDana?: string | number | null;
  totalCount?: string | number | null;
}

interface TotalRow {
  total?: string | number | null;
}

interface BreakdownRow {
  namaKategori: string | null;
  totalPublikasi: string | number | null;
}

const emptySection = { description: "" };

function formatRupiah(amount: number): string {
  if (!amount || Number.isNaN(amount)) return "Rp0";
  return `Rp${amount.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function toNumber(value: string | number | null | undefined): number {
  if (value === undefined || value === null) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildYearFilter(query: CapaianRangeQueryDto): {
  clause: string;
  replacements: Record<string, number>;
  valid: boolean;
  limit: number;
} {
  if (query.tahun_mulai !== undefined && query.tahun_selesai !== undefined && query.tahun_mulai > query.tahun_selesai) {
    return { clause: "WHERE 1 = 0", replacements: {}, valid: false, limit: query.limit_tahun ?? 5 };
  }

  const clauses: string[] = [];
  const replacements: Record<string, number> = {};
  if (query.tahun_mulai !== undefined) {
    clauses.push("tahun_mulai >= :tahunMulai");
    replacements.tahunMulai = query.tahun_mulai;
  }
  if (query.tahun_selesai !== undefined) {
    clauses.push("tahun_mulai <= :tahunSelesai");
    replacements.tahunSelesai = query.tahun_selesai;
  }
  return {
    clause: clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "",
    replacements,
    valid: true,
    limit: query.limit_tahun ?? 5,
  };
}

function toDeskripsiDto(row: DeskripsiCapaian): DeskripsiCapaianDto {
  return {
    id: row.id,
    section_key: row.section_key,
    content: row.content,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function getDeskripsiContent(data: UpsertDeskripsiDto): string | null {
  return data.content ?? data.deskripsi ?? null;
}

export class CapaianService {
  async getPublikasiPivot(query: CapaianRangeQueryDto): Promise<PublikasiPivotDto> {
    const filter = buildYearFilter(query);
    const tahunRowsDesc = await sequelize.query<TahunRow>(
      `SELECT id, tahun_mulai AS tahunMulai, tahun_selesai AS tahunSelesai FROM tahun_akademik ${filter.clause} ORDER BY tahun_mulai DESC LIMIT :limit`,
      {
        type: QueryTypes.SELECT,
        replacements: { ...filter.replacements, limit: Math.max(1, Math.min(filter.limit, 20)) },
      },
    );

    const activeTahun = [...tahunRowsDesc].sort((left, right) => left.tahunMulai - right.tahunMulai);
    const headerTahun = activeTahun.map((tahun) => `${tahun.tahunMulai}-${tahun.tahunSelesai}`);
    if (activeTahun.length === 0 || !filter.valid) return { headerTahun, dataTabel: [] };

    const publikasiRows = await sequelize.query<PublikasiRow>(
      `SELECT p.tahun_akademik_id AS tahunAkademikId, p.total_publikasi AS totalPublikasi, k.nama_kategori AS namaKategori
       FROM publikasi p
       LEFT JOIN kategori_publikasi k ON k.id = p.kategori_publikasi_id
       WHERE p.tahun_akademik_id IN (:tahunIds)`,
      {
        type: QueryTypes.SELECT,
        replacements: { tahunIds: activeTahun.map((tahun) => tahun.id) },
      },
    );

    const tahunLabelById = new Map(activeTahun.map((tahun) => [tahun.id, `${tahun.tahunMulai}-${tahun.tahunSelesai}`]));
    const kategoriMap = new Map<string, { kategori: string; skor_per_tahun: Record<string, number> }>();
    for (const publikasi of publikasiRows) {
      const kategori = publikasi.namaKategori || "Tidak diketahui";
      const tahunLabel = tahunLabelById.get(publikasi.tahunAkademikId);
      if (!tahunLabel) continue;
      const existing = kategoriMap.get(kategori) ?? { kategori, skor_per_tahun: {} };
      existing.skor_per_tahun[tahunLabel] = toNumber(publikasi.totalPublikasi);
      kategoriMap.set(kategori, existing);
    }

    const dataTabel = Array.from(kategoriMap.values()).map((row) => {
      for (const tahunLabel of headerTahun) {
        row.skor_per_tahun[tahunLabel] = row.skor_per_tahun[tahunLabel] ?? 0;
      }
      return row;
    });

    return { headerTahun, dataTabel };
  }

  async getCapaianStats(): Promise<CapaianStatsDto> {
    const [danaRows, publikasiRows, totalMitraRiset, totalHibah, totalHki] = await Promise.all([
      sequelize.query<SumCountRow>("SELECT SUM(dana_hibah) AS totalDana FROM hibahinternal", { type: QueryTypes.SELECT }),
      sequelize.query<TotalRow>("SELECT SUM(total_publikasi) AS total FROM publikasi", { type: QueryTypes.SELECT }),
      sequelize.query<TotalRow>("SELECT COUNT(id) AS total FROM mitra_kerja_riset", { type: QueryTypes.SELECT }),
      sequelize.query<TotalRow>("SELECT COUNT(id) AS total FROM hibahinternal", { type: QueryTypes.SELECT }),
      HKI.count(),
    ]);
    const totalDanaHibah = toNumber(danaRows[0]?.totalDana);
    return {
      total_dana_hibah: totalDanaHibah,
      total_dana_hibah_formatted: formatRupiah(totalDanaHibah),
      total_mitra_riset: toNumber(totalMitraRiset[0]?.total),
      total_hki: totalHki,
      total_publikasi: toNumber(publikasiRows[0]?.total),
      total_hibah: toNumber(totalHibah[0]?.total),
    };
  }

  async getTotalDanaHibah(): Promise<TotalDanaHibahDto> {
    const rows = await sequelize.query<SumCountRow>(
      "SELECT SUM(dana_hibah) AS totalDana, COUNT(id) AS totalCount FROM hibahinternal",
      { type: QueryTypes.SELECT },
    );
    const totalDana = toNumber(rows[0]?.totalDana);
    return {
      total_dana: totalDana,
      total_dana_formatted: formatRupiah(totalDana),
      total_count: toNumber(rows[0]?.totalCount),
    };
  }

  async getTotalMitraRiset(): Promise<TotalCountDto> {
    const rows = await sequelize.query<TotalRow>("SELECT COUNT(id) AS total FROM mitra_kerja_riset", { type: QueryTypes.SELECT });
    return { total: toNumber(rows[0]?.total) };
  }

  async getTotalHki(): Promise<TotalHkiDto> {
    const [byStatus, total] = await Promise.all([
      HKI.findAll({
        attributes: [
          "status",
          [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
        ],
        group: ["status"],
        raw: true,
      }) as unknown as Promise<Array<{ status: string; count: number }>>,
      HKI.count(),
    ]);

    return { total, by_status: byStatus };
  }

  async getTotalPublikasi(query: CapaianRangeQueryDto): Promise<TotalPublikasiDto> {
    const filter = buildYearFilter(query);
    const joinClause = filter.clause ? `INNER JOIN tahun_akademik t ON t.id = p.tahun_akademik_id ${filter.clause.replace("WHERE", "AND")}` : "";
    const [totalRows, breakdownRows] = await Promise.all([
      sequelize.query<TotalRow>(
        `SELECT SUM(p.total_publikasi) AS total FROM publikasi p ${joinClause}`,
        { type: QueryTypes.SELECT, replacements: filter.replacements },
      ),
      sequelize.query<BreakdownRow>(
        `SELECT k.nama_kategori AS namaKategori, SUM(p.total_publikasi) AS totalPublikasi
         FROM publikasi p
         INNER JOIN kategori_publikasi k ON k.id = p.kategori_publikasi_id
         ${joinClause}
         GROUP BY k.nama_kategori`,
        { type: QueryTypes.SELECT, replacements: filter.replacements },
      ),
    ]);

    return {
      total: toNumber(totalRows[0]?.total),
      breakdown: breakdownRows.map((row) => ({
        namaKategori: row.namaKategori,
        totalPublikasi: toNumber(row.totalPublikasi),
      })),
    };
  }

  async getStaticContent(): Promise<StaticContentDto> {
    const rows = await DeskripsiCapaian.findAll();
    const dbMap = new Map<DeskripsiCapaianSectionKeyDto, StaticContentSectionDto>();
    for (const row of rows) {
      dbMap.set(row.section_key, { description: row.content || "" });
    }
    return {
      banner_carousel: ["/assets/seminar_penelitian.webp"],
      tentang_prpm: dbMap.get("tentang_prpm") ?? emptySection,
      publikasi_ilmiah: dbMap.get("publikasi_ilmiah") ?? emptySection,
      hki_paten: { ...(dbMap.get("hki_paten") ?? emptySection), list: [] },
      pengalaman_riset: dbMap.get("pengalaman_riset") ?? emptySection,
      penghargaan_riset: { ...(dbMap.get("penghargaan_riset") ?? emptySection), image: "" },
      produk_riset: { ...(dbMap.get("produk_riset") ?? emptySection), list: [] },
      sertifikasi_mutu: dbMap.get("sertifikasi_mutu") ?? emptySection,
    };
  }

  async getAllDeskripsi(): Promise<DeskripsiCapaianDto[]> {
    const rows = await DeskripsiCapaian.findAll({ order: [["section_key", "ASC"]] });
    return rows.map((row) => toDeskripsiDto(row));
  }

  async getDeskripsiBySection(sectionKey: DeskripsiCapaianSectionKeyDto): Promise<DeskripsiCapaianDto> {
    const row = await DeskripsiCapaian.findOne({ where: { section_key: sectionKey } });
    if (!row) return { id: null, section_key: sectionKey, content: "" };
    return toDeskripsiDto(row);
  }

  async upsertDeskripsi(
    sectionKey: DeskripsiCapaianSectionKeyDto,
    data: UpsertDeskripsiDto,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<{ row: DeskripsiCapaianDto; created: boolean }> {
    const valid = DESKRIPSI_CAPAIAN_SECTION_KEYS.some((key) => key === sectionKey);
    if (!valid) throw HttpError.badRequest(`section_key tidak valid. Harus salah satu: ${DESKRIPSI_CAPAIAN_SECTION_KEYS.join(", ")}`);

    const [row, created] = await sequelize.transaction((trx) =>
      DeskripsiCapaian.upsert(
        {
          section_key: sectionKey,
          content: getDeskripsiContent(data),
        },
        { returning: true, transaction: trx },
      ),
    );
    const wasCreated = created === true;
    const response = toDeskripsiDto(row);
    auditService.persistNonBlocking({ action: wasCreated ? AuditAction.CREATE : AuditAction.UPDATE, module: CAPAIAN_MODULE, entityId: String(response.id ?? sectionKey), userId: user.id, after: response, requestId });
    return { row: response, created: wasCreated };
  }

  async batchUpsertDeskripsi(
    data: { items?: Array<{ section_key: DeskripsiCapaianSectionKeyDto; content?: string | null; deskripsi?: string | null }>; sections?: Array<{ section_key: DeskripsiCapaianSectionKeyDto; content?: string | null; deskripsi?: string | null }> },
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<DeskripsiCapaianDto[]> {
    const sections = data.items ?? data.sections ?? [];
    if (sections.length === 0) throw HttpError.badRequest("Body harus berisi array 'sections' yang tidak kosong");

    const rows = await sequelize.transaction(async (trx) => {
      const results: DeskripsiCapaian[] = [];
      for (const item of sections) {
        const [row] = await DeskripsiCapaian.upsert(
          {
            section_key: item.section_key,
            content: item.content ?? item.deskripsi ?? null,
          },
          { returning: true, transaction: trx },
        );
        results.push(row);
      }
      return results;
    });
    const response = rows.map((row) => toDeskripsiDto(row));
    auditService.persistNonBlocking({ action: AuditAction.UPDATE, module: CAPAIAN_MODULE, entityId: "batch", userId: user.id, after: response, requestId });
    return response;
  }
}
