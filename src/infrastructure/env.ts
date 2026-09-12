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
  SUPABASE_SERVICE_ROLE_KEY: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  JWT_SECRET: requireSecret("JWT_SECRET", 32),
  GOOGLE_CLIENT_ID: requireEnv("CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: requireEnv("CLIENT_SECRET"),
};
