/**
 * Guide visuel des contenants consignés — illustrations originales (SVG dessiné à la main),
 * aucune image provenant d'un tiers.
 * Règles : consigne sur les contenants de boisson de 100 ml à 2 L en aluminium et en plastique,
 * ainsi que sur les bouteilles de verre de boisson gazeuse et de bière.
 */

type IconProps = { className?: string };

const S = "stroke-current";

/* ---------------------------------- Acceptés --------------------------------- */

function Canette({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 64" className={className} fill="none" strokeWidth="2.5" strokeLinejoin="round">
      <path d="M14 12h20a2 2 0 0 1 2 2v36a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6V14a2 2 0 0 1 2-2Z" className={S} />
      <path d="M16 8h16a2 2 0 0 1 2 2v2H14v-2a2 2 0 0 1 2-2Z" className={S} />
      <path d="M18 24h12M18 32h12" className={`${S} opacity-40`} strokeLinecap="round" />
      <ellipse cx="24" cy="10" rx="4" ry="1.5" className={`${S} opacity-60`} />
    </svg>
  );
}

function BouteillePlastique({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 64" className={className} fill="none" strokeWidth="2.5" strokeLinejoin="round">
      <path d="M19 6h10v5l4 6a8 8 0 0 1 1.5 4.6V52a6 6 0 0 1-6 6h-9a6 6 0 0 1-6-6V21.6A8 8 0 0 1 15 17l4-6V6Z" className={S} />
      <path d="M18 6h12" className={S} strokeLinecap="round" />
      <path d="M14.5 26h19M14.5 31h19" className={`${S} opacity-35`} strokeLinecap="round" />
      <path d="M17 40h14" className={`${S} opacity-35`} strokeLinecap="round" />
    </svg>
  );
}

function BouteilleEau({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 64" className={className} fill="none" strokeWidth="2.5" strokeLinejoin="round">
      <path d="M20 6h8v4l3 5a7 7 0 0 1 1 3.6V53a5 5 0 0 1-5 5h-6a5 5 0 0 1-5-5V18.6a7 7 0 0 1 1-3.6l3-5V6Z" className={S} />
      <path d="M19 6h10" className={S} strokeLinecap="round" />
      <path d="M16 28c4 2 12 2 16 0M16 34c4 2 12 2 16 0" className={`${S} opacity-35`} strokeLinecap="round" />
    </svg>
  );
}

function BouteilleLait({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 64" className={className} fill="none" strokeWidth="2.5" strokeLinejoin="round">
      <path d="M20 8h8v4l4 5a6 6 0 0 1 1.4 3.9V53a5 5 0 0 1-5 5H19a5 5 0 0 1-5-5V20.9A6 6 0 0 1 15.4 17l4.6-5V8Z" className={S} />
      <path d="M19 8h10" className={S} strokeLinecap="round" />
      <rect x="17" y="30" width="14" height="14" rx="2" className={`${S} opacity-35`} />
    </svg>
  );
}

function BouteilleVerre({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 64" className={className} fill="none" strokeWidth="2.5" strokeLinejoin="round">
      <path d="M21 4h6v14l3.5 5.5A9 9 0 0 1 32 28v25a5 5 0 0 1-5 5h-6a5 5 0 0 1-5-5V28a9 9 0 0 1 1.5-4.5L21 18V4Z" className={S} />
      <path d="M20 4h8" className={S} strokeLinecap="round" />
      <rect x="17.5" y="32" width="13" height="12" rx="1.5" className={`${S} opacity-35`} />
    </svg>
  );
}

/* -------------------------------- Non acceptés ------------------------------- */

function BouteilleVin({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 64" className={className} fill="none" strokeWidth="2.5" strokeLinejoin="round">
      <path d="M21 4h6v16c0 2 5 5 5 10v23a5 5 0 0 1-5 5h-6a5 5 0 0 1-5-5V30c0-5 5-8 5-10V4Z" className={S} />
      <path d="M20 4h8M21 9h6" className={S} strokeLinecap="round" />
      <rect x="16.5" y="36" width="15" height="11" rx="1.5" className={`${S} opacity-35`} />
    </svg>
  );
}

function CartonLait({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 64" className={className} fill="none" strokeWidth="2.5" strokeLinejoin="round">
      <path d="M12 20 24 6l12 14v34a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3V20Z" className={S} />
      <path d="M12 20h24M24 6v14" className={`${S} opacity-50`} />
      <path d="M17 32h14M17 39h10" className={`${S} opacity-35`} strokeLinecap="round" />
    </svg>
  );
}

