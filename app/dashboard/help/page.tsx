import type { Metadata } from "next";
import { HelpCenter } from "./help-center";

export const metadata: Metadata = {
  title: "Help Center — itikQ",
  description:
    "Answers about filing document requests, queue numbers, request statuses, and your student profile.",
};

export default function HelpPage() {
  return <HelpCenter />;
}
