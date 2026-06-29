# Table Migration Inventory

This inventory maps legacy Sequelize models to the target migration context. Column-level details must be verified from each legacy model and migration before the module is implemented.

Status values:

- `not_started`
- `inventory_verified`
- `migrated`
- `parity_verified`
- `deferred`

| legacy_model | table_name_source | primary_key_source | key_columns_to_verify | owner_context | new_module | migration_strategy | phase | status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| user | `src/models/user.js` | legacy model | `id`, `username`, `email`, `nidn`, `role_id`, `prodi_kode`, soft delete | identity | user/auth | Phase 2 adds nullable legacy profile/prodi compatibility columns to new schema; old DB columns are preserved | 1/2 | migrated |
| role | `src/models/role.js` | legacy model | `id`, `name`, `description`, `is_active` | identity | roles | preserve and seed from RBAC source | 1 | inventory_verified |
| permission | `src/models/permission.js` | legacy model | `id`, `name`, `description`, `module` | identity | permissions | preserve and seed from RBAC source | 1 | inventory_verified |
| rolePermission | `src/models/rolePermission.js` | legacy model | `role_id`, `permission_id` | identity | roles/permissions | preserve mapping | 1 | inventory_verified |
| userRole | `src/models/userRole.js` | legacy model | `user_id`, `role_id`, `assigned_at`, `assigned_by` | identity | roles/user | preserve multi-role relation | 1 | inventory_verified |
| prodi | `src/models/prodi.js` | legacy model | `id`, `kode_prodi`, `nama_prodi`, `jenjang` | master-data | prodi | preserve natural key behavior; create table only if missing | 2 | migrated |
| skema | `src/models/skema.js` | legacy model | `id`, `nama_skema`, `tipe`, `deskripsi`, `is_active` | master-data | skema | preserve; create table only if missing | 2 | migrated |
| bidangfokus | `src/models/bidangfokus.js` | legacy model | `id`, `nama_bidang` | master-data | bidangfokus | preserve; create table only if missing | 2 | migrated |
| tahunakademik | `src/models/tahunakademik.js` | legacy model | `id`, `tahun_mulai`, `tahun_selesai`, `semester` | master-data | tahunakademik | preserve; create table only if missing | 2 | migrated |
| output | `src/models/output.js` | legacy model | `id`, `nama_output` | master-data | output | preserve 20260430 output migration; create table only if missing | 2 | migrated |
| sertifikatmutu | `src/models/sertifikatmutu.js` | legacy model | `id`, `sertifikat_description` | master-data/content | sertifikatmutu | preserve; create table only if missing | 2 | migrated |
| uploadedfile | `src/models/uploadedfile.js` | legacy model | path, public URL, mime, size, owner metadata | storage | files/upload | preserve 20260525 metadata/backfill | 3 | migrated |
| berita | `src/models/berita.js` | legacy model | slug, title, content, image/file fields | content | berita | preserve slug migration | 3 | migrated |
| pengumuman | `src/models/pengumuman.js` | legacy model | slug, title, content, image/file fields | content | pengumuman | preserve slug migration | 3 | migrated |
| panduan | `src/models/panduan.js` | legacy model | title, content, file fields | content | panduan | preserve | 3 | migrated |
| carousel | `src/models/carousel.js` | legacy model | image/order/active fields | content | carousel | preserve | 3 | migrated |
| landingSlider | `src/models/landingSlider.js` | legacy model | desktop/mobile image fields, order/status | content | landingslider | preserve | 3 | migrated |
| deskripsicapaian | `src/models/deskripsicapaian.js` | legacy model | section key, content | content/reporting | capaian | preserve | 3 | migrated |
| kategoripublikasi | `src/models/kategoripublikasi.js` | legacy model | category fields | content/reporting | kategoripublikasi | preserve | 3 | migrated |
| publikasi | `src/models/publikasi.js` | legacy model | publication metrics/content | content/reporting | publikasi | preserve | 3 | migrated |
| mitrakerjariset | `src/models/mitrakerjariset.js` | legacy model | partner data | content/reporting | mitrakerjariset | preserve | 3 | migrated |
| productriset | `src/models/productriset.js` | legacy model | product data | content/reporting | productriset | preserve | 3 | migrated |
| penghargaanriset | `src/models/penghargaanriset.js` | legacy model | award data | content/reporting | penghargaanriset | preserve | 3 | migrated |
| hibahinternal | `src/models/hibahinternal.js` | legacy model | grant data/content | content/proposal | hibahinternal | preserve | 3 | migrated |
| hakiproposal | `src/models/hakiproposal.js` | legacy model | root proposal fields, status, tipe, revision fields | proposal | proposal | preserve, no reintroduction of dropped `tingkat` | 4 | migrated |
| memberproposal | `src/models/memberproposal.js` | legacy model | role/peran, identity, status fields | proposal | proposal | preserve status migrations | 4 | migrated |
| mahasiswa | `src/models/mahasiswa.js` | legacy model | identity fields | proposal | search-anggota/proposal | preserve | 4 | migrated |
| mitraproposal | `src/models/mitraproposal.js` | legacy model | proposal partner data | proposal | proposal | legacy table decommission depends on current flow | 4 | inventory_verified |
| penelitianproposal | `src/models/penelitianproposal.js` | legacy model | penelitian detail fields | proposal | penelitian-proposal | preserve `tbl_penelitian_proposals` migration | 4 | migrated |
| pengabdianproposal | `src/models/pengabdianproposal.js` | legacy model | pengabdian detail fields, `tingkat` source | proposal | pengabdian-proposal | preserve `tbl_pengabdian_proposals` migration | 4 | migrated |
| jadwalproposal | `src/models/jadwalproposal.js` | legacy model | month/year fields, proposal FK | proposal | jadwal-proposal | preserve final jadwal table after legacy drops | 4 | migrated |
| luaranproposal | `src/models/luaranproposal.js` | legacy model | output relation, target fields | proposal | luaran-proposal | preserve | 4 | migrated |
| rabproposal | `src/models/rabproposal.js` | legacy model | budget rows, pajak | proposal | rab-proposal | preserve pajak migration | 4 | migrated |
| substansiluaran | `src/models/substansiluaran.js` | legacy model | legacy output/substance | proposal legacy | deferred | verify active references before decommission | 4 | deferred |
| notification | `src/models/notification.js` | legacy model | user, message, read/action fields | workflow | notification | preserve | 4 | migrated |
| laporanusulan | `src/models/laporanusulan.js` | legacy model | report type/status/file fields | reporting | laporan-usulan | Phase 4 preserves forward side-effect table/model only; full laporan workflow remains Phase 5 | 4/5 | migrated for forward dependency; full workflow inventory_verified |
| officialSignature | `src/models/officialSignature.js` | legacy model | signer, file, `kode_prodi` | documents | official-signatures | preserve prodi-scoped signature migrations | 5 | inventory_verified |
| hki | `src/models/hki.js` | legacy model | HKI base data | hki | hki | preserve | 5 | inventory_verified |
| hakiproposaloutput | `src/models/hakiproposaloutput.js` | legacy model | HKI/output link | hki/proposal | hki | preserve 20260430 link table | 5 | inventory_verified |
| monev | `src/models/monev.js` | legacy model | monev schedule/upload fields | reporting | monev | preserve admin mount behavior | 5 | inventory_verified |
| auditlog | `src/models/auditlog.js` | legacy model | action/entity/user/request fields | observability | auditlog | preserve | 5 | inventory_verified |
| userhibahinternalpair | `src/models/userhibahinternalpair.js` | legacy model | user-hibah relation | proposal/content | hibahinternal | verify active references | 5 | inventory_verified |
| heroimage | `src/models/heroimage.js` | legacy model | public image fields | content legacy | publicpage | verify active references | 3 | inventory_verified |
| informasiscroll | `src/models/informasiscroll.js` | legacy model | public scrolling info | content legacy | publicpage | verify active references | 3 | inventory_verified |
| jadwalbulanan | `src/models/jadwalbulanan.js` | legacy model | schedule fields | content/reporting | publicpage/monev | verify active references | 3/5 | inventory_verified |

