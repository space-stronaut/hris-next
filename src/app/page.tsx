import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");
  redirect(
    session.role === "SUPER_ADMIN"
      ? "/super/companies"
      : session.role === "ADMIN"
      ? "/admin"
      : session.role === "HRD"
      ? "/hrd"
      : "/dashboard"
  );
}
