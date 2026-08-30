# Commercial billing model

The canonical public offer catalog is `packages/contracts/src/billing.ts`. Monetary values are integer BRL cents. Internal offer keys are `avulso`, `essencial`, `gestao`, `administradora`, and the sales-only `enterprise` offer. Enterprise is deliberately excluded from checkout tier validation.

## Stripe configuration

Configure these variables in the Convex deployment:

```env
PRICE_ID_AVULSO_ONE_TIME=
PRICE_ID_ESSENCIAL_MONTHLY=
PRICE_ID_GESTAO_MONTHLY=
PRICE_ID_ADMINISTRADORA_MONTHLY=
```

Avulso must reference a one-time Stripe Price and Checkout uses `payment` mode. The recurring prices use `subscription` mode. Enterprise has no Price. Administradora is a self-service recurring subscription and requires its configured Stripe Price; no placeholder ID is used.

The Stripe products/prices must carry a `tierKey` metadata value matching the new key. `backend/convex/scripts/seedStripe.ts` can create test/development products after an operator explicitly runs it; it is never run during application startup.

## Legacy subscriptions

Existing persisted `plus` and `pro` values remain valid in the Convex schema and their original Stripe subscription, product, and price IDs are never rewritten. At runtime they resolve as follows for display, limits, and feature behavior:

- `plus` → `gestao`
- `pro` → `administradora`

The old `PRICE_ID_PLUS_MONTHLY` and `PRICE_ID_PRO_MONTHLY` variables remain optional lookup aliases so historical webhook events are processable. They must continue to point at the existing Stripe Prices while those subscriptions exist. This compatibility layer does not change what Stripe bills. New onboarding sessions cannot be created with legacy keys.

## One-time entitlements

A paid Avulso Checkout webhook idempotently creates an `assemblyEntitlements` record. The entitlement is consumed when a minute/assembly is published, not while it is a draft. Publication also enforces the 100-unit ceiling and 15-day duration. Deleting a published assembly does not restore the entitlement automatically; refunds and exceptional restoration require an explicit operational decision.

## Deployment notes

Deploy the Convex schema/functions before exposing new checkout CTAs. Then configure and verify Stripe webhook delivery for `checkout.session.completed` plus the existing subscription and invoice events. Validate test purchases for both payment modes before production rollout.
