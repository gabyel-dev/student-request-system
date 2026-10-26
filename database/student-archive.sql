-- Student-side archive.
--
-- Students can file away completed or rejected requests from their dashboard
-- without changing the registrar's queue cycle. `archived_at` remains the
-- admin-only queue-cycle archive; `student_archived_at` is owned by the student.

alter table public.requests
  add column if not exists student_archived_at timestamptz;

create index if not exists idx_requests_user_student_archived
  on public.requests (user_id, student_archived_at desc)
  where student_archived_at is not null;
