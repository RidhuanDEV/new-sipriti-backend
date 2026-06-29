import { Op } from "sequelize";
import { sequelize } from "../../config/database.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { MITRA_KERJA_RISET_MODULE } from "../../constants/modules.constants.js";
import { auditService } from "../../core/audit/audit.service.js";
import { buildSimpleMeta, normalizeSimplePagination } from "../../core/content/legacy-content.js";
import { HttpError } from "../../core/errors/http-error.js";
import { MitraKerjaRiset } from "./mitrakerjariset.model.js";
import { toMitraKerjaRisetResponse } from "./mappers/mitrakerjariset.mapper.js";
import type { WhereOptions } from "sequelize";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type { SimplePaginationMeta } from "../../core/master-data/pagination.js";
import type { CreateMitraKerjaRisetDto, ListMitraKerjaRisetQueryDto, MitraKerjaRisetResponseDto, UpdateMitraKerjaRisetDto } from "./dto/mitrakerjariset.dto.js";

function buildSearchWhere(query: ListMitraKerjaRisetQueryDto): WhereOptions<MitraKerjaRiset> {
  const search = query.search?.trim() || query.q?.trim();
  if (!search) return {};
  return { nama_mitra: { [Op.like]: `%${search}%` } };
}

async function findDuplicate(name: string, excludeId?: string): Promise<MitraKerjaRiset | null> {
  const where: WhereOptions<MitraKerjaRiset> = {
    nama_mitra: { [Op.like]: name },
  };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  return MitraKerjaRiset.findOne({ where });
}

export class MitraKerjaRisetService {
  async listMitraKerjaRiset(
    query: ListMitraKerjaRisetQueryDto,
  ): Promise<{ rows: MitraKerjaRisetResponseDto[]; meta: SimplePaginationMeta }> {
    const pagination = normalizeSimplePagination(query, 10, 200);
    const { rows, count } = await MitraKerjaRiset.findAndCountAll({
      where: buildSearchWhere(query),
      order: [["createdAt", "DESC"]],
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return {
      rows: rows.map((row) => toMitraKerjaRisetResponse(row)),
      meta: buildSimpleMeta(pagination.page, pagination.limit, count),
    };
  }

  async getAllMitraKerjaRiset(): Promise<MitraKerjaRisetResponseDto[]> {
    const rows = await MitraKerjaRiset.findAll({ order: [["nama_mitra", "ASC"]] });
    return rows.map((row) => toMitraKerjaRisetResponse(row));
  }

  async getMitraKerjaRisetById(id: string): Promise<MitraKerjaRisetResponseDto> {
    const row = await MitraKerjaRiset.findByPk(id);
    if (!row) throw HttpError.notFound("Mitra kerja riset tidak ditemukan");
    return toMitraKerjaRisetResponse(row);
  }

  async createMitraKerjaRiset(
    data: CreateMitraKerjaRisetDto,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<MitraKerjaRisetResponseDto> {
    const name = data.nama_mitra.trim();
    if (await findDuplicate(name)) throw HttpError.badRequest("Mitra kerja riset dengan nama tersebut sudah ada");
    const created = await sequelize.transaction((trx) =>
      MitraKerjaRiset.create(
        {
          nama_mitra: name,
          mitra_description: data.mitra_description ?? null,
        },
        { transaction: trx },
      ),
    );
    const response = toMitraKerjaRisetResponse(created);
    auditService.persistNonBlocking({ action: AuditAction.CREATE, module: MITRA_KERJA_RISET_MODULE, entityId: created.id, userId: user.id, after: response, requestId });
    return response;
  }

  async updateMitraKerjaRiset(
    id: string,
    data: UpdateMitraKerjaRisetDto,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<MitraKerjaRisetResponseDto> {
    const row = await MitraKerjaRiset.findByPk(id);
    if (!row) throw HttpError.notFound("Mitra kerja riset tidak ditemukan");
    if (data.nama_mitra !== undefined && (await findDuplicate(data.nama_mitra.trim(), id))) {
      throw HttpError.badRequest("Mitra kerja riset dengan nama tersebut sudah ada");
    }

    const before = toMitraKerjaRisetResponse(row);
    await sequelize.transaction((trx) =>
      row.update(
        {
          nama_mitra: data.nama_mitra !== undefined ? data.nama_mitra.trim() : row.nama_mitra,
          mitra_description: data.mitra_description !== undefined ? data.mitra_description : row.mitra_description,
        },
        { transaction: trx },
      ),
    );
    const response = toMitraKerjaRisetResponse(row);
    auditService.persistNonBlocking({ action: AuditAction.UPDATE, module: MITRA_KERJA_RISET_MODULE, entityId: row.id, userId: user.id, before, after: response, requestId });
    return response;
  }

  async deleteMitraKerjaRiset(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<void> {
    const row = await MitraKerjaRiset.findByPk(id);
    if (!row) throw HttpError.notFound("Mitra kerja riset tidak ditemukan");
    const before = toMitraKerjaRisetResponse(row);
    await sequelize.transaction((trx) => row.destroy({ transaction: trx }));
    auditService.persistNonBlocking({ action: AuditAction.DELETE, module: MITRA_KERJA_RISET_MODULE, entityId: before.id, userId: user.id, before, requestId });
  }
}
