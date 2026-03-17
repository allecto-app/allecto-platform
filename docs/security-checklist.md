# Security Verification Checklist

1. Confirm `allecto_admin` cookie is `HttpOnly`, `Secure` (prod), `SameSite=Lax`.
2. Confirm no auth token is persisted in browser `localStorage`.
3. Validate unauthorized cross-tenant access is denied for residents/units/minutes/votes endpoints.
4. Trigger repeated failed logins and confirm rate-limit behavior and generic errors.
5. Trigger password reset and OTP abuse tests; confirm throttling and generic responses.
6. Confirm `/api/documents/view` rejects expired/used tokens.
7. Confirm direct storage URLs are not returned by `documents.getViewToken`.
8. Confirm CSP and security headers are present on admin pages.
9. Confirm `securityEvents` and `adminAuditEvents` are populated for key actions.
10. Rotate all existing leaked/development secrets before production deploy.
