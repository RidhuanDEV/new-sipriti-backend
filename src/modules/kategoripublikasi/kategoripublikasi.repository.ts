import { Op } from "sequelize";
import { KategoriPublikasi } from "./kategoripublikasi.model.js";
import { Publikasi } from "../publikasi/publikasi.model.js";
import type { Transaction, WhereOptions } from "sequelize";
import type { ListKategoriPublikasiQueryDto } from "./dto/kategoripublikasi.dto.js";

export class KategoriPublikasiRepository {
  findAndCount(
    query: ListKategoriPublikasiQueryDto,
    pagination: { limit: number; offset: number },
  ): Promise<{ rows: KategoriPublikasi[]; count: number }> {
    const where: WhereOptions<KategoriPublikasi> = {};
    const search = query.q?.trim() || query.search?.trim();
    if (search) {
      where.namaKategori = { [Op.like]: `%${search}%` };
    }

    return KategoriPublikasi.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }

  findAllForPublikasiPivot(): Promise<KategoriPublikasi[]> {
    return KategoriPublikasi.findAll({
      order: [["namaKategori", "ASC"]],
      attributes: ["id", "namaKategori"],
    });
  }

  findById(id: string): Promise<KategoriPublikasi | null> {
    return KategoriPublikasi.findByPk(id);
  }

  findByName(name: string, excludeId?: string): Promise<KategoriPublikasi | null> {
    const where: WhereOptions<KategoriPublikasi> = {
      namaKategori: name,
    };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    return KategoriPublikasi.findOne({ where });
  }

  create(name: string, transaction?: Transaction): Promise<KategoriPublikasi> {
    return KategoriPublikasi.create({ namaKategori: name }, transaction ? { transaction } : {});
  }

  async update(row: KategoriPublikasi, name: string, transaction?: Transaction): Promise<KategoriPublikasi> {
    await row.update({ namaKategori: name }, transaction ? { transaction } : {});
    return row;
  }

  async delete(row: KategoriPublikasi, transaction?: Transaction): Promise<void> {
    await Publikasi.destroy({
      where: { kategoriPublikasiId: row.id },
      ...(transaction ? { transaction } : {}),
    });
    await row.destroy(transaction ? { transaction } : {});
  }
}
