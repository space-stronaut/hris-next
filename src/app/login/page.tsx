import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Masuk | HRIS Ultimate" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Suspense
        fallback={
          <div className="text-center text-sm text-slate-500">Memuat...</div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
