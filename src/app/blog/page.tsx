import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data";
import { SimpleText } from "@/components/SimpleText";
import { formatDateLong } from "@/lib/format";
import type { Post } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const admin = createAdminClient();
  const [settings, { data }] = await Promise.all([
    getSettings(),
    admin.from("posts").select("*").eq("published", true).order("published_at", { ascending: false }).limit(50),
  ]);
  const posts = (data ?? []) as Post[];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-brand-600">Blog</p>
        <h1 className="text-3xl font-extrabold text-gray-900">Les nouvelles de {settings.child_name}</h1>
        <p className="mt-2 text-gray-600">Les collectes, les dépôts, les petites victoires — en photos.</p>
      </div>

      {posts.length === 0 ? (
        <p className="card text-sm text-gray-500">Aucun article pour l&apos;instant. Revenez bientôt !</p>
      ) : (
        <div className="space-y-6">
          {posts.map((p) => (
            <article key={p.id} className="card">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{formatDateLong(p.published_at.slice(0, 10))}</p>
              <h2 className="mt-1 text-xl font-bold text-gray-900">{p.title}</h2>

              {p.images.length > 0 && (
                <div className={`mt-3 grid gap-2 ${p.images.length === 1 ? "" : "sm:grid-cols-2"}`}>
                  {p.images.map((url) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={url}
                      src={url}
                      alt=""
                      loading="lazy"
                      className={`w-full rounded-xl object-cover ring-1 ring-black/5 ${p.images.length === 1 ? "max-h-96" : "h-48"}`}
                    />
                  ))}
                </div>
              )}

              {p.body && (
                <div className="mt-3">
                  <SimpleText text={p.body} />
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <p className="text-center text-sm text-gray-500">
        <Link href="/a-propos" className="text-brand-700 hover:underline">
          ← À propos de {settings.child_name}
        </Link>
      </p>
    </div>
  );
}