## Phase 5 Table Details

These rows were rechecked before Phase 5 implementation.

| table | legacy_model | key columns | active module usage | target action |
| --- | --- | --- | --- | --- |
| `laporan_usulan` | `src/models/laporanusulan.js` | `haki_proposal_id`, `jenis_laporan`, `scope_tipe`, `file_url`, `status_laporan`, `validated_by`, `validated_at` | proposal review approval side effect, laporan upload/validation, final PDF readiness | already created in Phase 4 for forward dependency; Phase 5 adds full workflow services and validator association |
| `official_signatures` | `src/models/officialSignature.js` | `signature_key`, `kode_prodi`, `signer_name`, `stored_filename`, `sha256`, `is_active`, `uploaded_by`, `updated_by` | prodi-scoped official signature CRUD and final PDF | create typed model, associations, migration, SQL patch, storage directory |
| `hkis` | `src/models/hki.js` | `user_id`, `judul`, `jenis_hki`, `status`, `status_hki`, file URL columns | user HKI CRUD and HKI review | create typed model, association to user, migration, SQL patch |
| `monevs` | `src/models/monev.js` | `usulan_id`, `tgl_monev`, `direktorat`, `status_dokumen`, `jenis_usulan`, PDF document URL fields | admin monev schedule/upload and monev status list | create typed model, association to proposal, migration, SQL patch |
| `audit_logs` | `src/models/auditlog.js` and new core audit model | legacy viewer expects `entity_type`, `old_value`, `new_value`; new audit writer stores `module`, `before`, `after` | audit log browser | keep existing core table; Phase 5 viewer maps new audit columns to legacy response keys |
| `haki_proposal_outputs` | `src/models/hakiproposaloutput.js` | `haki_proposal_id`, `output_id` | proposal/HKI output relation | already migrated in Phase 4; reused by dashboard/review/list serializers |
| `memberproposals` | `src/models/memberproposal.js` | `no_identitas`, `peran`, `status_invite`, `prodi_kode_anggota` | proposal review, dashboard, bulk import | reuse Phase 4 model; enforce hidden-sheet member selection in bulk import service |

