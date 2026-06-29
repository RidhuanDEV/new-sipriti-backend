# Phase 6 Parity Report

Date: 2026-06-05

Verdict: locally cutover-ready for the covered Phase 6 DB-backed parity matrix and the previously reported gap endpoint matrix, with one documented legacy runtime defect not copied.

The old backend used `sipriti_db`; the new backend used `new_sipriti_db`; old/new parity servers were started on separate ports to avoid port conflicts.

## Scope

This report compares legacy `sipriti_backend` and target `new_sipriti_backend` for frontend-critical SIPRITI flows and the endpoint surfaces that were previously reported as Phase 6 gaps. Phase 6 is cutover readiness, not new feature work; behavior differences are treated as bugs unless explicitly documented.

## Environment

| item | value |
| --- | --- |
| Legacy DB | `mysql://root@localhost:3306/sipriti_db` |
| New DB | `mysql://root@localhost:3306/new_sipriti_db` |
| Legacy backend parity port | custom non-conflicting local port |
| New backend parity port | custom non-conflicting local port |
| New backend env | `new_sipriti_backend/.env` |

## Fixture Status

| fixture | command/status | result |
| --- | --- | --- |
| Schema migrations | `npm.cmd run db:migrate` and migration static checks | 16 migration files tracked; no destructive schema drift expected |
| SQL patches | `npm.cmd run phase6:migration-check` | 11 SQL patches passed static checks |
| Seeder idempotency | `npm.cmd run db:seed` and previous reruns | idempotent RBAC seeding fixed and verified |
| Legacy fixture copy | `npm.cmd run phase6:copy-legacy-fixture` | copied compatible rows from `sipriti_db` into `new_sipriti_db`; summary included users, roles, permissions, role-permission mappings, master data, public content, proposals, proposal members, laporan rows, and audit logs |
| RBAC metadata backfill | fixture copy plus 2026-06-05 migration/SQL patch | permission metadata refreshed so legacy grouping does not drift into an `other` bucket |

## Critical Flow Matrix

| group | checked endpoints | parity status |
| --- | --- | --- |
| Auth | `/api/auth/login`, `/api/auth/me`, `/api/users/me`, `/api/users/search`, `/api/users/admin/list`, `/api/auth/logout` | passed |
| Public content | `/api/berita`, `/api/pengumuman`, `/api/panduan`, `/api/publicpage/berita` | passed |
| Master data | `/api/prodi/options`, `/api/skema/options`, `/api/bidang-fokus/options` | passed |
| Proposal options/search | `/api/penelitian/options`, `/api/pengabdian/options`, `/api/usulan/search-anggota` | passed |
| Dashboard | `/api/dashboard/counts`, `/api/admin/dashboard/stats` | passed |
| Audit logs | `/api/audit-logs` | passed |
| Notifications | `/api/notifications/unread-count` | passed |

The generated fixture `docs/migration/phase6-http-parity-results.json` reports `total: 20` and `failed: 0`.

## Previous-Gap Manual Matrix

| group | checked endpoints | status |
| --- | --- | --- |
| Root | `GET /api/` | passed |
| Auth register | `POST /api/auth/register` legacy runtime validation cases | passed |
| Auth profile/password/admin | `PUT /api/auth/change-password`, `PUT /api/auth/profile`, admin detail/update/deactivate/restore and aliases | passed |
| RBAC compatibility | permissions, roles, role permissions, role users, RBAC users, user-role assignment endpoints | passed |
| Admin usulan | list, statistics, detail | passed with documented legacy defect for list |
| Products | list/create/detail/update/delete | passed |

Manual previous-gap parity completed with `total: 22` and `failed: 0`. The only documented difference is legacy `GET /api/admin/usulan` returning HTTP 500 locally because `TahunAkademik` is not defined in the old service; the new backend returns the working endpoint response.

## Verification Evidence

| command | result |
| --- | --- |
| `npm.cmd run db:migrate` | exit 0, no migrations were executed, database schema was already up to date |
| `npm.cmd run build` | exit 0 |
| `npm.cmd run api-docs` | exit 0, synced 203 Zod schemas |
| `npm.cmd test` | exit 0, 14 tests passed |
| `npm.cmd run phase6:migration-check` | exit 0, 16 migrations and 11 SQL patches passed static checks |
| `npm.cmd run phase6:smoke` | exit 0, 30 route/guard checks and 0 failed |
| `npm.cmd run phase6:http-parity` | exit 0, 20 old/new parity checks and 0 failed |

## Differences Found And Fixed

| gap | status | summary |
| --- | --- | --- |
| GAP-001 | fixed | RBAC seeder was not idempotent after permission migrations |
| GAP-002 | fixed | stale generated `dist/database/seeders/rbac-source.js` was executed as a seeder |
| GAP-003 | fixed | `new_sipriti_db` initially had schema but no legacy fixture data |
| GAP-004 | fixed | auth login request/response drifted from legacy username-based contract |
| GAP-005 | fixed | global Sequelize `paranoid` default queried missing `deleted_at` columns |
| GAP-006 | fixed | legacy camelCase timestamp tables were queried as snake_case |
| GAP-007 | fixed | `/api/users/admin/list` exposed extra `updatedAt` |
| GAP-008 | fixed | `/api/audit-logs` returned starter audit fields instead of legacy audit contract |
| GAP-009 | fixed | first audit contract migration attempt hit legacy zero datetime and unquoted reserved identifiers |
| GAP-010 | fixed | auth register drifted from current legacy runtime validation contract |
| GAP-011 | fixed | RBAC compatibility params rejected legacy seeded string IDs |
| GAP-012 | fixed | RBAC permission metadata drifted into an `other` group |
| GAP-013 | documented legacy defect | legacy admin usulan list fails locally with missing `TahunAkademik` import; new backend intentionally keeps the working response |

Detailed anomaly evidence and fixes are tracked in `docs/migration/phase6-parity-gap.md`.

## Intentional Additions

| addition | reason | endpoint impact |
| --- | --- | --- |
| `npm.cmd run phase6:copy-legacy-fixture` | repeatable local fixture copy from `sipriti_db` to `new_sipriti_db` | none |
| `npm.cmd run phase6:http-parity` | repeatable old/new response-shape comparison for critical frontend flows | none |
| `20260604060000-add-legacy-audit-log-contract` | restores legacy audit-log response columns in the new schema | preserves `/api/audit-logs` legacy shape |
| `20260605090000-add-legacy-auth-rbac-compat` | restores legacy auth/RBAC/product/admin compatibility metadata and permission details | preserves legacy compatibility surfaces |
| `patch-04-jun-2026-phase6-legacy-audit-log-contract.sql` | manual idempotent SQL companion for the audit contract migration | none |
| `patch-05-jun-2026-legacy-auth-rbac-compat.sql` | manual idempotent SQL companion for legacy compatibility metadata | none |

## Remaining Notes

- The final parity matrix compares response status and response shape for critical frontend flows and previously missing endpoint surfaces.
- Deep file upload binaries, PDF byte-level rendering, signature files, and bulk-import tamper workbooks should still be replayed in staging or FE UAT with real operator fixtures before production cutover.
- Any future difference found by the real frontend should be treated as a bug unless explicitly approved as an intentional new backend addition.
