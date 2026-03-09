# Admin App

## Testing

### Unit / Component

```bash
pnpm --filter admin test
```

- Runs Vitest in `apps/admin/vitest.config.ts` using jsdom and React Testing Library.
- Global helpers live under `apps/admin/test/` (browser mocks, router mocks, provider renderers, Convex stubs).
- Coverage: `pnpm --filter admin test:coverage`.
- Useful helpers:
  - `renderWithProviders` wraps components with `HostProvider`.
  - `mockConvexQuery` / `mockConvexMutation` register handlers for Convex hooks.

### End-to-end (Playwright)

```bash
pnpm --filter admin test:e2e
```

- Configuration: `apps/admin/playwright.config.ts`.
- Uses deterministic Convex mocks via `NEXT_PUBLIC_USE_MOCK_CONVEX=true` and fixtures registered in `src/test/fixtures/registerConvexMocks.ts`.
- Web server command automatically starts `pnpm --filter admin dev` in mock mode.
- UI runner: `pnpm --filter admin test:e2e:ui`.

### Mocking strategy

- Convex hooks are replaced with `src/test/mocks/runtime/convexReactMock.tsx` when testing or when `NEXT_PUBLIC_USE_MOCK_CONVEX=true`.
- Browser APIs (`matchMedia`, `ResizeObserver`, `IntersectionObserver`, `scrollTo`, `scrollIntoView`, HTML form validation) are shimmed in `apps/admin/test/mocks/browser.ts`.
- Next.js router is mocked in `apps/admin/test/mocks/nextNavigation.ts`.
- Toasts are stubbed via `apps/admin/test/mocks/sonner.ts`.

### E2E fixtures

- Default mock data (condos, residents, units, minutes, notifications) lives in `src/test/fixtures/registerConvexMocks.ts` and is imported by `app/providers.tsx` when mock mode is active.
- API calls such as `api.auth.adminSignIn`, `api.minutes.publish`, `api.residents.update`, etc. are handled entirely in-memory to keep tests deterministic.

### Environment variables

- `NEXT_PUBLIC_USE_MOCK_CONVEX=true` enables the Convex stub for local dev/tests.
- `NEXT_PUBLIC_CONVEX_URL` is still required for production; tests default to `http://localhost:9999/mock`.
- Playwright uses `NEXT_DIST_DIR=.next-e2e` to isolate builds.

### Snapshots

- No snapshot testing is used; prefer semantic assertions via Testing Library.
- If you add snapshots, update this section with instructions for `pnpm vitest --update`.
