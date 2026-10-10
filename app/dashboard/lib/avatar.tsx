import { useState } from "react";
import { getInitials } from "../helpers";
import type { User } from "@/src/domain/user";

export default function Avatar({ student }: { student: User }) {
  const [failed, setFailed] = useState(false);
  const url = student.profilePictureUrl;

  if (!url || failed) {
    return (
      <span
        aria-hidden="true"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#0B6B4A]/10 text-xs font-semibold text-[#0B6B4A]">
        {getInitials(student.fullName)}
      </span>
    );
  }

  return (
    <img
      src={url}
      alt={`${student.fullName}'s profile photo`}
      onError={() => setFailed(true)}
      loading="lazy"
      className="h-9 w-9 shrink-0 rounded-full bg-[#0B6B4A]/10 object-cover"
    />
  );
}
