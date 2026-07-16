import { requirePageUser } from "@/lib/admin-auth";
import MeClientPage from "@/components/MeClientPage";

export default async function MePage() {
  const user = await requirePageUser();

  return (
    <MeClientPage
      user={{
        name: user.name,
        username: user.username,
        email: user.email,
        status: user.status,
      }}
    />
  );
}
