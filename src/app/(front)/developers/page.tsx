import type { Metadata } from "next";
import EcosystemServicePage from "@/components/EcosystemServicePage";
import { requirePageAlumni } from "@/lib/admin-auth";
import { getServerEcosystemLinks } from "@/lib/ecosystem-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "开发者 API | Yanchuan API",
  description: "面向认证校友的统一模型 API、额度与用量入口。",
};

export default async function DevelopersPage() {
  await requirePageAlumni();
  return <EcosystemServicePage kind="api" href={getServerEcosystemLinks().api} />;
}
