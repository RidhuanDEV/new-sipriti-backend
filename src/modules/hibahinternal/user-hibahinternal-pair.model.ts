import { DataTypes, Model } from "sequelize";
import type { InferAttributes, InferCreationAttributes, Sequelize } from "sequelize";

export class UserHibahinternalPair extends Model<
  InferAttributes<UserHibahinternalPair>,
  InferCreationAttributes<UserHibahinternalPair>
> {
  declare user_id: string;
  declare hibah_internal_id: string;
}

export function initModel(sequelize: Sequelize): typeof UserHibahinternalPair {
  UserHibahinternalPair.init(
    {
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      hibah_internal_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "UserHibahinternalPair",
      tableName: "userhibahinternalpair",
      freezeTableName: true,
      timestamps: false,
    },
  );

  return UserHibahinternalPair;
}
