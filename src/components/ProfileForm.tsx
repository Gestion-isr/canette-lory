"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { updateLocation, updateProfile } from "@/actions/profile";
import type { ActionState } from "@/actions/pickups";
import type { Profile } from "@/lib/types";
import { Map } from "@/components/Map";

type Suggestion = { label: string; lat: number; lng: number };

export function ProfileForm({ profile, center }: { profile: Profile; center: [number, number] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateProfile, {});
  const [address, setAddress] = useState(profile.address ?? "");
  const [lat, setLat] = useState<number | null>(profile.lat);
  const [lng, setLng] = useState<number | null>(profile.lng);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [savingPin, startSavePin] = useTransition();
  const [pinSaved, setPinSaved] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressTouched = useRef(false);

  // Autocomplétion d'adresse (Nominatim via /api/geocode)
  useEffect(() => {
    if (!addressTouched.current) return;
    if (debounce.current) clearTimeout(debounce.current);
    if (address.trim().length < 5) {
      setSuggestions([]);
      return;
    }
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(address)}`);
        const data = (await res.json()) as { results: Suggestion[] };
        setSuggestions(data.results ?? []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 600);
  }, [address]);

  useEffect(() => {
    if (state.ok) {
      setShowSuggestions(false);
      // Recharge les coordonnées calculées côté serveur
      if (lat == null || lng == null) window.location.reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const pick = (s: Suggestion) => {
    setAddress(shortLabel(s.label));
    setLat(s.lat);
    setLng(s.lng);
    setShowSuggestions(false);
  };

  const savePin = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    setPinSaved(false);
    startSavePin(async () => {
      const r = await updateLocation(newLat, newLng);
      if (r.ok) setPinSaved(true);
    });
  };

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <form action={action} className="space-y-3">
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
        <div className="relative">
          <label className="label" htmlFor="address">
            Adresse de la maison
          </label>
          <input
            id="address"
            name="address"
            value={address}
            onChange={(e) => {
              addressTouched.current = true;
              setAddress(e.target.value);
              setLat(null);
              setLng(null);
            }}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            className="input"
            placeholder="123 rue Saint-Pierre"
            autoComplete="off"
            required
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl bg-white py-1 text-sm shadow-lg ring-1 ring-black/10">
              {suggestions.map((s) => (
                <li key={`${s.lat},${s.lng}`}>
                  <button type="button" onMouseDown={() => pick(s)} className="block w-full px-3 py-2 text-left hover:bg-brand-50">
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-1 text-xs text-gray-500">Saint-Charles-de-Drummond, Drummondville. Le numéro et la rue suffisent.</p>
        </div>
        <input type="hidden" name="lat" value={lat ?? ""} />
        <input type="hidden" name="lng" value={lng ?? ""} />

        {state.error && <p className="alert-error">{state.error}</p>}
        {state.ok && <p className="alert-success">{state.message}</p>}
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? "Enregistrement…" : "Enregistrer mon profil"}
        </button>
      </form>

      <div>
        <p className="label">Position sur la carte</p>
        {lat != null && lng != null ? (
          <>
            <Map
              center={[lat, lng]}
              zoom={16}
              markers={[{ id: "me", lat, lng, draggable: true, onDragEnd: savePin }]}
              onClick={savePin}
              className="h-64 w-full"
            />
            <p className="mt-1 text-xs text-gray-500">
              {savingPin ? "Enregistrement…" : pinSaved ? "✅ Position enregistrée." : "Glissez le point ou cliquez sur la carte pour ajuster l'emplacement exact."}
            </p>
          </>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-2xl bg-gray-50 text-center text-sm text-gray-500 ring-1 ring-black/5">
            Entrez votre adresse et enregistrez
            <br />
            pour la voir sur la carte.
          </div>
        )}
        <p className="sr-only">{center.join(",")}</p>
      </div>
    </div>
  );
}

function shortLabel(label: string) {
  // Nominatim renvoie "123, Rue X, Quartier, Drummondville, ..." -> on garde numéro + rue
  const parts = label.split(",").map((p) => p.trim());
  if (parts.length >= 2 && /^\d/.test(parts[0])) return `${parts[0]} ${parts[1]}`;
  return parts.slice(0, 2).join(", ");
}
