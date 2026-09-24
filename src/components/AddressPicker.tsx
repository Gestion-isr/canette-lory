"use client";

import { useEffect, useRef, useState } from "react";
import { Map } from "@/components/Map";

type Suggestion = { label: string; lat: number; lng: number };

export type AddressValue = { address: string; lat: number | null; lng: number | null };
export type AddressNames = { address: string; lat: string; lng: string };

const DEFAULT_NAMES: AddressNames = { address: "address", lat: "lat", lng: "lng" };

/**
 * État partagé entre le champ d'adresse et la carte.
 * Permet de placer les deux à des endroits différents du formulaire.
 */
export function useAddress(defaultValue: AddressValue) {
  const [value, setValue] = useState<AddressValue>(defaultValue);
  return { value, setValue };
}

export type AddressState = ReturnType<typeof useAddress>;

/** Champ texte avec autocomplétion (Nominatim) + champs cachés lat/lng. */
export function AddressInput({
  state,
  names = DEFAULT_NAMES,
  label = "Adresse",
  hint,
  required = false,
}: {
  state: AddressState;
  names?: AddressNames;
  label?: string;
  hint?: string;
  required?: boolean;
}) {
  const { value, setValue } = state;
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [touched, setTouched] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!touched) return;
    if (debounce.current) clearTimeout(debounce.current);
    if (value.address.trim().length < 5) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(value.address)}`);
        const data = (await res.json()) as { results?: Suggestion[] };
        setSuggestions(data.results ?? []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 600);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [value.address, touched]);

  const located = value.lat != null && value.lng != null;

  return (
    <div className="relative">
      <label className="label" htmlFor={names.address}>
        {label}
      </label>
      <input
        id={names.address}
        name={names.address}
        value={value.address}
        onChange={(e) => {
          setTouched(true);
          setValue({ address: e.target.value, lat: null, lng: null });
        }}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="input"
        placeholder="123 rue Saint-Pierre"
        autoComplete="off"
        required={required}
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl bg-white py-1 text-sm shadow-lg ring-1 ring-black/10">
          {suggestions.map((s) => (
            <li key={`${s.lat},${s.lng}`}>
              <button
                type="button"
                onMouseDown={() => {
                  setValue({ address: shortLabel(s.label), lat: s.lat, lng: s.lng });
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left hover:bg-brand-50"
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-1 text-xs text-gray-500">
        {searching
          ? "Recherche de l'adresse…"
          : located
            ? "✅ Adresse localisée. Ajustez le point sur la carte au besoin."
            : (hint ?? "Tapez le numéro et la rue, puis choisissez dans la liste.")}
      </p>
      <input type="hidden" name={names.lat} value={value.lat ?? ""} />
      <input type="hidden" name={names.lng} value={value.lng ?? ""} />
    </div>
  );
}

/** Carte affichant le point choisi, déplaçable pour ajuster l'emplacement exact. */
export function AddressMap({ state, className = "h-64" }: { state: AddressState; className?: string }) {
  const { value, setValue } = state;
  if (value.lat == null || value.lng == null) {
    return (
      <div className={`flex ${className} items-center justify-center rounded-2xl bg-gray-50 text-center text-sm text-gray-500 ring-1 ring-black/5`}>
        Choisissez une adresse dans la liste
        <br />
        pour la voir sur la carte.
      </div>
    );
  }
  return (
    <Map
      center={[value.lat, value.lng]}
      zoom={16}
      markers={[
        {
          id: "pin",
          lat: value.lat,
          lng: value.lng,
          draggable: true,
          onDragEnd: (lat, lng) => setValue({ ...value, lat, lng }),
        },
      ]}
      onClick={(lat, lng) => setValue({ ...value, lat, lng })}
      className={`${className} w-full`}
    />
  );
}

/** Champ + carte l'un sous l'autre (utilisé dans les Paramètres). */
export function AddressPicker({
  defaultValue,
  names = DEFAULT_NAMES,
  label = "Adresse",
  hint,
  mapHeight = "h-64",
  required = false,
}: {
  defaultValue: AddressValue;
  names?: AddressNames;
  label?: string;
  hint?: string;
  mapHeight?: string;
  required?: boolean;
}) {
  const state = useAddress(defaultValue);
  return (
    <div className="space-y-3">
      <AddressInput state={state} names={names} label={label} hint={hint} required={required} />
      <AddressMap state={state} className={mapHeight} />
    </div>
  );
}

function shortLabel(label: string) {
  // Nominatim renvoie "123, Rue X, Quartier, Drummondville, ..." -> on garde numéro + rue
  const parts = label.split(",").map((p) => p.trim());
  if (parts.length >= 2 && /^\d/.test(parts[0])) return `${parts[0]} ${parts[1]}`;
  return parts.slice(0, 2).join(", ");
}
