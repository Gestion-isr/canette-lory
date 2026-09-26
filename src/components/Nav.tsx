"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/actions/auth";
import type { Profile } from "@/lib/types";

type NavLink = { href: string; label: string; short?: string };

const publicLinks: NavLink[] = [
  { href: "/fonctionnement", label: "Fonctionnement" },
  { href: "/blog", label: "Blog" },
  { href: "/a-propos", label: "À propos" },
  { href: "/historique", label: "Historique" },
];
const citizenLinks: NavLink[] = [{ href: "/mon-compte", label: "Mon compte" }];
const adminLinks: NavLink[] = [
  { href: "/admin", label: "Tableau de bord", short: "Tableau" },
  { href: "/admin/collectes", label: "Collectes" },
  { href: "/admin/carte", label: "Carte & trajet", short: "Carte" },
  { href: "/admin/blog", label: "Blog (admin)", short: "Blog+" },
  { href: "/admin/citoyens", label: "Citoyens" },
  { href: "/admin/parametres", label: "Paramètres" },
];

export function Nav({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Les admins gèrent leur mot de passe dans Paramètres : pas besoin de « Mon compte »
  const links = [...publicLinks, ...(profile && !profile.is_admin ? citizenLinks : []), ...(profile?.is_admin ? adminLinks : [])];

  const linkClass = (href: string, mobile = false) =>
    `${mobile ? "block px-3 py-2" : "whitespace-nowrap px-2.5 py-1.5"} rounded-lg text-sm font-medium ${
      pathname === href ? "bg-brand-100 text-brand-800" : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <header className="sticky top-0 z-[1000] border-b border-black/5 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href={profile ? (profile.is_admin ? "/admin" : "/mon-compte") : "/"} className="flex items-center gap-2 font-bold text-brand-700">
          <span className="text-2xl">🥫</span>
          {/* En admin la barre compte 9 onglets : le logo reste court pour éviter le retour à la ligne */}
          <span className={profile?.is_admin ? "hidden" : "hidden xl:inline"}>Collecte de cannettes</span>
          <span className={profile?.is_admin ? "" : "xl:hidden"}>Cannettes</span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass(l.href)}>
              {l.short ?? l.label}
            </Link>
          ))}
          {profile ? (
            <form action={signOut}>
              <button className="ml-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm text-gray-500 hover:bg-gray-100">Déconnexion</button>
            </form>
          ) : (
            <Link href="/" className="btn-primary btn-sm ml-1 whitespace-nowrap">
              Connexion
            </Link>
          )}
        </nav>

        <button className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="border-t border-black/5 bg-white px-4 py-2 lg:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={linkClass(l.href, true)}>
              {l.label}
            </Link>
          ))}
          {profile ? (
            <form action={signOut}>
              <button className="block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-500">Déconnexion</button>
            </form>
          ) : (
            <Link href="/" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-semibold text-brand-700">
              Connexion / Inscription
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
