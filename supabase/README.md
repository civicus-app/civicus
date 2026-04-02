# Supabase Setup

This project supports two data providers:

- `VITE_DATA_PROVIDER=local` for browser-backed demo data
- `VITE_DATA_PROVIDER=supabase` for persistent shared storage

## Apply schema and seed data

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Set:

```env
VITE_DATA_PROVIDER=supabase
VITE_ENABLE_MFA=false
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

4. Apply migrations in order:

- `supabase/migrations/20260402170000_init_civicus.sql`
- `supabase/migrations/20260402154000_default_demo_accounts.sql`
- `supabase/migrations/20260402160000_fix_default_demo_account_emails.sql`
- `supabase/migrations/20260402183000_auth_email_mfa.sql`

5. Apply `supabase/seed.sql`.
6. Deploy the auth Edge Functions in `supabase/functions/`.
7. Set function secrets:

```bash
supabase secrets set RESEND_API_KEY=...
supabase secrets set OTP_FROM_EMAIL="CIVICUS <no-reply@your-domain.com>"
```

8. Deploy the functions:

```bash
supabase functions deploy auth-start-signup --no-verify-jwt
supabase functions deploy auth-verify-signup-code --no-verify-jwt
supabase functions deploy auth-complete-signup --no-verify-jwt
supabase functions deploy auth-dev-signup --no-verify-jwt
supabase functions deploy auth-start-login-otp
supabase functions deploy auth-verify-login-otp
supabase functions deploy auth-verify-trusted-device
supabase functions deploy auth-mark-session-verified
```

The signup functions must be public because account creation starts before a Supabase session exists. The repo also encodes this in `supabase/config.toml` with `verify_jwt = false` for:

- `auth-start-signup`
- `auth-verify-signup-code`
- `auth-complete-signup`
- `auth-dev-signup`

## Dev Mode Without MFA

For development, keep this in `.env.local`:

```env
VITE_ENABLE_MFA=false
```

In that mode:

- login uses plain email/password
- signup creates the account directly
- admin signup still requires a valid invite code
- `auth-mark-session-verified` marks the current session so the existing RLS policies continue to work

## Promote an admin user

Signup creates a `profiles` row automatically, but all users start as `citizen`.
Promote an admin after signup:

```sql
update public.profiles
set role = 'admin'
where email = 'your-admin-email@example.com';
```

## Create an admin invite

Admin signup is visible in the UI, but it is invite-gated. Create invite codes manually in the database for v1:

```sql
insert into public.admin_invites (code_hash, email, expires_at)
values (
  encode(extensions.digest('YOUR-ADMIN-INVITE-CODE', 'sha256'), 'hex'),
  'future-admin@example.com',
  timezone('utc', now()) + interval '7 days'
);
```

Set `email` to `null` if the invite should work for any address.

## Default Demo Accounts

For demo environments you can bootstrap the hosted Supabase project with:

```bash
npm run bootstrap:accounts
```

When Supabase CLI is logged in, the script pulls the project service-role key and creates or updates the users through the auth admin API.

This creates:

- `admin@civicus.example.com` / `admin12345`
- `citizen@civicus.example.com` / `citizen12345`

The signup trigger promotes `admin@civicus.example.com` to the `admin` role automatically.
Do not use these credentials in a production environment.

## Notes

- Primary auth uses Supabase email/password.
- Account MFA uses custom email OTP via Edge Functions and Resend.
- Citizen logins can trust a device for 30 days; admin logins always require OTP.
- The GitHub Pages frontend can talk directly to Supabase because data access is constrained by RLS.
