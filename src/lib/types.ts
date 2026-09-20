export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
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
  profiles: Pick<Profile, "full_name" | "email" | "phone" | "address" | "lat" | "lng">;
};

export type Recurrence = {
  id: string;
  user_id: string;
  interval_weeks: number;
  active: boolean;
  created_at: string;
};

export type GoalProgress = {
  goal_id: string;
  title: string;
  target_amount: number;
  started_at: string;
  raised_amount: number;
  total_amount: number;
  total_cans: number;
};

export type Deposit = {
  id: string;
  amount: number;
  cans_count: number | null;
  deposited_at: string;
  note: string | null;
};

export const STATUS_LABELS: Record<PickupStatus, string> = {
  en_attente: "En attente",
  completee: "Complétée",
  annulee: "Annulée",
};

export const WEEKDAY_LABELS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
