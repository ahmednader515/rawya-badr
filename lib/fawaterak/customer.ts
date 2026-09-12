import type { User } from "@/lib/types";

export type FawaterakCustomer = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
};

function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "Student", last: "User" };
  if (parts.length === 1) return { first: parts[0], last: "User" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function normalizePhone(raw: string | null | undefined): string {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.length >= 10) {
    if (digits.startsWith("20") && digits.length >= 12) return "0" + digits.slice(2);
    if (digits.length === 10) return "0" + digits;
    return digits;
  }
  return "01000000000";
}

export function buildFawaterakCustomer(user: User): FawaterakCustomer {
  const { first, last } = splitName(user.name);
  const phone = normalizePhone(user.student_number ?? user.guardian_number);
  const email =
    user.email?.includes("@") ? user.email.trim() : `${phone.replace(/\D/g, "")}@users.local`;

  return {
    first_name: first.slice(0, 100),
    last_name: last.slice(0, 100),
    email: email.slice(0, 200),
    phone,
    address: "Egypt",
  };
}
