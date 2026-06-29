import { Op } from "sequelize";
import { sequelize } from "../../config/database.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { PRODUCT_RISET_MODULE } from "../../constants/modules.constants.js";
import { auditService } from "../../core/audit/audit.service.js";
import { buildSimpleMeta, normalizeSimplePagination } from "../../core/content/legacy-content.js";
import { HttpError } from "../../core/errors/http-error.js";
import { ProductRiset } from "./productriset.model.js";
import { toProductRisetResponse } from "./mappers/productriset.mapper.js";
import type { WhereOptions } from "sequelize";
import type { AuthenticatedUserContext } from "../../types/auth.js";
import type { SimplePaginationMeta } from "../../core/master-data/pagination.js";
import type { CreateProductRisetDto, ListProductRisetQueryDto, ProductRisetResponseDto, UpdateProductRisetDto } from "./dto/productriset.dto.js";

function buildSearchWhere(query: ListProductRisetQueryDto): WhereOptions<ProductRiset> {
  const search = query.search?.trim() || query.q?.trim();
  if (!search) return {};
  return { nama_produk: { [Op.like]: `%${search}%` } };
}

async function findDuplicate(name: string, excludeId?: string): Promise<ProductRiset | null> {
  const where: WhereOptions<ProductRiset> = {
    nama_produk: { [Op.like]: name },
  };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  return ProductRiset.findOne({ where });
}

export class ProductRisetService {
  async listProductRiset(
    query: ListProductRisetQueryDto,
  ): Promise<{ rows: ProductRisetResponseDto[]; meta: SimplePaginationMeta }> {
    const pagination = normalizeSimplePagination(query, 10, 200);
    const { rows, count } = await ProductRiset.findAndCountAll({
      where: buildSearchWhere(query),
      order: [["createdAt", "DESC"]],
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return {
      rows: rows.map((row) => toProductRisetResponse(row)),
      meta: buildSimpleMeta(pagination.page, pagination.limit, count),
    };
  }

  async getAllProductRiset(): Promise<ProductRisetResponseDto[]> {
    const rows = await ProductRiset.findAll({ order: [["nama_produk", "ASC"]] });
    return rows.map((row) => toProductRisetResponse(row));
  }

  async getProductRisetById(id: string): Promise<ProductRisetResponseDto> {
    const row = await ProductRiset.findByPk(id);
    if (!row) throw HttpError.notFound("Product riset tidak ditemukan");
    return toProductRisetResponse(row);
  }

  async createProductRiset(
    data: CreateProductRisetDto,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<ProductRisetResponseDto> {
    const name = data.nama_produk.trim();
    if (await findDuplicate(name)) throw HttpError.badRequest("Product riset dengan nama tersebut sudah ada");
    const created = await sequelize.transaction((trx) =>
      ProductRiset.create(
        {
          nama_produk: name,
          produk_riset_description: data.produk_riset_description ?? null,
        },
        { transaction: trx },
      ),
    );
    const response = toProductRisetResponse(created);
    auditService.persistNonBlocking({ action: AuditAction.CREATE, module: PRODUCT_RISET_MODULE, entityId: created.id, userId: user.id, after: response, requestId });
    return response;
  }

  async updateProductRiset(
    id: string,
    data: UpdateProductRisetDto,
    user: AuthenticatedUserContext,
    requestId?: string,
  ): Promise<ProductRisetResponseDto> {
    const row = await ProductRiset.findByPk(id);
    if (!row) throw HttpError.notFound("Product riset tidak ditemukan");
    if (data.nama_produk !== undefined && (await findDuplicate(data.nama_produk.trim(), id))) {
      throw HttpError.badRequest("Product riset dengan nama tersebut sudah ada");
    }

    const before = toProductRisetResponse(row);
    await sequelize.transaction((trx) =>
      row.update(
        {
          nama_produk: data.nama_produk !== undefined ? data.nama_produk.trim() : row.nama_produk,
          produk_riset_description: data.produk_riset_description !== undefined ? data.produk_riset_description : row.produk_riset_description,
        },
        { transaction: trx },
      ),
    );
    const response = toProductRisetResponse(row);
    auditService.persistNonBlocking({ action: AuditAction.UPDATE, module: PRODUCT_RISET_MODULE, entityId: row.id, userId: user.id, before, after: response, requestId });
    return response;
  }

  async deleteProductRiset(id: string, user: AuthenticatedUserContext, requestId?: string): Promise<void> {
    const row = await ProductRiset.findByPk(id);
    if (!row) throw HttpError.notFound("Product riset tidak ditemukan");
    const before = toProductRisetResponse(row);
    await sequelize.transaction((trx) => row.destroy({ transaction: trx }));
    auditService.persistNonBlocking({ action: AuditAction.DELETE, module: PRODUCT_RISET_MODULE, entityId: before.id, userId: user.id, before, requestId });
  }
}
