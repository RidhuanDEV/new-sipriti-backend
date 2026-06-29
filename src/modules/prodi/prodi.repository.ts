import { Op } from "sequelize";
import { Prodi } from "./prodi.model.js";
import type { Transaction } from "sequelize";
import type {
  CreateProdiDto,
  ListProdiQueryDto,
  UpdateProdiDto,
} from "./dto/prodi.dto.js";

export class ProdiRepository {
  async findAndCount(
    query: ListProdiQueryDto,
    pagination: { limit: number; offset: number },
  ): Promise<{ rows: Prodi[]; count: number }> {
    const where: {
      jenjang?: string;
      [Op.or]?: Array<Record<string, { [Op.like]: string }>>;
    } = {};

    if (query.search) {
      where[Op.or] = [
        { namaProdi: { [Op.like]: `%${query.search}%` } },
        { kodeProdi: { [Op.like]: `%${query.search}%` } },
      ];
    }

    if (query.jenjang) {
      where.jenjang = query.jenjang;
    }

    return Prodi.findAndCountAll({
      where,
      limit: pagination.limit,
      offset: pagination.offset,
      order: [[query.sortBy, query.sortOrder.toUpperCase()]],
    });
  }

  findById(id: string): Promise<Prodi | null> {
    return Prodi.findByPk(id);
  }

  findByKode(kodeProdi: string, excludeId?: string): Promise<Prodi | null> {
    const where =
      excludeId === undefined
        ? { kodeProdi }
        : { kodeProdi, id: { [Op.ne]: excludeId } };
    return Prodi.findOne({ where });
  }

  create(data: CreateProdiDto, transaction?: Transaction): Promise<Prodi> {
    return Prodi.create(
      {
        kodeProdi: data.kode_prodi,
        namaProdi: data.nama_prodi,
        jenjang: data.jenjang,
      },
      transaction ? { transaction } : {},
    );
  }

  async update(
    prodi: Prodi,
    data: UpdateProdiDto,
    transaction?: Transaction,
  ): Promise<Prodi> {
    await prodi.update(
      {
        kodeProdi: data.kode_prodi ?? prodi.kodeProdi,
        namaProdi: data.nama_prodi ?? prodi.namaProdi,
        jenjang: data.jenjang ?? prodi.jenjang,
      },
      transaction ? { transaction } : {},
    );
    return prodi;
  }

  async delete(prodi: Prodi, transaction?: Transaction): Promise<void> {
    await prodi.destroy(transaction ? { transaction } : {});
  }

  findOptions(): Promise<Prodi[]> {
    return Prodi.findAll({
      attributes: ["id", "kodeProdi", "namaProdi", "jenjang"],
      order: [
        ["jenjang", "ASC"],
        ["namaProdi", "ASC"],
      ],
    });
  }

  findByIdWithDeleted(id: string): Promise<Prodi | null> {
    return Prodi.findOne({ where: { id }, paranoid: false });
  }

  async restore(prodi: Prodi, transaction?: Transaction): Promise<void> {
    await prodi.restore(transaction ? { transaction } : {});
  }
}
