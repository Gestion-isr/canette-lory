import { formatMoney } from "@/lib/format";
import { DEPOSIT_KINDS, type Funds } from "@/lib/types";

/** Répartition de l'argent récolté par source, en montants et en parts. */
export function fundsMix(funds: Funds) {
  const don = funds.total_donations;
  const personnel = funds.total_personal;
  const cannettes = Math.max(0, funds.total_amount - don - personnel);
  const total = cannettes + don + personnel;
  return {
    total,
    parts: DEPOSIT_KINDS.map((k) => {
      const montant = k.key === "cannettes" ? cannettes : k.key === "don" ? don : personnel;
      return { ...k, montant, ratio: total > 0 ? montant / total : 0 };
    }),
  };
}

/** Diagramme circulaire (anneau) de la provenance de l'argent. */
export function FundsDonut({ funds, size = 132 }: { funds: Funds; size?: number }) {
  const { total, parts } = fundsMix(funds);
  const visibles = parts.filter((p) => p.montant > 0);
  if (total <= 0) return null;

  const r = 60;
  const circonference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-5">
      <svg viewBox="0 0 160 160" width={size} height={size} role="img" aria-label="Provenance de l'argent récolté">
        <circle cx="80" cy="80" r={r} fill="none" stroke="#f1f0ee" strokeWidth="22" />
        {visibles.map((p) => {
          const longueur = p.ratio * circonference;
          const dash = `${longueur} ${circonference - longueur}`;
          const rotation = (offset / circonference) * 360 - 90;
          offset += longueur;
          return (
            <circle
              key={p.key}
              cx="80"
              cy="80"
              r={r}
              fill="none"
              stroke={p.couleur}
              strokeWidth="22"
              strokeDasharray={dash}
              transform={`rotate(${rotation} 80 80)`}
            />
          );
        })}
        <text x="80" y="74" textAnchor="middle" className="fill-gray-500" style={{ fontSize: 13 }}>
          Total
        </text>
        <text x="80" y="95" textAnchor="middle" className="fill-gray-900" style={{ fontSize: 19, fontWeight: 800 }}>
          {formatMoney(total)}
        </text>
      </svg>

      <ul className="min-w-40 flex-1 space-y-1.5 text-sm">
        {parts.map((p) => (
          <li key={p.key} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-gray-700">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: p.couleur }} />
              {p.icone} {p.court}
            </span>
            <span className="whitespace-nowrap text-gray-600">
              <strong className="text-gray-900">{formatMoney(p.montant)}</strong>
              <span className="ml-1 text-xs text-gray-400">{Math.round(p.ratio * 100)} %</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
