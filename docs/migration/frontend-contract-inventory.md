# Frontend Contract Inventory

This inventory lists frontend surfaces that are likely to consume legacy backend endpoints. Before any endpoint request/response change, update the listed service/hook/type/page or prove no change is required.

Status values:

- `not_started`
- `inventory_verified`
- `frontend_update_required`
- `backend_compatible_no_change`
- `updated`
- `parity_verified`

| backend_area | endpoint_scope | frontend_service | frontend_hooks_or_context | frontend_type_or_utils | change_required | status |
| --- | --- | --- | --- | --- | --- | --- |
| auth/users | `/api/auth/*`, `/api/users/*` | `SIPRITI/src/services/auth.ts`, `SIPRITI/src/services/user.service.ts` | `SIPRITI/src/hooks/auth`, `SIPRITI/src/contexts/RBACContext.tsx` | `SIPRITI/src/utils/csrf.ts`, `SIPRITI/src/utils/secureAxios.ts`, login types | No change allowed in Phase 1 unless compatibility is documented. | inventory_verified |
| rbac | `/api/rbac/*` | `SIPRITI/src/services/rbac.service.ts` | `SIPRITI/src/contexts/RBACContext.tsx`, admin hooks | `SIPRITI/src/constants/permissions.ts` | Preserve multi-role permission union. | inventory_verified |
| master data | `/api/admin/prodi`, `/api/prodi/options`, skema, bidang-fokus, tahun-akademik, output | `prodi.service.ts`, `skema.service.ts`, `bidangfokus.service.ts`, `outputs.service.ts`, `settings.service.ts` | `useDropdownOptions.ts`, settings/admin hooks | `types/admin/*.ts`, `types/output.ts` | Preserve field names and option shapes. | inventory_verified |
| upload/files | `/api/upload/*`, `/api/upload/richtext`, `/uploads/*` | `upload.service.ts` | form/page upload hooks | `utils/fileUrl.ts`, upload form types | Preserve public URL shape and error messages. | inventory_verified |
| public content | berita, pengumuman, panduan, publicpage, carousel, landing-slider, capaian | `berita.service.ts`, `pengumuman.service.ts`, `panduan.service.ts`, `publicpage.service.ts`, `landingSlider.service.ts`, `capaian.service.ts` | landing/public page hooks | public page data/types | Preserve public GET response shapes and slug behavior. | inventory_verified |
| penelitian | `/api/penelitian/*`, `/api/usulan-penelitian/*`, nested penelitian | `usulan.service.ts`, `penelitian-proposal.service.ts`, `penelitian-landing.service.ts` | `hooks/penelitian`, `hooks/usulan` | `types/usulan/penelitian.ts`, shared usulan types | No endpoint drift allowed. | inventory_verified |
| pengabdian | `/api/pengabdian/*`, `/api/usulan-pengabdian/*`, nested pengabdian | `usulan.service.ts`, `pengabdian-proposal.service.ts`, `pengabdian-landing.service.ts` | `hooks/pengabdian`, `hooks/usulan` | `types/usulan/pengabdian.ts`, shared usulan types | No endpoint drift allowed. | inventory_verified |
| proposal sections | `/api/proposals/:id/jadwal`, `/luaran`, `/rab` | `jadwal-proposal.service.ts`, `luaran-proposal.service.ts`, `rab-proposal.service.ts` | usulan form hooks | `types/usulan/jadwal.ts`, `luaran.ts`, `rab.types.ts` | Preserve nested route contracts. | inventory_verified |
| proposal review | `/api/proposal-review/*` | `proposal-review.service.ts` | admin/review hooks | review page types | Preserve approve/reject/resubmit behavior. | inventory_verified |
| final PDF | `/api/proposal-final-pdf/*` | `proposal-final-pdf.service.ts` | PDF eligibility utilities and pages | `utils/finalProposalPdfEligibility.ts`, `utils/laporanPreview.ts` | Backend and frontend eligibility must match. | inventory_verified |
| laporan | `/api/laporan-usulan/*` | `laporan-usulan.service.ts` | laporan hooks | laporan preview/types | Preserve upload, validate, overwrite status behavior. | inventory_verified |
| hki | `/api/hki/*`, `/api/hki-review/*` | `hki.service.ts`, `hki-review.service.ts` | `hooks/hki` | `types/hki/index.ts` | Preserve submit/review/file behavior. | inventory_verified |
| monev | `/api/monev/*`, `/api/admin/monev/*` | `monev-internal.service.ts` | admin hooks | admin/monev types | Preserve admin mount behavior. | inventory_verified |
| dashboard | `/api/dashboard/*`, `/api/admin/dashboard/*` | `dashboard.service.ts`, `admin-dashboard.service.ts` | dashboard hooks | dashboard/admin types | Preserve stats field names. | inventory_verified |
| notifications/invites | `/api/notifications/*`, `/api/invites/*` | `notification.service.ts` | `hooks/notifications`, notification page hooks | notification page types | Preserve read/accept/reject behavior. | inventory_verified |
| official signatures | `/api/admin/signatures/*` | `official-signature.service.ts` | admin settings hooks | admin/signature types | Preserve `kode_prodi` scope. | inventory_verified |
| bulk import | `/api/admin/usulan/import/*` | `bulk-import.service.ts`, `usulan-admin.service.ts` | admin usulan hooks | import modal/types | Preserve template selection and tamper-safe import. | inventory_verified |

## API Client Rules

- Existing frontend uses `SIPRITI/src/utils/secureAxios.ts` and CSRF helpers. Phase 1 must not break `withCredentials` behavior.
- Any backend response envelope change must be reflected in frontend service return types.
- Public upload URLs must remain browser-loadable without frontend URL rewriting beyond existing `fileUrl` utility behavior.
