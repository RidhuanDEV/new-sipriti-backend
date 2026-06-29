import { DataTypes, Model } from "sequelize";
import { generateUuidV7 } from "../../utils/uuid.js";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  Sequelize,
} from "sequelize";

export type LandingSliderStatus = "active" | "inactive";

export class LandingSlider extends Model<
  InferAttributes<LandingSlider>,
  InferCreationAttributes<LandingSlider>
> {
  declare id: CreationOptional<string>;
  declare title: string;
  declare description: string | null;
  declare img_desktop: string;
  declare img_mobile: string;
  declare btn_text: string | null;
  declare btn_link: string | null;
  declare btn_color: string | null;
  declare order_index: CreationOptional<number>;
  declare status: CreationOptional<LandingSliderStatus>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
}

export function initModel(sequelize: Sequelize): typeof LandingSlider {
  LandingSlider.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => generateUuidV7(),
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      img_desktop: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      img_mobile: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      btn_text: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      btn_link: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      btn_color: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      order_index: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM("active", "inactive"),
        allowNull: false,
        defaultValue: "active",
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
      modelName: "LandingSlider",
      tableName: "landing_slider",
      freezeTableName: true,
      paranoid: true,
      deletedAt: "deleted_at",
    },
  );

  return LandingSlider;
}
