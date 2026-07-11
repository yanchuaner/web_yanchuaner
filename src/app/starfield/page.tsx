import type { Metadata } from "next";
import { StarfieldExperience } from "@/components/starfield/StarfieldExperience";

export const metadata: Metadata = {
  title: "燕中星港",
  description: "燕中校友数字母港航天主题彩蛋页面",
  robots: { index: false, follow: false },
};

export default function StarfieldPage() {
  return <StarfieldExperience />;
}
