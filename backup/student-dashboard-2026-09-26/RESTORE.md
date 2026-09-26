# Restore the original Student Dashboard

Snapshot of the Student Dashboard as it existed **before** the GSAP redesign.

- **Taken:** 2026-09-26
- **Git commit:** `ee88d61` (`update: email message redesigned`)
- **Git branch:** `backup/student-dashboard-original`
- **Git tag:** `pre-gsap-redesign-2026-09-26`
- **Contents:** all 30 files of `app/dashboard/**`, `app/globals.css`, `package.json`, `package-lock.json`
- **Integrity:** every file is listed in `MANIFEST.sha256` (SHA-256). All 34 verified identical to the working tree at snapshot time.

## Verify this snapshot is intact

```powershell
$dest = "backup\student-dashboard-2026-09-26"
Get-Content "$dest\MANIFEST.sha256" | ForEach-Object {
  if ($_ -match '^([0-9a-f]{64})\s\s(.+)$') {
    $ok = (Get-FileHash -Algorithm SHA256 -LiteralPath ($matches[2] -replace '/','\')).Hash.ToLower() -eq $matches[1]
    if (-not $ok) { Write-Output "MISMATCH $($matches[2])" }
  }
}
```

No output means the snapshot still matches its manifest. (Run this **before** restoring, when the working tree is the redesigned version — mismatch is expected then, and is the point: it proves the files have changed.)

## Rollback paths

### 1. Git checkout — recommended, keeps full history

```powershell
git checkout backup/student-dashboard-original -- app/dashboard app/globals.css package.json package-lock.json
npm install
```

The four new files introduced by the redesign (`app/dashboard/lib/motion.ts`,
`app/dashboard/lib/use-gsap-context.ts`, `app/dashboard/lib/use-scroll-reveal.ts`,
`app/dashboard/lib/use-count-up.ts`, plus `app/dashboard/student/status-pill.tsx`
and `app/dashboard/student/confirm-dialog.tsx`) are **not** tracked by that
checkout, so delete them to get back to an identical tree:

```powershell
Remove-Item -Force app\dashboard\lib\motion.ts, app\dashboard\lib\use-gsap-context.ts, `
  app\dashboard\lib\use-scroll-reveal.ts, app\dashboard\lib\use-count-up.ts, `
  app\dashboard\student\status-pill.tsx, app\dashboard\student\confirm-dialog.tsx
```

### 2. Hard reset — throws away all work since the snapshot

```powershell
git reset --hard backup/student-dashboard-original
npm install
```

### 3. No git — copy the files back

```powershell
$dest = "backup\student-dashboard-2026-09-26"
Copy-Item -Recurse -Force "$dest\app-dashboard\*" app\dashboard
Copy-Item -Force "$dest\globals.css" app\globals.css
Copy-Item -Force "$dest\package.json" package.json
Copy-Item -Force "$dest\package-lock.json" package-lock.json
# remove the redesign-only files listed in path 1
npm install
```

## What was NOT touched by the redesign

Only these paths changed: `app/dashboard/sidebar.tsx`, `app/dashboard/dashboard-shell.tsx`,
`app/dashboard/student/{dashboard,quick-actions,recent-activity,student-details,duck-mascot}.tsx`,
`app/globals.css`, `package.json`, `package-lock.json`, plus 6 new files under
`app/dashboard/`.

Everything else is byte-identical to the original, including all of
`app/dashboard/admin/**`, `app/dashboard/lib/{use-realtime-requests,request-utils,use-request-filters,format,realtime-live-badge}`,
`app/dashboard/{page,dashboard-shell,data,types,helpers}`,
`app/actions/**`, `app/request/**`, `app/onboarding/**`, `app/login/**`,
`app/components/**`, `src/**`, `proxy.ts`, `app/layout.tsx`.

No route, server action, API call, database interaction, or Supabase query was
changed. No data was migrated.
