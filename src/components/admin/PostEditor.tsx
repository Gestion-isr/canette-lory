"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { deletePost, savePost, togglePostPublished } from "@/actions/blog";
import { MultiImagePicker } from "@/components/admin/MultiImagePicker";
import { formatDateLong } from "@/lib/format";
import type { ActionState } from "@/actions/pickups";
import type { Post } from "@/lib/types";

export function PostEditor({ posts, today }: { posts: Post[]; today: string }) {
  const [editing, setEditing] = useState<Post | null>(null);
  const [creating, setCreating] = useState(posts.length === 0);

  return (
    <div className="space-y-5">
      {!creating && !editing && (
        <button type="button" onClick={() => setCreating(true)} className="btn-primary">
          ✍️ Écrire un article
        </button>
      )}

      {(creating || editing) && (
        <PostForm
          key={editing?.id ?? "nouveau"}
          post={editing}
          today={today}
          onDone={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      <section className="card">
        <h2 className="mb-3 text-lg font-bold">📰 Articles ({posts.length})</h2>
        {posts.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun article pour l&apos;instant.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {posts.map((p) => (
              <PostRow key={p.id} post={p} onEdit={() => { setCreating(false); setEditing(p); }} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function PostForm({ post, today, onDone }: { post: Post | null; today: string; onDone: () => void }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(savePost, {});
  const [kept, setKept] = useState<string[]>(post?.images ?? []);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      ref.current?.reset();
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={ref} action={action} className="card space-y-3">
      <h2 className="text-lg font-bold">{post ? "Modifier l'article" : "Nouvel article"}</h2>
      {post && <input type="hidden" name="id" value={post.id} />}
      <input type="hidden" name="existing_images" value={kept.join(",")} />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="title">
            Titre
          </label>
          <input id="title" name="title" required defaultValue={post?.title ?? ""} className="input" placeholder="Notre dépôt de cannettes !" />
        </div>
        <div>
          <label className="label" htmlFor="published_at">
            Date
          </label>
          <input
            id="published_at"
            name="published_at"
            type="date"
            defaultValue={post ? post.published_at.slice(0, 10) : today}
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="body">
          Texte
        </label>
        <textarea
          id="body"
          name="body"
          rows={6}
          defaultValue={post?.body ?? ""}
          className="input"
          placeholder={"Aujourd'hui on est allés porter les cannettes au dépanneur…\n\n## Un sous-titre\n\n- un point\n- un autre point"}
        />
        <p className="mt-1 text-xs text-gray-500">
          Ligne vide = nouveau paragraphe · <code>## </code> = sous-titre · <code>- </code> = liste.
        </p>
      </div>

      <div>
        <p className="label">Photos (6 maximum)</p>
        <MultiImagePicker existing={kept} onRemoveExisting={(url) => setKept((k) => k.filter((u) => u !== url))} max={6 - kept.length} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked={post ? post.published : true} className="accent-brand-600" />
        Visible par les citoyens
      </label>

      {state.error && <p className="alert-error">{state.error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Enregistrement…" : post ? "Enregistrer" : "Publier"}
        </button>
        <button type="button" onClick={onDone} className="btn-secondary">
          Annuler
        </button>
      </div>
    </form>
  );
}

function PostRow({ post, onEdit }: { post: Post; onEdit: () => void }) {
  const [busy, start] = useTransition();
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="flex min-w-0 items-center gap-3">
        {post.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.images[0]} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover ring-1 ring-black/10" />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-lg">📝</div>
        )}
        <div className="min-w-0">
          <p className="truncate font-medium">{post.title}</p>
          <p className="text-xs capitalize text-gray-500">
            {formatDateLong(post.published_at.slice(0, 10))}
            {post.images.length > 0 && ` · ${post.images.length} photo${post.images.length > 1 ? "s" : ""}`}
            {!post.published && " · 🔒 brouillon"}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onEdit} className="btn-secondary btn-sm">
          Modifier
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => start(async () => { await togglePostPublished(post.id, !post.published); })}
          className="btn-secondary btn-sm"
        >
          {post.published ? "Masquer" : "Publier"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (confirm(`Supprimer « ${post.title} » ?`)) start(async () => { await deletePost(post.id); });
          }}
          className="btn-sm text-xs text-gray-400 hover:text-red-600"
        >
          Supprimer
        </button>
      </div>
    </li>
  );
}
