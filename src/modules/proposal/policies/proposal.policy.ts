import { Op } from "sequelize";
import { HttpError } from "../../../core/errors/http-error.js";
import { MemberProposal } from "../member-proposal.model.js";
import { HakiProposal, type ProposalTipeUsulan } from "../proposal.model.js";
import type { AuthenticatedUserContext } from "../../../types/auth.js";
import {
  getPrimaryRoleName,
  getUserProdiKode,
  hasPermission,
  isAdminUser,
  TIPE_USULAN_PENGABDIAN,
  TIPE_USULAN_PENELITIAN,
} from "../proposal.helpers.js";

const COORDINATOR_ROLE_BY_TIPE: Record<ProposalTipeUsulan, string> = {
  [TIPE_USULAN_PENELITIAN]: "koordinator_penelitian",
  [TIPE_USULAN_PENGABDIAN]: "koordinator_pengabdian",
};

const MANAGE_PERMISSION_BY_TIPE: Record<ProposalTipeUsulan, string> = {
  [TIPE_USULAN_PENELITIAN]: "manage_penelitian",
  [TIPE_USULAN_PENGABDIAN]: "manage_pengabdian",
};

interface ProposalAccessDecisionInput {
  isOwner: boolean;
  isAdmin: boolean;
  hasRequiredPermission: boolean;
  hasProdiPermission: boolean;
  isCoordinator: boolean;
  hasPermissionIntent: boolean;
}

export function canAccessProposalWithPermissionIntent(input: ProposalAccessDecisionInput): boolean {
  if (!input.hasPermissionIntent) {
    return true;
  }

  if (input.isOwner || input.isAdmin) {
    return true;
  }

  if (!input.hasRequiredPermission && !input.hasProdiPermission) return true;

  return input.hasProdiPermission && input.isCoordinator;
}

function getUserIdentityValues(user: AuthenticatedUserContext): string[] {
  return [user.nidn ?? "", user.username ?? ""].map((value) => value.trim()).filter((value) => value.length > 0);
}

export function isCoordinatorForProposal(user: AuthenticatedUserContext, proposal: HakiProposal): boolean {
  let tipeUsulan: "Penelitian" | "Pengabdian" | null = null;
  if (proposal.tipe_usulan === "Penelitian") tipeUsulan = "Penelitian";
  if (proposal.tipe_usulan === "Pengabdian") tipeUsulan = "Pengabdian";
  if (!tipeUsulan) return false;
  const expectedRole = COORDINATOR_ROLE_BY_TIPE[tipeUsulan];
  const userProdiKode = getUserProdiKode(user);
  return Boolean(expectedRole && getPrimaryRoleName(user) === expectedRole && userProdiKode && userProdiKode === proposal.prodi_pengusul);
}

async function getAcceptedMembership(proposalId: string, user: AuthenticatedUserContext): Promise<MemberProposal | null> {
  const identities = getUserIdentityValues(user);
  if (identities.length === 0) return null;
  return MemberProposal.findOne({
    where: {
      haki_proposal_id: proposalId,
      no_identitas: { [Op.in]: identities },
      status_invite: "accepted",
    },
    attributes: ["id", "peran", "status_invite", "no_identitas"],
  });
}

export async function loadProposalOrThrow(proposalId: string): Promise<HakiProposal> {
  const proposal = await HakiProposal.findByPk(proposalId, {
    attributes: ["id", "judul", "tipe", "tipe_usulan", "prodi_pengusul", "status_usulan", "user_id"],
  });
  if (!proposal) throw HttpError.notFound("Proposal tidak ditemukan");
  return proposal;
}

export async function canViewProposal(proposal: HakiProposal, user: AuthenticatedUserContext): Promise<boolean> {
  if (isAdminUser(user)) return true;
  if (proposal.user_id === user.id) return true;
  if (isCoordinatorForProposal(user, proposal)) return true;
  const membership = await getAcceptedMembership(proposal.id, user);
  return Boolean(membership);
}

export async function assertCanViewProposal(proposalId: string, user: AuthenticatedUserContext): Promise<HakiProposal> {
  const proposal = await loadProposalOrThrow(proposalId);
  if (!(await canViewProposal(proposal, user))) {
    throw HttpError.forbidden("Anda tidak memiliki akses ke proposal ini");
  }
  return proposal;
}

export async function assertProposalAccess(
  proposalId: string,
  user: AuthenticatedUserContext,
  options: { requiredPermissions?: string[]; prodiPermissions?: string[] } = {},
): Promise<HakiProposal> {
  const proposal = await assertCanViewProposal(proposalId, user);
  const requiredPermissions = options.requiredPermissions ?? [];
  const prodiPermissions = options.prodiPermissions ?? [];

  if (requiredPermissions.length === 0 && prodiPermissions.length === 0) return proposal;

  const hasRequiredPermission = requiredPermissions.some((permission) => hasPermission(user, permission));
  const hasProdiPermission = prodiPermissions.some((permission) => hasPermission(user, permission));
  const isOwner = proposal.user_id === user.id;
  const isAdmin = isAdminUser(user);
  const isCoordinator = isCoordinatorForProposal(user, proposal);

  if (
    canAccessProposalWithPermissionIntent({
      isOwner,
      isAdmin,
      hasRequiredPermission,
      hasProdiPermission,
      isCoordinator,
      hasPermissionIntent: true,
    })
  ) {
    return proposal;
  }

  throw HttpError.forbidden("Anda tidak memiliki akses ke proposal ini");
}

export function resolveProposalDraftEditDecision(params: {
  user: AuthenticatedUserContext;
  proposalStatus: string;
  proposalTipeUsulan: ProposalTipeUsulan;
  isKetua: boolean;
  isWithinUserProdi: boolean;
}): { allowed: boolean; actor: string; message: string | null } {
  if (params.isKetua) {
    if (["Draft", "Declined"].includes(params.proposalStatus)) {
      return { allowed: true, actor: "ketua", message: null };
    }
    return { allowed: false, actor: "none", message: "Usulan yang sudah difinalisasi tidak dapat diedit." };
  }

  if (isAdminUser(params.user)) {
    if (params.proposalStatus === "Draft") return { allowed: true, actor: "admin", message: null };
    return { allowed: false, actor: "none", message: "Admin hanya dapat mengedit usulan yang masih berstatus Draft." };
  }

  const expectedRole = COORDINATOR_ROLE_BY_TIPE[params.proposalTipeUsulan];
  const managePermission = MANAGE_PERMISSION_BY_TIPE[params.proposalTipeUsulan];
  const isCoordinator =
    getPrimaryRoleName(params.user) === expectedRole &&
    hasPermission(params.user, "edit_usulan_by_prodi") &&
    hasPermission(params.user, managePermission) &&
    params.isWithinUserProdi;

  if (isCoordinator) {
    if (params.proposalStatus === "Draft") return { allowed: true, actor: "koordinator", message: null };
    return {
      allowed: false,
      actor: "none",
      message: "Koordinator hanya dapat mengedit usulan program studi yang masih berstatus Draft.",
    };
  }

  return { allowed: false, actor: "none", message: "Anda tidak memiliki akses untuk mengedit usulan ini." };
}
