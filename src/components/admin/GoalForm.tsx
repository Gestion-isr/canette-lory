"use client";

import { useActionState, useState, useTransition } from "react";
import { includeAllDepositsInGoal, markGoalAchieved, setGoal } from "@/actions/admin";
import { formatDateLong, formatMoney } from "@/lib/format";
import type { ActionState } from "@/actions/pickups";
import type { GoalProgress } from "@/lib/types";

export function GoalForm({ goal, today }: { goal: GoalProgress | null; today: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(setGoal, {});
  const [open, setOpen] = useState(!goal);
  const [achieving, startAchieve] = useTransition();

  const excluded = goal ? goal.total_amount - goal.raised_amount : 0;

  return (
    <div className="space-y-3">
      {goal && excluded > 0.001 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-sun-400/20 px-3 py-2 text-xs text-gray-800 ring-1 ring-sun-500/40">
          <span>
            ⚠️ {formatMoney(excluded)} de dépôts datés d&apos;avant le {formatDateLong(goal.started_at)} ne sont pas comptés dans cet objectif.
          </span>
          <button
            type="button"
            disabled={achieving}
            onClick={() => startAchieve(async () => { await includeAllDepositsInGoal(goal.goal_id); })}
            className="btn-secondary btn-sm"
          >
            Les inclure
          </button>
        </div>
      )}
      {goal && !open && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setOpen(true)} className="btn-secondary btn-sm">
            🎯 Nouvel objectif
          </button>
          {goal.raised_amount >= goal.target_amount && (
            <button
              type="button"
              disabled={achieving}
              onClick={() => {
                if (confirm("Marquer cet objectif comme atteint ? Il sera archivé.")) startAchieve(async () => { await markGoalAchieved(goal.goal_id); });
              }}
              className="btn-primary btn-sm"
            >
              🎉 Objectif atteint !
            </button>
          )}
        </div>
      )}

      {open && (
        <form action={action} className="space-y-3 rounded-xl bg-gray-50 p-4 ring-1 ring-black/5">
          <p className="text-sm font-semibold">Définir l&apos;objectif</p>
          <div>
            <label className="label" htmlFor="title">
              Nom
            </label>
            <input id="title" name="title" required className="input" placeholder="Trottinette électrique" defaultValue={goal ? "" : "Trottinette électrique"} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="target_amount">
                Montant cible ($)
              </label>
              <input id="target_amount" name="target_amount" type="number" step="0.01" min="1" required className="input" placeholder="350" />
            </div>
            <div>
              <label className="label" htmlFor="started_at">
                Compter les dépôts à partir du
              </label>
              <input id="started_at" name="started_at" type="date" defaultValue={today} required className="input" />
            </div>
          </div>
          {state.error && <p className="alert-error">{state.error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? "…" : "Enregistrer"}
            </button>
            {goal && (
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
