# Allecto Security Hardening (Admin + Convex)

## Session model
- Admin session cookie: `allecto_admin`.
- Cookie attributes: `HttpOnly`, `Secure` (production), `SameSite=Lax`, `Path=/`.
- Session token revocation: `POST /api/logout` revokes Convex session (`api.auth.logout`) and expires the cookie.
- Sensitive tokens are no longer persisted in `localStorage`.

## Convex authorization model
- Centralized guard helpers in `backend/convex/convex/guards.ts`:
  - `requirePlatformRole(...)`
  - `requireCondoRole(...)`
  - `requirePlatformRoleForToken(...)`
  - `requireCondoRoleForToken(...)`
  - `requireResidentMembership(...)`
- Sensitive modules now enforce server-side checks (no UI-only trust):
  - `auth.ts` (login/reset/logout events + rate limits)
  - `documents.ts` (authorized token issuance/redemption)
  - `minutes.ts` (publish/close/list/get checks)
  - `residents.ts` (create/update/remove/list/find checks)
  - `units.ts` (list/detail/write checks)
  - `votes.ts` (cast/summary/list checks)
  - `condos.ts` (branding/settings/logo upload checks)

## Rate limiting
- Generic reusable limiter: `backend/convex/convex/lib/security.ts` (`enforceRateLimit`).
- Storage table: `securityRateLimits`.
- Protected high-risk flows:
  - Platform login (`auth.adminSignIn`)
  - Resident login (`auth.residentSignIn`)
  - Resident OTP request (`auth.requestResidentOtp`)
  - Password reset request/confirm (`auth.requestPasswordReset`, `auth.resetPassword`)
  - External API token issuance (`externalApi.issueToken`)
  - Document token issuance (`documents.getViewToken`)
  - Invite flow already had dedicated limits (`inviteRate`).

## Audit + security events
- Structured admin audits: `adminAuditEvents` via `recordAdminAuditEvent`.
- Structured security logs: `securityEvents` with `severity` and `meta`.
- Logged events include:
  - Login success/failure/rate-limit
  - Password reset request/success/failure/rate-limit
  - Invite create/accept/revoke
  - Minute publish/close/final-report operations
  - PDF token issuance/redemption
  - External API key and token events

## Private PDF/file access
- `documents.getViewToken` no longer returns raw storage URLs to clients.
- New short-lived access token table: `documentViewTokens`.
- New route: `GET /api/documents/view?token=...`
  - Redeems one-time token through Convex (`documents.redeemViewToken`)
  - Streams PDF from server side with `Cache-Control: private, no-store`
  - Rejects invalid/expired token with generic errors
- File access events logged in `documentEvents` and `securityEvents`.

## HTTP security headers + CSP
- Implemented in `apps/admin/next.config.js`.
- Headers:
  - `Content-Security-Policy`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` (deny camera/mic/geolocation/etc)
  - `Strict-Transport-Security` (production)
- CSP allows Convex connections explicitly:
  - `connect-src 'self' https://*.convex.cloud wss://*.convex.cloud`

## Secrets and env
- Added `.env.example` files with safe placeholders.
- Expected rule:
  - Only non-sensitive browser values should use `NEXT_PUBLIC_*`.
  - Secrets must stay server-side env vars.
- Rotate any previously committed local secrets before production rollout.

## Monitoring hooks
- Security events are centralized in `securityEvents` and ready for forwarding.
- Recommended next step:
  - Add scheduled export/stream from `securityEvents` to SIEM/log sink.
