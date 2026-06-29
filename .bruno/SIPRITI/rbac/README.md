# RBAC (Role-Based Access Control) API

Dokumentasi endpoint untuk sistem RBAC SIPRITI.

## Overview

SIPRITI menggunakan sistem RBAC many-to-many dimana:

- Satu user bisa memiliki banyak roles
- Satu role bisa dimiliki banyak users
- Permissions di-aggregate dari semua roles yang dimiliki user

## Authentication

Semua endpoint RBAC memerlukan:

1. **JWT Cookie** - Dikirim otomatis dengan `credentials: "include"`
2. **CSRF Token** - Dikirim via header `X-CSRF-Token`

### Cara Mendapatkan CSRF Token

CSRF token tersedia di cookie `XSRF-TOKEN` (non-httpOnly):

```javascript
// Frontend JavaScript
const getCSRFToken = () => {
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "XSRF-TOKEN") {
      return decodeURIComponent(value);
    }
  }
  return null;
};

// Gunakan di fetch
fetch("/api/rbac/users/123/roles", {
  method: "POST",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    "X-CSRF-Token": getCSRFToken(),
  },
  body: JSON.stringify({ roleIds: ["role-uuid-1", "role-uuid-2"] }),
});
```

## Permission Naming Convention

Format: `{action}_{module}`

### Actions

| Prefix    | Description                                    |
| --------- | ---------------------------------------------- |
| `view_`   | Melihat/read data                              |
| `create_` | Membuat data baru                              |
| `update_` | Mengubah data existing                         |
| `delete_` | Menghapus data                                 |
| `manage_` | CRUD lengkap (view + create + update + delete) |
| `assign_` | Assign relationships (e.g., assign_roles)      |

### Contoh Permissions

```
view_users
create_users
update_users
delete_users
manage_users       # Setara dengan semua di atas

view_penelitian
create_penelitian
update_penelitian
delete_penelitian

assign_roles       # Untuk mengassign roles ke users
```

## Endpoints

| Method | Endpoint                            | Description           | Permission     |
| ------ | ----------------------------------- | --------------------- | -------------- |
| GET    | `/rbac/roles`                       | List all roles        | `assign_roles` |
| GET    | `/rbac/permissions`                 | List all permissions  | `assign_roles` |
| GET    | `/rbac/users`                       | List users with roles | `manage_users` |
| GET    | `/rbac/users/:userId/roles`         | Get user's roles      | `manage_users` |
| POST   | `/rbac/users/:userId/roles`         | Assign roles to user  | `assign_roles` |
| POST   | `/rbac/users/:userId/roles/:roleId` | Add single role       | `assign_roles` |
| DELETE | `/rbac/users/:userId/roles/:roleId` | Remove single role    | `assign_roles` |

## Response Format

### Success

```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... }
}
```

### Error

```json
{
  "success": false,
  "message": "Error description",
  "error": "Error Type"
}
```

## Frontend Integration

### AuthProvider (JWT Cookie-based)

Frontend tidak menyimpan userData di localStorage/sessionStorage.
Semua data user diambil dari `/auth/me` yang membaca JWT dari httpOnly cookie.

```typescript
// AuthProvider.tsx - Tidak ada storage
const { data: authUser } = useQuery({
  queryKey: ["auth", "me"],
  queryFn: fetchAuthUser,
  enabled: !isPublicRoute,
});

// fetchAuthUser
const fetchAuthUser = async () => {
  const response = await fetch("/api/auth/me", {
    credentials: "include", // Kirim cookie JWT
    headers: {
      "X-CSRF-Token": getCSRFToken(),
    },
  });
  return response.json();
};
```

### RBAC Context

```typescript
// Cek permission
const { can, canAny, hasRole } = useRBAC();

if (can("view_users")) {
  // Tampilkan menu users
}

if (hasRole("admin")) {
  // User adalah admin
}

if (canAny(["create_penelitian", "manage_penelitian"])) {
  // Tampilkan tombol tambah
}
```
