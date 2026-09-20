"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/actions/auth";
import type { Profile } from "@/lib/types";

const citizenLinks = [{ href: "/mon-compte", label: "Mon compte" }];
const adminLinks = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/collectes", label: "Collectes" },
  { href: "/admin/carte", label: "Carte & trajet" },
  { href: "/admin/citoyens", label: "Citoyens" },
  { href: "/admin/parametres", label: "Paramètres" },
];

export function Nav({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = profile ? [...citizenLinks, ...(profile.is_admin ? adminLinks : [])] : [];

  return (
    <header className="sticky top-0 z-[1000] border-b border-black/5 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href={profile ? "/mon-compte" : "/"} className="flex items-center gap-2 font-bold text-brand-700">
          <span className="text-2xl">🥫</span>
          <span className="hidden sm:inline">Collecte de cannettes</span>
          <span className="sm:hidden">Cannettes</span>
        </Link>

        {profile && (
          <>
            <nav className="hidden items-center gap-1 md:flex">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    pathname === l.href ? "bg-brand-100 text-brand-800" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
              <form action={signOut}>
                <button className="ml-2 rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100">Déconnexion</button>
              </form>
            </nav>
            <button
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
              onClick={() => setOpen((o) => !o)}
              aria-label="Menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {open ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </>
        )}
      </div>
      {profile && open && (
        <nav className="border-t border-black/5 bg-white px-4 py-2 md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                pathname === l.href ? "bg-brand-100 text-brand-800" : "text-gray-700"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <form action={signOut}>
            <button className="block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-500">Déconnexion</button>
          </form>
        </nav>
      )}
    </header>
  );
}
