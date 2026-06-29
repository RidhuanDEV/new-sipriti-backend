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
  if (!(await tableExists(queryInterface, "uploaded_files"))) {
    await queryInterface.createTable("uploaded_files", {
      id: uuidPk,
      owner_user_id: { type: DataTypes.UUID, allowNull: true },
      entity_type: { type: DataTypes.STRING(80), allowNull: false },
      entity_id: { type: DataTypes.UUID, allowNull: true },
      visibility: { type: DataTypes.ENUM("public", "private"), allowNull: false, defaultValue: "private" },
      subdir: { type: DataTypes.STRING(120), allowNull: false },
      stored_filename: { type: DataTypes.STRING(255), allowNull: false },
      original_filename: { type: DataTypes.STRING(255), allowNull: true },
      mime_type: { type: DataTypes.STRING(120), allowNull: true },
      size_bytes: { type: DataTypes.BIGINT, allowNull: true },
      sha256: { type: DataTypes.STRING(64), allowNull: true },
      status: { type: DataTypes.ENUM("active", "orphan", "deleted"), allowNull: false, defaultValue: "active" },
      created_by: { type: DataTypes.UUID, allowNull: true },
      deleted_by: { type: DataTypes.UUID, allowNull: true },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
      ...timestampsSnake,
    });
  }

  if (!(await tableExists(queryInterface, "berita"))) {
    await queryInterface.createTable("berita", {
      id: uuidPk,
      judul: { type: DataTypes.STRING, allowNull: false },
      slug: { type: DataTypes.STRING, allowNull: false, unique: true },
      isi_berita: { type: DataTypes.TEXT, allowNull: false },
      photo_url: { type: DataTypes.STRING, allowNull: true },
      file_url: { type: DataTypes.STRING, allowNull: true },
      kategori: { type: DataTypes.ENUM("Pendanaan", "Workshop", "Panduan", "Umum"), allowNull: false, defaultValue: "Umum" },
      tanggal_rilis: { type: DataTypes.DATE, allowNull: true },
      ...timestampsCamel,
    });
  } else {
    await addColumnIfMissing(queryInterface, "berita", "slug", { type: DataTypes.STRING, allowNull: true });
  }

  if (!(await tableExists(queryInterface, "pengumuman"))) {
    await queryInterface.createTable("pengumuman", {
      id: uuidPk,
      judul: { type: DataTypes.STRING, allowNull: false },
      slug: { type: DataTypes.STRING, allowNull: false, unique: true },
      isi_pengumuman: { type: DataTypes.TEXT, allowNull: false },
      gambar: { type: DataTypes.STRING, allowNull: true },
      file_lampiran: { type: DataTypes.STRING, allowNull: true },
      tanggal_rilis: { type: DataTypes.DATE, allowNull: true },
      ...timestampsCamel,
    });
  } else {
    await addColumnIfMissing(queryInterface, "pengumuman", "slug", { type: DataTypes.STRING, allowNull: true });
  }

  if (!(await tableExists(queryInterface, "panduan"))) {
    await queryInterface.createTable("panduan", {
      id: uuidPk,
      judul: { type: DataTypes.STRING, allowNull: false },
      isi_panduan: { type: DataTypes.TEXT, allowNull: false },
      thumbnail: { type: DataTypes.STRING, allowNull: true },
      file_url: { type: DataTypes.STRING, allowNull: true },
      ...timestampsCamel,
    });
  }

  if (!(await tableExists(queryInterface, "carousel"))) {
    await queryInterface.createTable("carousel", {
      id: uuidPk,
      image_url: { type: DataTypes.STRING, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
      display_order: { type: DataTypes.INTEGER, defaultValue: 0 },
      page: { type: DataTypes.STRING, allowNull: false, defaultValue: "capaian" },
      tentang_prpm_description: { type: DataTypes.TEXT, allowNull: true },
      ...timestampsCamel,
    });
  }

  if (!(await tableExists(queryInterface, "landing_slider"))) {
    await queryInterface.createTable("landing_slider", {
      id: uuidPk,
      title: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      img_desktop: { type: DataTypes.STRING, allowNull: false },
      img_mobile: { type: DataTypes.STRING, allowNull: false },
      btn_text: { type: DataTypes.STRING, allowNull: true },
      btn_link: { type: DataTypes.STRING, allowNull: true },
      btn_color: { type: DataTypes.STRING, allowNull: true },
      order_index: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      status: { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "active" },
      ...timestampsCamel,
    });
  }

  if (!(await tableExists(queryInterface, "deskripsi_capaian"))) {
    await queryInterface.createTable("deskripsi_capaian", {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      section_key: {
        type: DataTypes.ENUM("tentang_prpm", "publikasi_ilmiah", "hki_paten", "pengalaman_riset", "penghargaan_riset", "produk_riset", "sertifikasi_mutu"),
        allowNull: false,
        unique: true,
      },
      content: { type: DataTypes.TEXT, allowNull: true },
      ...timestampsCamel,
    });
  }

  if (!(await tableExists(queryInterface, "kategori_publikasi"))) {
    await queryInterface.createTable("kategori_publikasi", {
      id: uuidPk,
      nama_kategori: { type: DataTypes.STRING, allowNull: false, unique: true },
      ...timestampsSnake,
    });
  }

  if (!(await tableExists(queryInterface, "publikasi"))) {
    await queryInterface.createTable("publikasi", {
      id: uuidPk,
      tahun_akademik_id: { type: DataTypes.UUID, allowNull: false },
      kategori_publikasi_id: { type: DataTypes.UUID, allowNull: false },
      total_publikasi: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      publikasi_ilmiah_description: { type: DataTypes.TEXT, allowNull: true },
      ...timestampsSnake,
    });
  }

  if (!(await tableExists(queryInterface, "mitra_kerja_riset"))) {
    await queryInterface.createTable("mitra_kerja_riset", {
      id: uuidPk,
      nama_mitra: { type: DataTypes.STRING, allowNull: false },
      mitra_description: { type: DataTypes.TEXT, allowNull: true },
      ...timestampsCamel,
    });
  }

  if (!(await tableExists(queryInterface, "product_riset"))) {
    await queryInterface.createTable("product_riset", {
      id: uuidPk,
      nama_produk: { type: DataTypes.STRING, allowNull: false },
      produk_riset_description: { type: DataTypes.TEXT, allowNull: true },
      ...timestampsCamel,
    });
  }

  if (!(await tableExists(queryInterface, "penghargaan_riset"))) {
    await queryInterface.createTable("penghargaan_riset", {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      penghargaan_description: { type: DataTypes.TEXT, allowNull: true },
      penghargaan_image: { type: DataTypes.STRING(500), allowNull: true },
      ...timestampsSnake,
    });
  }

  if (!(await tableExists(queryInterface, "hibahinternal"))) {
    await queryInterface.createTable("hibahinternal", {
      id: uuidPk,
      tipe_hibah: { type: DataTypes.STRING, allowNull: false },
      judul_hibah: { type: DataTypes.STRING, allowNull: false },
      susunan_tim_hibah: { type: DataTypes.TEXT, allowNull: false, defaultValue: "[]" },
      tahun_hibah: { type: DataTypes.STRING, allowNull: false },
      dana_hibah: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      pengalaman_riset_description: { type: DataTypes.TEXT, allowNull: true },
      ...timestampsCamel,
    });
  }

  if (!(await tableExists(queryInterface, "userhibahinternalpair"))) {
    await queryInterface.createTable("userhibahinternalpair", {
      user_id: { type: DataTypes.UUID, allowNull: false },
      hibah_internal_id: { type: DataTypes.UUID, allowNull: false },
    });
  }

  await addIndexIfMissing(queryInterface, "uploaded_files", ["owner_user_id"], { name: "idx_uploaded_files_owner" });
  await addIndexIfMissing(queryInterface, "uploaded_files", ["entity_type", "entity_id"], { name: "idx_uploaded_files_entity" });
  await addIndexIfMissing(queryInterface, "uploaded_files", ["visibility", "status"], { name: "idx_uploaded_files_visibility_status" });
  await addIndexIfMissing(queryInterface, "uploaded_files", ["subdir", "stored_filename"], { name: "uniq_uploaded_files_storage_path", unique: true });
  await addIndexIfMissing(queryInterface, "berita", ["slug"], { name: "idx_berita_slug", unique: true });
  await addIndexIfMissing(queryInterface, "berita", ["kategori"], { name: "idx_berita_kategori" });
  await addIndexIfMissing(queryInterface, "berita", ["createdAt"], { name: "idx_berita_createdAt" });
  await addIndexIfMissing(queryInterface, "pengumuman", ["slug"], { name: "idx_pengumuman_slug", unique: true });
  await addIndexIfMissing(queryInterface, "deskripsi_capaian", ["section_key"], { name: "idx_deskripsi_capaian_section_key", unique: true });
  await addIndexIfMissing(queryInterface, "publikasi", ["tahun_akademik_id"], { name: "idx_publikasi_tahun_akademik" });
  await addIndexIfMissing(queryInterface, "publikasi", ["kategori_publikasi_id"], { name: "idx_publikasi_kategori" });
  await addIndexIfMissing(queryInterface, "userhibahinternalpair", ["user_id", "hibah_internal_id"], { name: "uniq_user_hibahinternal_pair", unique: true });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  for (const tableName of [
    "userhibahinternalpair",
    "uploaded_files",
    "publikasi",
    "kategori_publikasi",
    "deskripsi_capaian",
    "landing_slider",
    "carousel",
    "hibahinternal",
    "penghargaan_riset",
    "product_riset",
    "mitra_kerja_riset",
    "panduan",
    "pengumuman",
    "berita",
  ]) {
    if (await tableExists(queryInterface, tableName)) {
      await queryInterface.dropTable(tableName);
    }
  }
}
