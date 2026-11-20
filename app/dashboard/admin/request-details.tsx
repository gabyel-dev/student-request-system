import { ProofViewer } from "@/app/components/proof-viewer";
import { formatDateTime } from "../lib/format";
import type { StudentRequest } from "@/src/domain/request";

export function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#62716A]">
        {label}
      </dt>
      <dd className="mt-1 break-words text-[13px] text-[#17211B]">{value}</dd>
    </div>
  );
}

export function ProofLink({ urls }: { urls: string[] }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#62716A]">
        Proof
      </dt>
      <dd className="mt-1">
        <div className="flex flex-col items-start gap-1">
          {urls.map((url, index) => (
            <ProofViewer key={url} url={url} label={`View proof ${index + 1}`} />
          ))}
        </div>
      </dd>
    </div>
  );
}

export function RequestDetailGrid({
  request,
  studentNumber,
}: {
  request: StudentRequest;
  studentNumber: string | null;
}) {
  return (
    <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
      <DetailItem
        label="Student no."
        value={studentNumber ?? "Not on record"}
      />
      <DetailItem label="Submitted" value={formatDateTime(request.createdAt)} />
      <DetailItem
        label="Last updated"
        value={formatDateTime(request.updatedAt)}
      />
      <DetailItem label="Document" value={request.documentType} />
      {request.notes ? (
        <DetailItem label="Notes" value={request.notes} />
      ) : null}
      {request.proofUrls.length ? <ProofLink urls={request.proofUrls} /> : null}
    </dl>
  );
}
