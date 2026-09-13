import type { UserRepository } from "@/src/application/ports/user.repository";
import type { User } from "@/src/domain/user";
import { getSupabaseClient } from "@/src/infrastructure/supabase/supabase.client";

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  profile_picture_url: string | null;
  section: string | null;
  student_number: string | null;
  created_at: string;
  updated_at: string;
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    profilePictureUrl: row.profile_picture_url,
    section: row.section,
    studentNumber: row.student_number,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createSupabaseUserRepository(): UserRepository {
  const client = getSupabaseClient();

  return {
    async findByEmail(email: string): Promise<User | null> {
      const { data, error } = await client
        .from("users")
        .select(
          "id, full_name, email, profile_picture_url, section, student_number, created_at, updated_at",
        )
        .eq("email", email)
        .maybeSingle();

      if (error) throw error;
      return data ? toUser(data as UserRow) : null;
    },

    async findById(id: string): Promise<User | null> {
      const { data, error } = await client
        .from("users")
        .select(
          "id, full_name, email, profile_picture_url, section, student_number, created_at, updated_at",
        )
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data ? toUser(data as UserRow) : null;
    },

    async create(input: { fullName: string; email: string }): Promise<User> {
      const { data, error } = await client
        .from("users")
        .insert({
          full_name: input.fullName,
          email: input.email,
        })
        .select(
          "id, full_name, email, profile_picture_url, section, student_number, created_at, updated_at",
        )
        .single();

      if (error) throw error;
      return toUser(data as UserRow);
    },

    async updateProfile(input): Promise<User> {
      const { data, error } = await client
        .from("users")
        .update({
          section: input.section,
          student_number: input.studentNumber,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .select(
          "id, full_name, email, profile_picture_url, section, student_number, created_at, updated_at",
        )
        .single();

      if (error) throw error;
      return toUser(data as UserRow);
    },

    async updateProfilePicture(input): Promise<User> {
      const { data, error } = await client
        .from("users")
        .update({
          profile_picture_url: input.profilePictureUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .select(
          "id, full_name, email, profile_picture_url, section, student_number, created_at, updated_at",
        )
        .single();

      if (error) throw error;
      return toUser(data as UserRow);
    },
  };
}
