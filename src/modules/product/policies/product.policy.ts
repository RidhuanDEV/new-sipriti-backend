import type { PermissionName } from "../../../constants/permissions.constants.js";

export const productPolicy: {
  managePermissions: ReadonlyArray<PermissionName>;
} = {
  managePermissions: ["manage_product"],
};
