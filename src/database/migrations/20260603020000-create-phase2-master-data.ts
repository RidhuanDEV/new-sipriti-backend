import type { QueryInterface } from "sequelize";
import { DataTypes, QueryTypes } from "sequelize";

interface ExistsRow {
  found: number;
}

async function tableExists(
  queryInterface: QueryInterface,
  tableName: string,
): Promise<boolean> {
  const rows = await queryInterface.sequelize.query<ExistsRow>(
    "SELECT 1 AS found FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = :tableName LIMIT 1",
    {
      type: QueryTypes.SELECT,
      replacements: { tableName },
    },
  );
  return rows.length > 0;
}

async function columnExists(
  queryInterface: QueryInterface,
  tableName: string,
  columnName: string,
): Promise<boolean> {
  const rows = await queryInterface.sequelize.query<ExistsRow>(
    "SELECT 1 AS found FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = :tableName AND column_name = :columnName LIMIT 1",
    {
      type: QueryTypes.SELECT,
      replacements: { tableName, columnName },
    },
  );
  return rows.length > 0;
}

async function addUserColumnIfMissing(
  queryInterface: QueryInterface,
  columnName: string,
  definition: Parameters<QueryInterface["addColumn"]>[2],
): Promise<void> {
  if (!(await columnExists(queryInterface, "users", columnName))) {
    await queryInterface.addColumn("users", columnName, definition);
  }
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  if (!(await tableExists(queryInterface, "prodis"))) {
    await queryInterface.createTable("prodis", {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, primaryKey: true },
      kode_prodi: { type: DataTypes.STRING(20), allowNull: false, unique: true },
      nama_prodi: { type: DataTypes.STRING(255), allowNull: false },
      jenjang: { type: DataTypes.ENUM("D3", "S1", "S2", "S3"), allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    });
  }

  if (!(await tableExists(queryInterface, "skemas"))) {
    await queryInterface.createTable("skemas", {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, primaryKey: true },
      nama_skema: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      tipe: { type: DataTypes.ENUM("Penelitian", "Pengabdian", "HKI"), allowNull: false },
      deskripsi: { type: DataTypes.TEXT, allowNull: true },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    });
  }

  if (!(await tableExists(queryInterface, "bidang_fokus"))) {
    await queryInterface.createTable("bidang_fokus", {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, primaryKey: true },
      nama_bidang: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    });
  }

  if (!(await tableExists(queryInterface, "tahun_akademik"))) {
    await queryInterface.createTable("tahun_akademik", {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, primaryKey: true },
      tahun_mulai: { type: DataTypes.INTEGER, allowNull: false },
      tahun_selesai: { type: DataTypes.INTEGER, allowNull: false },
      semester: { type: DataTypes.ENUM("Ganjil", "Genap"), allowNull: false, defaultValue: "Ganjil" },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    });
  }

  if (!(await tableExists(queryInterface, "outputs"))) {
    await queryInterface.createTable("outputs", {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, primaryKey: true },
      nama_output: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    });
  }

  if (!(await tableExists(queryInterface, "sertifikat_mutu"))) {
    await queryInterface.createTable("sertifikat_mutu", {
      id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
      sertifikat_description: { type: DataTypes.TEXT, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    });
  }

  await addUserColumnIfMissing(queryInterface, "name", {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await addUserColumnIfMissing(queryInterface, "username", {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await addUserColumnIfMissing(queryInterface, "nidn", {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await addUserColumnIfMissing(queryInterface, "institusi", {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await addUserColumnIfMissing(queryInterface, "prodi_kode", {
    type: DataTypes.STRING(20),
    allowNull: true,
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  for (const columnName of ["prodi_kode", "institusi", "nidn", "username", "name"]) {
    if (await columnExists(queryInterface, "users", columnName)) {
      await queryInterface.removeColumn("users", columnName);
    }
  }

  for (const tableName of [
    "sertifikat_mutu",
    "outputs",
    "tahun_akademik",
    "bidang_fokus",
    "skemas",
    "prodis",
  ]) {
    if (await tableExists(queryInterface, tableName)) {
      await queryInterface.dropTable(tableName);
    }
  }
}
