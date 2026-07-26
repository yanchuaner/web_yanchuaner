import assert from "node:assert/strict";
import test from "node:test";
import { resolveActiveAdminHref } from "../src/lib/admin-nav";

const routes = [
  { href: "/admin", exact: true },
  { href: "/admin/stories" },
  { href: "/admin/stories/pending" },
  { href: "/admin/news" },
] as const;

test("nested admin route wins over its parent", () => {
  assert.equal(
    resolveActiveAdminHref("/admin/stories/pending", routes),
    "/admin/stories/pending",
  );
});

test("exact dashboard route does not match child pages", () => {
  assert.equal(resolveActiveAdminHref("/admin/users", routes), undefined);
  assert.equal(resolveActiveAdminHref("/admin", routes), "/admin");
});
