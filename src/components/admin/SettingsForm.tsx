"use client";

import { useActionState, useTransition } from "react";
import { addBlockedDate, removeBlockedDate, updateSettings } from "@/actions/admin";
import type { ActionState } from "@/actions/pickups";
import { WEEKDAY_LABELS, type Settings } from "@/lib/types";
import { formatDateLong } from "@/lib/format";

export function SettingsForm({ settings, blocked }: { settings: Settings; blocked: { date: string; reason: string | null }[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateSettings, {});
  const [bState, bAction, bPending] = useActionState<ActionState, FormData>(addBlockedDate, {});
  const [busy, start] = useTransition();

  const order = [1, 2, 3, 4, 5, 6, 0]; // lundi -> dimanche

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <form action={action} className="card space-y-5">
        <div>
          <label className="label" htmlFor="child_name">
            Prénom affiché aux citoyens
          </label>
          <input id="child_name" name="child_name" defaultValue={settings.child_name} className="input" />
        </div>

        <fieldset>
          <legend className="label">Saison actuelle</legend>
          <div className="flex gap-2">
            {(["ete", "hiver"] as const).map((s) => (
              <label key={s} className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-gray-200 has-[:checked]:bg-brand-50 has-[:checked]:ring-brand-500">
                <input type="radio" name="season" value={s} defaultChecked={settings.season === s} className="accent-brand-600" />
                {s === "ete" ? "☀️ Été" : "❄️ Hiver"}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <fieldset>
            <legend className="label">Jours de collecte – été</legend>
            <div className="space-y-1">
              {order.map((d) => (
                <label key={d} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="summer_days" value={d} defaultChecked={settings.summer_days.includes(d)} className="accent-brand-600" />
                  {WEEKDAY_LABELS[d]}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="label">Jours de collecte – hiver</legend>
            <div className="space-y-1">
              {order.map((d) => (
                <label key={d} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="winter_days" value={d} defaultChecked={settings.winter_days.includes(d)} className="accent-brand-600" />
                  {WEEKDAY_LABELS[d]}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="min_notice_days">
              Préavis (jours)
            </label>
            <input id="min_notice_days" name="min_notice_days" type="number" min="0" max="14" defaultValue={settings.min_notice_days} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="max_per_day">
              Max. collectes / jour
            </label>
            <input id="max_per_day" name="max_per_day" type="number" min="1" max="100" defaultValue={settings.max_per_day} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="horizon_days">
              Réservation jusqu&apos;à (jours)
            </label>
            <input id="horizon_days" name="horizon_days" type="number" min="7" max="180" defaultValue={settings.horizon_days} className="input" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="home_address">
            Adresse de départ (maison) – pour le calcul du trajet
          </label>
          <input id="home_address" name="home_address" defaultValue={settings.home_address ?? ""} className="input" placeholder="123 rue Saint-Pierre" />
          <p className="mt-1 text-xs text-gray-500">
            Position actuelle : {settings.home_lat.toFixed(5)}, {settings.home_lng.toFixed(5)}
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="show_goal_to_citizens" defaultChecked={settings.show_goal_to_citizens} className="accent-brand-600" />
          Afficher l&apos;objectif et la barre de progression aux citoyens
        </label>

        {state.error && <p className="alert-error">{state.error}</p>}
        {state.ok && <p className="alert-success">{state.message}</p>}
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? "Enregistrement…" : "Enregistrer les paramètres"}
        </button>
      </form>

      <div className="card space-y-4">
        <div>
          <h2 className="font-bold">🚫 Dates bloquées</h2>
          <p className="text-sm text-gray-500">Vacances, examens, tempête… ces journées ne seront pas proposées aux citoyens.</p>
        </div>
        <form action={bAction} className="flex flex-wrap items-end gap-2">
          <div>
            <label className="label" htmlFor="bdate">
              Date
            </label>
            <input id="bdate" name="date" type="date" required className="input" />
          </div>
          <div className="flex-1">
            <label className="label" htmlFor="breason">
              Raison (optionnel)
            </label>
            <input id="breason" name="reason" className="input" placeholder="Vacances" />
          </div>
          <button type="submit" disabled={bPending} className="btn-secondary">
            Bloquer
          </button>
          {bState.error && <p className="alert-error w-full">{bState.error}</p>}
        </form>
        {blocked.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune date bloquée.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {blocked.map((b) => (
              <li key={b.date} className="flex items-center justify-between py-2 text-sm">
                <span className="capitalize">
                  {formatDateLong(b.date)}
                  {b.reason && <span className="text-gray-500"> · {b.reason}</span>}
                </span>
                <button disabled={busy} onClick={() => start(async () => { await removeBlockedDate(b.date); })} className="text-xs text-gray-400 hover:text-red-600">
                  Retirer
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
