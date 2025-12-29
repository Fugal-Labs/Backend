export interface EmailPayload {
  to: string;
  subject: string;
  text?: string;
  html: string;
}

export interface EmailProvider {
  send(payload: EmailPayload): Promise<void>;
}
