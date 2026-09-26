import type { IconType } from "react-icons";

export type Student = {
  name: string;
  email: string;
  profilePictureUrl: string | null;
  section: string;
  studentNumber: string;
};

export type Service = {
  slug: string;
  title: string;
  description: string;
  icon: IconType;
};