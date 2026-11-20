# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 with React, TypeScript, Tailwind CSS, and Supabase.

## Users

Primary users are students at Pateros Technological College who need to submit and track official document requests. Secondary users are registrar or school staff who review requests, manage statuses, and view student records.

## Product Purpose

itikQ provides a smooth, easy-to-access place for students to request school documents and for staff to process those requests. Success means a student can submit a request with minimal friction and staff can see the queue, identify the student, and update the request status from one workspace.

## Positioning

The product combines a simple student request flow with a staff-facing live queue and student directory, keeping the handoff between student and registrar visible in one system rather than splitting it across forms, email, and manual tracking.

## Operating Context

Students authenticate with their school Google account, complete their profile when needed, and choose from four document services: Certificate of Registration (COR), Certificate of Grades (COG), Subject Request, and Others. They receive a section-based queue number and track the request through five statuses. Whitelisted administrators use a dedicated dashboard to review requests, update statuses, view registered students, and manage queue cycles. The prototype supports the complete student-to-admin workflow.

## Capabilities and Constraints

- Google authentication is restricted to the Pateros Technological College email domain.
- Administrator access is controlled by the server-side `ADMIN_ACCOUNTS` environment variable.
- Administrators bypass student onboarding and enter the dashboard directly.
- Students can submit at most 4 requests per day with a 60-second cooldown between submissions.
- Subject Request requires notes and one or more proof files; students may select up to 4 files totaling 20 MB in one browse.
- Proof files are uploaded to the public Supabase `request_proofs` bucket and stored as URLs in the request.
- Proofs support JPG, PNG, WEBP, GIF, and PDF formats and can be previewed in a modal or opened in a new tab.
- Students can view, edit while Reviewing, delete while Reviewing, and archive completed or rejected requests.
- The status sequence is Reviewing → Processing → Pending payment → Claimed.
- Rejected (overdue) is an optional terminal state outside the main status sequence.
- Every student-relevant status change sends an email notification.
- COR and COG completion emails include payment and claim instructions; other services use the normal claim instructions.
- Administrators can view all requests, update statuses, view proof files, and manage the student directory.
- The web experience must remain usable on mobile devices.
- Request and user data are stored in Supabase.

## Brand Commitments

- Product name: itikQ.
- School context: Pateros Technological College.
- Preserve the existing itikQ identity, school logos, campus imagery, and relevant school terminology.
- The experience should feel smooth and easy to access.

## Evidence on Hand

- Existing student dashboard and request service UI in `app/dashboard/`.
- Existing administrator queue and directory UI in `app/dashboard/admin-dashboard.tsx`.
- School identity assets in `public/`, including logos and campus imagery.
- Google OAuth flow in `app/api/auth/google/callback/route.ts` and related authentication services.
- Supabase schema and request persistence in `database/schema.sql` and `src/infrastructure/supabase/`.

## Product Principles

- Make official requests simple to start and easy to understand.
- Keep the student-to-registrar handoff visible and accountable.
- Give staff the information needed to act without unnecessary navigation.
- Treat school identity and access control as part of the product, not decoration.
- Support quick scanning and reliable use across desktop and mobile web.

## Accessibility & Inclusion

The product should remain mobile-friendly, use clear labels and status language, preserve keyboard-accessible controls, and avoid relying on color alone to communicate request state.
