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

Students authenticate with their school Google account, complete their profile when needed, choose a document service, receive a queue number, and track request status. Whitelisted administrators use a dedicated dashboard to review requests, update statuses, and view registered students. The prototype is intended for professor evaluation of the complete student-to-admin workflow.

## Capabilities and Constraints

- Google authentication is restricted to the Pateros Technological College email domain.
- Administrator access is controlled by the server-side `ADMIN_ACCOUNTS` environment variable.
- Administrators bypass student onboarding and enter the dashboard directly.
- Students can submit document requests with a queue number and status.
- Administrators can view all requests, update request statuses, and view the student directory.
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
