export const AuditAction = {
  REGISTER: "REGISTER",
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  RESTORE: "RESTORE",
  ASSIGN_PERMISSIONS: "ASSIGN_PERMISSIONS",
  SUBMIT: "SUBMIT",
  FORWARD: "FORWARD",
  APPROVE: "APPROVE",
  DECLINE: "DECLINE",
} as const;

export type AuditActionType = (typeof AuditAction)[keyof typeof AuditAction];
