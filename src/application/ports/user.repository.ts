import type { User } from "@/src/domain/user";

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  create(input: { fullName: string; email: string }): Promise<User>;
  updateProfile(input: {
    id: string;
    section: string;
    studentNumber: string;
  }): Promise<User>;
  updateProfilePicture(input: {
    id: string;
    profilePictureUrl: string;
  }): Promise<User>;
}
