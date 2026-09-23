"use client";

import { useEffect, useRef, useState } from "react";
import { Map } from "@/components/Map";

type Suggestion = { label: string; lat: number; lng: number };

export type AddressValue = { address: string; lat: number | null; lng: number | null };

/**
 * Champ d'adresse avec autocomplétion (Nominatim) et carte : on tape l'adresse,
 * on choisit une suggestion, puis on peut ajuster le point exact sur la carte.
 * Les valeurs sont transmises au formulaire via des champs cachés.
 */
export function AddressPicker({
  defaultValue,
  names = { address: "address", lat: "lat", lng: "lng" },
  label = "Adresse",
  hint,
  mapHeight = "h-64",
  required = false,
  onChange,
}: {
  defaultValue: AddressValue;
  names?: { address: string; lat: string; lng: string };
  label?: string;
  hint?: string;
  mapHeight?: string;
  required?: boolean;
  onChange?: (v: AddressValue) => void;
}) {
  const [address, setAddress] = useState(defaultValue.address);
  const [lat, setLat] = useState<number | null>(defaultValue.lat);
  const [lng, setLng] = useState<number | null>(defaultValue.lng);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [touched, setTouched] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = (v: AddressValue) => {
    setAddress(v.address);
    setLat(v.lat);
    setLng(v.lng);
    onChange?.(v);
  };

  useEffect(() => {
    if (!touched) return;
    if (debounce.current) clearTimeout(debounce.current);
    if (address.trim().length < 5) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(address)}`);
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
  }, [address, touched]);

  const located = lat != null && lng != null;

  return (
    <div className="space-y-3">
      <div className="relative">
        <label className="label" htmlFor={names.address}>
          {label}
        </label>
        <input
          id={names.address}
          name={names.address}
          value={address}
          onChange={(e) => {
            setTouched(true);
            set({ address: e.target.value, lat: null, lng: null });
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
                    set({ address: shortLabel(s.label), lat: s.lat, lng: s.lng });
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
      </div>

      <input type="hidden" name={names.lat} value={lat ?? ""} />
      <input type="hidden" name={names.lng} value={lng ?? ""} />

      {located ? (
        <Map
          center={[lat, lng]}
          zoom={16}
          markers={[{ id: "pin", lat, lng, draggable: true, onDragEnd: (la, ln) => set({ address, lat: la, lng: ln }) }]}
          onClick={(la, ln) => set({ address, lat: la, lng: ln })}
          className={`${mapHeight} w-full`}
        />
      ) : (
        <div className={`flex ${mapHeight} items-center justify-center rounded-2xl bg-gray-50 text-center text-sm text-gray-500 ring-1 ring-black/5`}>
          Choisissez une adresse dans la liste
          <br />
          pour la voir sur la carte.
        </div>
      )}
    </div>
  );
}

function shortLabel(label: string) {
  // Nominatim renvoie "123, Rue X, Quartier, Drummondville, ..." -> on garde numéro + rue
  const parts = label.split(",").map((p) => p.trim());
  if (parts.length >= 2 && /^\d/.test(parts[0])) return `${parts[0]} ${parts[1]}`;
  return parts.slice(0, 2).join(", ");
}
