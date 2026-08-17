import { notFound, redirect } from "next/navigation";
import Sidebar, { MobileNav } from "@/components/Sidebar";
import { getCurrentUser } from "@/lib/auth";

export default async function HrdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentUser();
  if (!session) redirect("/login");
  if (session.role !== "HRD" && session.role !== "ADMIN") notFound();

  const navProps = {
    name: session.name,
    role: session.role,
    companyName: session.companyName,
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MobileNav {...navProps} />
      <div className="flex flex-1">
        <Sidebar {...navProps} />
        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
