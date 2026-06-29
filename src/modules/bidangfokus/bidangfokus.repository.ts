import { Op } from "sequelize";
import { BidangFokus } from "./bidangfokus.model.js";
import type { Transaction } from "sequelize";
import type {
  CreateBidangFokusDto,
  ListBidangFokusQueryDto,
  UpdateBidangFokusDto,
} from "./dto/bidangfokus.dto.js";

export class BidangFokusRepository {
  findAndCount(
    query: ListBidangFokusQueryDto,
    pagination: { limit: number; offset: number },
  ): Promise<{ rows: BidangFokus[]; count: number }> {
    const where = query.search
      ? { namaBidang: { [Op.like]: `%${query.search}%` } }
      : {};
    return BidangFokus.findAndCountAll({
      where,
      limit: pagination.limit,
      offset: pagination.offset,
      order: [[query.sortBy, query.sortOrder.toUpperCase()]],
    });
  }

  findById(id: string): Promise<BidangFokus | null> {
    return BidangFokus.findByPk(id);
  }

  findByName(
    namaBidang: string,
    excludeId?: string,
  ): Promise<BidangFokus | null> {
    const where =
      excludeId === undefined
        ? { namaBidang }
        : { namaBidang, id: { [Op.ne]: excludeId } };
    return BidangFokus.findOne({ where });
  }

  create(
    data: CreateBidangFokusDto,
    transaction?: Transaction,
  ): Promise<BidangFokus> {
    return BidangFokus.create(
      { namaBidang: data.nama_bidang },
      transaction ? { transaction } : {},
    );
  }

  async update(
    bidangFokus: BidangFokus,
    data: UpdateBidangFokusDto,
    transaction?: Transaction,
  ): Promise<BidangFokus> {
    await bidangFokus.update(
      { namaBidang: data.nama_bidang ?? bidangFokus.namaBidang },
      transaction ? { transaction } : {},
    );
    return bidangFokus;
  }

  async delete(bidangFokus: BidangFokus, transaction?: Transaction): Promise<void> {
    await bidangFokus.destroy(transaction ? { transaction } : {});
  }

  findOptions(): Promise<BidangFokus[]> {
    return BidangFokus.findAll({
      attributes: ["id", "namaBidang"],
      order: [["namaBidang", "ASC"]],
    });
  }

  findByIdWithDeleted(id: string): Promise<BidangFokus | null> {
    return BidangFokus.findOne({ where: { id }, paranoid: false });
  }

  async restore(bidangFokus: BidangFokus, transaction?: Transaction): Promise<void> {
    await bidangFokus.restore(transaction ? { transaction } : {});
  }
}
