import { createSupabaseUserRepository } from "@/src/infrastructure/supabase/user-repository.supabase";
import { createGoogleLogin } from "@/src/application/use-cases/google-login";
import { createRequestRepository } from "@/src/infrastructure/supabase/request-repository.supabase";
import { createNodemailerMailer } from "@/src/infrastructure/mail/nodemailer.mail";

export const userRepository = createSupabaseUserRepository();

export const googleLogin = createGoogleLogin({ userRepository });
export const requestRepository = createRequestRepository();
export const mailer = createNodemailerMailer();
