import type { Metadata } from "next";
import PrivacyClientPage from "@/components/PrivacyClientPage";

export const metadata: Metadata = {
  title: "隐私与合规 | Privacy & Compliance",
  description: "燕中校友数字母港的统一隐私、数据使用、内容边界与更正删除说明。",
};

export default function PrivacyPage() {
  return <PrivacyClientPage />;
}
