import { Op } from "sequelize";
import { sequelize } from "../../config/database.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { HIBAH_INTERNAL_MODULE } from "../../constants/modules.constants.js";
import { auditService } from "../../core/audit/audit.service.js";
import { buildSimpleMeta, normalizeSimplePagination } from "../../core/content/legacy-content.js";
import { HttpError } from "../../core/errors/http-error.js";
import { User } from "../user/user.model.js";
import { HibahInternal } from "./hibahinternal.model.js";
import { UserHibahinternalPair } from "./user-hibahinternal-pair.model.js";
import { normalizeHibahTeamInput, toHibahInternalResponse } from "./mappers/hibahinternal.mapper.js";
import type { WhereOptions } from "sequelize";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type { SimplePaginationMeta } from "../../core/master-data/pagination.js";
import type { CreateHibahInternalDto, HibahInternalResponseDto, ListHibahInternalQueryDto, UpdateHibahInternalDto } from "./dto/hibahinternal.dto.js";

const hibahInclude = [
  {
    model: User,
    as: "users",
    attributes: ["id", "name", "email", "nidn"],
    through: { attributes: [] },
  },
];

function buildSearchWhere(query: ListHibahInternalQueryDto): WhereOptions<HibahInternal> {
  const search = query.search?.trim() || query.q?.trim();
  if (!search) return {};
  const likeValue = `%${search}%`;
  return {
    [Op.or]: [
      { tipe_hibah: { [Op.like]: likeValue } },
      { judul_hibah: { [Op.like]: likeValue } },
      { susunan_tim_hibah: { [Op.like]: likeValue } },
      { tahun_hibah: { [Op.like]: likeValue } },
    ],
  };
}

interface CompleteHibahUpdateData {
  tipe_hibah: string;
  judul_hibah: string;
  susunan_tim_hibah: string | string[];
  tahun_hibah: string | number;
  dana_hibah: number;
  pengalaman_riset_description?: string | null | undefined;
}

function requireCompleteUpdateData(data: UpdateHibahInternalDto): CompleteHibahUpdateData {
  const tipeHibah = data.tipe_hibah;
  const judulHibah = data.judul_hibah;
  const susunanTimHibah = data.susunan_tim_hibah;
  const tahunHibah = data.tahun_hibah;
  const danaHibah = data.dana_hibah;

  if (
    tipeHibah === undefined ||
    judulHibah === undefined ||
    susunanTimHibah === undefined ||
    tahunHibah === undefined ||
    danaHibah === undefined
  ) {
    throw HttpError.badRequest("Tipe Hibah, Judul Hibah, Susunan Tim Hibah, Tahun Hibah, dan Dana Hibah wajib diisi");
  }

  return {
    tipe_hibah: tipeHibah,
    judul_hibah: judulHibah,
    susunan_tim_hibah: susunanTimHibah,
    tahun_hibah: tahunHibah,
    dana_hibah: danaHibah,
    pengalaman_riset_description: data.pengalaman_riset_description,
  };
}

function normalizeTahunHibah(value: string | number): string {
  return String(value).trim();
}

export class HibahInternalService {
  async listHibahInternal(
    query: ListHibahInternalQueryDto,
  ): Promise<{ rows: HibahInternalResponseDto[]; meta: SimplePaginationMeta }> {
    const pagination = normalizeSimplePagination(query, 10, 200);
    const { rows, count } = await HibahInternal.findAndCountAll({
      where: buildSearchWhere(query),
      include: hibahInclude,
      order: [["createdAt", "DESC"]],
      limit: pagination.limit,
      offset: pagination.offset,
      distinct: true,
    });
    return {
      rows: rows.map((row) => toHibahInternalResponse(row)),
      meta: buildSimpleMeta(pagination.page, pagination.limit, count),
    };
  }

  async getHibahInternalById(id: string): Promise<HibahInternalResponseDto> {
    const row = await HibahInternal.findByPk(id, { include: hibahInclude });
    if (!row) throw HttpError.notFound("Hibah internal tidak ditemukan");
    return toHibahInternalResponse(row);
  }

  async createHibahInternal(
    data: CreateHibahInternalDto,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<HibahInternalResponseDto> {
    const team = normalizeHibahTeamInput(data.susunan_tim_hibah);
    if (team.length === 0) throw HttpError.badRequest("Susunan tim hibah harus berupa array");
    const created = await sequelize.transaction((trx) =>
      HibahInternal.create(
        {
          tipe_hibah: data.tipe_hibah.trim(),
          judul_hibah: data.judul_hibah.trim(),
          susunan_tim_hibah: JSON.stringify(team),
          tahun_hibah: normalizeTahunHibah(data.tahun_hibah),
          dana_hibah: String(data.dana_hibah),
          pengalaman_riset_description: data.pengalaman_riset_description ?? null,
        },
        { transaction: trx },
      ),
    );
    const response = toHibahInternalResponse(created);
    auditService.persistNonBlocking({ action: AuditAction.CREATE, module: HIBAH_INTERNAL_MODULE, entityId: created.id, userId: user.id, after: response, requestId });
    return response;
  }

  async updateHibahInternal(
    id: string,
    data: UpdateHibahInternalDto,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<HibahInternalResponseDto> {
    const updateData = requireCompleteUpdateData(data);
    const row = await HibahInternal.findByPk(id);
    if (!row) throw HttpError.notFound("Hibah internal tidak ditemukan");

    const team = normalizeHibahTeamInput(updateData.susunan_tim_hibah);
    if (team.length === 0) throw HttpError.badRequest("Susunan tim hibah harus berupa array");
    const before = toHibahInternalResponse(row);
    await sequelize.transaction((trx) =>
      row.update(
        {
          tipe_hibah: updateData.tipe_hibah.trim(),
          judul_hibah: updateData.judul_hibah.trim(),
          susunan_tim_hibah: JSON.stringify(team),
          tahun_hibah: normalizeTahunHibah(updateData.tahun_hibah),
          dana_hibah: String(updateData.dana_hibah),
          pengalaman_riset_description: updateData.pengalaman_riset_description ?? row.pengalaman_riset_description,
        },
        { transaction: trx },
      ),
    );
    const response = toHibahInternalResponse(row);
    auditService.persistNonBlocking({ action: AuditAction.UPDATE, module: HIBAH_INTERNAL_MODULE, entityId: row.id, userId: user.id, before, after: response, requestId });
    return response;
  }

  async restoreHibahInternal(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<HibahInternalResponseDto> {
    const row = await HibahInternal.findOne({ where: { id }, paranoid: false });
    if (!row) throw HttpError.notFound("Hibah internal tidak ditemukan");
    if (!row.deletedAt) throw HttpError.badRequest("Hibah internal tidak dalam status terhapus");
    await row.restore();
    const response = toHibahInternalResponse(row);
    auditService.persistNonBlocking({ action: AuditAction.RESTORE, module: HIBAH_INTERNAL_MODULE, entityId: row.id, userId: user.id, after: response, requestId });
    return response;
  }

  async deleteHibahInternal(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<void> {
    const row = await HibahInternal.findByPk(id);
    if (!row) throw HttpError.notFound("Hibah internal tidak ditemukan");
    const before = toHibahInternalResponse(row);
    await sequelize.transaction(async (trx) => {
      await UserHibahinternalPair.destroy({ where: { hibah_internal_id: id }, transaction: trx });
      await row.destroy({ transaction: trx });
    });
    auditService.persistNonBlocking({ action: AuditAction.DELETE, module: HIBAH_INTERNAL_MODULE, entityId: before.id, userId: user.id, before, requestId });
  }
}
