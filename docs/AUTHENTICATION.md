# StatusFlow - Authentication & Identity Management

StatusFlow relies on **Supabase Auth** for identity management, session token issuance, password security, and multi-factor/OAuth connectivity.

## Supported Auth Providers & Workflows

### 1. Email & Password Authentication
- User sign-up triggers a confirmation link via Supabase Auth email service.
- Verification status checked automatically before allowing post schedules.

### 2. Google OAuth Integration
- Seamless single-click authentication via `supabase.auth.signInWithOAuth({ provider: 'google' })`.

### 3. Password Reset
- `resetPasswordForEmail` issues secure token links to user inbox.

### 4. Protected Routes & Middleware Verification
- JWT Access tokens attached as `Authorization: Bearer <token>` in API calls.
- Express middleware verifies claims against Supabase public JWKS key.
