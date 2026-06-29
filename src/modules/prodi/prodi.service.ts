import { sequelize } from "../../config/database.js";
import { auditService } from "../../core/audit/audit.service.js";
import { countRowsByColumn } from "../../core/database/table-introspection.js";
import {
  buildLegacyPaginationMeta,
  normalizePagination,
} from "../../core/master-data/pagination.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { PRODI_MODULE } from "../../constants/modules.constants.js";
import { HttpError } from "../../core/errors/http-error.js";
import { ProdiRepository } from "./prodi.repository.js";
import { toProdiResponse, toProdiResponseList } from "./mappers/prodi.mapper.js";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type { LegacyPaginationMeta } from "../../core/master-data/pagination.js";
import type {
  CreateProdiDto,
  ListProdiQueryDto,
  ProdiResponseDto,
  UpdateProdiDto,
} from "./dto/prodi.dto.js";

const repository = new ProdiRepository();

export class ProdiService {
  async findAll(
    query: ListProdiQueryDto,
  ): Promise<{ rows: ProdiResponseDto[]; meta: LegacyPaginationMeta }> {
    const pagination = normalizePagination(query);
    const { rows, count } = await repository.findAndCount(query, pagination);

    return {
      rows: toProdiResponseList(rows),
      meta: buildLegacyPaginationMeta(pagination.page, pagination.limit, count),
    };
  }

  async findById(id: string): Promise<ProdiResponseDto> {
    const prodi = await repository.findById(id);
    if (!prodi) throw HttpError.notFound("Prodi tidak ditemukan");
    return toProdiResponse(prodi);
  }

  async create(
    data: CreateProdiDto,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<ProdiResponseDto> {
    const existing = await repository.findByKode(data.kode_prodi);
    if (existing) {
      throw HttpError.conflict(`Kode prodi '${data.kode_prodi}' sudah terdaftar`);
    }

    const created = await sequelize.transaction((trx) =>
      repository.create(data, trx),
    );

    auditService.persistNonBlocking({
      action: AuditAction.CREATE,
      module: PRODI_MODULE,
      entityId: created.id,
      userId: user.id,
      after: toProdiResponse(created),
      requestId,
    });

    return toProdiResponse(created);
  }

  async update(
    id: string,
    data: UpdateProdiDto,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<ProdiResponseDto> {
    const prodi = await repository.findById(id);
    if (!prodi) throw HttpError.notFound("Prodi tidak ditemukan");

    if (data.kode_prodi && data.kode_prodi !== prodi.kodeProdi) {
      const existing = await repository.findByKode(data.kode_prodi, id);
      if (existing) {
        throw HttpError.conflict(`Kode prodi '${data.kode_prodi}' sudah terdaftar`);
      }
    }

    const before = toProdiResponse(prodi);
    const updated = await sequelize.transaction((trx) =>
      repository.update(prodi, data, trx),
    );

    auditService.persistNonBlocking({
      action: AuditAction.UPDATE,
      module: PRODI_MODULE,
      entityId: updated.id,
      userId: user.id,
      before,
      after: toProdiResponse(updated),
      requestId,
    });

    return toProdiResponse(updated);
  }

  async delete(
    id: string,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<void> {
    const prodi = await repository.findById(id);
    if (!prodi) throw HttpError.notFound("Prodi tidak ditemukan");

    const usersWithProdi = await countRowsByColumn(
      "users",
      "prodi_kode",
      prodi.kodeProdi,
    );
    if (usersWithProdi > 0) {
      throw HttpError.badRequest(
        `Tidak dapat menghapus prodi. Terdapat ${usersWithProdi} pengguna yang terkait.`,
      );
    }

    const before = toProdiResponse(prodi);
    await sequelize.transaction((trx) => repository.delete(prodi, trx));

    auditService.persistNonBlocking({
      action: AuditAction.DELETE,
      module: PRODI_MODULE,
      entityId: prodi.id,
      userId: user.id,
      before,
      requestId,
    });
  }

  async findOptions(): Promise<ProdiResponseDto[]> {
    return toProdiResponseList(await repository.findOptions());
  }

  async restore(
    id: string,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<ProdiResponseDto> {
    const prodi = await repository.findByIdWithDeleted(id);
    if (!prodi) throw HttpError.notFound("Prodi tidak ditemukan");
    if (!prodi.deletedAt) {
      throw HttpError.badRequest("Prodi tidak dalam status terhapus");
    }
    await sequelize.transaction((trx) => repository.restore(prodi, trx));

    const after = toProdiResponse(prodi);
    auditService.persistNonBlocking({
      action: AuditAction.RESTORE,
      module: PRODI_MODULE,
      entityId: prodi.id,
      userId: user.id,
      after,
      requestId,
    });

    return after;
  }
}
