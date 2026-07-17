import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./actions";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-line flex items-center justify-between border-b px-6 py-4">
        <Link
          href="/"
          className="text-parchment-muted hover:text-parchment focus-visible:outline-gold font-mono text-xs tracking-[0.2em] uppercase focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Kam denes — admin
        </Link>
        <form action={logout} className="flex items-center gap-3">
          <span className="text-parchment-muted text-sm">{user.email}</span>
          <button
            type="submit"
            className="border-line text-parchment-muted hover:text-parchment rounded-md border px-3 py-1.5 text-sm"
          >
            Odjava
          </button>
        </form>
      </header>
      {children}
    </div>
  );
}
