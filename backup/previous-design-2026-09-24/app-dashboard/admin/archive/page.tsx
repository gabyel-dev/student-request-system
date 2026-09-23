import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import { requestRepository, userRepository } from "@/src/server/container";
import { isAdminEmail } from "@/src/infrastructure/auth/admin-accounts";
import { ArchivePanel } from "../archive-panel";
import { buildEmailMaps } from "../../lib/request-utils";

export default async function ArchivePage() {
  const [archived, students] = await Promise.all([
    requestRepository.findArchived(),
    userRepository.findAll(),
  ]);
  const { studentNumberByEmail } = buildEmailMaps(
    students.filter((student) => !isAdminEmail(student.email)),
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#087a54] transition hover:text-[#066044]">
        <FiArrowLeft aria-hidden="true" />
        Back to dashboard
      </Link>

      <ArchivePanel
        archived={archived}
        studentNumberByEmail={studentNumberByEmail}
      />
    </div>
  );
}