import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getCurrentProfile } from "@/lib/supabase/server";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Collecte de cannettes – Saint-Charles-de-Drummond",
  description: "Demande une collecte de cannettes à domicile.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#db2777",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile().catch(() => null);
  return (
    <html lang="fr">
      <body className="flex min-h-screen flex-col">
        <Nav profile={profile} />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">{children}</main>
        <footer className="px-4 py-6 text-center text-xs text-gray-400">
          Collecte de cannettes · Saint-Charles-de-Drummond · Merci de votre soutien 💚
        </footer>
      </body>
    </html>
  );
}
