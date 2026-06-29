import type { QueryInterface, QueryInterfaceIndexOptions } from "sequelize";
import { DataTypes, QueryTypes } from "sequelize";

interface ExistsRow {
  found: number;
}

async function tableExists(queryInterface: QueryInterface, tableName: string): Promise<boolean> {
  const rows = await queryInterface.sequelize.query<ExistsRow>(
    "SELECT 1 AS found FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = :tableName LIMIT 1",
    { type: QueryTypes.SELECT, replacements: { tableName } },
  );
  return rows.length > 0;
}

async function columnExists(queryInterface: QueryInterface, tableName: string, columnName: string): Promise<boolean> {
  const rows = await queryInterface.sequelize.query<ExistsRow>(
    "SELECT 1 AS found FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = :tableName AND column_name = :columnName LIMIT 1",
    { type: QueryTypes.SELECT, replacements: { tableName, columnName } },
  );
  return rows.length > 0;
}

async function indexExists(queryInterface: QueryInterface, tableName: string, indexName: string): Promise<boolean> {
  const rows = await queryInterface.sequelize.query<ExistsRow>(
    "SELECT 1 AS found FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = :tableName AND index_name = :indexName LIMIT 1",
    { type: QueryTypes.SELECT, replacements: { tableName, indexName } },
  );
  return rows.length > 0;
}

async function addColumnIfMissing(
  queryInterface: QueryInterface,
  tableName: string,
  columnName: string,
  definition: Parameters<QueryInterface["addColumn"]>[2],
): Promise<void> {
  if (!(await columnExists(queryInterface, tableName, columnName))) {
    await queryInterface.addColumn(tableName, columnName, definition);
  }
}

async function addIndexIfMissing(
  queryInterface: QueryInterface,
  tableName: string,
  fields: string[],
  options: QueryInterfaceIndexOptions & { name: string },
): Promise<void> {
  if (!(await indexExists(queryInterface, tableName, options.name))) {
    await queryInterface.addIndex(tableName, fields, options);
  }
}

const uuidPk = { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, primaryKey: true };
const timestampsCamel = {
  createdAt: { type: DataTypes.DATE, allowNull: false },
  updatedAt: { type: DataTypes.DATE, allowNull: false },
};
const timestampsSnake = {
  created_at: { type: DataTypes.DATE, allowNull: false },
  updated_at: { type: DataTypes.DATE, allowNull: false },
};

