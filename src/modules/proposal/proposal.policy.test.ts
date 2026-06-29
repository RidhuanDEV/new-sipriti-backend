import assert from "node:assert/strict";
import test from "node:test";

import { canAccessProposalWithPermissionIntent } from "./policies/proposal.policy.js";

test("proposal access decision allows owner regardless of permission intent", () => {
  assert.equal(
    canAccessProposalWithPermissionIntent({
      isOwner: true,
      isAdmin: false,
      hasRequiredPermission: false,
      hasProdiPermission: false,
      isCoordinator: false,
      hasPermissionIntent: true,
    }),
    true,
  );
});

test("proposal access decision allows admin regardless of permission intent", () => {
  assert.equal(
    canAccessProposalWithPermissionIntent({
      isOwner: false,
      isAdmin: true,
      hasRequiredPermission: false,
      hasProdiPermission: false,
      isCoordinator: false,
      hasPermissionIntent: true,
    }),
    true,
  );
});

test("proposal access decision denies required permission without owner/admin/prodi coordinator legacy branch", () => {
  assert.equal(
    canAccessProposalWithPermissionIntent({
      isOwner: false,
      isAdmin: false,
      hasRequiredPermission: true,
      hasProdiPermission: false,
      isCoordinator: false,
      hasPermissionIntent: true,
    }),
    false,
  );
});

test("proposal access decision allows prodi permission only for matching coordinator", () => {
  assert.equal(
    canAccessProposalWithPermissionIntent({
      isOwner: false,
      isAdmin: false,
      hasRequiredPermission: false,
      hasProdiPermission: true,
      isCoordinator: true,
      hasPermissionIntent: true,
    }),
    true,
  );
});

test("proposal access decision allows related user without required/prodi permission after visibility passes", () => {
  assert.equal(
    canAccessProposalWithPermissionIntent({
      isOwner: false,
      isAdmin: false,
      hasRequiredPermission: false,
      hasProdiPermission: false,
      isCoordinator: false,
      hasPermissionIntent: true,
    }),
    true,
  );
});
