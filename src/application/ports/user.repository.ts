import type { User } from "@/src/domain/user";

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(input: { fullName: string; email: string }): Promise<User>;
  updateProfile(input: {
    id: string;
    section: string;
    studentNumber: string;
  }): Promise<User>;
}
