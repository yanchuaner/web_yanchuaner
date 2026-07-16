import type { Metadata } from "next";
import EcosystemClientPage from "@/components/EcosystemClientPage";

export const metadata: Metadata = {
  title: "燕中生态 | Yanchuan Ecosystem",
  description: "了解燕中校友数字母港的功能网络、访问边界、公益治理与共建方式。Explore the platform, privacy boundaries, governance, and ways to participate.",
};

export default function EcosystemPage() {
  return <EcosystemClientPage />;
}
