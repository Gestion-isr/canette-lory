"use client";

import { useMemo, useState } from "react";
import { addMonths, endOfMonth, format, getDay, parseISO, startOfMonth, subMonths, isSameMonth } from "date-fns";
import { fr } from "date-fns/locale";
import type { DayAvailability } from "@/lib/availability";

const REASONS: Record<NonNullable<DayAvailability["reason"]>, string> = {
  passe: "Date passée",
  preavis: "Trop tôt (préavis)",
  jour_ferme: "Pas de collecte ce jour",
  bloque: "Indisponible",
  complet: "Journée complète",
};

export function DatePicker({
  availability,
  value,
  onChange,
}: {
  availability: DayAvailability[];
  value: string | null;
  onChange: (iso: string) => void;
}) {
  const byDate = useMemo(() => Object.fromEntries(availability.map((d) => [d.date, d])), [availability]);
  const firstAvailable = availability.find((d) => d.available)?.date;
  const [month, setMonth] = useState(() => startOfMonth(parseISO(value ?? firstAvailable ?? availability[0]?.date ?? format(new Date(), "yyyy-MM-dd"))));

  const minMonth = startOfMonth(parseISO(availability[0]?.date ?? format(new Date(), "yyyy-MM-dd")));
  const maxMonth = startOfMonth(parseISO(availability[availability.length - 1]?.date ?? format(new Date(), "yyyy-MM-dd")));

  const days: (string | null)[] = [];
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  for (let i = 0; i < getDay(start); i++) days.push(null);
  for (let d = start.getDate(); d <= end.getDate(); d++) {
    days.push(format(new Date(month.getFullYear(), month.getMonth(), d), "yyyy-MM-dd"));
  }

  return (
    <div className="rounded-2xl ring-1 ring-black/5">
      <div className="flex items-center justify-between px-3 py-2">
        <button
          type="button"
          onClick={() => setMonth((m) => subMonths(m, 1))}
          disabled={isSameMonth(month, minMonth) || month < minMonth}
          className="btn-secondary btn-sm"
          aria-label="Mois précédent"
        >
          ‹
        </button>
        <p className="font-semibold capitalize">{format(month, "MMMM yyyy", { locale: fr })}</p>
        <button
          type="button"
          onClick={() => setMonth((m) => addMonths(m, 1))}
          disabled={isSameMonth(month, maxMonth) || month > maxMonth}
          className="btn-secondary btn-sm"
          aria-label="Mois suivant"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 px-2 pb-2 text-center text-xs">
        {["D", "L", "M", "M", "J", "V", "S"].map((d, i) => (
          <div key={i} className="py-1 font-semibold text-gray-400">
            {d}
          </div>
        ))}
        {days.map((iso, i) => {
          if (!iso) return <div key={`e${i}`} />;
          const info = byDate[iso];
          const available = !!info?.available;
          const selected = value === iso;
          const title = info ? (available ? `${info.remaining} place(s) restante(s)` : REASONS[info.reason!]) : "Hors période";
          return (
            <button
              key={iso}
              type="button"
              disabled={!available}
              onClick={() => onChange(iso)}
              title={title}
              className={`aspect-square rounded-lg text-sm font-medium transition ${
                selected
                  ? "bg-brand-600 text-white"
                  : available
                    ? "bg-brand-50 text-brand-800 hover:bg-brand-100"
                    : "text-gray-300"
              }`}
            >
              {parseInt(iso.slice(-2), 10)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
