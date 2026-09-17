export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailPort {
  isConfigured(): boolean;
  send(input: SendEmailInput): Promise<void>;
}