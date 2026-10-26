import type { RequestStatus } from "@/src/domain/request";

export type AssistantRequestSummary = {
  documentType: string;
  section: string | null;
  queueNumber: number;
  status: RequestStatus;
  notes: string | null;
  createdAt: string;
  archived: boolean;
};

export type AssistantContext = {
  user: {
    firstName: string;
    section: string | null;
  };
  requests: AssistantRequestSummary[];
  serverTime: string;
};

export type AssistantChatMessage = {
  role: "user" | "assistant";
  content: string;
};
