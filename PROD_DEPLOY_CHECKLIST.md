# Production Deploy Checklist

This checklist is for the current Prisma changes in this repo:

- `20260517183000_add_preorder_allocation_statuses`
- `20260517191500_remove_ups_fields`

## Important facts

- Production deploy uses `migrate deploy`, not `migrate dev`.
- The GitHub Actions deploy workflow runs:

```sh
docker compose run --rm app node node_modules/prisma/build/index.js migrate deploy
```

- `migrate deploy` does not reset the production database.
- There is an old migration-history inconsistency around:

```text
20260509154016_add_ups_shipping_fields
```

That old migration was reconstructed locally. This should not trigger a production reset, but Prisma may warn if the file checksum differs from what production originally applied.

## Before pushing to `main`

1. Confirm the app builds locally:

```sh
npx prisma generate
npm run build
```

2. Confirm the deploy workflow still uses `migrate deploy` in `.github/workflows/deploy.yml`.

3. Review the pending migration files:

```text
prisma/migrations/20260517183000_add_preorder_allocation_statuses/migration.sql
prisma/migrations/20260517191500_remove_ups_fields/migration.sql
```

4. If possible, restore the original contents of:

```text
prisma/migrations/20260509154016_add_ups_shipping_fields/migration.sql
```

This is the cleanest long-term fix for Prisma migration history.

## Recommended staging test

Before production, run the same image and migration flow against a staging database:

```sh
docker compose run --rm app node node_modules/prisma/build/index.js migrate deploy
```

Verify:

- Pre-orders are created with `AWAITING_STOCK`
- Increasing stock moves eligible pre-orders to `READY_TO_SHIP`
- FedEx shipment creation is hidden for waiting pre-orders
- FedEx shipment creation appears for `READY_TO_SHIP` pre-orders
- UPS-specific columns are no longer needed by the app

## Production deploy steps

1. Push the branch to `main`.
2. Let GitHub Actions build and push the image.
3. Let the VPS deploy step run migrations with `migrate deploy`.
4. Watch the migration output carefully.

Expected safe behavior:

- Pending migrations apply
- No reset prompt appears
- The app restarts normally

Possible warning:

- Prisma may warn that `20260509154016_add_ups_shipping_fields` was modified after being applied

That warning is not the same as a reset or data wipe.

## If deploy fails on production

1. Do not run `prisma migrate dev`.
2. Do not reset the production database.
3. Capture the exact Prisma error output from the deploy logs.
4. Stop and fix the migration issue before retrying.

## Current risk summary

- Safe from automatic production reset: yes
- Safe to use `migrate deploy`: yes
- Migration history perfectly clean: not until the original UPS migration file is restored
