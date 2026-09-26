export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  pickup_note: string | null;
  is_admin: boolean;
  created_at: string;
};

export type Settings = {
  id: number;
  child_name: string;
  season: "ete" | "hiver";
  summer_days: number[];
  winter_days: number[];
  min_notice_days: number;
  max_per_day: number;
  horizon_days: number;
  home_address: string | null;
  home_lat: number;
  home_lng: number;
  show_goal_to_citizens: boolean;
  about_text: string | null;
};

export type PickupStatus = "en_attente" | "completee" | "annulee";

export type PickupRequest = {
  id: string;
  user_id: string;
  requested_date: string; // YYYY-MM-DD
  estimated_bags: number | null;
  note: string | null;
  status: PickupStatus;
  cans_count: number | null;
  completed_at: string | null;
  recurrence_id: string | null;
  created_at: string;
};

export type PickupWithProfile = PickupRequest & {
  profiles: Pick<Profile, "full_name" | "email" | "phone" | "address" | "lat" | "lng" | "pickup_note">;
};

export type Recurrence = {
  id: string;
  user_id: string;
  interval_weeks: number;
  active: boolean;
  created_at: string;
};

export type Goal = {
  id: string;
  title: string;
  target_amount: number;
  position: number;
  image_url: string | null;
  active: boolean;
  achieved_at: string | null;
  spent_amount: number | null;
  created_at: string;
};

/** Objectif actif avec le montant qui lui est attribué par la cascade. */
export type GoalProgress = Goal & { raised_amount: number };

export type Funds = {
  total_amount: number;
  total_donations: number;
  total_personal: number;
  total_cans: number;
  spent_amount: number;
  /** Cagnotte disponible pour les objectifs actifs = total - dépensé */
  available: number;
};

export type DepositKind = "cannettes" | "don" | "personnel";

export const DEPOSIT_KINDS: { key: DepositKind; label: string; court: string; icone: string; couleur: string }[] = [
  { key: "cannettes", label: "Consignes de cannettes", court: "Cannettes", icone: "🥫", couleur: "#db2777" },
  { key: "don", label: "Don reçu", court: "Dons", icone: "💛", couleur: "#f59e0b" },
  { key: "personnel", label: "Argent personnel", court: "Argent personnel", icone: "🐷", couleur: "#6366f1" },
];

export type Deposit = {
  id: string;
  kind: DepositKind;
  amount: number;
  cans_count: number | null;
  deposited_at: string;
  note: string | null;
};

export type Post = {
  id: string;
  title: string;
  body: string;
  images: string[];
  published: boolean;
  published_at: string;
  created_at: string;
};

export const STATUS_LABELS: Record<PickupStatus, string> = {
  en_attente: "En attente",
  completee: "Complétée",
  annulee: "Annulée",
};

export const WEEKDAY_LABELS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
