import { FiLink } from "react-icons/fi";
import { formatDateTime } from "../lib/format";
import type { StudentRequest } from "@/src/domain/request";

export function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[.08em] text-[#5d6f66]">
        {label}
      </dt>
      <dd className="mt-1 break-words font-mono text-xs font-medium tabular-nums text-[#14251d]">
        {value}
      </dd>
    </div>
  );
}

export function ProofLink({ url }: { url: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[.08em] text-[#5d6f66]">
        Proof
      </dt>
      <dd className="mt-1 break-words font-mono text-xs font-medium tabular-nums text-[#14251d]">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[#087a54] underline underline-offset-2 hover:opacity-70">
          <FiLink /> View proof
        </a>
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
      <DetailItem label="Student no." value={studentNumber ?? "Not on record"} />
      <DetailItem label="Submitted" value={formatDateTime(request.createdAt)} />
      <DetailItem label="Last updated" value={formatDateTime(request.updatedAt)} />
      <DetailItem label="Document" value={request.documentType} />
      {request.notes ? <DetailItem label="Notes" value={request.notes} /> : null}
      {request.proofUrl ? <ProofLink url={request.proofUrl} /> : null}
    </dl>
  );
}