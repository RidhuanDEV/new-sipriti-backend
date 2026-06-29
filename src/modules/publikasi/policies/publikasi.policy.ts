import { PERMISSION_GROUPS } from "../../../constants/permissions.constants.js";

export const publikasiPolicy = {
  editPermission: PERMISSION_GROUPS.PUBLIKASI.EDIT,
  managePermission: PERMISSION_GROUPS.PUBLIKASI.MANAGE,
} as const;
