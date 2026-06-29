import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema, registerSchema } from "./auth.schema.js";

test("auth login schema accepts legacy username credentials", () => {
  const parsed = loginSchema.parse({
    username: "Phase6_Admin",
    password: "password123",
  });

  assert.equal(parsed.username, "phase6_admin");
  assert.equal(parsed.password, "password123");
});

test("auth register schema accepts legacy non-uuid role_id entries", () => {
  const parsed = registerSchema.parse({
    username: "Legacy_User",
    password: "password123",
    confirmPassword: "password123",
    name: "Legacy User",
    role_id: ["legacy-role-id"],
  });

  assert.equal(parsed.username, "legacy_user");
  assert.deepEqual(parsed.role_id, ["legacy-role-id"]);
});
