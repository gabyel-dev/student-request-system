export type RequestStatus = "pending" | "processing" | "completed" | "rejected";

/** The receipt returned to the student right after a request is created. */
export type RequestSubmissionReceipt = {
  id: string;
  documentType: string;
  queueNumber: number;
  section: string | null;
  emailSent: boolean;
};

export interface StudentRequest {
  id: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  documentType: string;
  // Section snapshotted onto the request when it was created. Queue numbers are
  // per section, and archived records are grouped by this section.
  section: string | null;
  queueNumber: number;
  status: RequestStatus;
  proofUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  // Set when the admin completes the queue cycle. A null value means the
  // request is part of the currently active queue.
  archivedAt: string | null;
  // Set when the student files the request away from their own dashboard. This
  // does not affect the registrar's active queue.
  studentArchivedAt: string | null;
}
