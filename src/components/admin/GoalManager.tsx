"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { addGoal, deleteGoal, markGoalAchieved, moveGoal, updateGoalImage } from "@/actions/admin";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { GoalProgressBar } from "@/components/GoalProgressBar";
import { formatMoney } from "@/lib/format";
import type { ActionState } from "@/actions/pickups";
import type { Funds, GoalProgress } from "@/lib/types";

export function GoalManager({ goals, funds, surplus }: { goals: GoalProgress[]; funds: Funds; surplus: number }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(addGoal, {});
  const [open, setOpen] = useState(goals.length === 0);
  const [busy, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setOpen(false);
    }
  }, [state]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold">🎯 Objectifs</h2>
        <p className="text-xs text-gray-500">
          Cagnotte : <strong className="text-brand-700">{formatMoney(funds.available)}</strong>
          {funds.spent_amount > 0 && <> · {formatMoney(funds.spent_amount)} déjà dépensés</>}
        </p>
      </div>

      {goals.length === 0 && !open && <p className="text-sm text-gray-500">Aucun objectif actif.</p>}

      <ul className="space-y-4">
        {goals.map((g, i) => (
          <li key={g.id} className="rounded-xl bg-gray-50 p-3 ring-1 ring-black/5">
            <GoalProgressBar goal={g} compact rank={goals.length > 1 ? i + 1 : undefined} />
            <GoalActions goal={g} index={i} count={goals.length} busy={busy} start={start} />
          </li>
        ))}
      </ul>

      {surplus > 0.001 && goals.length > 0 && (
        <p className="rounded-xl bg-brand-50 px-3 py-2 text-xs text-brand-800 ring-1 ring-brand-200">
          🎉 Tous les objectifs sont financés, il reste {formatMoney(surplus)} en surplus. Ajoute un nouvel objectif !
        </p>
      )}

      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="btn-secondary btn-sm">
          ➕ Ajouter un objectif
        </button>
      ) : (
        <form ref={formRef} action={action} className="space-y-3 rounded-xl bg-gray-50 p-4 ring-1 ring-black/5">
          <p className="text-sm font-semibold">Nouvel objectif</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="title">
                Nom
              </label>
              <input id="title" name="title" required className="input" placeholder="Patins à roues alignées" />
            </div>
            <div>
              <label className="label" htmlFor="target_amount">
                Montant cible ($)
              </label>
              <input id="target_amount" name="target_amount" type="number" step="0.01" min="1" required className="input" placeholder="200" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="image">
              Photo <span className="font-normal text-gray-400">(optionnel)</span>
            </label>
            <ImagePicker />
          </div>
          <p className="text-xs text-gray-500">Il sera placé en dernier dans l&apos;ordre de priorité ; tu pourras le remonter avec les flèches.</p>
          {state.error && <p className="alert-error">{state.error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? "…" : "Ajouter"}
            </button>
            {goals.length > 0 && (
              <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
                Annuler
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

function GoalActions({
  goal,
  index,
  count,
  busy,
  start,
}: {
  goal: GoalProgress;
  index: number;
  count: number;
  busy: boolean;
  start: (cb: () => Promise<void>) => void;
}) {
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoState, photoAction, photoPending] = useActionState<ActionState, FormData>(updateGoalImage, {});
  useEffect(() => {
    if (photoState.ok) setPhotoOpen(false);
  }, [photoState]);
  const done = goal.raised_amount >= goal.target_amount;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {count > 1 && (
          <>
            <button
              type="button"
              disabled={busy || index === 0}
              onClick={() => start(async () => { await moveGoal(goal.id, "up"); })}
              className="btn-secondary btn-sm"
              title="Monter en priorité"
            >
              ↑
            </button>
            <button
              type="button"
              disabled={busy || index === count - 1}
              onClick={() => start(async () => { await moveGoal(goal.id, "down"); })}
              className="btn-secondary btn-sm"
              title="Descendre"
            >
              ↓
            </button>
          </>
        )}
        <button type="button" onClick={() => setPhotoOpen((o) => !o)} className="btn-secondary btn-sm">
          📷 {goal.image_url ? "Photo" : "Ajouter une photo"}
        </button>
        {done && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (confirm(`Marquer « ${goal.title} » comme atteint ? ${formatMoney(goal.target_amount)} seront retirés de la cagnotte.`))
                start(async () => { await markGoalAchieved(goal.id); });
            }}
            className="btn-primary btn-sm"
          >
            🎉 Atteint !
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (confirm(`Supprimer l'objectif « ${goal.title} » ?`)) start(async () => { await deleteGoal(goal.id); });
          }}
          className="btn-sm ml-auto text-xs text-gray-400 hover:text-red-600"
        >
          Supprimer
        </button>
      </div>

      {photoOpen && (
        <form action={photoAction} className="space-y-2 rounded-lg bg-white p-3 ring-1 ring-black/5">
          <input type="hidden" name="id" value={goal.id} />
          <ImagePicker id={`photo-${goal.id}`} />
          {photoState.error && <p className="alert-error">{photoState.error}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={photoPending} className="btn-primary btn-sm">
              {photoPending ? "Envoi…" : "Enregistrer la photo"}
            </button>
            {goal.image_url && (
              <button type="submit" name="remove" value="1" disabled={photoPending} className="btn-danger btn-sm">
                Retirer
              </button>
            )}
            <button type="button" onClick={() => setPhotoOpen(false)} className="btn-secondary btn-sm">
              Fermer
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
