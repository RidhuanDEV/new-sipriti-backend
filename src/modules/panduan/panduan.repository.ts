import { Op } from "sequelize";
import { Panduan } from "./panduan.model.js";
import type { Transaction, WhereOptions } from "sequelize";
import type { CreatePanduanDto, ListPanduanQueryDto, UpdatePanduanDto } from "./dto/panduan.dto.js";

export class PanduanRepository {
  findAndCount(
    query: ListPanduanQueryDto,
    pagination: { limit: number; offset: number },
    maxLimit: number,
  ): Promise<{ rows: Panduan[]; count: number }> {
    const where: WhereOptions<Panduan> = query.q
      ? {
        [Op.or]: [
        { judul: { [Op.like]: `%${query.q}%` } },
        { isi_panduan: { [Op.like]: `%${query.q}%` } },
        ],
      }
      : {};

    return Panduan.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: Math.min(pagination.limit, maxLimit),
      offset: pagination.offset,
    });
  }

  findById(id: string): Promise<Panduan | null> {
    return Panduan.findByPk(id);
  }

  create(
    data: CreatePanduanDto & { thumbnail: string | null; file_url: string | null },
    transaction?: Transaction,
  ): Promise<Panduan> {
    return Panduan.create(
      {
        judul: data.judul,
        isi_panduan: data.isi_panduan,
        thumbnail: data.thumbnail,
        file_url: data.file_url,
      },
      transaction ? { transaction } : {},
    );
  }

  async update(
    panduan: Panduan,
    data: UpdatePanduanDto & { thumbnail: string | null; file_url: string | null },
    transaction?: Transaction,
  ): Promise<Panduan> {
    await panduan.update(
      {
        judul: data.judul,
        isi_panduan: data.isi_panduan,
        thumbnail: data.thumbnail,
        file_url: data.file_url,
      },
      transaction ? { transaction } : {},
    );
    return panduan;
  }

  async delete(panduan: Panduan, transaction?: Transaction): Promise<void> {
    await panduan.destroy(transaction ? { transaction } : {});
  }

  findByIdWithDeleted(id: string): Promise<Panduan | null> {
    return Panduan.findOne({ where: { id }, paranoid: false });
  }

  async restore(panduan: Panduan, transaction?: Transaction): Promise<void> {
    await panduan.restore(transaction ? { transaction } : {});
  }
}
