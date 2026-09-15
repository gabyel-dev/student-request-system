const ADMIN_ACCOUNTS = (process.env.ADMIN_ACCOUNTS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email: string): boolean {
  return ADMIN_ACCOUNTS.includes(email.trim().toLowerCase());
}
