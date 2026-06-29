# Phase 3.5 Execution Report - Restore & Archive Parity

This report details the execution and completion of Phase 3.5 tasks as outlined in `PORTING_PLAN.md`.

## 1. Status of Restore Endpoints (10 Modules)

All 10 modules have been successfully updated to support soft delete recovery:
1. **Prodi**: `POST /admin/prodi/:id/restore` — **DONE**
2. **Skema**: `POST /admin/skema/:id/restore` — **DONE**
3. **Bidang Fokus**: `POST /admin/bidang-fokus/:id/restore` — **DONE**
4. **Monev Internal**: `POST /admin/monev/:id/restore` — **DONE**
5. **Official Signatures**: `POST /admin/signatures/:id/restore` — **DONE**
6. **Berita**: `POST /berita/:id/restore` — **DONE**
7. **Pengumuman**: `POST /pengumuman/:id/restore` — **DONE**
8. **Panduan**: `POST /panduan/:id/restore` — **DONE**
9. **Landing Slider**: `POST /landing-slider/:id/restore` — **DONE**
10. **HKI**: `POST /hki/:id/restore` — **DONE**

## 2. Status of Official Signatures Archive-on-Replace & Validation

- **Archive-on-replace & delete**: **DONE**
  - Implemented `archiveSignatureFile` which automatically handles file renaming with UUID + ISO timestamps and stores deleted/replaced signature files safely in the `storage/official-signatures/archive` directory.
  - Linked file archiving into both `update` (when a new file is uploaded) and `delete` service methods.
- **Validations**: **DONE**
  - Integrated validation standard for PNG extension check (case-insensitive `.png`).
  - Added constraints ensuring image dimensions are valid (`width > 0` and `height > 0`) before uploading.

## 3. Paranoid Model Updates

Every model corresponding to the 10 modules had `paranoid: true` and the `deletedAt` field added to its class properties and attributes mappings in `new_sipriti_backend/src/modules/`:
- `prodi.model.ts`
- `skema.model.ts`
- `bidangfokus.model.ts`
- `monev.model.ts`
- `official-signature.model.ts` (mapped to `deleted_at`)
- `berita.model.ts` (mapped to `deleted_at`)
- `pengumuman.model.ts` (mapped to `deleted_at`)
- `panduan.model.ts` (mapped to `deleted_at`)
- `landingslider.model.ts` (mapped to `deleted_at`)
- `hki.model.ts` (mapped to `deleted_at`)

All 10 modules now correctly match the legacy soft-delete logic.

## 4. Modified Files

### Models
- [prodi.model.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/prodi/prodi.model.ts)
- [skema.model.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/skema/skema.model.ts)
- [bidangfokus.model.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding Moment/React/PRPM/new_sipriti_backend/src/modules/bidangfokus/bidangfokus.model.ts)
- [monev.model.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/monev-internal/monev.model.ts)
- [official-signature.model.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/official-signatures/official-signature.model.ts)
- [berita.model.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/berita/berita.model.ts)
- [pengumuman.model.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/pengumuman/pengumuman.model.ts)
- [panduan.model.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/panduan/panduan.model.ts)
- [landing-slider.model.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/landingslider/landing-slider.model.ts)
- [hki.model.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/hki/hki.model.ts)

### Repositories
- [prodi.repository.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/prodi/prodi.repository.ts)
- [skema.repository.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/skema/skema.repository.ts)
- [bidangfokus.repository.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/bidangfokus/bidangfokus.repository.ts)
- [berita.repository.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/berita/berita.repository.ts)
- [pengumuman.repository.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/pengumuman/pengumuman.repository.ts)
- [panduan.repository.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/panduan/panduan.repository.ts)
- [landingslider.repository.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/landingslider/landingslider.repository.ts)

### Services
- [prodi.service.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/prodi/prodi.service.ts)
- [skema.service.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/skema/skema.service.ts)
- [bidangfokus.service.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/bidangfokus/bidangfokus.service.ts)
- [monev-internal.service.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/monev-internal/monev-internal.service.ts)
- [official-signatures.service.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/official-signatures/official-signatures.service.ts)
- [berita.service.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/berita/berita.service.ts)
- [pengumuman.service.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/pengumuman/pengumuman.service.ts)
- [panduan.service.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/panduan/panduan.service.ts)
- [landingslider.service.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/landingslider/landingslider.service.ts)
- [hki.service.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/hki/hki.service.ts)

### Controllers
- [prodi.controller.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/prodi/prodi.controller.ts)
- [skema.controller.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/skema/skema.controller.ts)
- [bidangfokus.controller.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/bidangfokus/bidangfokus.controller.ts)
- [monev-internal.controller.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/monev-internal/monev-internal.controller.ts)
- [official-signatures.controller.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/official-signatures/official-signatures.controller.ts)
- [berita.controller.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/berita/berita.controller.ts)
- [pengumuman.controller.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/pengumuman/pengumuman.controller.ts)
- [panduan.controller.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/panduan/panduan.controller.ts)
- [landingslider.controller.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/landingslider/landingslider.controller.ts)
- [hki.controller.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/hki/hki.controller.ts)

### Routes
- [prodi.routes.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/prodi/prodi.routes.ts)
- [skema.routes.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/skema/skema.routes.ts)
- [bidangfokus.routes.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/bidangfokus/bidangfokus.routes.ts)
- [monev-internal.routes.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/monev-internal/monev-internal.routes.ts)
- [official-signatures.routes.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/official-signatures/official-signatures.routes.ts)
- [berita.routes.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/berita/berita.routes.ts)
- [pengumuman.routes.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/pengumuman/pengumuman.routes.ts)
- [panduan.routes.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/panduan/panduan.routes.ts)
- [landingslider.routes.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/landingslider/landingslider.routes.ts)
- [hki.routes.ts](file:///media/ridhuan/CodingGame/Ridhuan%20Ngoding%20Moment/React/PRPM/new_sipriti_backend/src/modules/hki/hki.routes.ts)

## 5. Verification Results
- `npm run build`: Successful compiler check (0 typecheck errors).
- `npm run api-docs`: Swagger definitions generated successfully.
