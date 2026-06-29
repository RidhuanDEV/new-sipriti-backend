import { Op } from "sequelize";
import { Skema } from "./skema.model.js";
import type { Transaction } from "sequelize";
import type {
  CreateSkemaDto,
  ListSkemaQueryDto,
  SkemaOptionsQueryDto,
  UpdateSkemaDto,
} from "./dto/skema.dto.js";

function normalizeBoolean(value: UpdateSkemaDto["is_active"]): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  return value === "true" || value === "1";
}

export class SkemaRepository {
  async findAndCount(
    query: ListSkemaQueryDto,
    pagination: { limit: number; offset: number },
  ): Promise<{ rows: Skema[]; count: number }> {
    const where: { namaSkema?: { [Op.like]: string }; tipe?: string } = {};
    if (query.search) where.namaSkema = { [Op.like]: `%${query.search}%` };
    if (query.tipe) where.tipe = query.tipe;

    return Skema.findAndCountAll({
      where,
      limit: pagination.limit,
      offset: pagination.offset,
      order: [[query.sortBy, query.sortOrder.toUpperCase()]],
    });
  }

  findById(id: string): Promise<Skema | null> {
    return Skema.findByPk(id);
  }

  findByName(namaSkema: string, excludeId?: string): Promise<Skema | null> {
    const where =
      excludeId === undefined
        ? { namaSkema }
        : { namaSkema, id: { [Op.ne]: excludeId } };
    return Skema.findOne({ where });
  }

  create(data: CreateSkemaDto, transaction?: Transaction): Promise<Skema> {
    return Skema.create(
      {
        namaSkema: data.nama_skema,
        tipe: data.tipe,
        deskripsi: data.deskripsi ?? null,
        isActive: true,
      },
      transaction ? { transaction } : {},
    );
  }

  async update(
    skema: Skema,
    data: UpdateSkemaDto,
    transaction?: Transaction,
  ): Promise<Skema> {
    const isActive = normalizeBoolean(data.is_active);
    await skema.update(
      {
        namaSkema: data.nama_skema ?? skema.namaSkema,
        tipe: data.tipe ?? skema.tipe,
        deskripsi: data.deskripsi !== undefined ? data.deskripsi : skema.deskripsi,
        isActive: isActive ?? skema.isActive,
      },
      transaction ? { transaction } : {},
    );
    return skema;
  }

  async delete(skema: Skema, transaction?: Transaction): Promise<void> {
    await skema.destroy(transaction ? { transaction } : {});
  }

  findOptions(query: SkemaOptionsQueryDto): Promise<Skema[]> {
    const where = query.tipe ? { isActive: true, tipe: query.tipe } : { isActive: true };
    return Skema.findAll({
      where,
      attributes: ["id", "namaSkema", "tipe"],
      order: [
        ["tipe", "ASC"],
        ["namaSkema", "ASC"],
      ],
    });
  }

  findByIdWithDeleted(id: string): Promise<Skema | null> {
    return Skema.findOne({ where: { id }, paranoid: false });
  }

  async restore(skema: Skema, transaction?: Transaction): Promise<void> {
    await skema.restore(transaction ? { transaction } : {});
  }
}
