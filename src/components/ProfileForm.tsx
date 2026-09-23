"use client";

import { useActionState } from "react";
import { updateProfile } from "@/actions/profile";
import type { ActionState } from "@/actions/pickups";
import type { Profile } from "@/lib/types";
import { AddressPicker } from "@/components/AddressPicker";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateProfile, {});

  return (
    <form action={action} className="grid gap-5 md:grid-cols-2">
      <div className="space-y-3">
        <div>
          <label className="label" htmlFor="full_name">
            Nom complet
          </label>
          <input id="full_name" name="full_name" defaultValue={profile.full_name ?? ""} className="input" placeholder="Prénom Nom" />
        </div>
        <div>
          <label className="label" htmlFor="phone">
            Téléphone <span className="font-normal text-gray-400">(optionnel)</span>
          </label>
          <input id="phone" name="phone" defaultValue={profile.phone ?? ""} className="input" placeholder="819 555-1234" inputMode="tel" />
        </div>
        <div>
          <label className="label" htmlFor="pickup_note">
            Note pour la collecte <span className="font-normal text-gray-400">(optionnel)</span>
          </label>
          <textarea
            id="pickup_note"
            name="pickup_note"
            rows={3}
            defaultValue={profile.pickup_note ?? ""}
            maxLength={300}
            className="input"
            placeholder="Ex. : Sac près de la porte, du côté droit de la maison. Attention au chien dans la cour."
          />
          <p className="mt-1 text-xs text-gray-500">
            Cette note s&apos;affiche à chaque collecte. Vous pourrez quand même ajouter une note ponctuelle au moment de la demande.
          </p>
        </div>

        {state.error && <p className="alert-error">{state.error}</p>}
        {state.ok && <p className="alert-success">{state.message}</p>}
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? "Enregistrement…" : "Enregistrer mon profil"}
        </button>
      </div>

      <AddressPicker
        defaultValue={{ address: profile.address ?? "", lat: profile.lat, lng: profile.lng }}
        label="Adresse de la maison"
        hint="Saint-Charles-de-Drummond. Tapez le numéro et la rue, puis choisissez dans la liste."
        required
      />
    </form>
  );
}
