import type { ElementType } from "react";

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
  /**
   * An IconPark component. Always rendered through `Icon` so it picks up the
   * two-tone palette rather than being coloured at the call site.
   */
  icon: ElementType;
};