export async function up(queryInterface: QueryInterface): Promise<void> {
  if (!(await tableExists(queryInterface, "official_signatures"))) {
    await queryInterface.createTable("official_signatures", {
      id: uuidPk,
      signature_key: { type: DataTypes.STRING(100), allowNull: false },
      role_code: { type: DataTypes.STRING(100), allowNull: true },
      kode_prodi: { type: DataTypes.STRING(20), allowNull: true },
      signer_name: { type: DataTypes.STRING(255), allowNull: false },
      signer_nidn: { type: DataTypes.STRING(50), allowNull: true },
      stored_filename: { type: DataTypes.STRING(255), allowNull: false },
      original_filename: { type: DataTypes.STRING(255), allowNull: true },
      mime_type: { type: DataTypes.STRING(100), allowNull: false, defaultValue: "image/png" },
      file_size: { type: DataTypes.INTEGER, allowNull: false },
      sha256: { type: DataTypes.STRING(64), allowNull: false },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      activated_at: { type: DataTypes.DATE, allowNull: true },
      uploaded_by: { type: DataTypes.UUID, allowNull: true },
      updated_by: { type: DataTypes.UUID, allowNull: true },
      ...timestampsSnake,
    });
  } else {
    await addColumnIfMissing(queryInterface, "official_signatures", "kode_prodi", { type: DataTypes.STRING(20), allowNull: true });
    await addColumnIfMissing(queryInterface, "official_signatures", "role_code", { type: DataTypes.STRING(100), allowNull: true });
    await addColumnIfMissing(queryInterface, "official_signatures", "updated_by", { type: DataTypes.UUID, allowNull: true });
  }

  await addIndexIfMissing(queryInterface, "official_signatures", ["signature_key"], { name: "idx_official_signatures_key" });
  await addIndexIfMissing(queryInterface, "official_signatures", ["signature_key", "is_active"], { name: "idx_official_signatures_key_active" });
  await addIndexIfMissing(queryInterface, "official_signatures", ["uploaded_by"], { name: "idx_official_signatures_uploaded_by" });
  await addIndexIfMissing(queryInterface, "official_signatures", ["sha256"], { name: "idx_official_signatures_sha256" });
  await addIndexIfMissing(queryInterface, "official_signatures", ["kode_prodi"], { name: "idx_official_signatures_prodi" });
  await addIndexIfMissing(queryInterface, "official_signatures", ["signature_key", "kode_prodi", "is_active"], { name: "idx_official_signatures_key_prodi_active" });

  if (!(await tableExists(queryInterface, "hkis"))) {
    await queryInterface.createTable("hkis", {
      id: uuidPk,
      user_id: { type: DataTypes.UUID, allowNull: false },
      judul: { type: DataTypes.STRING, allowNull: false },
      jenis_hki: { type: DataTypes.STRING, allowNull: false },
      sub_jenis_ciptaan: { type: DataTypes.STRING, allowNull: true },
      nomor_permohonan: { type: DataTypes.STRING, allowNull: true },
      tanggal_permohonan: { type: DataTypes.DATE, allowNull: true },
      status_hki: { type: DataTypes.STRING, allowNull: true },
      inventor: { type: DataTypes.TEXT, allowNull: false },
      pemegang_hak: { type: DataTypes.STRING, allowNull: false },
      deskripsi: { type: DataTypes.TEXT, allowNull: true },
      file_sertifikat: { type: DataTypes.STRING, allowNull: true },
      file_dokumen_pendukung: { type: DataTypes.STRING, allowNull: true },
      file_surat_pernyataan: { type: DataTypes.STRING, allowNull: true },
      file_bukti_pengalihan: { type: DataTypes.STRING, allowNull: true },
      status: { type: DataTypes.STRING, allowNull: false, defaultValue: "Pending" },
      ...timestampsCamel,
    });
  } else {
    await addColumnIfMissing(queryInterface, "hkis", "file_surat_pernyataan", { type: DataTypes.STRING, allowNull: true });
    await addColumnIfMissing(queryInterface, "hkis", "file_bukti_pengalihan", { type: DataTypes.STRING, allowNull: true });
  }

  await addIndexIfMissing(queryInterface, "hkis", ["user_id"], { name: "idx_hkis_user_id" });
  await addIndexIfMissing(queryInterface, "hkis", ["status"], { name: "idx_hkis_status" });

  if (!(await tableExists(queryInterface, "monevs"))) {
    await queryInterface.createTable("monevs", {
      id: uuidPk,
      usulan_id: { type: DataTypes.UUID, allowNull: false },
      tgl_monev: { type: DataTypes.DATEONLY, allowNull: false },
      direktorat: { type: DataTypes.ENUM("PRPM", "PRODI", "PKA"), allowNull: false, defaultValue: "PRPM" },
      status_dokumen: { type: DataTypes.ENUM("Pending", "Uploaded", "Complete"), allowNull: false, defaultValue: "Pending" },
      jenis_usulan: { type: DataTypes.ENUM("Penelitian", "Pengabdian"), allowNull: false },
      berita_acara: { type: DataTypes.STRING(500), allowNull: true },
      form_penilaian: { type: DataTypes.STRING(500), allowNull: true },
      ringkasan_monev: { type: DataTypes.STRING(500), allowNull: true },
      catatan: { type: DataTypes.TEXT, allowNull: true },
      created_by: { type: DataTypes.UUID, allowNull: true },
      updated_by: { type: DataTypes.UUID, allowNull: true },
      ...timestampsSnake,
    });
  } else {
    await addColumnIfMissing(queryInterface, "monevs", "berita_acara", { type: DataTypes.STRING(500), allowNull: true });
    await addColumnIfMissing(queryInterface, "monevs", "form_penilaian", { type: DataTypes.STRING(500), allowNull: true });
    await addColumnIfMissing(queryInterface, "monevs", "ringkasan_monev", { type: DataTypes.STRING(500), allowNull: true });
    await addColumnIfMissing(queryInterface, "monevs", "updated_by", { type: DataTypes.UUID, allowNull: true });
  }

  await addIndexIfMissing(queryInterface, "monevs", ["usulan_id"], { name: "monevs_usulan_id_index" });
  await addIndexIfMissing(queryInterface, "monevs", ["tgl_monev"], { name: "monevs_tgl_monev_index" });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  if (await tableExists(queryInterface, "monevs")) await queryInterface.dropTable("monevs");
  if (await tableExists(queryInterface, "hkis")) await queryInterface.dropTable("hkis");
  if (await tableExists(queryInterface, "official_signatures")) await queryInterface.dropTable("official_signatures");
}
