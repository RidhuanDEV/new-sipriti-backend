import { sequelize } from "../../config/database.js";
import { auditService } from "../../core/audit/audit.service.js";
import { buildSimplePaginationMeta, normalizePagination } from "../../core/master-data/pagination.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { SERTIFIKAT_MUTU_MODULE } from "../../constants/modules.constants.js";
import { HttpError } from "../../core/errors/http-error.js";
import { SertifikatMutuRepository } from "./sertifikatmutu.repository.js";
import { toSertifikatMutuResponse } from "./mappers/sertifikatmutu.mapper.js";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type { SimplePaginationMeta } from "../../core/master-data/pagination.js";
import type { CreateSertifikatMutuDto, ListSertifikatMutuQueryDto, SertifikatMutuResponseDto, UpdateSertifikatMutuDto } from "./dto/sertifikatmutu.dto.js";

const repository = new SertifikatMutuRepository();

export class SertifikatMutuService {
  async findAll(query: ListSertifikatMutuQueryDto): Promise<{ rows: SertifikatMutuResponseDto[]; meta: SimplePaginationMeta }> {
    const pagination = normalizePagination(query);
    const { rows, count } = await repository.findAndCount(pagination);
    return { rows: rows.map((row) => toSertifikatMutuResponse(row)), meta: buildSimplePaginationMeta(pagination.page, pagination.limit, count) };
  }

  async findAllUnpaginated(): Promise<SertifikatMutuResponseDto[]> {
    return (await repository.findAll()).map((row) => toSertifikatMutuResponse(row));
  }

  async findById(id: number): Promise<SertifikatMutuResponseDto> {
    const record = await repository.findById(id);
    if (!record) throw HttpError.notFound("Sertifikat mutu tidak ditemukan");
    return toSertifikatMutuResponse(record);
  }

  async create(data: CreateSertifikatMutuDto, user: AuthenticatedUserContext, requestId?: string): Promise<SertifikatMutuResponseDto> {
    const created = await sequelize.transaction((trx) => repository.create(data, trx));
    auditService.persistNonBlocking({ action: AuditAction.CREATE, module: SERTIFIKAT_MUTU_MODULE, entityId: String(created.id), userId: user.id, after: toSertifikatMutuResponse(created), requestId });
    return toSertifikatMutuResponse(created);
  }

  async update(id: number, data: UpdateSertifikatMutuDto, user: AuthenticatedUserContext, requestId?: string): Promise<SertifikatMutuResponseDto> {
    const record = await repository.findById(id);
    if (!record) throw HttpError.notFound("Sertifikat mutu tidak ditemukan");
    const before = toSertifikatMutuResponse(record);
    const updated = await sequelize.transaction((trx) => repository.update(record, data, trx));
    auditService.persistNonBlocking({ action: AuditAction.UPDATE, module: SERTIFIKAT_MUTU_MODULE, entityId: String(updated.id), userId: user.id, before, after: toSertifikatMutuResponse(updated), requestId });
    return toSertifikatMutuResponse(updated);
  }

  async delete(id: number, user: AuthenticatedUserContext, requestId?: string): Promise<void> {
    const record = await repository.findById(id);
    if (!record) throw HttpError.notFound("Sertifikat mutu tidak ditemukan");
    const before = toSertifikatMutuResponse(record);
    await sequelize.transaction((trx) => repository.delete(record, trx));
    auditService.persistNonBlocking({ action: AuditAction.DELETE, module: SERTIFIKAT_MUTU_MODULE, entityId: String(record.id), userId: user.id, before, requestId });
  }
}
