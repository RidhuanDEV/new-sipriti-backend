import { LandingSlider } from "./landingslider.model.js";
import type { Transaction, WhereOptions } from "sequelize";
import type { LandingSliderStatusDto } from "./dto/landingslider.dto.js";

export interface LandingSliderCreateAttributes {
  title: string;
  description: string | null;
  img_desktop: string;
  img_mobile: string;
  btn_text: string | null;
  btn_link: string | null;
  btn_color: string | null;
  order_index: number;
  status: LandingSliderStatusDto;
}

export type LandingSliderUpdateAttributes = Partial<LandingSliderCreateAttributes>;

export class LandingSliderRepository {
  findPublic(): Promise<LandingSlider[]> {
    return LandingSlider.findAll({
      where: { status: "active" },
      order: [["order_index", "ASC"]],
    });
  }

  findAndCountAdmin(
    status: LandingSliderStatusDto | undefined,
    pagination: { limit: number; offset: number },
  ): Promise<{ rows: LandingSlider[]; count: number }> {
    const where: WhereOptions<LandingSlider> = {};
    if (status) where.status = status;

    return LandingSlider.findAndCountAll({
      where,
      order: [["order_index", "ASC"]],
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }

  findById(id: string): Promise<LandingSlider | null> {
    return LandingSlider.findByPk(id);
  }

  create(data: LandingSliderCreateAttributes, transaction?: Transaction): Promise<LandingSlider> {
    return LandingSlider.create(data, transaction ? { transaction } : {});
  }

  async update(
    slider: LandingSlider,
    data: LandingSliderUpdateAttributes,
    transaction?: Transaction,
  ): Promise<LandingSlider> {
    await slider.update(data, transaction ? { transaction } : {});
    return slider;
  }

  async delete(slider: LandingSlider, transaction?: Transaction): Promise<void> {
    await slider.destroy(transaction ? { transaction } : {});
  }

  findByIdWithDeleted(id: string): Promise<LandingSlider | null> {
    return LandingSlider.findOne({ where: { id }, paranoid: false });
  }

  async restore(slider: LandingSlider, transaction?: Transaction): Promise<void> {
    await slider.restore(transaction ? { transaction } : {});
  }
}
