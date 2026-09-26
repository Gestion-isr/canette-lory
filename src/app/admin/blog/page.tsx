import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { toISODate } from "@/lib/availability";
import { PostEditor } from "@/components/admin/PostEditor";
import type { Post } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const admin = createAdminClient();
  const { data, error } = await admin.from("posts").select("*").order("published_at", { ascending: false });

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Blog</h1>
        <p className="alert-error">
          La table « posts » n&apos;existe pas encore. Exécute <code>supabase/migrations/0009_blog.sql</code> dans Supabase → SQL Editor.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Blog</h1>
          <p className="text-sm text-gray-500">Raconte les collectes, les dépôts, les objectifs atteints.</p>
        </div>
        <Link href="/blog" className="btn-secondary btn-sm">
          Voir la page publique
        </Link>
      </div>
      <PostEditor posts={(data ?? []) as Post[]} today={toISODate(new Date())} />
    </div>
  );
}