function BoiteConserve({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 64" className={className} fill="none" strokeWidth="2.5" strokeLinejoin="round">
      <path d="M10 18h28v32a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V18Z" className={S} />
      <ellipse cx="24" cy="18" rx="14" ry="5" className={S} />
      <path d="M13 28h22M13 34h22" className={`${S} opacity-35`} strokeLinecap="round" />
    </svg>
  );
}

function Cruche({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 64" className={className} fill="none" strokeWidth="2.5" strokeLinejoin="round">
      <path d="M20 8h8v5h5a4 4 0 0 1 4 4v35a4 4 0 0 1-4 4H15a4 4 0 0 1-4-4V17a4 4 0 0 1 4-4h5V8Z" className={S} />
      <path d="M37 22h4a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-4" className={S} />
      <path d="M15 24h18M15 32h18" className={`${S} opacity-35`} strokeLinecap="round" />
    </svg>
  );
}

function Pochette({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 64" className={className} fill="none" strokeWidth="2.5" strokeLinejoin="round">
      <path d="M13 14c4-3 18-3 22 0l-2 40a4 4 0 0 1-4 3.8H19A4 4 0 0 1 15 54L13 14Z" className={S} />
      <path d="M13 14c4 3 18 3 22 0" className={`${S} opacity-50`} />
      <path d="M19 28h10" className={`${S} opacity-35`} strokeLinecap="round" />
    </svg>
  );
}

function Yogourt({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 64" className={className} fill="none" strokeWidth="2.5" strokeLinejoin="round">
      <path d="M17 18h14l-1.5 34a5 5 0 0 1-5 4.8h-1A5 5 0 0 1 18.5 52L17 18Z" className={S} />
      <path d="M16 13h16a1 1 0 0 1 1 1v4H15v-4a1 1 0 0 1 1-1Z" className={S} />
      <path d="M21 8h6v5h-6z" className={S} />
    </svg>
  );
}

/* ------------------------------------ Vue ----------------------------------- */

const ACCEPTES = [
  { Icon: Canette, label: "Canettes", detail: "aluminium" },
  { Icon: BouteillePlastique, label: "Bouteilles de plastique", detail: "boisson gazeuse, eau pétillante" },
  { Icon: BouteilleEau, label: "Bouteilles d'eau", detail: "plastique" },
  { Icon: BouteilleLait, label: "Jus et lait", detail: "en plastique seulement" },
  { Icon: BouteilleVerre, label: "Bouteilles de verre", detail: "bière, boisson gazeuse" },
];

const REFUSES = [
  { Icon: BouteilleVin, label: "Bouteilles de vin et de spiritueux", detail: "en verre — consignées en 2027" },
  { Icon: CartonLait, label: "Cartons de jus et de lait", detail: "consignés en 2027" },
  { Icon: BoiteConserve, label: "Boîtes de conserve", detail: "soupe, jus format familial" },
  { Icon: Cruche, label: "Cruches d'eau de 18 L", detail: "consigne privée du fournisseur" },
  { Icon: Yogourt, label: "Yogourt à boire, boissons nutritionnelles", detail: "" },
  { Icon: Pochette, label: "Emballages souples, détergents, condiments", detail: "" },
];

export function ContainerGuide() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <section className="card bg-emerald-50/70 ring-emerald-200">
        <h3 className="mb-1 flex items-center gap-2 font-bold text-emerald-800">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-sm text-white">✓</span>
          Contenants acceptés
        </h3>
        <p className="mb-4 text-xs text-emerald-800/80">Contenants de boisson de 100 ml à 2 L</p>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-2">
          {ACCEPTES.map(({ Icon, label, detail }) => (
            <li key={label} className="flex flex-col items-center text-center">
              <Icon className="h-14 w-14 text-emerald-700" />
              <p className="mt-1 text-xs font-semibold leading-tight text-gray-800">{label}</p>
              {detail && <p className="text-[11px] leading-tight text-gray-500">{detail}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section className="card bg-red-50/70 ring-red-200">
        <h3 className="mb-1 flex items-center gap-2 font-bold text-red-800">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-sm text-white">✕</span>
          Non consignés
        </h3>
        <p className="mb-4 text-xs text-red-800/80">Ils vont au bac de recyclage</p>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-4">
          {REFUSES.map(({ Icon, label, detail }) => (
            <li key={label} className="flex flex-col items-center text-center">
              <Icon className="h-14 w-14 text-red-600/80" />
              <p className="mt-1 text-xs font-semibold leading-tight text-gray-700">{label}</p>
              {detail && <p className="text-[11px] leading-tight text-gray-500">{detail}</p>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