## Phase 6 Cutover Readiness Notes

- Static migration check is covered by `npm.cmd run phase6:migration-check`.
- The local check verifies each Sequelize migration exports `up` and `down`.
- The local check verifies SQL patches contain idempotency markers and that patches declaring foreign keys include `FOREIGN_KEY_CHECKS` guards.
- Static checks passed for 16 migrations and 11 SQL patches.
- Runtime migration rerun previously reported no pending migrations against `new_sipriti_db`.
- DB-backed parity previously passed the covered Phase 6 old/new matrix using `sipriti_db` and `new_sipriti_db`.
- Current machine-level DB availability should still be checked before final deployment because MySQL service state is environment dependent.

## Migration Files Already Present In Legacy

The migration strategy must account for these legacy schema steps:

- `2026_03_05_000000_base_initialize_schema.js`
- `20260306000002-create-audit-logs-table.js`
- `20260309000001-normalize-user-prodi-relations.js`
- `20260309000002-assign-view-users-to-dosen-mahasiswa.js`
- `20260310000001-add-view-audit-log-permission.js`
- `20260417000001-update-laporan-usulan-overwrite-status.js`
- `20260420000001-create-official-signatures.js`
- `20260420000002-add-manage-signature-permission.js`
- `20260421000001-add-haki-proposal-output-link-tanggal-pengumpulan.js`
- `20260423000001-drop-haki-proposal-link-dan-tanggal-pengumpulan.js`
- `20260425000001-create-tbl-penelitian-proposals.js`
- `20260425000002-create-tbl-pengabdian-proposals.js`
- `20260425000003-create-jadwalproposals.js`
- `20260425000004-create-luaranproposals.js`
- `20260425000005-drop-tingkat-from-haki-proposals.js`
- `20260425000006-drop-dokumenpendukungproposals.js`
- `20260425144604-add-tahun-pelaksanaan-to-jadwalproposals.js`
- `20260425144623-add-status-persetujuan-to-memberproposals.js`
- `20260425220001-create-jadwal-2-tabel.js`
- `20260426200325-drop-legacy-jadwalproposals.js`
- `20260428000001-drop-substansiluaranproposals.js`
- `20260428000002-drop-mitraproposals.js`
- `20260428120000-add-pajak-to-rabproposals.js`
- `20260430000001-create-outputs.js`
- `20260430000002-create-haki-proposal-outputs.js`
- `20260430000003-drop-output-penelitian-from-haki-proposals.js`
- `20260502000001-add-status-to-memberproposals.js`
- `20260504000001-refactor-prodi-natural-key.js`
- `20260504000002-drop-legacy-prodi-id.js`
- `20260505000001-add-kode-prodi-to-official-signatures.js`
- `20260505000002-assign-manage-signature-to-kaprodi.js`
- `20260507000002-add-granular-manage-permissions.js`
- `20260507063603-add-rbac-refactor-permissions.js`
- `20260507100645-add-manage-proposal-permission.js`
- `20260508000001-add-revision-columns-to-haki-proposals.js`
- `20260511145500-add-slug-to-berita.js`
- `20260511145501-add-slug-to-pengumuman.js`
- `20260525000000-create-uploaded-files.js`
- `20260525000001-backfill-uploaded-files-metadata.js`
