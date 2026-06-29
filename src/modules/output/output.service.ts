import { sequelize } from "../../config/database.js";
import { auditService } from "../../core/audit/audit.service.js";
import { buildLegacyPaginationMeta, normalizePagination } from "../../core/master-data/pagination.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { OUTPUT_MODULE } from "../../constants/modules.constants.js";
import { HttpError } from "../../core/errors/http-error.js";
import { OutputRepository } from "./output.repository.js";
import { toOutputOption, toOutputResponse } from "./mappers/output.mapper.js";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type { LegacyPaginationMeta } from "../../core/master-data/pagination.js";
import type { CreateOutputDto, ListOutputQueryDto, OutputOptionDto, OutputResponseDto, UpdateOutputDto } from "./dto/output.dto.js";

const repository = new OutputRepository();

export class OutputService {
  async findAll(query: ListOutputQueryDto): Promise<{ rows: OutputResponseDto[]; meta: LegacyPaginationMeta }> {
    const pagination = normalizePagination(query);
    const { rows, count } = await repository.findAndCount(query, pagination);
    return { rows: rows.map((row) => toOutputResponse(row)), meta: buildLegacyPaginationMeta(pagination.page, pagination.limit, count) };
  }

  async findById(id: string): Promise<OutputResponseDto> {
    const output = await repository.findById(id);
    if (!output) throw HttpError.notFound("Output tidak ditemukan");
    return toOutputResponse(output);
  }

  async findOptions(): Promise<OutputOptionDto[]> {
    return (await repository.findOptions()).map((row) => toOutputOption(row));
  }

  async create(data: CreateOutputDto, user: AuthenticatedUserContext, requestId?: string): Promise<OutputResponseDto> {
    const existing = await repository.findByName(data.nama_output);
    if (existing) throw HttpError.conflict("Output dengan nama ini sudah ada");
    const created = await sequelize.transaction((trx) => repository.create(data, trx));
    auditService.persistNonBlocking({ action: AuditAction.CREATE, module: OUTPUT_MODULE, entityId: created.id, userId: user.id, after: toOutputResponse(created), requestId });
    return toOutputResponse(created);
  }

  async update(id: string, data: UpdateOutputDto, user: AuthenticatedUserContext, requestId?: string): Promise<OutputResponseDto> {
    const output = await repository.findById(id);
    if (!output) throw HttpError.notFound("Output tidak ditemukan");
    if (data.nama_output) {
      const existing = await repository.findByName(data.nama_output, id);
      if (existing) throw HttpError.conflict("Output dengan nama ini sudah ada");
    }
    const before = toOutputResponse(output);
    const updated = await sequelize.transaction((trx) => repository.update(output, data, trx));
    auditService.persistNonBlocking({ action: AuditAction.UPDATE, module: OUTPUT_MODULE, entityId: updated.id, userId: user.id, before, after: toOutputResponse(updated), requestId });
    return toOutputResponse(updated);
  }

  async delete(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<void> {
    const output = await repository.findById(id);
    if (!output) throw HttpError.notFound("Output tidak ditemukan");
    const before = toOutputResponse(output);
    await sequelize.transaction((trx) => repository.delete(output, trx));
    auditService.persistNonBlocking({ action: AuditAction.DELETE, module: OUTPUT_MODULE, entityId: output.id, userId: user.id, before, requestId });
  }
}
