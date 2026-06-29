# SIPRITI Backend Rollback Runbook

Date: 2026-06-04

Scope: rollback from `new_sipriti_backend` to `sipriti_backend` during or after cutover. Prefer fast traffic rollback first, then database/storage restoration only if needed.

## Rollback Principles

- Protect user data before preserving the new deployment.
- Prefer reverting traffic to the known-good legacy backend when application behavior is broken but database state is still compatible.
- Use database restore for destructive/corrupting migration failures, not for ordinary app process failures.
- Do not run production `down` migrations blindly after real user writes unless the data loss impact is known.

## Rollback Decision Tree

| situation | rollback action |
| --- | --- |
| New process fails before traffic switch | keep legacy backend active; stop new process; fix offline |
| New process starts but smoke fails before traffic switch | keep legacy backend active; stop new process; inspect logs |
| Traffic switched and app-only issue appears | route traffic back to legacy backend; keep DB snapshot untouched if schema remains backward-compatible |
| Migration created bad schema before user writes | run migration undo in staging/rehearsed order or restore pre-cutover DB backup |
| Migration caused data corruption or writes happened | restore database from pre-cutover backup, then replay only approved transactions manually if needed |
| Upload storage path/files are wrong | restore upload directory backup and route traffic to legacy backend |
| Bulk import tamper behavior is unsafe | stop new backend immediately, route traffic to legacy backend, preserve uploaded import file for investigation |

## Fast Traffic Rollback

1. Disable or drain `new_sipriti_backend`.
2. Repoint reverse proxy/process manager to `sipriti_backend`.
3. Confirm legacy backend is healthy.
4. Run minimum smoke:

```text
GET /api/auth/me
POST /api/auth/login
GET /api/penelitian
GET /api/pengabdian
GET /api/berita
GET /api/dashboard/counts
```

5. Keep the failed new backend logs and request IDs for investigation.

## Database Rollback

Use this only if schema/data state is unsafe.

1. Stop all write traffic.
2. Confirm the pre-cutover database backup is available and readable.
3. Restore the backup to the production schema or a replacement schema.
4. Repoint `DATABASE_URL` to the restored schema if using a replacement database.
5. Restart legacy backend.
6. Run login, proposal list/detail, public content, and upload/static smoke.

### Migration Undo

`npm.cmd run db:migrate:undo` is acceptable only before production traffic writes to the migrated schema. For production incidents after writes, prefer database restore because Phase 2-5 migrations are broad and include additive workflow tables/permissions.

## SQL Patch Rollback Notes

SQL patches are intentionally idempotent and mostly additive. Manual rollback should be explicit:

- permission patches: delete only Phase-specific permissions after confirming no role mapping still depends on them;
- schema patches: drop newly-created tables only when there are no production writes to preserve;
- index additions: safe to leave in place unless they cause a proven issue;
- `user_roles`: do not drop if legacy users have already been mapped to multi-role state and the legacy backend can tolerate the table.

Production SQL rollback must be reviewed against the backup and the exact applied patch list.

## Upload Storage Rollback

1. Stop new backend writes.
2. Restore the pre-cutover upload directory backup.
3. Confirm static URLs:

```text
/uploads/berita/<known-file>
/uploads/images/<known-file>
/uploads/proposals/<known-file>
/uploads/laporan-akhir/<known-file>
```

4. Restart legacy backend with its original upload root.

## Post-Rollback Validation

After rollback, verify:

- valid user can login and `/api/auth/me` returns legacy user shape;
- public content list/detail endpoints render in frontend;
- proposal list/detail and submit pages load;
- upload/static file reads work;
- dashboard counts load;
- audit log viewer still loads for admin;
- no new backend process is still receiving traffic.

## Incident Follow-Up

Capture:

- rollback start/end time;
- trigger route and request ID;
- database backup name;
- upload backup name;
- applied migrations and SQL patches;
- frontend-visible symptom;
- whether user data was written after cutover;
- next fix owner and required parity test before retrying.
