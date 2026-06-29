import { DataTypes, Model } from "sequelize";
import { generateUuidV7 } from "../../utils/uuid.js";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  Sequelize,
} from "sequelize";

export class ProductRiset extends Model<
  InferAttributes<ProductRiset>,
  InferCreationAttributes<ProductRiset>
> {
  declare id: CreationOptional<string>;
  declare nama_produk: string;
  declare produk_riset_description: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initModel(sequelize: Sequelize): typeof ProductRiset {
  ProductRiset.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => generateUuidV7(),
        primaryKey: true,
      },
      nama_produk: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      produk_riset_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "productriset",
      tableName: "product_riset",
      timestamps: true,
    },
  );

  return ProductRiset;
}
