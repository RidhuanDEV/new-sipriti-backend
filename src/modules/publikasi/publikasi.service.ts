import { Op } from "sequelize";
import { sequelize } from "../../config/database.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { PUBLIKASI_MODULE } from "../../constants/modules.constants.js";
import { auditService } from "../../core/audit/audit.service.js";
import { buildSimpleMeta, normalizeSimplePagination } from "../../core/content/legacy-content.js";
import { HttpError } from "../../core/errors/http-error.js";
import { KategoriPublikasi } from "../kategoripublikasi/kategoripublikasi.model.js";
import { TahunAkademik } from "../tahunakademik/tahunakademik.model.js";
import { Publikasi } from "./publikasi.model.js";
import type { WhereOptions } from "sequelize";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type { KategoriPublikasi as KategoriPublikasiModel } from "../kategoripublikasi/kategoripublikasi.model.js";
import type { TahunAkademik as TahunAkademikModel } from "../tahunakademik/tahunakademik.model.js";
import type { ListPublikasiQueryDto, PublikasiListDataDto, PublikasiListMetaDto, PublikasiUpsertResponseDto, UpsertPublikasiDto } from "./dto/publikasi.dto.js";

interface PublikasiMapValue {
  id: string;
  totalPublikasi: number;
}

function buildTahunWhere(query: ListPublikasiQueryDto): WhereOptions<TahunAkademikModel> {
  const where: WhereOptions<TahunAkademikModel> = {};
  if (query.tahun_mulai !== undefined && query.tahun_selesai !== undefined) {
    if (query.tahun_mulai > query.tahun_selesai) throw HttpError.badRequest("Filter tahun tidak valid");
    where.tahunMulai = { [Op.between]: [query.tahun_mulai, query.tahun_selesai] };
  } else if (query.tahun_mulai !== undefined) {
    where.tahunMulai = { [Op.gte]: query.tahun_mulai };
  } else if (query.tahun_selesai !== undefined) {
    where.tahunMulai = { [Op.lte]: query.tahun_selesai };
  }
  return where;
}

function buildKategoriWhere(query: ListPublikasiQueryDto): WhereOptions<KategoriPublikasiModel> {
  const search = query.q?.trim() || query.search?.trim();
  if (!search) return {};
  return { namaKategori: { [Op.like]: `%${search}%` } };
}

export class PublikasiService {
  async listPublikasi(
    query: ListPublikasiQueryDto,
  ): Promise<{ data: PublikasiListDataDto; meta: PublikasiListMetaDto }> {
    const tahunWhere = buildTahunWhere(query);
    const kategoriWhere = buildKategoriWhere(query);
    const pagination = normalizeSimplePagination(query, 10, 5000);

    const [tahunAkademikList, kategoriResult] = await Promise.all([
      TahunAkademik.findAll({
        where: tahunWhere,
        order: [["tahunMulai", "ASC"]],
        attributes: ["id", "tahunMulai", "tahunSelesai"],
      }),
      KategoriPublikasi.findAndCountAll({
        where: kategoriWhere,
        order: [["namaKategori", "ASC"]],
        attributes: ["id", "namaKategori"],
        limit: pagination.limit,
        offset: pagination.offset,
      }),
    ]);

    const columns = tahunAkademikList.map((tahun) => ({
      id: tahun.id,
      label: `${tahun.tahunMulai}-${tahun.tahunSelesai}`,
      tahunMulai: tahun.tahunMulai,
      tahunSelesai: tahun.tahunSelesai,
    }));
    const tahunIds = tahunAkademikList.map((tahun) => tahun.id);
    const kategoriIds = kategoriResult.rows.map((kategori) => kategori.id);
    const publikasiRows =
      tahunIds.length > 0 && kategoriIds.length > 0
        ? await Publikasi.findAll({
            where: {
              tahunAkademikId: { [Op.in]: tahunIds },
              kategoriPublikasiId: { [Op.in]: kategoriIds },
            },
            attributes: ["id", "tahunAkademikId", "kategoriPublikasiId", "totalPublikasi"],
          })
        : [];

    const publikasiMap = new Map<string, PublikasiMapValue>();
    for (const publikasi of publikasiRows) {
      publikasiMap.set(`${publikasi.kategoriPublikasiId}:${publikasi.tahunAkademikId}`, {
        id: publikasi.id,
        totalPublikasi: publikasi.totalPublikasi,
      });
    }

    const rows = kategoriResult.rows.map((kategori) => ({
      id: kategori.id,
      nama_kategori: kategori.namaKategori,
      values: columns.map((column) => {
        const existing = publikasiMap.get(`${kategori.id}:${column.id}`);
        return {
          publikasi_id: existing?.id ?? null,
          tahun_akademik_id: column.id,
          kategori_publikasi_id: kategori.id,
          total_publikasi: existing?.totalPublikasi ?? 0,
        };
      }),
    }));

    return {
      data: { columns, rows },
      meta: {
        filters: {
          tahun_mulai: query.tahun_mulai ?? null,
          tahun_selesai: query.tahun_selesai ?? null,
        },
        pagination: buildSimpleMeta(pagination.page, pagination.limit, kategoriResult.count),
      },
    };
  }

  async upsertPublikasi(
    data: UpsertPublikasiDto,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<PublikasiUpsertResponseDto> {
    const [tahun, kategori] = await Promise.all([
      TahunAkademik.findByPk(data.tahun_akademik_id),
      KategoriPublikasi.findByPk(data.kategori_publikasi_id),
    ]);
    if (!tahun) throw HttpError.notFound("Tahun akademik tidak ditemukan");
    if (!kategori) throw HttpError.notFound("Kategori publikasi tidak ditemukan");

    let publikasi = await Publikasi.findOne({
      where: {
        tahunAkademikId: data.tahun_akademik_id,
        kategoriPublikasiId: data.kategori_publikasi_id,
      },
    });
    const action = publikasi ? AuditAction.UPDATE : AuditAction.CREATE;

    if (publikasi) {
      await sequelize.transaction((trx) => publikasi!.update({ totalPublikasi: data.total_publikasi }, { transaction: trx }));
    } else {
      publikasi = await sequelize.transaction((trx) =>
        Publikasi.create(
          {
            tahunAkademikId: data.tahun_akademik_id,
            kategoriPublikasiId: data.kategori_publikasi_id,
            totalPublikasi: data.total_publikasi,
            publikasi_ilmiah_description: null,
          },
          { transaction: trx },
        ),
      );
    }

    const response = toPublikasiUpsertResponse(publikasi, tahun, kategori);
    auditService.persistNonBlocking({
      action,
      module: PUBLIKASI_MODULE,
      entityId: publikasi.id,
      userId: user.id,
      after: response,
      requestId,
    });
    return response;
  }
}

function toPublikasiUpsertResponse(
  publikasi: Publikasi,
  tahun: TahunAkademik,
  kategori: KategoriPublikasi,
): PublikasiUpsertResponseDto {
  return {
    id: publikasi.id,
    tahun: {
      id: tahun.id,
      label: `${tahun.tahunMulai}-${tahun.tahunSelesai}`,
    },
    kategori: {
      id: kategori.id,
      nama: kategori.namaKategori,
    },
    total: publikasi.totalPublikasi,
  };
}
