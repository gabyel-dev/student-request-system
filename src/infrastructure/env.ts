function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function requireSecret(name: string, minimumLength: number): string {
  const value = requireEnv(name);
  if (value.length < minimumLength) {
    throw new Error(
      `${name} must be at least ${minimumLength} characters long`,
    );
  }
  return value;
}

export const env = {
  SUPABASE_URL: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  SUPABASE_ANON_KEY: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  JWT_SECRET: requireSecret("JWT_SECRET", 32),
  GOOGLE_CLIENT_ID: requireEnv("CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: requireEnv("CLIENT_SECRET"),
};

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true";
}

/**
 * Optional SMTP settings. The app still starts without them; email sending
 * simply reports that SMTP has not been configured.
 */
export const smtpEnv: {
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_SECURE: boolean;
  SMTP_USER: string | null;
  SMTP_PASS: string | null;
  SMTP_FROM: string;
} | null = (() => {
  const host = process.env.SMTP_HOST?.trim();
  if (!host) return null;

  const port = Number(process.env.SMTP_PORT ?? 465);
  const user = process.env.SMTP_USER?.trim() || null;
  const pass = process.env.SMTP_PASS?.trim() || null;
  // Credentials are optional: some senders only trust the SMTP server IP.
  if (user || pass) {
    if (!user || !pass) return null;
  }

  return {
    SMTP_HOST: host,
    SMTP_PORT: Number.isFinite(port) ? port : 465,
    SMTP_SECURE: parseBoolean(process.env.SMTP_SECURE, true),
    SMTP_USER: user,
    SMTP_PASS: pass,
    SMTP_FROM:
      process.env.SMTP_FROM?.trim() ||
      "itikQ - Pateros Technological College <no-reply@paterostechnologicalcollege.edu.ph>",
  };
})();
