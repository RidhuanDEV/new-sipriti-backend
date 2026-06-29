import { sequelize } from "../../config/database.js";
import { auditService } from "../../core/audit/audit.service.js";
import { countRowsByColumn } from "../../core/database/table-introspection.js";
import { buildLegacyPaginationMeta, normalizePagination } from "../../core/master-data/pagination.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { SKEMA_MODULE } from "../../constants/modules.constants.js";
import { HttpError } from "../../core/errors/http-error.js";
import { SkemaRepository } from "./skema.repository.js";
import { toSkemaOption, toSkemaResponse, toSkemaResponseList } from "./mappers/skema.mapper.js";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type { LegacyPaginationMeta } from "../../core/master-data/pagination.js";
import type { CreateSkemaDto, ListSkemaQueryDto, SkemaOptionDto, SkemaOptionsQueryDto, SkemaResponseDto, UpdateSkemaDto } from "./dto/skema.dto.js";

const repository = new SkemaRepository();

export class SkemaService {
  async findAll(query: ListSkemaQueryDto): Promise<{ rows: SkemaResponseDto[]; meta: LegacyPaginationMeta }> {
    const pagination = normalizePagination(query);
    const { rows, count } = await repository.findAndCount(query, pagination);
    return { rows: toSkemaResponseList(rows), meta: buildLegacyPaginationMeta(pagination.page, pagination.limit, count) };
  }

  async findById(id: string): Promise<SkemaResponseDto> {
    const skema = await repository.findById(id);
    if (!skema) throw HttpError.notFound("Skema tidak ditemukan");
    return toSkemaResponse(skema);
  }

  async create(data: CreateSkemaDto, user: AuthenticatedUserContext, requestId?: string): Promise<SkemaResponseDto> {
    const existing = await repository.findByName(data.nama_skema);
    if (existing) throw HttpError.conflict(`Nama skema '${data.nama_skema}' sudah terdaftar`);
    const created = await sequelize.transaction((trx) => repository.create(data, trx));
    auditService.persistNonBlocking({ action: AuditAction.CREATE, module: SKEMA_MODULE, entityId: created.id, userId: user.id, after: toSkemaResponse(created), requestId });
    return toSkemaResponse(created);
  }

  async update(id: string, data: UpdateSkemaDto, user: AuthenticatedUserContext, requestId?: string): Promise<SkemaResponseDto> {
    const skema = await repository.findById(id);
    if (!skema) throw HttpError.notFound("Skema tidak ditemukan");
    if (data.nama_skema && data.nama_skema !== skema.namaSkema) {
      const existing = await repository.findByName(data.nama_skema, id);
      if (existing) throw HttpError.conflict(`Nama skema '${data.nama_skema}' sudah terdaftar`);
    }
    const before = toSkemaResponse(skema);
    const updated = await sequelize.transaction((trx) => repository.update(skema, data, trx));
    auditService.persistNonBlocking({ action: AuditAction.UPDATE, module: SKEMA_MODULE, entityId: updated.id, userId: user.id, before, after: toSkemaResponse(updated), requestId });
    return toSkemaResponse(updated);
  }

  async delete(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<void> {
    const skema = await repository.findById(id);
    if (!skema) throw HttpError.notFound("Skema tidak ditemukan");
    const proposalsWithSkema = await countRowsByColumn("hakiproposals", "skema_id", id);
    if (proposalsWithSkema > 0) {
      throw HttpError.badRequest(`Tidak dapat menghapus skema. Terdapat ${proposalsWithSkema} usulan yang terkait.`);
    }
    const before = toSkemaResponse(skema);
    await sequelize.transaction((trx) => repository.delete(skema, trx));
    auditService.persistNonBlocking({ action: AuditAction.DELETE, module: SKEMA_MODULE, entityId: skema.id, userId: user.id, before, requestId });
  }

  async findOptions(query: SkemaOptionsQueryDto): Promise<SkemaOptionDto[]> {
    return (await repository.findOptions(query)).map((skema) => toSkemaOption(skema));
  }

  async restore(
    id: string,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<SkemaResponseDto> {
    const skema = await repository.findByIdWithDeleted(id);
    if (!skema) throw HttpError.notFound("Skema tidak ditemukan");
    if (!skema.deletedAt) {
      throw HttpError.badRequest("Skema tidak dalam status terhapus");
    }
    await sequelize.transaction((trx) => repository.restore(skema, trx));

    const after = toSkemaResponse(skema);
    auditService.persistNonBlocking({
      action: AuditAction.RESTORE,
      module: SKEMA_MODULE,
      entityId: skema.id,
      userId: user.id,
      after,
      requestId,
    });

    return after;
  }
}
