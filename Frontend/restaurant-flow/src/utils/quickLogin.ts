import type { AppRole } from "@/src/types";

export interface QuickLoginOption {
  role: AppRole;
  label: string;
  email: string;
  password: string;
}

// Matches real seeded/registered demo accounts — every account here must
// exist for real in the database, not be made up for the UI.
// Staff accounts come from Backend/alembic/versions/0007_seed_staff_users.py.
// The customer account was registered live through the real (auto-verified)
// /api/customers/register flow, not fabricated.
export const QUICK_LOGIN_OPTIONS: QuickLoginOption[] = [
  { role: "cliente", label: "Cliente", email: "cliente@demo.com", password: "password123" },
  { role: "admin", label: "Admin", email: "admin@rest.com", password: "password123" },
  { role: "mesero", label: "Mesero", email: "juan@rest.com", password: "password123" },
  { role: "chef", label: "Chef", email: "chef@rest.com", password: "password123" },
];
