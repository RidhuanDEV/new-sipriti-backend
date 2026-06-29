import { DataTypes, Model } from "sequelize";
import { generateUuidV7 } from "../../utils/uuid.js";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  Sequelize,
} from "sequelize";

export type CarouselPage = "capaian" | "dashboard" | "landing";

export class Carousel extends Model<
  InferAttributes<Carousel>,
  InferCreationAttributes<Carousel>
> {
  declare id: CreationOptional<string>;
  declare image_url: string;
  declare title: string | null;
  declare description: string | null;
  declare is_active: CreationOptional<boolean>;
  declare display_order: CreationOptional<number>;
  declare page: CreationOptional<CarouselPage>;
  declare tentang_prpm_description: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
}

export function initModel(sequelize: Sequelize): typeof Carousel {
  Carousel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => generateUuidV7(),
        primaryKey: true,
      },
      image_url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      display_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      page: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "capaian",
      },
      tentang_prpm_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "deleted_at",
      },
    },
    {
      sequelize,
      modelName: "Carousel",
      tableName: "carousel",
      freezeTableName: true,
      paranoid: true,
      deletedAt: "deleted_at",
    },
  );

  return Carousel;
}
