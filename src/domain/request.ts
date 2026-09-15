export type RequestStatus = "pending" | "processing" | "completed" | "rejected";

export interface StudentRequest {
  id: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  documentType: string;
  queueNumber: number;
  status: RequestStatus;
  proofUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
