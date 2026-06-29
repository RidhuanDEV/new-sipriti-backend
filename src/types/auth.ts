export interface AuthenticatedRole {
  id: string;
  name: string;
}

export interface AuthenticatedProdi {
  id: string;
  kodeProdi: string;
  namaProdi: string;
}

export interface AuthenticatedUserContext {
  id: string;
  name: string;
  username: string;
  email: string | null;
  nidn: string | null;
  roleId: string | null;
  roles: ReadonlyArray<AuthenticatedRole>;
  permissions: ReadonlyArray<string>;
  prodi: AuthenticatedProdi | null;
}

export interface AuthCookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
  path: string;
  maxAge?: number;
  domain?: string;
}
