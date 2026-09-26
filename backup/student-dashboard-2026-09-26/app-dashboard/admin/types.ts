import type { StudentRequest, RequestStatus } from "@/src/domain/request";
import type { EmailMaps } from "../lib/request-utils";

export type RequestListContext = {
  emailMaps: EmailMaps;
  isPending: boolean;
  updatingId: string | null;
  expandedId: string | null;
  onToggleRequest: (id: string | null) => void;
  onChangeStatus: (id: string, status: RequestStatus) => void;
};

export type RequestListItemProps = {
  request: StudentRequest;
  context: RequestListContext;
};