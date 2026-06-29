# Phase 3 Report — Workflow Parity

This report outlines the status, verification details, logic mappings, and fixes applied during **Phase 3 (Workflow Parity)** of the legacy backend porting task.

---

## 1. Status Overview

| Task | Description | Status | Verification & Fix Notes |
|---|---|---|---|
| **Task 3.1** | Add notification to `forwardWorkflowProposal` | **DONE** | Added notification to ketua proposal upon forwarding to `hibah_internal`. Altered MySQL database schema via migration to support `"forward_usulan"` type in the notifications ENUM. |
| **Task 3.2** | Verify `proposal-review.service.ts` line-by-line | **DONE** | Performed full audit against legacy. Fixed major logic gaps in user list views (`listUserStatusProposals`) and review actions (`approveProposal`, `declineProposal`) including relationship loading and message templates. |
| **Task 3.3** | Verify `proposalAccess` / `proposalDraftEditAccess` parity | **DONE** | Enhanced `getUserIdentityValues` in `proposal.policy.ts` to include `user.username` along with `user.nidn` to support both lecturer and student credentials during ownership checks. |
| **Task 3.4** | Verify HKI and laporan-usulan side-effects | **DONE** | Confirmed transactional integrity and notification parity on HKI approval/rejections. Verified report validation gates and automatic provisioning of `laporan_akhir` for `hibah_internal`. |

---

## 2. Detailed Findings & Fixes

### Task 3.1: Notification Enum Expansion
* **Findings:** The legacy backend attempts to write type `"forward_usulan"` to the notifications database table, but this value was missing from the new backend's ENUM constraints in both the TS model and the initial migrations, which would throw insert errors in production.
* **Fixes:**
  1. Created migration `20260623000000-add-forward-usulan-notification-type.ts` to execute `changeColumn` on the `notifications` table.
  2. Modified `notification.model.ts` to add `"forward_usulan"` to the model class union and initializations ENUM.
  3. Integrated `Notification.create(...)` in `forwardWorkflowProposal` in `proposal.service.ts` inside the transaction.

### Task 3.2: Proposal Review Service Logic Parity
* **Findings:** Deep line-by-line comparison revealed critical logic and field mismatches in `proposal-review.service.ts`:
  1. `listUserStatusProposals` returned raw casing for `jenis` (instead of lowercase `"penelitian"`/`"pengabdian"`).
  2. `program` was mapped to the database-internal `tipe` column instead of the legacy-parity `tipe_usulan` value.
  3. `skema` was loaded without joining the `Skema` model, and missed name extraction/fallbacks.
  4. User approved listing set the status to a hardcoded `"Unsubmit"` and missed dynamic check for uploaded files in the new `laporan_usulan` table.
  5. `approveProposal` failed to load `user` in `MemberProposal` before reading `ketua?.user?.id`, falling back incorrectly to `proposal.user_id`.
  6. Rejection/Approval notifications had simple messages and missed `catatan` in metadata.
* **Fixes:**
  1. Re-implemented `listUserStatusProposals` in `proposal-review.service.ts` to join `Skema`, `LaporanUsulan`, `User`, and `Prodi` models.
  2. Dynamically resolved `status` (`Submitted` vs `Unsubmit`) and `berkas` by scanning the child reports matching the proposal type.
  3. Joined `User` relation in `approveProposal` to safely retrieve `ketua?.user?.id`.
  4. Standardized all notification message templates and metadata payloads to fully match legacy.
  5. Swapped the hardcoded inline flags for `canEdit` and `can_edit` in `proposal-review.service.ts` with calls to the unified `resolveProposalDraftEditDecision` function to eliminate policy implementation drift.

### Task 3.3: Row-level Identity Validation
* **Findings:** `getUserIdentityValues` checked only `user.nidn`. If a student or system user logged in with a username/NRP, they would be locked out of draft edits.
* **Fixes:** Added `user.username` to the checked identities.

### Task 3.4: HKI & Reports Side-Effects
* **Findings:** Verified that `approveHKI` and `rejectHKI` in `hki.service.ts` have full parity, and `validateLaporanUsulan` in `laporan-usulan.service.ts` correctly triggers report upgrades.

---

## 3. Verification Details
* **TypeScript Compilation:** Run `npx tsc --noEmit` succeeded with **0 errors**.
* **Database Migrations:** Executed `npm run db:migrate` successfully.

---

## 4. Remaining Concerns / Plans
* None. All workflows are fully aligned with legacy logic.
