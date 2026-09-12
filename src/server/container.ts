import { createSupabaseUserRepository } from "@/src/infrastructure/supabase/user-repository.supabase";
import { createGoogleLogin } from "@/src/application/use-cases/google-login";

export const userRepository = createSupabaseUserRepository();

export const googleLogin = createGoogleLogin({ userRepository });