import { Carousel } from "./carousel.model.js";
import type { Transaction, WhereOptions } from "sequelize";
import type { CarouselPage } from "./carousel.model.js";
import type { CreateCarouselDto, ListCarouselAdminQueryDto, ListCarouselQueryDto, UpdateCarouselDto } from "./dto/carousel.dto.js";

export class CarouselRepository {
  findPublic(query: ListCarouselQueryDto): Promise<Carousel[]> {
    const where: WhereOptions<Carousel> = {
      page: query.page ?? "capaian",
    };
    if (query.active_only === "true" || query.active_only === true) {
      where.is_active = true;
    }

    return Carousel.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: 3,
    });
  }

  findAndCountAdmin(
    query: ListCarouselAdminQueryDto,
    pagination: { limit: number; offset: number },
  ): Promise<{ rows: Carousel[]; count: number }> {
    const where: WhereOptions<Carousel> = {};
    if (query.pageFilter) where.page = query.pageFilter;

    return Carousel.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }

  findById(id: string): Promise<Carousel | null> {
    return Carousel.findByPk(id);
  }

  create(
    data: CreateCarouselDto & { image_url: string; is_active_normalized: boolean; page: CarouselPage },
    transaction?: Transaction,
  ): Promise<Carousel> {
    return Carousel.create(
      {
        image_url: data.image_url,
        title: data.title ?? null,
        is_active: data.is_active_normalized,
        page: data.page,
        display_order: 0,
        description: null,
        tentang_prpm_description: null,
      },
      transaction ? { transaction } : {},
    );
  }

  async update(
    carousel: Carousel,
    data: UpdateCarouselDto & {
      image_url: string;
      is_active_normalized: boolean;
      page: CarouselPage;
    },
    transaction?: Transaction,
  ): Promise<Carousel> {
    await carousel.update(
      {
        image_url: data.image_url,
        title: data.title !== undefined ? data.title : carousel.title,
        is_active: data.is_active_normalized,
        page: data.page,
      },
      transaction ? { transaction } : {},
    );
    return carousel;
  }

  async delete(carousel: Carousel, transaction?: Transaction): Promise<void> {
    await carousel.destroy(transaction ? { transaction } : {});
  }

  findByIdParanoid(id: string): Promise<Carousel | null> {
    return Carousel.findByPk(id, { paranoid: false });
  }

  async restore(carousel: Carousel, transaction?: Transaction): Promise<Carousel> {
    await carousel.restore(transaction ? { transaction } : {});
    return carousel;
  }
}
