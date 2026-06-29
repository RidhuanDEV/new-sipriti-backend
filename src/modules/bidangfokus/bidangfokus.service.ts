import { sequelize } from "../../config/database.js";
import { auditService } from "../../core/audit/audit.service.js";
import { buildLegacyPaginationMeta, normalizePagination } from "../../core/master-data/pagination.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { BIDANG_FOKUS_MODULE } from "../../constants/modules.constants.js";
import { HttpError } from "../../core/errors/http-error.js";
import { BidangFokusRepository } from "./bidangfokus.repository.js";
import { toBidangFokusOption, toBidangFokusResponse } from "./mappers/bidangfokus.mapper.js";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type { LegacyPaginationMeta } from "../../core/master-data/pagination.js";
import type { BidangFokusOptionDto, BidangFokusResponseDto, CreateBidangFokusDto, ListBidangFokusQueryDto, UpdateBidangFokusDto } from "./dto/bidangfokus.dto.js";

const repository = new BidangFokusRepository();

export class BidangFokusService {
  async findAll(query: ListBidangFokusQueryDto): Promise<{ rows: BidangFokusResponseDto[]; meta: LegacyPaginationMeta }> {
    const pagination = normalizePagination(query);
    const { rows, count } = await repository.findAndCount(query, pagination);
    return { rows: rows.map((row) => toBidangFokusResponse(row)), meta: buildLegacyPaginationMeta(pagination.page, pagination.limit, count) };
  }

  async findById(id: string): Promise<BidangFokusResponseDto> {
    const bidangFokus = await repository.findById(id);
    if (!bidangFokus) throw HttpError.notFound("Bidang fokus tidak ditemukan");
    return toBidangFokusResponse(bidangFokus);
  }

  async create(data: CreateBidangFokusDto, user: AuthenticatedUserContext, requestId?: string): Promise<BidangFokusResponseDto> {
    const existing = await repository.findByName(data.nama_bidang);
    if (existing) throw HttpError.conflict("Bidang fokus dengan nama ini sudah ada");
    const created = await sequelize.transaction((trx) => repository.create(data, trx));
    auditService.persistNonBlocking({ action: AuditAction.CREATE, module: BIDANG_FOKUS_MODULE, entityId: created.id, userId: user.id, after: toBidangFokusResponse(created), requestId });
    return toBidangFokusResponse(created);
  }

  async update(id: string, data: UpdateBidangFokusDto, user: AuthenticatedUserContext, requestId?: string): Promise<BidangFokusResponseDto> {
    const bidangFokus = await repository.findById(id);
    if (!bidangFokus) throw HttpError.notFound("Bidang fokus tidak ditemukan");
    if (data.nama_bidang) {
      const existing = await repository.findByName(data.nama_bidang, id);
      if (existing) throw HttpError.conflict("Bidang fokus dengan nama ini sudah ada");
    }
    const before = toBidangFokusResponse(bidangFokus);
    const updated = await sequelize.transaction((trx) => repository.update(bidangFokus, data, trx));
    auditService.persistNonBlocking({ action: AuditAction.UPDATE, module: BIDANG_FOKUS_MODULE, entityId: updated.id, userId: user.id, before, after: toBidangFokusResponse(updated), requestId });
    return toBidangFokusResponse(updated);
  }

  async delete(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<void> {
    const bidangFokus = await repository.findById(id);
    if (!bidangFokus) throw HttpError.notFound("Bidang fokus tidak ditemukan");
    const before = toBidangFokusResponse(bidangFokus);
    await sequelize.transaction((trx) => repository.delete(bidangFokus, trx));
    auditService.persistNonBlocking({ action: AuditAction.DELETE, module: BIDANG_FOKUS_MODULE, entityId: bidangFokus.id, userId: user.id, before, requestId });
  }

  async findOptions(): Promise<BidangFokusOptionDto[]> {
    return (await repository.findOptions()).map((row) => toBidangFokusOption(row));
  }

  async restore(
    id: string,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<BidangFokusResponseDto> {
    const bidangFokus = await repository.findByIdWithDeleted(id);
    if (!bidangFokus) throw HttpError.notFound("Bidang fokus tidak ditemukan");
    if (!bidangFokus.deletedAt) {
      throw HttpError.badRequest("Bidang fokus tidak dalam status terhapus");
    }
    await sequelize.transaction((trx) => repository.restore(bidangFokus, trx));

    const after = toBidangFokusResponse(bidangFokus);
    auditService.persistNonBlocking({
      action: AuditAction.RESTORE,
      module: BIDANG_FOKUS_MODULE,
      entityId: bidangFokus.id,
      userId: user.id,
      after,
      requestId,
    });

    return after;
  }
}
