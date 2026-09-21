import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import { userRepository } from "@/src/server/container";
import { isAdminEmail } from "@/src/infrastructure/auth/admin-accounts";
import { StudentsPanel } from "../students-panel";

export default async function StudentsPage() {
  const students = (await userRepository.findAll()).filter(
    (student) => !isAdminEmail(student.email),
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#087a54] transition hover:text-[#066044]">
        <FiArrowLeft aria-hidden="true" />
        Back to dashboard
      </Link>

      <StudentsPanel students={students} />
    </div>
  );
}