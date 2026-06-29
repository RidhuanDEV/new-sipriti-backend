import { Op } from "sequelize";
import { Output } from "./output.model.js";
import type { Transaction } from "sequelize";
import type {
  CreateOutputDto,
  ListOutputQueryDto,
  UpdateOutputDto,
} from "./dto/output.dto.js";

export class OutputRepository {
  findAndCount(
    query: ListOutputQueryDto,
    pagination: { limit: number; offset: number },
  ): Promise<{ rows: Output[]; count: number }> {
    const where = query.search
      ? { namaOutput: { [Op.like]: `%${query.search}%` } }
      : {};
    return Output.findAndCountAll({
      where,
      limit: pagination.limit,
      offset: pagination.offset,
      order: [["namaOutput", "ASC"]],
    });
  }

  findById(id: string): Promise<Output | null> {
    return Output.findByPk(id);
  }

  findByName(namaOutput: string, excludeId?: string): Promise<Output | null> {
    const where =
      excludeId === undefined
        ? { namaOutput }
        : { namaOutput, id: { [Op.ne]: excludeId } };
    return Output.findOne({ where });
  }

  create(data: CreateOutputDto, transaction?: Transaction): Promise<Output> {
    return Output.create(
      { namaOutput: data.nama_output },
      transaction ? { transaction } : {},
    );
  }

  async update(output: Output, data: UpdateOutputDto, transaction?: Transaction): Promise<Output> {
    await output.update(
      { namaOutput: data.nama_output ?? output.namaOutput },
      transaction ? { transaction } : {},
    );
    return output;
  }

  async delete(output: Output, transaction?: Transaction): Promise<void> {
    await output.destroy(transaction ? { transaction } : {});
  }

  findOptions(): Promise<Output[]> {
    return Output.findAll({
      attributes: ["id", "namaOutput"],
      order: [["namaOutput", "ASC"]],
    });
  }
}
