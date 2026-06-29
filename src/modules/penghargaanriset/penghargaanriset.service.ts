import { sequelize } from "../../config/database.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { PENGHARGAAN_RISET_MODULE } from "../../constants/modules.constants.js";
import { auditService } from "../../core/audit/audit.service.js";
import { buildSimpleMeta, normalizeSimplePagination } from "../../core/content/legacy-content.js";
import { HttpError } from "../../core/errors/http-error.js";
import { PenghargaanRiset } from "./penghargaanriset.model.js";
import { toPenghargaanRisetResponse } from "./mappers/penghargaanriset.mapper.js";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type { SimplePaginationMeta } from "../../core/master-data/pagination.js";
import type { CreatePenghargaanRisetDto, ListPenghargaanRisetQueryDto, PenghargaanRisetResponseDto, UpdatePenghargaanRisetDto } from "./dto/penghargaanriset.dto.js";

export class PenghargaanRisetService {
  async getAllPenghargaanRiset(
    query: ListPenghargaanRisetQueryDto,
  ): Promise<{ rows: PenghargaanRisetResponseDto[]; meta: SimplePaginationMeta }> {
    const pagination = normalizeSimplePagination(query, 10, 200);
    const { rows, count } = await PenghargaanRiset.findAndCountAll({
      order: [["createdAt", "DESC"]],
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return {
      rows: rows.map((row) => toPenghargaanRisetResponse(row)),
      meta: buildSimpleMeta(pagination.page, pagination.limit, count),
    };
  }

  async getAllPenghargaanRisetNoPagination(): Promise<PenghargaanRisetResponseDto[]> {
    const rows = await PenghargaanRiset.findAll({ order: [["createdAt", "DESC"]] });
    return rows.map((row) => toPenghargaanRisetResponse(row));
  }

  async getPenghargaanRiset(id: number): Promise<PenghargaanRisetResponseDto> {
    const row = await PenghargaanRiset.findByPk(id);
    if (!row) throw HttpError.notFound("Penghargaan riset tidak ditemukan");
    return toPenghargaanRisetResponse(row);
  }

  async createPenghargaanRiset(
    data: CreatePenghargaanRisetDto,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<PenghargaanRisetResponseDto> {
    const created = await sequelize.transaction((trx) =>
      PenghargaanRiset.create(
        {
          penghargaan_description: data.penghargaan_description ?? null,
          penghargaan_image: data.penghargaan_image ?? null,
        },
        { transaction: trx },
      ),
    );
    const response = toPenghargaanRisetResponse(created);
    auditService.persistNonBlocking({ action: AuditAction.CREATE, module: PENGHARGAAN_RISET_MODULE, entityId: String(created.id), userId: user.id, after: response, requestId });
    return response;
  }

  async updatePenghargaanRiset(
    id: number,
    data: UpdatePenghargaanRisetDto,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<PenghargaanRisetResponseDto> {
    const row = await PenghargaanRiset.findByPk(id);
    if (!row) throw HttpError.notFound("Penghargaan riset tidak ditemukan");
    const before = toPenghargaanRisetResponse(row);
    await sequelize.transaction((trx) =>
      row.update(
        {
          penghargaan_description: data.penghargaan_description !== undefined ? data.penghargaan_description : row.penghargaan_description,
          penghargaan_image: data.penghargaan_image !== undefined ? data.penghargaan_image : row.penghargaan_image,
        },
        { transaction: trx },
      ),
    );
    const response = toPenghargaanRisetResponse(row);
    auditService.persistNonBlocking({ action: AuditAction.UPDATE, module: PENGHARGAAN_RISET_MODULE, entityId: String(row.id), userId: user.id, before, after: response, requestId });
    return response;
  }

  async deletePenghargaanRiset(id: number, user: AuthenticatedUserContext, requestId?: string): Promise<void> {
    const row = await PenghargaanRiset.findByPk(id);
    if (!row) throw HttpError.notFound("Penghargaan riset tidak ditemukan");
    const before = toPenghargaanRisetResponse(row);
    await sequelize.transaction((trx) => row.destroy({ transaction: trx }));
    auditService.persistNonBlocking({ action: AuditAction.DELETE, module: PENGHARGAAN_RISET_MODULE, entityId: String(before.id), userId: user.id, before, requestId });
  }
}
