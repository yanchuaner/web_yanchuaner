import { requirePageAdmin } from "@/lib/admin-auth";
import { headers } from "next/headers";

export default async function AdminTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  if (headers().get("x-pathname") !== "/admin/login") {
    await requirePageAdmin();
  }
  return children;
}
